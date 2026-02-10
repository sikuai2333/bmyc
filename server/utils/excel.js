function safeSheetName(input) {
  if (!input) return 'sheet';
  return String(input)
    .replace(/[\[\]:*?\\\/]/g, ' ')
    .trim()
    .slice(0, 31);
}

function safeFileName(input) {
  if (!input) return 'export';
  return String(input)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}

function applySectionStyle(cell) {
  cell.font = { bold: true, size: 12 };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FF' } };
  cell.alignment = { vertical: 'middle', horizontal: 'left' };
}

function applyHeaderStyle(cell) {
  cell.font = { bold: true };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F7FF' } };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFDEE3F3' } },
    left: { style: 'thin', color: { argb: 'FFDEE3F3' } },
    bottom: { style: 'thin', color: { argb: 'FFDEE3F3' } },
    right: { style: 'thin', color: { argb: 'FFDEE3F3' } }
  };
}

function applyValueBorder(cell) {
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFE6E9F5' } },
    left: { style: 'thin', color: { argb: 'FFE6E9F5' } },
    bottom: { style: 'thin', color: { argb: 'FFE6E9F5' } },
    right: { style: 'thin', color: { argb: 'FFE6E9F5' } }
  };
}

function normalizeExcelValue(cell) {
  if (!cell) return '';
  const value = cell.value;
  if (value === null || value === undefined) return '';

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'object') {
    if (value.text) return String(value.text);
    if (value.richText) {
      return value.richText.map((part) => part.text).join('');
    }
    if (value.formula && value.result !== undefined && value.result !== null) {
      return String(value.result);
    }
    if (value.result !== undefined && value.result !== null) {
      return String(value.result);
    }
    if (value.hyperlink) {
      return String(value.text || value.hyperlink);
    }
  }

  return String(value);
}

module.exports = {
  safeSheetName,
  safeFileName,
  applySectionStyle,
  applyHeaderStyle,
  applyValueBorder,
  normalizeExcelValue
};
