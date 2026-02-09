const express = require('express');
const { db } = require('../db');
const { DIMENSION_CATEGORIES } = require('../config/constants');
const { authenticate } = require('../middleware/auth');
const { canEditDimensions, canViewPerson } = require('../utils/access');
const { maskDimensions } = require('../utils/sensitive');
const { normalizeDimensionList } = require('../utils/dimensions');
const { getCurrentMonth, normalizeMonthInput, buildMonthList } = require('../utils/date');
const { logAction } = require('../utils/audit');

const router = express.Router();

router.put('/api/personnel/:id/dimensions', authenticate, (req, res) => {
  const targetPersonId = Number(req.params.id);
  if (!canEditDimensions(req.user, targetPersonId)) {
    return res.status(403).json({ message: '无权限编辑维度' });
  }

  const { dimensions, month } = req.body;
  if (!Array.isArray(dimensions)) {
    return res.status(400).json({ message: '请提交维度数组' });
  }
  const invalidCategory = dimensions.find(
    (dimension) => !dimension.category || !DIMENSION_CATEGORIES.includes(dimension.category)
  );
  if (invalidCategory) {
    return res.status(400).json({ message: '维度分类不符合六维标准' });
  }

  const targetMonth = normalizeMonthInput(month) || getCurrentMonth();
  const normalizedDimensions = normalizeDimensionList(dimensions);

  const insertDimension = db.prepare(
    'INSERT INTO dimensions_monthly (person_id, category, month, detail) VALUES (?,?,?,?)'
  );
  const updateDimensions = db.transaction(() => {
    db.prepare('DELETE FROM dimensions_monthly WHERE person_id = ? AND month = ?').run(
      targetPersonId,
      targetMonth
    );
    normalizedDimensions.forEach((dimension) => {
      insertDimension.run(targetPersonId, dimension.category, targetMonth, dimension.detail);
    });
  });
  updateDimensions();

  const fresh = db
    .prepare('SELECT id,category,detail,month FROM dimensions_monthly WHERE person_id = ? AND month = ?')
    .all(targetPersonId, targetMonth);
  logAction({
    actorId: req.user.id,
    action: 'update',
    entityType: 'dimensions-monthly',
    entityId: targetPersonId,
    detail: { count: fresh.length, month: targetMonth }
  });
  res.json(maskDimensions(fresh, req.user, targetPersonId));
});

router.get('/api/personnel/:id/dimensions/monthly', authenticate, (req, res) => {
  const targetPersonId = Number(req.params.id);
  if (!canViewPerson(req.user, targetPersonId)) {
    return res.status(403).json({ message: '无权限查看维度' });
  }
  const month = normalizeMonthInput(req.query.month);
  const start = normalizeMonthInput(req.query.start);
  const end = normalizeMonthInput(req.query.end);
  const monthsParam = Number.parseInt(req.query.months, 10);
  const months = buildMonthList({ month, start, end, count: monthsParam });
  if (!months.length) {
    return res.json({ personId: targetPersonId, months: [], rows: [] });
  }
  const placeholders = months.map(() => '?').join(',');
  const rows = db
    .prepare(
      `SELECT category, detail, month FROM dimensions_monthly WHERE person_id = ? AND month IN (${placeholders})`
    )
    .all(targetPersonId, ...months);
  const monthMap = new Map();
  rows.forEach((row) => {
    if (!monthMap.has(row.month)) {
      monthMap.set(row.month, new Map());
    }
    monthMap.get(row.month).set(row.category, row.detail);
  });
  const resultRows = months.map((monthKey) => {
    const categoryMap = monthMap.get(monthKey) || new Map();
    const dimensions = DIMENSION_CATEGORIES.map((category) => ({
      category,
      detail: categoryMap.has(category) ? categoryMap.get(category) : '无'
    }));
    return { month: monthKey, dimensions: maskDimensions(dimensions, req.user, targetPersonId) };
  });
  res.json({ personId: targetPersonId, months, rows: resultRows });
});

router.post('/api/import/dimensions', authenticate, (req, res) => {
  const { personId, dimensions, month } = req.body;
  if (!personId || !Array.isArray(dimensions)) {
    return res.status(400).json({ message: '导入参数不完整' });
  }
  if (!canEditDimensions(req.user, personId)) {
    return res.status(403).json({ message: '仅可导入本人维度' });
  }

  const invalidCategory = dimensions.find(
    (dimension) => !dimension.category || !DIMENSION_CATEGORIES.includes(dimension.category)
  );
  if (invalidCategory) {
    return res.status(400).json({ message: '维度分类不符合六维标准' });
  }
  const targetMonth = normalizeMonthInput(month) || getCurrentMonth();
  const normalizedDimensions = normalizeDimensionList(dimensions);
  const insertDimension = db.prepare(
    'INSERT INTO dimensions_monthly (person_id, category, month, detail) VALUES (?,?,?,?)'
  );
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM dimensions_monthly WHERE person_id = ? AND month = ?').run(personId, targetMonth);
    normalizedDimensions.forEach((dimension) => {
      insertDimension.run(personId, dimension.category, targetMonth, dimension.detail);
    });
  });
  transaction();
  logAction({
    actorId: req.user.id,
    action: 'import',
    entityType: 'dimensions-monthly',
    entityId: Number(personId),
    detail: { count: normalizedDimensions.length, month: targetMonth }
  });
  res.json({ success: true });
});

module.exports = router;
