const express = require('express');
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');
const { requireAnyPermission } = require('../middleware/permissions');
const { READING_CATEGORIES } = require('../config/constants');
const { diffFields, logAction } = require('../utils/audit');

const router = express.Router();
const EDIT_PERMISSIONS = ['users.manage', 'permissions.manage'];

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

router.get('/api/reading-zone', authenticate, (req, res) => {
  const category = normalizeText(req.query.category);
  if (category && READING_CATEGORIES.length > 0 && !READING_CATEGORIES.includes(category)) {
    return res.status(400).json({ message: '栏目分类不合法' });
  }
  const rows = category
    ? db
        .prepare(
          `SELECT rz.*, u.name as author_name
           FROM reading_zone_items rz
           LEFT JOIN users u ON u.id = rz.created_by
           WHERE rz.category = ?
           ORDER BY rz.published_at DESC, rz.created_at DESC, rz.id DESC`
        )
        .all(category)
    : db
        .prepare(
          `SELECT rz.*, u.name as author_name
           FROM reading_zone_items rz
           LEFT JOIN users u ON u.id = rz.created_by
           ORDER BY rz.published_at DESC, rz.created_at DESC, rz.id DESC`
        )
        .all();
  res.json(rows);
});

router.get('/api/reading-zone/:id', authenticate, (req, res) => {
  const readingId = Number(req.params.id);
  const row = db
    .prepare(
      `SELECT rz.*, u.name as author_name
       FROM reading_zone_items rz
       LEFT JOIN users u ON u.id = rz.created_by
       WHERE rz.id = ?`
    )
    .get(readingId);
  if (!row) {
    return res.status(404).json({ message: '内容不存在' });
  }
  res.json(row);
});

router.post('/api/reading-zone', authenticate, requireAnyPermission(EDIT_PERMISSIONS), (req, res) => {
  const title = normalizeText(req.body.title);
  const category = normalizeText(req.body.category);
  const summary = normalizeText(req.body.summary);
  const content = normalizeText(req.body.content);
  const coverUrl = normalizeText(req.body.coverUrl);
  const sourceUrl = normalizeText(req.body.sourceUrl);
  const readMinutesRaw = req.body.readMinutes;
  const readMinutes =
    readMinutesRaw === '' || readMinutesRaw === null || readMinutesRaw === undefined
      ? null
      : Number.isFinite(Number(readMinutesRaw))
        ? Number(readMinutesRaw)
        : null;

  if (!title || !category) {
    return res.status(400).json({ message: '请填写标题与分类' });
  }
  if (READING_CATEGORIES.length > 0 && !READING_CATEGORIES.includes(category)) {
    return res.status(400).json({ message: '栏目分类不合法' });
  }
  if (!summary && !content) {
    return res.status(400).json({ message: '请填写摘要或正文内容' });
  }

  const insert = db.prepare(
    `INSERT INTO reading_zone_items
     (title, category, summary, content, cover_url, source_url, read_minutes, created_by)
     VALUES (?,?,?,?,?,?,?,?)`
  );
  const readingId = insert.run(
    title,
    category,
    summary,
    content,
    coverUrl,
    sourceUrl,
    readMinutes,
    req.user.id
  ).lastInsertRowid;
  const created = db.prepare('SELECT * FROM reading_zone_items WHERE id = ?').get(readingId);
  logAction({
    actorId: req.user.id,
    action: 'create',
    entityType: 'reading_zone_items',
    entityId: readingId,
    detail: { title, category }
  });
  res.status(201).json(created);
});

router.put('/api/reading-zone/:id', authenticate, requireAnyPermission(EDIT_PERMISSIONS), (req, res) => {
  const readingId = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM reading_zone_items WHERE id = ?').get(readingId);
  if (!existing) {
    return res.status(404).json({ message: '内容不存在' });
  }

  const nextTitle =
    typeof req.body.title === 'string' ? normalizeText(req.body.title) : existing.title || '';
  const nextCategory =
    typeof req.body.category === 'string'
      ? normalizeText(req.body.category)
      : existing.category || '';
  const nextSummary =
    typeof req.body.summary === 'string' ? normalizeText(req.body.summary) : existing.summary || '';
  const nextContent =
    typeof req.body.content === 'string' ? normalizeText(req.body.content) : existing.content || '';
  const nextCoverUrl =
    typeof req.body.coverUrl === 'string' ? normalizeText(req.body.coverUrl) : existing.cover_url || '';
  const nextSourceUrl =
    typeof req.body.sourceUrl === 'string' ? normalizeText(req.body.sourceUrl) : existing.source_url || '';
  const nextReadMinutes =
    req.body.readMinutes === '' || req.body.readMinutes === null
      ? null
      : req.body.readMinutes !== undefined
        ? Number.isFinite(Number(req.body.readMinutes))
          ? Number(req.body.readMinutes)
          : null
        : existing.read_minutes;

  if (!nextTitle || !nextCategory) {
    return res.status(400).json({ message: '请填写标题与分类' });
  }
  if (READING_CATEGORIES.length > 0 && !READING_CATEGORIES.includes(nextCategory)) {
    return res.status(400).json({ message: '栏目分类不合法' });
  }
  if (!nextSummary && !nextContent) {
    return res.status(400).json({ message: '请填写摘要或正文内容' });
  }

  db.prepare(
    `UPDATE reading_zone_items
     SET title = ?,
         category = ?,
         summary = ?,
         content = ?,
         cover_url = ?,
         source_url = ?,
         read_minutes = ?,
         updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    nextTitle,
    nextCategory,
    nextSummary,
    nextContent,
    nextCoverUrl,
    nextSourceUrl,
    nextReadMinutes,
    readingId
  );

  const updated = db.prepare('SELECT * FROM reading_zone_items WHERE id = ?').get(readingId);
  const changes = diffFields(existing, updated, [
    'title',
    'category',
    'summary',
    'content',
    'cover_url',
    'source_url',
    'read_minutes'
  ]);
  if (Object.keys(changes).length > 0) {
    logAction({
      actorId: req.user.id,
      action: 'update',
      entityType: 'reading_zone_items',
      entityId: readingId,
      detail: changes
    });
  }
  res.json(updated);
});

router.delete('/api/reading-zone/:id', authenticate, requireAnyPermission(EDIT_PERMISSIONS), (req, res) => {
  const readingId = Number(req.params.id);
  const existing = db.prepare('SELECT id FROM reading_zone_items WHERE id = ?').get(readingId);
  if (!existing) {
    return res.status(404).json({ message: '内容不存在' });
  }
  db.prepare('DELETE FROM reading_zone_items WHERE id = ?').run(readingId);
  logAction({ actorId: req.user.id, action: 'delete', entityType: 'reading_zone_items', entityId: readingId });
  res.json({ success: true });
});

module.exports = router;
