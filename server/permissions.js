const PERMISSIONS = [
  { key: 'people.view.all', label: '基础档案-查看全部' },
  { key: 'people.edit.all', label: '基础档案-编辑全部' },
  { key: 'people.edit.self', label: '基础档案-编辑本人' },
  { key: 'dimensions.view.all', label: '六维画像-查看全部' },
  { key: 'dimensions.edit.all', label: '六维画像-编辑全部' },
  { key: 'dimensions.edit.self', label: '六维画像-编辑本人' },
  { key: 'evaluations.view', label: '评价管理-查看' },
  { key: 'evaluations.edit', label: '评价管理-编辑' },
  { key: 'growth.view.all', label: '成长轨迹-查看全部' },
  { key: 'growth.edit.all', label: '成长轨迹-编辑全部' },
  { key: 'growth.edit.self', label: '成长轨迹-编辑本人' },
  { key: 'meetings.view', label: '会议活动-查看' },
  { key: 'meetings.edit', label: '会议活动-编辑' },
  { key: 'certificates.view', label: '证书管理-查看' },
  { key: 'certificates.upload', label: '证书管理-上传' },
  { key: 'certificates.delete', label: '证书管理-删除' },
  { key: 'sensitive.view', label: '敏感信息-查看明文' },
  { key: 'users.manage', label: '账号管理' },
  { key: 'permissions.manage', label: '权限配置' },
  { key: 'import.excel', label: 'Excel 导入' },
  { key: 'export.excel', label: 'Excel 导出' },
  { key: 'logs.view', label: '操作日志-查看' }
];

const DEFAULT_PERMISSIONS = {
  super_admin: PERMISSIONS.map((item) => item.key),
  admin: [
    'people.view.all',
    'people.edit.all',
    'dimensions.view.all',
    'dimensions.edit.all',
    'evaluations.view',
    'evaluations.edit',
    'growth.view.all',
    'growth.edit.all',
    'meetings.view',
    'meetings.edit',
    'certificates.view',
    'certificates.upload',
    'certificates.delete',
    'sensitive.view',
    'users.manage',
    'import.excel',
    'export.excel',
    'logs.view'
  ],
  user: [
    'people.view.all',
    'people.edit.self',
    'dimensions.view.all',
    'dimensions.edit.self',
    'evaluations.view',
    'growth.view.all',
    'growth.edit.self',
    'meetings.view',
    'certificates.view',
    'certificates.upload',
    'certificates.delete'
  ],
  display: [
    'people.view.all',
    'dimensions.view.all',
    'evaluations.view',
    'growth.view.all',
    'meetings.view',
    'certificates.view'
  ]
};

function getDefaultPermissions(role, isSuperAdmin = false) {
  if (isSuperAdmin) {
    return DEFAULT_PERMISSIONS.super_admin.slice();
  }
  const defaults = DEFAULT_PERMISSIONS[role] || [];
  return defaults.slice();
}

function normalizePermissions(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter(Boolean);
  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (error) {
    return [];
  }
}

function hasPermission(user, permission) {
  if (!user) return false;
  if (user.is_super_admin) return true;
  const permissions = normalizePermissions(user.permissions);
  return permissions.includes(permission);
}

module.exports = {
  PERMISSIONS,
  DEFAULT_PERMISSIONS,
  getDefaultPermissions,
  normalizePermissions,
  hasPermission
};
