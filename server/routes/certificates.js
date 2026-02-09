const express = require('express');
const path = require('path');
const fs = require('fs');
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { upload, UPLOAD_DIR } = require('../middleware/upload');
const { canManageCertificates } = require('../utils/access');
const { logAction } = require('../utils/audit');

const router = express.Router();

router.get('/api/certificates', authenticate, requirePermission('certificates.view'), (req, res) => {
  const personId = req.query.personId ? Number(req.query.personId) : null;
  const resolvedPersonId = personId || (req.user.role === 'user' ? req.user.personId : null);
  if (!resolvedPersonId) {
    return res.status(400).json({ message: '缺少人员编号' });
  }
  if (req.user.role === 'user' && req.user.personId !== resolvedPersonId) {
    return res.status(403).json({ message: '仅可查看本人证书' });
  }
  const rows = db
    .prepare('SELECT * FROM certificates WHERE person_id = ? ORDER BY uploaded_at DESC')
    .all(resolvedPersonId);
  res.json(rows);
});

router.post('/api/certificates', authenticate, upload.single('file'), (req, res) => {
  const { personId, name, issuedDate, description, category } = req.body;
  if (!personId || !name) {
    return res.status(400).json({ message: '证书名称与人员必填' });
  }
  if (!canManageCertificates(req.user, personId)) {
    return res.status(403).json({ message: '无权上传证书' });
  }
  const filePath = req.file ? req.file.filename : null;
  const insert = db.prepare(
    'INSERT INTO certificates (person_id, name, issued_date, category, file_path, description, uploaded_by) VALUES (?,?,?,?,?,?,?)'
  );
  const certId = insert.run(
    Number(personId),
    name,
    issuedDate || null,
    category || '',
    filePath,
    description || '',
    req.user.id
  ).lastInsertRowid;
  const created = db.prepare('SELECT * FROM certificates WHERE id = ?').get(certId);
  logAction({
    actorId: req.user.id,
    action: 'create',
    entityType: 'certificates',
    entityId: certId,
    detail: { personId: Number(personId), name }
  });
  res.status(201).json(created);
});

router.delete('/api/certificates/:id', authenticate, (req, res) => {
  const certId = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM certificates WHERE id = ?').get(certId);
  if (!existing) {
    return res.status(404).json({ message: '证书不存在' });
  }
  if (!canManageCertificates(req.user, existing.person_id)) {
    return res.status(403).json({ message: '无权删除证书' });
  }
  if (existing.file_path) {
    const safeName = path.basename(existing.file_path);
    const fullPath = path.join(UPLOAD_DIR, safeName);
    if (fullPath.startsWith(UPLOAD_DIR) && fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
  db.prepare('DELETE FROM certificates WHERE id = ?').run(certId);
  logAction({ actorId: req.user.id, action: 'delete', entityType: 'certificates', entityId: certId });
  res.json({ success: true });
});

router.get('/api/certificates/:id/file', authenticate, requirePermission('certificates.view'), (req, res) => {
  const certId = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM certificates WHERE id = ?').get(certId);
  if (!existing) {
    return res.status(404).json({ message: '证书不存在' });
  }
  if (req.user.role === 'user' && req.user.personId !== existing.person_id) {
    return res.status(403).json({ message: '无权查看证书附件' });
  }
  if (existing.file_path) {
    const safeName = path.basename(existing.file_path);
    const fullPath = path.join(UPLOAD_DIR, safeName);
    if (!fullPath.startsWith(UPLOAD_DIR) || !fs.existsSync(fullPath)) {
      return res.status(404).json({ message: '附件不存在' });
    }
    return res.sendFile(fullPath);
  }
  return res.status(404).json({ message: '附件不存在' });
});

module.exports = router;
