const express = require('express');
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { DIMENSION_CATEGORIES } = require('../config/constants');
const { getCurrentMonth, normalizeMonthInput, buildMonthList, buildMonthRange } = require('../utils/date');

const router = express.Router();

router.get('/api/insights/dimensions', authenticate, requirePermission('dimensions.view.all'), (req, res) => {
  const requestedMonth = normalizeMonthInput(req.query.month);
  let targetMonth = requestedMonth;
  if (!targetMonth) {
    const latest = db.prepare('SELECT month FROM dimensions_monthly ORDER BY month DESC LIMIT 1').get();
    targetMonth = latest?.month || getCurrentMonth();
  }
  const counts = db
    .prepare(
      `SELECT category, COUNT(*) as count
       FROM dimensions_monthly
       WHERE month = ?
       GROUP BY category`
    )
    .all(targetMonth);
  const countMap = new Map(counts.map((row) => [row.category, row.count]));
  const rows = DIMENSION_CATEGORIES.map((category) => ({
    category,
    count: countMap.get(category) || 0,
    month: targetMonth
  }));
  res.json(rows);
});

router.get('/api/insights/completions', authenticate, requirePermission('dimensions.view.all'), (req, res) => {
  const month = normalizeMonthInput(req.query.month);
  const start = normalizeMonthInput(req.query.start);
  const end = normalizeMonthInput(req.query.end);
  const count = Number.parseInt(req.query.months || req.query.count, 10);
  let months = [];
  if (month || (start && end)) {
    months = buildMonthList({ month, start, end, count: Number.isFinite(count) ? count : undefined });
  } else {
    const fallbackCount = Number.isFinite(count) && count > 0 ? count : 6;
    const latest = db.prepare('SELECT month FROM dimensions_monthly ORDER BY month DESC LIMIT 1').get();
    const anchor = latest?.month || getCurrentMonth();
    months = buildMonthRange(anchor, fallbackCount);
  }
  if (!months.length) {
    return res.json([]);
  }
  const placeholders = months.map(() => '?').join(',');
  const rows = db
    .prepare(
      `SELECT month, COUNT(*) as count
       FROM dimensions_monthly
       WHERE month IN (${placeholders})
         AND TRIM(detail) != ''
         AND TRIM(detail) != '无'
       GROUP BY month`
    )
    .all(...months);
  const rowMap = new Map(rows.map((row) => [row.month, row.count]));
  const result = months.map((item) => ({
    month: item,
    count: rowMap.get(item) || 0
  }));
  res.json(result);
});

router.get('/api/insights/person-dimensions', authenticate, requirePermission('dimensions.view.all'), (req, res) => {
  const personId = Number(req.query.personId);
  if (!personId) {
    return res.status(400).json({ message: '缺少人员ID' });
  }
  const rows = db
    .prepare(
      `SELECT category, COUNT(*) as count
       FROM dimensions_monthly
       WHERE person_id = ?
         AND TRIM(detail) != ''
         AND TRIM(detail) != '无'
       GROUP BY category`
    )
    .all(personId);
  const countMap = new Map(rows.map((row) => [row.category, row.count]));
  const result = DIMENSION_CATEGORIES.map((category) => ({
    category,
    count: countMap.get(category) || 0
  }));
  res.json(result);
});

module.exports = router;
