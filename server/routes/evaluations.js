const express = require('express');
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { diffFields, logAction } = require('../utils/audit');

const router = express.Router();

router.get('/api/evaluations', authenticate, requirePermission('evaluations.view'), (req, res) => {
  const personId = req.query.personId ? Number(req.query.personId) : null;
  const resolvedPersonId = personId || (req.user.role === 'user' ? req.user.personId : null);
  if (!resolvedPersonId) {
    return res.status(400).json({ message: '缺少人员编号' });
  }
  if (req.user.role === 'user' && req.user.personId !== resolvedPersonId) {
    return res.status(403).json({ message: '仅可查看本人评价' });
  }
  const rows = db.prepare('SELECT * FROM evaluations WHERE person_id = ? ORDER BY created_at DESC').all(resolvedPersonId);
  res.json(rows);
});

router.post('/api/evaluations', authenticate, requirePermission('evaluations.edit'), (req, res) => {
  const { personId, type, period, content } = req.body;
  if (!personId || !type || !period || !content) {
    return res.status(400).json({ message: '评价参数不完整' });
  }
  if (!['quarterly', 'annual', 'marriage'].includes(type)) {
    return res.status(400).json({ message: '评价类型不合法' });
  }
  const insert = db.prepare('INSERT INTO evaluations (person_id, type, period, content, created_by) VALUES (?,?,?,?,?)');
  const evaluationId = insert.run(personId, type, period, content, req.user.id).lastInsertRowid;
  const created = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(evaluationId);
  logAction({
    actorId: req.user.id,
    action: 'create',
    entityType: 'evaluations',
    entityId: evaluationId,
    detail: { personId, type, period }
  });
  res.status(201).json(created);
});

router.put('/api/evaluations/:id', authenticate, requirePermission('evaluations.edit'), (req, res) => {
  const evaluationId = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(evaluationId);
  if (!existing) {
    return res.status(404).json({ message: '评价不存在' });
  }
  const { type, period, content } = req.body;
  if (type && !['quarterly', 'annual', 'marriage'].includes(type)) {
    return res.status(400).json({ message: '评价类型不合法' });
  }
  db.prepare(
    `UPDATE evaluations
     SET type = COALESCE(?, type),
         period = COALESCE(?, period),
         content = COALESCE(?, content),
         updated_at = datetime('now')
     WHERE id = ?`
  ).run(type, period, content, evaluationId);
  const updated = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(evaluationId);
  const changes = diffFields(existing, updated, ['type', 'period', 'content']);
  if (Object.keys(changes).length > 0) {
    logAction({
      actorId: req.user.id,
      action: 'update',
      entityType: 'evaluations',
      entityId: evaluationId,
      detail: changes
    });
  }
  res.json(updated);
});

router.delete('/api/evaluations/:id', authenticate, requirePermission('evaluations.edit'), (req, res) => {
  const evaluationId = Number(req.params.id);
  const existing = db.prepare('SELECT id FROM evaluations WHERE id = ?').get(evaluationId);
  if (!existing) {
    return res.status(404).json({ message: '评价不存在' });
  }
  db.prepare('DELETE FROM evaluations WHERE id = ?').run(evaluationId);
  logAction({ actorId: req.user.id, action: 'delete', entityType: 'evaluations', entityId: evaluationId });
  res.json({ success: true });
});

module.exports = router;
