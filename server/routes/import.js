const express = require('express');
const fs = require('fs');
const ExcelJS = require('exceljs');
const { db } = require('../db');
const { DIMENSION_CATEGORIES } = require('../config/constants');
const { authenticate } = require('../middleware/auth');
const { requireAnyPermission, requirePermission } = require('../middleware/permissions');
const { upload } = require('../middleware/upload');
const { normalizeDimensionList } = require('../utils/dimensions');
const { getCurrentMonth, normalizeMonthInput } = require('../utils/date');
const { normalizeExcelValue } = require('../utils/excel');
const { logAction } = require('../utils/audit');

const router = express.Router();

router.post(
  '/api/import/people',
  authenticate,
  requireAnyPermission(['import.excel', 'people.edit.all']),
  (req, res) => {
    const { people } = req.body;
    if (!Array.isArray(people) || people.length === 0) {
      return res.status(400).json({ message: '缺少有效的人才列表' });
    }

    const insertPerson = db.prepare(
      'INSERT INTO people (name,title,department,focus,bio,icon,birth_date,gender,phone) VALUES (?,?,?,?,?,?,?,?,?)'
    );
    const updatePerson = db.prepare(
      `UPDATE people SET name = COALESCE(?, name), title = COALESCE(?, title),
      department = COALESCE(?, department), focus = COALESCE(?, focus),
      bio = COALESCE(?, bio), icon = COALESCE(?, icon),
      birth_date = COALESCE(?, birth_date), gender = COALESCE(?, gender),
      phone = COALESCE(?, phone)
     WHERE id = ?`
    );
    const findPersonByName = db.prepare('SELECT id FROM people WHERE name = ?');
    const deleteDimensions = db.prepare('DELETE FROM dimensions_monthly WHERE person_id = ? AND month = ?');
    const insertDimension = db.prepare(
      'INSERT INTO dimensions_monthly (person_id, category, month, detail) VALUES (?,?,?,?)'
    );
    const currentMonth = getCurrentMonth();

    const summary = db.transaction(() => {
      const stats = { created: 0, updated: 0, skipped: 0 };
      people.forEach((person) => {
        const trimmedName = (person.name || '').trim();
        let targetId = Number(person.id) || null;
        if (!targetId && trimmedName) {
          const existing = findPersonByName.get(trimmedName);
          targetId = existing ? existing.id : null;
        }
        if (!targetId && !trimmedName) {
          stats.skipped += 1;
          return;
        }
        if (targetId) {
          updatePerson.run(
            trimmedName || null,
            person.title || null,
            person.department || null,
            person.focus || null,
            person.bio || null,
            person.icon || null,
            person.birth_date || null,
            person.gender || null,
            person.phone || null,
            targetId
          );
          stats.updated += 1;
        } else {
          const newId = insertPerson.run(
            trimmedName,
            person.title || '',
            person.department || '',
            person.focus || '',
            person.bio || '',
            person.icon || '',
            person.birth_date || null,
            person.gender || '',
            person.phone || ''
          ).lastInsertRowid;
          targetId = newId;
          stats.created += 1;
        }

        if (Array.isArray(person.dimensions)) {
          const normalizedDimensions = normalizeDimensionList(person.dimensions);
          const targetMonth = normalizeMonthInput(person.month) || currentMonth;
          deleteDimensions.run(targetId, targetMonth);
          normalizedDimensions.forEach((dimension) => {
            insertDimension.run(targetId, dimension.category, targetMonth, dimension.detail);
          });
        }
      });
      return stats;
    })();

    logAction({
      actorId: req.user.id,
      action: 'import',
      entityType: 'people',
      detail: summary
    });
    res.status(201).json(summary);
  }
);

router.post('/api/import/meetings', authenticate, requirePermission('meetings.edit'), (req, res) => {
  const { meetings } = req.body;
  if (!Array.isArray(meetings) || meetings.length === 0) {
    return res.status(400).json({ message: '缺少会议列表' });
  }

  const insertMeeting = db.prepare('INSERT INTO meetings (topic, meetingDate, location, summary, category) VALUES (?,?,?,?,?)');
  const insertAttendee = db.prepare(
    'INSERT OR REPLACE INTO meeting_attendees (meeting_id, person_id, role) VALUES (?,?,?)'
  );
  const findPersonByName = db.prepare('SELECT id FROM people WHERE name = ?');

  const stats = db.transaction(() => {
    const summary = { created: 0, attendeeLinked: 0, skipped: 0 };
    meetings.forEach((meeting) => {
      const topic = (meeting.topic || '').trim();
      const meetingDate = (meeting.meetingDate || '').trim();
      if (!topic || !meetingDate) {
        summary.skipped += 1;
        return;
      }
      const meetingId = insertMeeting.run(
        topic,
        meetingDate,
        meeting.location || '',
        meeting.summary || '',
        meeting.category || '政治学习'
      ).lastInsertRowid;
      summary.created += 1;
      if (Array.isArray(meeting.attendees)) {
        meeting.attendees.forEach((attendee) => {
          const personId = attendee.personId
            ? Number(attendee.personId)
            : attendee.personName
            ? findPersonByName.get(attendee.personName)?.id
            : null;
          if (!personId) {
            return;
          }
          insertAttendee.run(meetingId, personId, attendee.role || '参会');
          summary.attendeeLinked += 1;
        });
      }
    });
    return summary;
  })();

  logAction({ actorId: req.user.id, action: 'import', entityType: 'meetings', detail: stats });
  res.status(201).json(stats);
});

router.post(
  '/api/import/excel',
  authenticate,
  requirePermission('import.excel'),
  upload.single('file'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: '请上传 Excel 文件' });
    }
    const allowCreate = req.query.allowCreate === 'true' || req.query.allowCreate === '1';

    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.readFile(req.file.path);
    } catch (error) {
      return res.status(400).json({ message: 'Excel 解析失败', detail: error.message });
    } finally {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({ message: 'Excel 没有可用表格' });
    }

    const headerMap = {};
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const key = normalizeExcelValue(cell).trim();
      if (key) {
        headerMap[colNumber] = key;
      }
    });

    const errors = [];
    const payload = [];
    const currentMonth = getCurrentMonth();

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber);
      if (!row || row.actualCellCount === 0) {
        continue;
      }
      const rowData = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const key = headerMap[colNumber];
        if (!key) return;
        rowData[key] = normalizeExcelValue(cell).trim();
      });
      if (!Object.keys(rowData).length) {
        continue;
      }

      const name = rowData['姓名']?.toString().trim();
      const birthDate = rowData['出生日期']?.toString().trim();
      const gender = rowData['性别']?.toString().trim();
      const phone = rowData['手机号']?.toString().trim();
      const monthValue =
        rowData['月份']?.toString().trim() ||
        rowData['month']?.toString().trim() ||
        rowData['Month']?.toString().trim();
      const dimensionMonth = normalizeMonthInput(monthValue) || currentMonth;

      if (!name || !birthDate || !gender || !phone) {
        errors.push({ row: rowNumber, message: '姓名/出生日期/性别/手机号 必填' });
        continue;
      }

      const dimensions = DIMENSION_CATEGORIES.map((category) => ({
        category,
        detail: rowData[category] ? rowData[category].toString().trim() : ''
      }));

      payload.push({
        name,
        title: rowData['职务抬头']?.toString().trim() || '',
        department: rowData['所属部门']?.toString().trim() || '',
        focus: rowData['聚焦方向']?.toString().trim() || '',
        bio: rowData['个人简介']?.toString().trim() || '',
        birth_date: birthDate,
        gender,
        phone,
        dimensions,
        dimensionMonth
      });
    }

    if (errors.length) {
      return res.status(400).json({ message: 'Excel 校验失败', errors });
    }

    const insertPerson = db.prepare(
      'INSERT INTO people (name,title,department,focus,bio,icon,birth_date,gender,phone) VALUES (?,?,?,?,?,?,?,?,?)'
    );
    const updatePerson = db.prepare(
      `UPDATE people SET title = COALESCE(?, title),
      department = COALESCE(?, department), focus = COALESCE(?, focus),
      bio = COALESCE(?, bio), birth_date = COALESCE(?, birth_date),
      gender = COALESCE(?, gender), phone = COALESCE(?, phone)
     WHERE id = ?`
    );
    const findPersonByName = db.prepare('SELECT id FROM people WHERE name = ?');
    const deleteDimensions = db.prepare('DELETE FROM dimensions_monthly WHERE person_id = ? AND month = ?');
    const insertDimension = db.prepare(
      'INSERT INTO dimensions_monthly (person_id, category, month, detail) VALUES (?,?,?,?)'
    );

    const summary = db.transaction(() => {
      const stats = { created: 0, updated: 0, skipped: 0, skippedNames: [] };
      payload.forEach((person) => {
        const existing = findPersonByName.get(person.name);
        const targetMonth = normalizeMonthInput(person.dimensionMonth) || currentMonth;
        const normalizedDimensions = normalizeDimensionList(person.dimensions);
        if (existing) {
          updatePerson.run(
            person.title,
            person.department,
            person.focus,
            person.bio,
            person.birth_date,
            person.gender,
            person.phone,
            existing.id
          );
          deleteDimensions.run(existing.id, targetMonth);
          normalizedDimensions.forEach((dimension) => {
            insertDimension.run(existing.id, dimension.category, targetMonth, dimension.detail);
          });
          stats.updated += 1;
        } else if (allowCreate) {
          const newId = insertPerson.run(
            person.name,
            person.title,
            person.department,
            person.focus,
            person.bio,
            '',
            person.birth_date,
            person.gender,
            person.phone
          ).lastInsertRowid;
          normalizedDimensions.forEach((dimension) => {
            insertDimension.run(newId, dimension.category, targetMonth, dimension.detail);
          });
          stats.created += 1;
        } else {
          stats.skipped += 1;
          stats.skippedNames.push(person.name);
        }
      });
      return stats;
    })();

    logAction({ actorId: req.user.id, action: 'import', entityType: 'people', detail: summary });
    if (!allowCreate && summary.skipped > 0) {
      return res.json({
        created: summary.created,
        updated: summary.updated,
        skipped: summary.skipped,
        needsConfirm: true,
        pendingNames: summary.skippedNames.slice(0, 20)
      });
    }
    res.json({ created: summary.created, updated: summary.updated, skipped: summary.skipped });
  }
);

module.exports = router;
