function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function normalizeMonthInput(value) {
  if (!value || typeof value !== 'string') return null;
  return /^\d{4}-\d{2}$/.test(value) ? value : null;
}

function buildMonthRange(endMonth, count) {
  if (!endMonth || !count || count <= 0) return [];
  const [year, month] = endMonth.split('-').map(Number);
  let currentYear = year;
  let currentMonth = month;
  const months = [];
  for (let idx = 0; idx < count; idx += 1) {
    months.push(`${currentYear}-${String(currentMonth).padStart(2, '0')}`);
    currentMonth -= 1;
    if (currentMonth === 0) {
      currentMonth = 12;
      currentYear -= 1;
    }
  }
  return months;
}

function buildMonthsBetween(startMonth, endMonth) {
  if (!startMonth || !endMonth) return [];
  let [startYear, startIndex] = startMonth.split('-').map(Number);
  let [endYear, endIndex] = endMonth.split('-').map(Number);
  const months = [];
  while (startYear < endYear || (startYear === endYear && startIndex <= endIndex)) {
    months.push(`${startYear}-${String(startIndex).padStart(2, '0')}`);
    startIndex += 1;
    if (startIndex === 13) {
      startIndex = 1;
      startYear += 1;
    }
  }
  return months;
}

function buildMonthList({ month, start, end, count }) {
  if (month) {
    return [month];
  }
  if (start && end) {
    const startMonth = start > end ? end : start;
    const endMonth = start > end ? start : end;
    return buildMonthsBetween(startMonth, endMonth).reverse();
  }
  const fallbackCount = Number.isFinite(count) && count > 0 ? count : 6;
  return buildMonthRange(getCurrentMonth(), fallbackCount);
}

module.exports = {
  getCurrentMonth,
  normalizeMonthInput,
  buildMonthRange,
  buildMonthsBetween,
  buildMonthList
};
