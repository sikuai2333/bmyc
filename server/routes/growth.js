const express = require('express');
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');
const { requireAnyPermission } = require('../middleware/permissions');
const { canEditGrowth, canViewGrowth } = require('../utils/access');
const { logAction } = require('../utils/audit');

const router = express.Router();

router.get('/api/growth', authenticate, requireAnyPermission(['growth.view.all', 'growth.edit.self']), (req, res) => {
  const personId = req.query.personId ? Number(req.query.personId) : null;
  const resolvedPersonId = personId || (req.user.role === 'user' ? req.user.personId : null);
  if (!resolvedPersonId) {
    return res.status(400).json({ message: '缺少人员编号' });
  }
  if (!canViewGrowth(req.user, resolvedPersonId)) {
    return res.status(403).json({ message: '无权查看成长轨迹' });
  }
  const rows = db
    .prepare('SELECT * FROM growth_events WHERE person_id = ? ORDER BY event_date DESC, id DESC')
    .all(resolvedPersonId);
  res.json(rows);
});

router.post('/api/growth', authenticate, (req, res) => {
  const { personId, eventDate, title, description, category } = req.body;
  if (!personId || !eventDate || !title) {
    return res.status(400).json({ message: '成长轨迹参数不完整' });
  }
  if (!canEditGrowth(req.user, personId)) {
    return res.status(403).json({ message: '无权维护成长轨迹' });
  }
  const insert = db.prepare(
    'INSERT INTO growth_events (person_id, event_date, title, description, category, created_by) VALUES (?,?,?,?,?,?)'
  );
  const eventId = insert.run(personId, eventDate, title, description || '', category || '', req.user.id).lastInsertRowid;
  const created = db.prepare('SELECT * FROM growth_events WHERE id = ?').get(eventId);
  logAction({
    actorId: req.user.id,
    action: 'create',
    entityType: 'growth_events',
    entityId: eventId,
    detail: { personId, title }
  });
  res.status(201).json(created);
});

router.delete('/api/growth/:id', authenticate, (req, res) => {
  const eventId = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM growth_events WHERE id = ?').get(eventId);
  if (!existing) {
    return res.status(404).json({ message: '成长轨迹不存在' });
  }
  if (!canEditGrowth(req.user, existing.person_id)) {
    return res.status(403).json({ message: '无权删除成长轨迹' });
  }
  db.prepare('DELETE FROM growth_events WHERE id = ?').run(eventId);
  logAction({ actorId: req.user.id, action: 'delete', entityType: 'growth_events', entityId: eventId });
  res.json({ success: true });
});

module.exports = router;
