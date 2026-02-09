const path = require('path');

const sharedConstantsPath = path.join(__dirname, '..', '..', 'shared', 'constants.json');
const sharedConstants = require(sharedConstantsPath);

const DIMENSION_CATEGORIES = sharedConstants.dimensionCategories || [];
const SENSITIVE_DIMENSION = '婚恋情况';

module.exports = {
  DIMENSION_CATEGORIES,
  SENSITIVE_DIMENSION
};
