const express = require('express');
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');
const { requireAnyPermission, requirePermission } = require('../middleware/permissions');
const { applySensitiveMask } = require('../utils/sensitive');
const { canEditPerson } = require('../utils/access');
const { diffFields, logAction } = require('../utils/audit');

const router = express.Router();

router.get(
  '/api/personnel',
  authenticate,
  requireAnyPermission(['people.view.all', 'people.edit.all', 'people.edit.self']),
  (req, res) => {
    const keyword = (req.query.q || '').trim();
    const baseQuery = 'SELECT id,name,title,department,focus,bio,icon,birth_date,gender,phone FROM people';
    const people = keyword
      ? db
          .prepare(`${baseQuery} WHERE name LIKE ? OR focus LIKE ? OR department LIKE ?`)
          .all(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
      : db.prepare(`${baseQuery} ORDER BY id`).all();

    const dimensionCountStmt = db.prepare('SELECT COUNT(*) as count FROM dimensions_monthly WHERE person_id = ?');
    const dimensionMonthCountStmt = db.prepare(
      'SELECT COUNT(DISTINCT month) as count FROM dimensions_monthly WHERE person_id = ?'
    );
    const latestDimensionMonthStmt = db.prepare(
      'SELECT month FROM dimensions_monthly WHERE person_id = ? ORDER BY month DESC LIMIT 1'
    );

    const formatted = people.map((person) => {
      const dimensionCount = dimensionCountStmt.get(person.id).count || 0;
      const dimensionMonthCount = dimensionMonthCountStmt.get(person.id).count || 0;
      const latestDimensionMonth = latestDimensionMonthStmt.get(person.id)?.month || null;
      return {
        ...applySensitiveMask(person, req.user),
        dimensionCount,
        dimensionMonthCount,
        latestDimensionMonth
      };
    });

    res.json(formatted);
  }
);

router.get(
  '/api/personnel/:id',
  authenticate,
  requireAnyPermission(['people.view.all', 'people.edit.all', 'people.edit.self']),
  (req, res) => {
    const person = db
      .prepare('SELECT id,name,title,department,focus,bio,icon,birth_date,gender,phone FROM people WHERE id = ?')
      .get(req.params.id);
    if (!person) {
      return res.status(404).json({ message: '人才不存在' });
    }
    const dimensionCount =
      db.prepare('SELECT COUNT(*) as count FROM dimensions_monthly WHERE person_id = ?').get(person.id).count || 0;
    const dimensionMonthCount =
      db.prepare('SELECT COUNT(DISTINCT month) as count FROM dimensions_monthly WHERE person_id = ?').get(person.id)
        .count || 0;
    const latestDimensionMonth =
      db
        .prepare('SELECT month FROM dimensions_monthly WHERE person_id = ? ORDER BY month DESC LIMIT 1')
        .get(person.id)?.month || null;

    res.json({
      ...applySensitiveMask(person, req.user),
      dimensionCount,
      dimensionMonthCount,
      latestDimensionMonth
    });
  }
);

router.put('/api/personnel/:id', authenticate, (req, res) => {
  const targetPersonId = Number(req.params.id);
  if (!canEditPerson(req.user, targetPersonId)) {
    return res.status(403).json({ message: '无权限编辑档案' });
  }

  const { focus, bio, title, department, birth_date, gender, phone } = req.body;
  const before = db
    .prepare('SELECT id,name,title,department,focus,bio,icon,birth_date,gender,phone FROM people WHERE id = ?')
    .get(targetPersonId);
  db.prepare(
    `UPDATE people SET focus = COALESCE(?, focus), bio = COALESCE(?, bio),
      title = COALESCE(?, title), department = COALESCE(?, department),
      birth_date = COALESCE(?, birth_date), gender = COALESCE(?, gender),
      phone = COALESCE(?, phone)
     WHERE id = ?`
  ).run(focus, bio, title, department, birth_date, gender, phone, targetPersonId);

  const updated = db
    .prepare('SELECT id,name,title,department,focus,bio,icon,birth_date,gender,phone FROM people WHERE id = ?')
    .get(targetPersonId);
  if (before) {
    const changes = diffFields(before, updated, [
      'title',
      'department',
      'focus',
      'bio',
      'birth_date',
      'gender',
      'phone'
    ]);
    if (Object.keys(changes).length > 0) {
      logAction({
        actorId: req.user.id,
        action: 'update',
        entityType: 'people',
        entityId: targetPersonId,
        detail: changes
      });
    }
  }
  res.json(updated);
});

router.post('/api/personnel', authenticate, requirePermission('people.edit.all'), (req, res) => {
  const {
    name,
    title = '',
    department = '',
    focus = '',
    bio = '',
    icon = '',
    birth_date = null,
    gender = '',
    phone = ''
  } = req.body;
  if (!name) {
    return res.status(400).json({ message: '请输入姓名' });
  }
  const insertPerson = db.prepare(
    'INSERT INTO people (name,title,department,focus,bio,icon,birth_date,gender,phone) VALUES (?,?,?,?,?,?,?,?,?)'
  );
  const newId = insertPerson.run(
    name,
    title,
    department,
    focus,
    bio,
    icon,
    birth_date,
    gender,
    phone
  ).lastInsertRowid;
  const created = db
    .prepare('SELECT id,name,title,department,focus,bio,icon,birth_date,gender,phone FROM people WHERE id = ?')
    .get(newId);
  logAction({
    actorId: req.user.id,
    action: 'create',
    entityType: 'people',
    entityId: newId,
    detail: { name }
  });
  res.status(201).json(created);
});

router.delete('/api/personnel/:id', authenticate, requirePermission('people.edit.all'), (req, res) => {
  const personId = Number(req.params.id);
  const person = db.prepare('SELECT id FROM people WHERE id = ?').get(personId);
  if (!person) {
    return res.status(404).json({ message: '人才不存在' });
  }
  const remove = db.transaction(() => {
    db.prepare('DELETE FROM meeting_attendees WHERE person_id = ?').run(personId);
    db.prepare('DELETE FROM dimensions_monthly WHERE person_id = ?').run(personId);
    db.prepare('DELETE FROM dimensions WHERE person_id = ?').run(personId);
    db.prepare('UPDATE users SET person_id = NULL WHERE person_id = ?').run(personId);
    db.prepare('DELETE FROM people WHERE id = ?').run(personId);
  });
  remove();
  logAction({ actorId: req.user.id, action: 'delete', entityType: 'people', entityId: personId });
  res.json({ success: true });
});

module.exports = router;
