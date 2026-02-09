const { hasPermission } = require('../permissions');

function canEditPerson(user, personId) {
  if (hasPermission(user, 'people.edit.all')) return true;
  if (hasPermission(user, 'people.edit.self') && user.personId === Number(personId)) return true;
  return false;
}

function canViewPerson(user, personId) {
  if (hasPermission(user, 'people.view.all')) return true;
  if (hasPermission(user, 'people.edit.all')) return true;
  if (hasPermission(user, 'people.edit.self') && user.personId === Number(personId)) return true;
  return false;
}

function canEditDimensions(user, personId) {
  if (hasPermission(user, 'dimensions.edit.all')) return true;
  if (hasPermission(user, 'dimensions.edit.self') && user.personId === Number(personId)) return true;
  return false;
}

function canEditGrowth(user, personId) {
  if (hasPermission(user, 'growth.edit.all')) return true;
  if (hasPermission(user, 'growth.edit.self') && user.personId === Number(personId)) return true;
  return false;
}

function canViewGrowth(user, personId) {
  if (hasPermission(user, 'growth.view.all')) return true;
  if (hasPermission(user, 'growth.edit.self') && user.personId === Number(personId)) return true;
  return false;
}

function canManageCertificates(user, personId) {
  if (hasPermission(user, 'certificates.upload') || hasPermission(user, 'certificates.delete')) {
    if (hasPermission(user, 'people.edit.all')) return true;
    if (user.personId && user.personId === Number(personId)) return true;
  }
  return false;
}

module.exports = {
  canEditPerson,
  canViewPerson,
  canEditDimensions,
  canEditGrowth,
  canViewGrowth,
  canManageCertificates
};
