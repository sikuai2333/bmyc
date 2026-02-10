const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { JWT_SECRET } = require('../config/env');
const { normalizePermissions } = require('../permissions');

const router = express.Router();

router.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: '请输入邮箱和密码' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ message: '账号不存在' });
  }
  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ message: '密码错误' });
  }
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '12h' });
  res.json({
    token,
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

module.exports = router;
