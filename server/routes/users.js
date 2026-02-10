const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');
const { requireAnyPermission, requirePermission } = require('../middleware/permissions');
const { PERMISSIONS, getDefaultPermissions, hasPermission, normalizePermissions } = require('../permissions');
const { logAction } = require('../utils/audit');

const router = express.Router();

router.get('/api/users', authenticate, requireAnyPermission(['users.manage', 'permissions.manage']), (req, res) => {
  const users = db
    .prepare(
      'SELECT id,name,email,role,person_id as personId,permissions,is_super_admin,sensitive_unmasked FROM users ORDER BY id'
    )
    .all()
    .map((user) => ({
      ...user,
      isSuperAdmin: user.is_super_admin === 1,
      sensitiveUnmasked: user.sensitive_unmasked === 1,
      permissions: normalizePermissions(user.permissions)
    }));
  res.json(users);
});

router.post('/api/users', authenticate, requirePermission('users.manage'), (req, res) => {
  const {
    name,
    email,
    password,
    role = 'user',
    personId = null,
    permissions,
    isSuperAdmin = false,
    sensitiveUnmasked = false
  } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: '请填写姓名、邮箱和密码' });
  }
  if (!['user', 'admin', 'display'].includes(role)) {
    return res.status(400).json({ message: '角色无效' });
  }
  try {
    const hash = bcrypt.hashSync(password, 10);
    const insertUser = db.prepare(
      'INSERT INTO users (name,email,role,password_hash,person_id,permissions,is_super_admin,sensitive_unmasked) VALUES (?,?,?,?,?,?,?,?)'
    );
    const canAssignSuper = req.user.is_super_admin;
    const resolvedPermissions = Array.isArray(permissions)
      ? permissions
      : getDefaultPermissions(role, canAssignSuper && isSuperAdmin);
    const userId = insertUser.run(
      name,
      email,
      role,
      hash,
      personId || null,
      JSON.stringify(resolvedPermissions),
      canAssignSuper && isSuperAdmin ? 1 : 0,
      sensitiveUnmasked ? 1 : 0
    ).lastInsertRowid;
    const created = db
      .prepare(
        'SELECT id,name,email,role,person_id as personId,permissions,is_super_admin,sensitive_unmasked FROM users WHERE id = ?'
      )
      .get(userId);
    const response = {
      ...created,
      isSuperAdmin: created.is_super_admin === 1,
      sensitiveUnmasked: created.sensitive_unmasked === 1,
      permissions: normalizePermissions(created.permissions)
    };
    logAction({ actorId: req.user.id, action: 'create', entityType: 'users', entityId: userId });
    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({ message: '创建账号失败', detail: error.message });
  }
});

router.put('/api/users/:id', authenticate, requireAnyPermission(['users.manage', 'permissions.manage']), (req, res) => {
  const userId = Number(req.params.id);
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!target) {
    return res.status(404).json({ message: '账号不存在' });
  }
  let { name, email, role, personId, password, permissions, isSuperAdmin, sensitiveUnmasked } = req.body;
  const canManageUsers = req.user.is_super_admin || hasPermission(req.user, 'users.manage');
  if (!canManageUsers) {
    name = null;
    email = null;
    role = null;
    personId = null;
    password = null;
  }
  if (role && !['user', 'admin', 'display'].includes(role)) {
    return res.status(400).json({ message: '角色无效' });
  }
  const hash = password ? bcrypt.hashSync(password, 10) : null;
  const canAssignSuper = req.user.is_super_admin;
  const roleChanged = role && role !== target.role;
  const nextIsSuper =
    typeof isSuperAdmin === 'boolean' && canAssignSuper ? (isSuperAdmin ? 1 : 0) : target.is_super_admin;
  const nextSensitive =
    typeof sensitiveUnmasked === 'boolean' ? (sensitiveUnmasked ? 1 : 0) : target.sensitive_unmasked;
  const resolvedPermissions = roleChanged
    ? JSON.stringify(getDefaultPermissions(role, nextIsSuper === 1))
    : Array.isArray(permissions)
    ? JSON.stringify(permissions)
    : target.permissions;
  db.prepare(
    `UPDATE users
     SET name = COALESCE(?, name),
         email = COALESCE(?, email),
         role = COALESCE(?, role),
         person_id = COALESCE(?, person_id),
         password_hash = COALESCE(?, password_hash),
         permissions = COALESCE(?, permissions),
         is_super_admin = COALESCE(?, is_super_admin),
         sensitive_unmasked = COALESCE(?, sensitive_unmasked)
     WHERE id = ?`
  ).run(name, email, role, personId ?? target.person_id, hash, resolvedPermissions, nextIsSuper, nextSensitive, userId);
  const updated = db
    .prepare(
      'SELECT id,name,email,role,person_id as personId,permissions,is_super_admin,sensitive_unmasked FROM users WHERE id = ?'
    )
    .get(userId);
  const response = {
    ...updated,
    isSuperAdmin: updated.is_super_admin === 1,
    sensitiveUnmasked: updated.sensitive_unmasked === 1,
    permissions: normalizePermissions(updated.permissions)
  };
  logAction({ actorId: req.user.id, action: 'update', entityType: 'users', entityId: userId });
  res.json(response);
});

router.delete('/api/users/:id', authenticate, requirePermission('users.manage'), (req, res) => {
  const userId = Number(req.params.id);
  const target = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!target) {
    return res.status(404).json({ message: '账号不存在' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  logAction({ actorId: req.user.id, action: 'delete', entityType: 'users', entityId: userId });
  res.json({ success: true });
});

router.get('/api/permissions', authenticate, requirePermission('permissions.manage'), (req, res) => {
  res.json(PERMISSIONS);
});

module.exports = router;
