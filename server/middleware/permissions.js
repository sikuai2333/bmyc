const { hasPermission } = require('../permissions');

function requirePermission(permission) {
  return function permissionGuard(req, res, next) {
    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({ message: '无操作权限' });
    }
    next();
  };
}

function requireAnyPermission(permissions = []) {
  return function permissionGuard(req, res, next) {
    const allowed = permissions.some((permission) => hasPermission(req.user, permission));
    if (!allowed) {
      return res.status(403).json({ message: '无操作权限' });
    }
    next();
  };
}

module.exports = {
  requirePermission,
  requireAnyPermission
};
