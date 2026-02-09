const express = require('express');
const ExcelJS = require('exceljs');
const archiver = require('archiver');
const { db } = require('../db');
const { DIMENSION_CATEGORIES } = require('../config/constants');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { getCurrentMonth } = require('../utils/date');
const {
  safeFileName,
  applySectionStyle,
  applyHeaderStyle,
  applyValueBorder
} = require('../utils/excel');
const { logAction } = require('../utils/audit');

const router = express.Router();

router.get('/api/export/people', authenticate, requirePermission('export.excel'), async (req, res) => {
  const personId = req.query.personId ? Number(req.query.personId) : null;
  const people = personId
    ? db
        .prepare('SELECT id,name,title,department,focus,bio,icon,birth_date,gender,phone FROM people WHERE id = ?')
        .all(personId)
    : db
        .prepare('SELECT id,name,title,department,focus,bio,icon,birth_date,gender,phone FROM people ORDER BY id')
        .all();

  const dimensionStmt = db.prepare('SELECT month,category,detail FROM dimensions_monthly WHERE person_id = ?');
  const evaluationStmt = db.prepare('SELECT type,period,content,created_at FROM evaluations WHERE person_id = ?');
  const growthStmt = db.prepare('SELECT event_date,title,description,category FROM growth_events WHERE person_id = ?');
  const certStmt = db.prepare('SELECT name,issued_date,category,description,file_path FROM certificates WHERE person_id = ?');

  const exportTime = new Date().toLocaleString('zh-CN', { hour12: false });
  const totalColumns = Math.max(7, DIMENSION_CATEGORIES.length + 1);
  const columnLetters = Array.from({ length: totalColumns }, (_, idx) => String.fromCharCode(65 + idx));
  const titleRange = `A1:${columnLetters[totalColumns - 1]}1`;
  const infoRange = `A2:${columnLetters[totalColumns - 1]}2`;

  const buildWorkbook = (person) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = '金岩高新人才成长APP';
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet('人才档案');
    worksheet.columns = [{ width: 14 }, ...Array.from({ length: totalColumns - 1 }, () => ({ width: 22 }))];

    worksheet.mergeCells(titleRange);
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `人才档案全量导出 · ${person.name || '未知人员'}`;
    titleCell.font = { bold: true, size: 16, color: { argb: 'FF1F3A6D' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells(infoRange);
    const infoCell = worksheet.getCell('A2');
    infoCell.value = `导出时间：${exportTime}`;
    infoCell.font = { size: 11, color: { argb: 'FF6B7AA6' } };
    infoCell.alignment = { vertical: 'middle', horizontal: 'right' };

    let rowCursor = 4;
    worksheet.mergeCells(`A${rowCursor}:${columnLetters[totalColumns - 1]}${rowCursor}`);
    const baseHeader = worksheet.getCell(`A${rowCursor}`);
    baseHeader.value = '基础信息';
    applySectionStyle(baseHeader);
    rowCursor += 1;

    const addRow = (values, labelIdx = [0, 2, 4]) => {
      const row = worksheet.addRow(values);
      labelIdx.forEach((idx) => {
        const cell = row.getCell(idx + 1);
        cell.font = { bold: true, color: { argb: 'FF2F3B63' } };
        cell.alignment = { vertical: 'middle' };
      });
      row.eachCell((cell) => {
        applyValueBorder(cell);
        if (!cell.alignment) {
          cell.alignment = { vertical: 'middle' };
        }
      });
      return row;
    };

    addRow(['姓名', person.name || '', '出生日期', person.birth_date || '', '性别', person.gender || '']);
    addRow(['手机号', person.phone || '', '所属部门', person.department || '', '职务抬头', person.title || '']);

    const focusRow = worksheet.addRow(['聚焦方向', person.focus || '']);
    worksheet.mergeCells(`B${focusRow.number}:${columnLetters[totalColumns - 1]}${focusRow.number}`);
    focusRow.getCell(1).font = { bold: true, color: { argb: 'FF2F3B63' } };
    focusRow.eachCell((cell) => {
      applyValueBorder(cell);
      cell.alignment = { wrapText: true, vertical: 'top' };
    });

    const bioRow = worksheet.addRow(['个人简介', person.bio || '']);
    worksheet.mergeCells(`B${bioRow.number}:${columnLetters[totalColumns - 1]}${bioRow.number}`);
    bioRow.getCell(1).font = { bold: true, color: { argb: 'FF2F3B63' } };
    bioRow.eachCell((cell) => {
      applyValueBorder(cell);
      cell.alignment = { wrapText: true, vertical: 'top' };
    });

    rowCursor = bioRow.number + 2;
    worksheet.mergeCells(`A${rowCursor}:${columnLetters[totalColumns - 1]}${rowCursor}`);
    const dimHeader = worksheet.getCell(`A${rowCursor}`);
    dimHeader.value = '六维画像（按月记录）';
    applySectionStyle(dimHeader);
    rowCursor += 1;

    const dimHeadRow = worksheet.addRow(['月份', ...DIMENSION_CATEGORIES]);
    dimHeadRow.eachCell((cell) => applyHeaderStyle(cell));

    const dimensionRows = dimensionStmt.all(person.id);
    const monthMap = new Map();
    dimensionRows.forEach((dimension) => {
      if (!monthMap.has(dimension.month)) {
        monthMap.set(dimension.month, new Map());
      }
      monthMap.get(dimension.month).set(dimension.category, dimension.detail);
    });
    const months = Array.from(monthMap.keys()).sort((a, b) => b.localeCompare(a));
    if (!months.length) {
      months.push(getCurrentMonth());
    }
    months.forEach((month) => {
      const categoryMap = monthMap.get(month) || new Map();
      const row = worksheet.addRow([
        month,
        ...DIMENSION_CATEGORIES.map((category) => categoryMap.get(category) || '无')
      ]);
      row.eachCell((cell) => {
        applyValueBorder(cell);
        cell.alignment = { wrapText: true, vertical: 'top' };
      });
    });

    rowCursor = worksheet.lastRow.number + 2;
    worksheet.mergeCells(`A${rowCursor}:${columnLetters[totalColumns - 1]}${rowCursor}`);
    const evalHeader = worksheet.getCell(`A${rowCursor}`);
    evalHeader.value = '评价记录';
    applySectionStyle(evalHeader);
    rowCursor += 1;

    const evalHead = worksheet.addRow(['类型', '周期', '内容', '时间']);
    evalHead.eachCell((cell) => applyHeaderStyle(cell));
    evaluationStmt.all(person.id).forEach((evaluation) => {
      const row = worksheet.addRow([
        evaluation.type,
        evaluation.period,
        evaluation.content,
        evaluation.created_at
      ]);
      row.eachCell((cell) => {
        applyValueBorder(cell);
        cell.alignment = { wrapText: true, vertical: 'top' };
      });
    });

    rowCursor = worksheet.lastRow.number + 2;
    worksheet.mergeCells(`A${rowCursor}:${columnLetters[totalColumns - 1]}${rowCursor}`);
    const growthHeader = worksheet.getCell(`A${rowCursor}`);
    growthHeader.value = '成长轨迹';
    applySectionStyle(growthHeader);
    rowCursor += 1;

    const growthHead = worksheet.addRow(['时间', '标题', '描述', '类别']);
    growthHead.eachCell((cell) => applyHeaderStyle(cell));
    growthStmt.all(person.id).forEach((event) => {
      const row = worksheet.addRow([
        event.event_date,
        event.title,
        event.description || '',
        event.category || ''
      ]);
      row.eachCell((cell) => {
        applyValueBorder(cell);
        cell.alignment = { wrapText: true, vertical: 'top' };
      });
    });

    rowCursor = worksheet.lastRow.number + 2;
    worksheet.mergeCells(`A${rowCursor}:${columnLetters[totalColumns - 1]}${rowCursor}`);
    const certHeader = worksheet.getCell(`A${rowCursor}`);
    certHeader.value = '证书记录';
    applySectionStyle(certHeader);
    rowCursor += 1;

    const certHead = worksheet.addRow(['证书名称', '分类', '颁发时间', '描述', '附件路径']);
    certHead.eachCell((cell) => applyHeaderStyle(cell));
    certStmt.all(person.id).forEach((cert) => {
      const row = worksheet.addRow([
        cert.name,
        cert.category || '',
        cert.issued_date || '',
        cert.description || '',
        cert.file_path || ''
      ]);
      row.eachCell((cell) => {
        applyValueBorder(cell);
        cell.alignment = { wrapText: true, vertical: 'top' };
      });
    });

    return workbook;
  };

  res.setHeader('Content-Disposition', 'attachment; filename="talent-export.zip"');
  res.type('application/zip');

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.on('error', (error) => {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).end();
    }
  });
  archive.pipe(res);

  for (const person of people) {
    const workbook = buildWorkbook(person);
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `${safeFileName(person.name || `person-${person.id}`)}-档案.xlsx`;
    archive.append(Buffer.from(buffer), { name: fileName });
  }

  logAction({ actorId: req.user.id, action: 'export', entityType: 'people', detail: { count: people.length } });
  archive.finalize();
});

module.exports = router;
