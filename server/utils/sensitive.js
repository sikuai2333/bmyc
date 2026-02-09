const { hasPermission } = require('../permissions');
const { SENSITIVE_DIMENSION } = require('../config/constants');

function canViewSensitive(user, personId) {
  if (!user) return false;
  if (user.is_super_admin) return true;
  if (user.personId && personId && user.personId === Number(personId)) return true;
  if (hasPermission(user, 'sensitive.view') && user.sensitive_unmasked) return true;
  return false;
}

function maskPhone(phone) {
  if (!phone) return '';
  if (phone.length <= 7) return '••••';
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

function maskBirthDate(date) {
  if (!date) return '';
  return '****-**-**';
}

function applySensitiveMask(person, user) {
  const canView = canViewSensitive(user, person.id);
  if (canView) {
    return person;
  }
  return {
    ...person,
    phone: maskPhone(person.phone),
    birth_date: maskBirthDate(person.birth_date)
  };
}

function maskDimensions(dimensions, user, personId) {
  const canView = canViewSensitive(user, personId);
  if (canView) {
    return dimensions;
  }
  return dimensions.map((dimension) => {
    if (dimension.category === SENSITIVE_DIMENSION) {
      return { ...dimension, detail: '已脱敏' };
    }
    return dimension;
  });
}

module.exports = {
  canViewSensitive,
  maskPhone,
  maskBirthDate,
  applySensitiveMask,
  maskDimensions
};
