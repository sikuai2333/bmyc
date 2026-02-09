const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { normalizePermissions } = require('../permissions');
const { JWT_SECRET } = require('../config/env');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: '缺少认证信息' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db
      .prepare(
        'SELECT id,name,email,role,person_id,permissions,is_super_admin,sensitive_unmasked FROM users WHERE id = ?'
      )
      .get(payload.id);
    if (!user) {
      return res.status(401).json({ message: '账号不存在或已被移除' });
    }
    req.user = {
      ...user,
      personId: user.person_id,
      is_super_admin: user.is_super_admin === 1,
      sensitive_unmasked: user.sensitive_unmasked === 1,
      permissions: normalizePermissions(user.permissions)
    };
    next();
  } catch (error) {
    res.status(401).json({ message: '认证失败', detail: error.message });
  }
}

module.exports = {
  authenticate
};
