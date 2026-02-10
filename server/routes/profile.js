const express = require('express');
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');
const { hasPermission, normalizePermissions } = require('../permissions');

const router = express.Router();

router.get('/api/profile', authenticate, (req, res) => {
  const user = db
    .prepare(
      'SELECT id,name,email,role,person_id,permissions,is_super_admin,sensitive_unmasked FROM users WHERE id = ?'
    )
    .get(req.user.id);
  if (!user) {
    return res.status(404).json({ message: '账号不存在' });
  }
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      personId: user.person_id,
      isSuperAdmin: user.is_super_admin === 1,
      sensitiveUnmasked: user.sensitive_unmasked === 1,
      permissions: normalizePermissions(user.permissions)
    }
  });
});

router.put('/api/profile/sensitive', authenticate, (req, res) => {
  if (!hasPermission(req.user, 'sensitive.view')) {
    return res.status(403).json({ message: '无权查看敏感信息' });
  }
  const { sensitiveUnmasked } = req.body;
  if (typeof sensitiveUnmasked !== 'boolean') {
    return res.status(400).json({ message: '参数无效' });
  }
  db.prepare('UPDATE users SET sensitive_unmasked = ? WHERE id = ?').run(
    sensitiveUnmasked ? 1 : 0,
    req.user.id
  );
  res.json({ sensitiveUnmasked });
});

module.exports = router;
