const express = require('express');
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

const router = express.Router();

router.get('/api/logs', authenticate, requirePermission('logs.view'), (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 200, 500);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const rows = db
    .prepare(
      `SELECT l.*, u.name as actorName, u.email as actorEmail
       FROM audit_logs l
       LEFT JOIN users u ON u.id = l.actor_id
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(limit, offset)
    .map((row) => ({
      ...row,
      detail: row.detail ? JSON.parse(row.detail) : null
    }));
  res.json(rows);
});

module.exports = router;
