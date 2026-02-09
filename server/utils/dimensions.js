const { DIMENSION_CATEGORIES } = require('../config/constants');

function splitComments(value) {
  if (!value) return [];
  return String(value)
    .split(/[\n；;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeDimensionList(dimensions = []) {
  const detailMap = new Map();
  dimensions.forEach((dimension) => {
    if (!dimension || !dimension.category) return;
    detailMap.set(dimension.category, dimension.detail);
  });
  return DIMENSION_CATEGORIES.map((category) => {
    const rawDetail = detailMap.get(category);
    const detail = rawDetail && String(rawDetail).trim() ? String(rawDetail).trim() : '无';
    return { category, detail };
  });
}

module.exports = {
  splitComments,
  normalizeDimensionList
};
