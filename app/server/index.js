const path = require('path');

const fs = require('fs');

const express = require('express');

const cors = require('cors');

const bodyParser = require('body-parser');

const jwt = require('jsonwebtoken');

const bcrypt = require('bcryptjs');

const dotenv = require('dotenv');

const multer = require('multer');

const ExcelJS = require('exceljs');

const { db, init } = require('./db');

const { PERMISSIONS, getDefaultPermissions, normalizePermissions, hasPermission } = require('./permissions');



dotenv.config();

init();



const app = express();

const PORT = process.env.PORT || 4000;

const JWT_SECRET = process.env.JWT_SECRET || 'talent-secret';

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '';

const defaultOrigins = [

  'http://localhost:5173',

  'http://localhost:5174',

  'http://127.0.0.1:5173',

  'http://127.0.0.1:5174'

];

const envOrigins = CLIENT_ORIGIN.split(',').map((item) => item.trim()).filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));



const DIMENSION_CATEGORIES = [

  '\u601d\u60f3\u653f\u6cbb',

  '\u4e1a\u52a1\u6c34\u5e73',

  '\u4e1a\u7ee9\u6210\u679c',

  '\u516b\u5c0f\u65f6\u5916\u4e1a\u4f59\u751f\u6d3b',

  '\u9605\u8bfb\u5b66\u4e60\u60c5\u51b5',

  '\u5a5a\u604b\u60c5\u51b5'

];

const SENSITIVE_DIMENSION = '\u5a5a\u604b\u60c5\u51b5';



const UPLOAD_DIR = path.join(__dirname, '..', 'data', 'uploads');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });



const upload = multer({

  storage: multer.diskStorage({

    destination: (_, __, cb) => cb(null, UPLOAD_DIR),

    filename: (_, file, cb) => {

      const ext = path.extname(file.originalname || '').toLowerCase();

      const safeExt = ['.pdf', '.jpg', '.jpeg', '.png'].includes(ext) ? ext : '';

      const name = `${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`;

      cb(null, name);

    }

  }),

  fileFilter: (_, file, cb) => {

    const ext = path.extname(file.originalname || '').toLowerCase();

    if (['.pdf', '.jpg', '.jpeg', '.png'].includes(ext)) {

      return cb(null, true);

    }

    return cb(new Error('\u4ec5\u652f\u6301 pdf/jpg/png \u683c\u5f0f'));

  },

  limits: { fileSize: 10 * 1024 * 1024 }

});



app.use(

  cors({

    origin(origin, callback) {

      if (!origin || allowedOrigins.includes(origin)) {

        return callback(null, true);

      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`));

    },

    credentials: true

  })

);

app.use(bodyParser.json({ limit: '4mb' }));



function authenticate(req, res, next) {

  const authHeader = req.headers.authorization;

  if (!authHeader) {

    return res.status(401).json({ message: '缺少认证信息' });

  }

  const token = authHeader.split(' ')[1];

  try {

    const payload = jwt.verify(token, JWT_SECRET);

    const user = db

      .prepare(

        'SELECT id,name,email,role,person_id,permissions,is_super_admin,sensitive_unmasked FROM users WHERE id = ?'

      )

      .get(payload.id);

    if (!user) {

      return res.status(401).json({ message: '账号不存在或已被移除' });

    }

    req.user = {

      ...user,

      personId: user.person_id,

      is_super_admin: user.is_super_admin === 1,

      sensitive_unmasked: user.sensitive_unmasked === 1,

      permissions: normalizePermissions(user.permissions)

    };

    next();

  } catch (error) {

    res.status(401).json({ message: '认证失败', detail: error.message });

  }

}



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



function canViewSensitive(user, personId) {

  if (!user) return false;

  if (user.is_super_admin) return true;

  if (user.personId && personId && user.personId === Number(personId)) return true;

  if (hasPermission(user, 'sensitive.view') && user.sensitive_unmasked) return true;

  return false;

}



function maskPhone(phone) {

  if (!phone) return '';

  if (phone.length <= 7) return '\u2022\u2022\u2022\u2022';

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

      return { ...dimension, detail: '\u5df2\u8131\u654f' };

    }

    return dimension;

  });

}



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



function logAction({ actorId, action, entityType, entityId, detail }) {

  db.prepare(

    'INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, detail) VALUES (?,?,?,?,?)'

  ).run(actorId || null, action, entityType, entityId || null, detail ? JSON.stringify(detail) : null);

}



function diffFields(before, after, fields) {

  const changes = {};

  fields.forEach((field) => {

    if ((before?.[field] ?? null) !== (after?.[field] ?? null)) {

      changes[field] = { from: before?.[field] ?? null, to: after?.[field] ?? null };

    }

  });

  return changes;

}



function safeSheetName(input) {

  if (!input) return 'sheet';

  return String(input)

    .replace(/[\[\]\:\*\?\\\/]/g, ' ')

    .trim()

    .slice(0, 31);

}



function splitComments(value) {

  if (!value) return [];

  return String(value)

    .split(/[\n;\uff1b]+/)

    .map((item) => item.trim())

    .filter(Boolean);

}



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



app.post('/api/login', (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {

    return res.status(400).json({ message: '请输入邮箱和密码' });

  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user) {

    return res.status(401).json({ message: '账号不存在' });

  }

  const isValid = bcrypt.compareSync(password, user.password_hash);

  if (!isValid) {

    return res.status(401).json({ message: '密码错误' });

  }

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '12h' });



  res.json({

    token,

    user: {

      id: user.id,

      name: user.name,

      email: user.email,

      role: user.role,

      personId: user.person_id,

      isSuperAdmin: user.is_super_admin === 1,

      sensitiveUnmasked: user.sensitive_unmasked === 1,

      permissions: normalizePermissions(user.permissions)

    }

  });

});



app.get('/api/profile', authenticate, (req, res) => {

  const user = db

    .prepare(

      'SELECT id,name,email,role,person_id,permissions,is_super_admin,sensitive_unmasked FROM users WHERE id = ?'

    )

    .get(req.user.id);

  if (!user) {

    return res.status(404).json({ message: '账号不存在' });

  }

  res.json({

    user: {

      id: user.id,

      name: user.name,

      email: user.email,

      role: user.role,

      personId: user.person_id,

      isSuperAdmin: user.is_super_admin === 1,

      sensitiveUnmasked: user.sensitive_unmasked === 1,

      permissions: normalizePermissions(user.permissions)

    }

  });

});



app.get(

  '/api/personnel',

  authenticate,

  requireAnyPermission(['people.view.all', 'people.edit.all', 'people.edit.self']),

  (req, res) => {

  const keyword = (req.query.q || '').trim();

  const baseQuery = `SELECT id,name,title,department,focus,bio,icon,birth_date,gender,phone FROM people`;

  const people = keyword

    ? db.prepare(`${baseQuery} WHERE name LIKE ? OR focus LIKE ? OR department LIKE ?`).all(

        `%${keyword}%`,

        `%${keyword}%`,

        `%${keyword}%`

      )

    : db.prepare(`${baseQuery} ORDER BY id`).all();

  const dimensionCountStmt = db.prepare('SELECT COUNT(*) as count FROM dimensions_monthly WHERE person_id = ?');
  const dimensionMonthCountStmt = db.prepare(
    'SELECT COUNT(DISTINCT month) as count FROM dimensions_monthly WHERE person_id = ?'
  );
  const latestDimensionMonthStmt = db.prepare(
    'SELECT month FROM dimensions_monthly WHERE person_id = ? ORDER BY month DESC LIMIT 1'
  );

  const formatted = people.map((person) => {

    const dimensionCount = dimensionCountStmt.get(person.id).count || 0;
    const dimensionMonthCount = dimensionMonthCountStmt.get(person.id).count || 0;
    const latestDimensionMonth = latestDimensionMonthStmt.get(person.id)?.month || null;

    return {
      ...applySensitiveMask(person, req.user),
      dimensionCount,
      dimensionMonthCount,
      latestDimensionMonth
    };

  });



  res.json(formatted);

});



app.get(

  '/api/personnel/:id',

  authenticate,

  requireAnyPermission(['people.view.all', 'people.edit.all', 'people.edit.self']),

  (req, res) => {

  const person = db

    .prepare('SELECT id,name,title,department,focus,bio,icon,birth_date,gender,phone FROM people WHERE id = ?')

    .get(req.params.id);

  if (!person) {

    return res.status(404).json({ message: '人才不存在' });

  }

  const dimensionCount = db.prepare('SELECT COUNT(*) as count FROM dimensions_monthly WHERE person_id = ?').get(person.id)
    .count;
  const dimensionMonthCount = db
    .prepare('SELECT COUNT(DISTINCT month) as count FROM dimensions_monthly WHERE person_id = ?')
    .get(person.id).count;
  const latestDimensionMonth = db
    .prepare('SELECT month FROM dimensions_monthly WHERE person_id = ? ORDER BY month DESC LIMIT 1')
    .get(person.id)?.month || null;



  res.json({

    ...applySensitiveMask(person, req.user),

    dimensionCount: dimensionCount || 0,
    dimensionMonthCount: dimensionMonthCount || 0,
    latestDimensionMonth

  });

});



app.put('/api/personnel/:id', authenticate, (req, res) => {

  const targetPersonId = Number(req.params.id);

  if (!canEditPerson(req.user, targetPersonId)) {

    return res.status(403).json({ message: '无权限编辑档案' });

  }



  const { focus, bio, title, department, birth_date, gender, phone } = req.body;

  const before = db

    .prepare('SELECT id,name,title,department,focus,bio,icon,birth_date,gender,phone FROM people WHERE id = ?')

    .get(targetPersonId);

  db.prepare(

    `UPDATE people SET focus = COALESCE(?, focus), bio = COALESCE(?, bio),

      title = COALESCE(?, title), department = COALESCE(?, department),

      birth_date = COALESCE(?, birth_date), gender = COALESCE(?, gender),

      phone = COALESCE(?, phone)

     WHERE id = ?`

  ).run(focus, bio, title, department, birth_date, gender, phone, targetPersonId);



  const updated = db

    .prepare('SELECT id,name,title,department,focus,bio,icon,birth_date,gender,phone FROM people WHERE id = ?')

    .get(targetPersonId);

  if (before) {

    const changes = diffFields(before, updated, [

      'title',

      'department',

      'focus',

      'bio',

      'birth_date',

      'gender',

      'phone'

    ]);

    if (Object.keys(changes).length > 0) {

      logAction({

        actorId: req.user.id,

        action: 'update',

        entityType: 'people',

        entityId: targetPersonId,

        detail: changes

      });

    }

  }

  res.json(updated);

});



app.put('/api/personnel/:id/dimensions', authenticate, (req, res) => {
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



app.get('/api/personnel/:id/dimensions/monthly', authenticate, (req, res) => {
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

app.post('/api/import/dimensions', authenticate, (req, res) => {
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


app.post(

  '/api/import/people',

  authenticate,

  requireAnyPermission(['import.excel', 'people.edit.all']),

  (req, res) => {

  const { people } = req.body;

  if (!Array.isArray(people) || people.length === 0) {

    return res.status(400).json({ message: '缺少有效的人才列表' });

  }



  const insertPerson = db.prepare(

    'INSERT INTO people (name,title,department,focus,bio,icon,birth_date,gender,phone) VALUES (?,?,?,?,?,?,?,?,?)'

  );

  const updatePerson = db.prepare(

    `UPDATE people SET name = COALESCE(?, name), title = COALESCE(?, title),

      department = COALESCE(?, department), focus = COALESCE(?, focus),

      bio = COALESCE(?, bio), icon = COALESCE(?, icon),

      birth_date = COALESCE(?, birth_date), gender = COALESCE(?, gender),

      phone = COALESCE(?, phone)

     WHERE id = ?`

  );

  const findPersonByName = db.prepare('SELECT id FROM people WHERE name = ?');

  const deleteDimensions = db.prepare('DELETE FROM dimensions_monthly WHERE person_id = ? AND month = ?');

  const insertDimension = db.prepare(
    'INSERT INTO dimensions_monthly (person_id, category, month, detail) VALUES (?,?,?,?)'
  );
  const currentMonth = getCurrentMonth();



  const summary = db.transaction(() => {

    const stats = { created: 0, updated: 0, skipped: 0 };

    people.forEach((person) => {

      const trimmedName = (person.name || '').trim();

      let targetId = Number(person.id) || null;

      if (!targetId && trimmedName) {

        const existing = findPersonByName.get(trimmedName);

        targetId = existing ? existing.id : null;

      }

      if (!targetId && !trimmedName) {

        stats.skipped += 1;

        return;

      }

      if (targetId) {

        updatePerson.run(

          trimmedName || null,

          person.title || null,

          person.department || null,

          person.focus || null,

          person.bio || null,

          person.icon || null,

          person.birth_date || null,

          person.gender || null,

          person.phone || null,

          targetId

        );

        stats.updated += 1;

      } else {

        targetId = insertPerson.run(

          trimmedName,

          person.title || '',

          person.department || '',

          person.focus || '',

          person.bio || '',

          person.icon || '',

          person.birth_date || null,

          person.gender || null,

          person.phone || null

        ).lastInsertRowid;

        stats.created += 1;

      }

      if (Array.isArray(person.dimensions)) {
        const invalidCategory = person.dimensions.find(
          (dimension) => !dimension.category || !DIMENSION_CATEGORIES.includes(dimension.category)
        );
        if (invalidCategory) {
          stats.skipped += 1;
          return;
        }
        const targetMonth =
          normalizeMonthInput(person.dimensionsMonth || person.month || person.dimensionMonth) || currentMonth;
        const normalizedDimensions = normalizeDimensionList(person.dimensions);
        deleteDimensions.run(targetId, targetMonth);
        normalizedDimensions.forEach((dimension) => {
          insertDimension.run(targetId, dimension.category, targetMonth, dimension.detail);
        });
      }

    });

    return stats;

  })();



  logAction({

    actorId: req.user.id,

    action: 'import',

    entityType: 'people',

    detail: summary

  });

  res.status(201).json(summary);

});



app.post('/api/personnel', authenticate, requirePermission('people.edit.all'), (req, res) => {

  const {

    name,

    title = '',

    department = '',

    focus = '',

    bio = '',

    icon = '',

    birth_date = null,

    gender = '',

    phone = ''

  } = req.body;

  if (!name) {

    return res.status(400).json({ message: '请输入姓名' });

  }

  const insertPerson = db.prepare(

    'INSERT INTO people (name,title,department,focus,bio,icon,birth_date,gender,phone) VALUES (?,?,?,?,?,?,?,?,?)'

  );

  const newId = insertPerson.run(

    name,

    title,

    department,

    focus,

    bio,

    icon,

    birth_date,

    gender,

    phone

  ).lastInsertRowid;

  const created = db

    .prepare('SELECT id,name,title,department,focus,bio,icon,birth_date,gender,phone FROM people WHERE id = ?')

    .get(newId);

  logAction({

    actorId: req.user.id,

    action: 'create',

    entityType: 'people',

    entityId: newId,

    detail: { name }

  });

  res.status(201).json(created);

});



app.delete('/api/personnel/:id', authenticate, requirePermission('people.edit.all'), (req, res) => {

  const personId = Number(req.params.id);

  const person = db.prepare('SELECT id FROM people WHERE id = ?').get(personId);

  if (!person) {

    return res.status(404).json({ message: '人才不存在' });

  }

  const remove = db.transaction(() => {

    db.prepare('DELETE FROM meeting_attendees WHERE person_id = ?').run(personId);

    db.prepare('DELETE FROM dimensions_monthly WHERE person_id = ?').run(personId);
    db.prepare('DELETE FROM dimensions WHERE person_id = ?').run(personId);

    db.prepare('UPDATE users SET person_id = NULL WHERE person_id = ?').run(personId);

    db.prepare('DELETE FROM people WHERE id = ?').run(personId);

  });

  remove();

  logAction({ actorId: req.user.id, action: 'delete', entityType: 'people', entityId: personId });

  res.json({ success: true });

});



app.post('/api/import/meetings', authenticate, requirePermission('meetings.edit'), (req, res) => {

  const { meetings } = req.body;

  if (!Array.isArray(meetings) || meetings.length === 0) {

    return res.status(400).json({ message: '缺少会议列表' });

  }



  const insertMeeting = db.prepare(

    'INSERT INTO meetings (topic, meetingDate, location, summary, category) VALUES (?,?,?,?,?)'

  );

  const insertAttendee = db.prepare(

    'INSERT OR REPLACE INTO meeting_attendees (meeting_id, person_id, role) VALUES (?,?,?)'

  );

  const findPersonByName = db.prepare('SELECT id FROM people WHERE name = ?');



  const stats = db.transaction(() => {

    const summary = { created: 0, attendeeLinked: 0, skipped: 0 };

    meetings.forEach((meeting) => {

      const topic = (meeting.topic || '').trim();

      const meetingDate = (meeting.meetingDate || '').trim();

      if (!topic || !meetingDate) {

        summary.skipped += 1;

        return;

      }

      const meetingId = insertMeeting.run(

        topic,

        meetingDate,

        meeting.location || '',

        meeting.summary || '',

        meeting.category || '\u653f\u6cbb\u5b66\u4e60'

      ).lastInsertRowid;

      summary.created += 1;

      if (Array.isArray(meeting.attendees)) {

        meeting.attendees.forEach((attendee) => {

          const personId = attendee.personId

            ? Number(attendee.personId)

            : attendee.personName

            ? findPersonByName.get(attendee.personName)?.id

            : null;

          if (!personId) {

            return;

          }

          insertAttendee.run(meetingId, personId, attendee.role || '参会');

          summary.attendeeLinked += 1;

        });

      }

    });

    return summary;

  })();



  logAction({ actorId: req.user.id, action: 'import', entityType: 'meetings', detail: stats });

  res.status(201).json(stats);

});



app.get('/api/meetings', authenticate, requirePermission('meetings.view'), (req, res) => {

  const meetings = db.prepare('SELECT * FROM meetings ORDER BY meetingDate DESC').all();

  const attendeesStmt = db.prepare(

    `SELECT ma.meeting_id, p.id, p.name, p.title, ma.role

     FROM meeting_attendees ma

     JOIN people p ON p.id = ma.person_id

     WHERE ma.meeting_id = ?`

  );

  const withAttendees = meetings.map((meeting) => ({

    ...meeting,

    attendees: attendeesStmt.all(meeting.id)

  }));

  res.json(withAttendees);

});



app.post('/api/meetings', authenticate, requirePermission('meetings.edit'), (req, res) => {

  const { topic, meetingDate, location, summary, attendees, category } = req.body;

  if (!topic || !meetingDate) {

    return res.status(400).json({ message: '请填写主题和时间' });

  }

  const insertMeeting = db.prepare(

    'INSERT INTO meetings (topic, meetingDate, location, summary, category) VALUES (?,?,?,?,?)'

  );

  const insertAttendee = db.prepare(

    'INSERT INTO meeting_attendees (meeting_id, person_id, role) VALUES (?,?,?)'

  );

  const newMeetingId = insertMeeting.run(

    topic,

    meetingDate,

    location,

    summary,

    category || '政治学习'

  ).lastInsertRowid;

  if (Array.isArray(attendees)) {

    attendees.forEach((attendee) => {

      insertAttendee.run(newMeetingId, attendee.personId, attendee.role || '参会');

    });

  }

  const created = db.prepare('SELECT * FROM meetings WHERE id = ?').get(newMeetingId);

  logAction({ actorId: req.user.id, action: 'create', entityType: 'meetings', entityId: newMeetingId });

  res.status(201).json(created);

});



app.delete('/api/meetings/:id', authenticate, requirePermission('meetings.edit'), (req, res) => {

  const meetingId = Number(req.params.id);

  const existing = db.prepare('SELECT id FROM meetings WHERE id = ?').get(meetingId);

  if (!existing) {

    return res.status(404).json({ message: '会议不存在' });

  }

  const remove = db.transaction(() => {

    db.prepare('DELETE FROM meeting_attendees WHERE meeting_id = ?').run(meetingId);

    db.prepare('DELETE FROM meetings WHERE id = ?').run(meetingId);

  });

  remove();

  logAction({ actorId: req.user.id, action: 'delete', entityType: 'meetings', entityId: meetingId });

  res.json({ success: true });

});



app.get('/api/meetings/:id', authenticate, requirePermission('meetings.view'), (req, res) => {

  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(req.params.id);

  if (!meeting) {

    return res.status(404).json({ message: '会议不存在' });

  }

  const attendees = db.prepare(

    `SELECT p.id,p.name,p.title,ma.role

     FROM meeting_attendees ma

     JOIN people p ON ma.person_id = p.id

     WHERE ma.meeting_id = ?`

  ).all(meeting.id);

  res.json({ ...meeting, attendees });

});



app.get('/api/users', authenticate, requireAnyPermission(['users.manage', 'permissions.manage']), (req, res) => {

  const users = db

    .prepare(

      'SELECT id,name,email,role,person_id as personId,permissions,is_super_admin,sensitive_unmasked FROM users ORDER BY id'

    )

    .all()

    .map((user) => ({

      ...user,

      isSuperAdmin: user.is_super_admin === 1,

      sensitiveUnmasked: user.sensitive_unmasked === 1,

      permissions: normalizePermissions(user.permissions)

    }));

  res.json(users);

});



app.post('/api/users', authenticate, requirePermission('users.manage'), (req, res) => {

  const {

    name,

    email,

    password,

    role = 'user',

    personId = null,

    permissions,

    isSuperAdmin = false,

    sensitiveUnmasked = false

  } = req.body;

  if (!name || !email || !password) {

    return res.status(400).json({ message: '请填写姓名、邮箱和密码' });

  }

  if (!['user', 'admin', 'display'].includes(role)) {

    return res.status(400).json({ message: '角色无效' });

  }

  try {

    const hash = bcrypt.hashSync(password, 10);

    const insertUser = db.prepare(

      'INSERT INTO users (name,email,role,password_hash,person_id,permissions,is_super_admin,sensitive_unmasked) VALUES (?,?,?,?,?,?,?,?)'

    );

    const canAssignSuper = req.user.is_super_admin;

    const resolvedPermissions = Array.isArray(permissions)

      ? permissions

      : getDefaultPermissions(role, canAssignSuper && isSuperAdmin);

    const userId = insertUser.run(

      name,

      email,

      role,

      hash,

      personId || null,

      JSON.stringify(resolvedPermissions),

      canAssignSuper && isSuperAdmin ? 1 : 0,

      sensitiveUnmasked ? 1 : 0

    ).lastInsertRowid;

    const created = db

      .prepare(

        'SELECT id,name,email,role,person_id as personId,permissions,is_super_admin,sensitive_unmasked FROM users WHERE id = ?'

      )

      .get(userId);

    const response = {

      ...created,

      isSuperAdmin: created.is_super_admin === 1,

      sensitiveUnmasked: created.sensitive_unmasked === 1,

      permissions: normalizePermissions(created.permissions)

    };

    logAction({ actorId: req.user.id, action: 'create', entityType: 'users', entityId: userId });

    res.status(201).json(response);

  } catch (error) {

    res.status(400).json({ message: '创建账号失败', detail: error.message });

  }

});



app.put('/api/users/:id', authenticate, requireAnyPermission(['users.manage', 'permissions.manage']), (req, res) => {

  const userId = Number(req.params.id);

  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

  if (!target) {

    return res.status(404).json({ message: '账号不存在' });

  }

  let { name, email, role, personId, password, permissions, isSuperAdmin, sensitiveUnmasked } = req.body;

  const canManageUsers = req.user.is_super_admin || hasPermission(req.user, 'users.manage');

  if (!canManageUsers) {

    name = null;

    email = null;

    role = null;

    personId = null;

    password = null;

  }

  if (role && !['user', 'admin', 'display'].includes(role)) {

    return res.status(400).json({ message: '角色无效' });

  }

  const hash = password ? bcrypt.hashSync(password, 10) : null;

  const resolvedPermissions = Array.isArray(permissions)

    ? JSON.stringify(permissions)

    : target.permissions;

  const canAssignSuper = req.user.is_super_admin;

  const nextIsSuper = typeof isSuperAdmin === 'boolean' && canAssignSuper ? (isSuperAdmin ? 1 : 0) : target.is_super_admin;

  const nextSensitive = typeof sensitiveUnmasked === 'boolean' ? (sensitiveUnmasked ? 1 : 0) : target.sensitive_unmasked;

  db.prepare(

    `UPDATE users

     SET name = COALESCE(?, name),

         email = COALESCE(?, email),

         role = COALESCE(?, role),

         person_id = COALESCE(?, person_id),

         password_hash = COALESCE(?, password_hash),

         permissions = COALESCE(?, permissions),

         is_super_admin = COALESCE(?, is_super_admin),

         sensitive_unmasked = COALESCE(?, sensitive_unmasked)

     WHERE id = ?`

  ).run(

    name,

    email,

    role,

    personId ?? target.person_id,

    hash,

    resolvedPermissions,

    nextIsSuper,

    nextSensitive,

    userId

  );

  const updated = db

    .prepare(

      'SELECT id,name,email,role,person_id as personId,permissions,is_super_admin,sensitive_unmasked FROM users WHERE id = ?'

    )

    .get(userId);

  const response = {

    ...updated,

    isSuperAdmin: updated.is_super_admin === 1,

    sensitiveUnmasked: updated.sensitive_unmasked === 1,

    permissions: normalizePermissions(updated.permissions)

  };

  logAction({ actorId: req.user.id, action: 'update', entityType: 'users', entityId: userId });

  res.json(response);

});



app.delete('/api/users/:id', authenticate, requirePermission('users.manage'), (req, res) => {

  const userId = Number(req.params.id);

  const target = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);

  if (!target) {

    return res.status(404).json({ message: '账号不存在' });

  }

  db.prepare('DELETE FROM users WHERE id = ?').run(userId);

  logAction({ actorId: req.user.id, action: 'delete', entityType: 'users', entityId: userId });

  res.json({ success: true });

});



app.get('/api/insights/dimensions', authenticate, requirePermission('dimensions.view.all'), (req, res) => {
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



app.get('/api/permissions', authenticate, requirePermission('permissions.manage'), (req, res) => {

  res.json(PERMISSIONS);

});



app.put('/api/profile/sensitive', authenticate, (req, res) => {

  if (!hasPermission(req.user, 'sensitive.view')) {

    return res.status(403).json({ message: '无权查看敏感信息' });

  }

  const { sensitiveUnmasked } = req.body;

  if (typeof sensitiveUnmasked !== 'boolean') {

    return res.status(400).json({ message: '参数无效' });

  }

  db.prepare('UPDATE users SET sensitive_unmasked = ? WHERE id = ?').run(

    sensitiveUnmasked ? 1 : 0,

    req.user.id

  );

  res.json({ sensitiveUnmasked });

});



app.get('/api/logs', authenticate, requirePermission('logs.view'), (req, res) => {

  const limit = Math.min(Number(req.query.limit) || 200, 500);

  const offset = Math.max(Number(req.query.offset) || 0, 0);

  const rows = db

    .prepare(

      `SELECT l.*, u.name as actorName, u.email as actorEmail

       FROM audit_logs l

       LEFT JOIN users u ON u.id = l.actor_id

       ORDER BY l.created_at DESC

       LIMIT ? OFFSET ?`

    )

    .all(limit, offset)

    .map((row) => ({

      ...row,

      detail: row.detail ? JSON.parse(row.detail) : null

    }));

  res.json(rows);

});



app.get('/api/evaluations', authenticate, requirePermission('evaluations.view'), (req, res) => {

  const personId = req.query.personId ? Number(req.query.personId) : null;

  const resolvedPersonId =

    personId || (req.user.role === 'user' ? req.user.personId : null);

  if (!resolvedPersonId) {

    return res.status(400).json({ message: '缺少人员编号' });

  }

  if (req.user.role === 'user' && req.user.personId !== resolvedPersonId) {

    return res.status(403).json({ message: '仅可查看本人评价' });

  }

  const rows = db

    .prepare('SELECT * FROM evaluations WHERE person_id = ? ORDER BY created_at DESC')

    .all(resolvedPersonId);

  res.json(rows);

});



app.post('/api/evaluations', authenticate, requirePermission('evaluations.edit'), (req, res) => {

  const { personId, type, period, content } = req.body;

  if (!personId || !type || !period || !content) {

    return res.status(400).json({ message: '评价参数不完整' });

  }

  if (!['quarterly', 'annual', 'marriage'].includes(type)) {

    return res.status(400).json({ message: '评价类型不合法' });

  }

  const insert = db.prepare(

    'INSERT INTO evaluations (person_id, type, period, content, created_by) VALUES (?,?,?,?,?)'

  );

  const evaluationId = insert.run(personId, type, period, content, req.user.id).lastInsertRowid;

  const created = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(evaluationId);

  logAction({

    actorId: req.user.id,

    action: 'create',

    entityType: 'evaluations',

    entityId: evaluationId,

    detail: { personId, type, period }

  });

  res.status(201).json(created);

});



app.put('/api/evaluations/:id', authenticate, requirePermission('evaluations.edit'), (req, res) => {

  const evaluationId = Number(req.params.id);

  const existing = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(evaluationId);

  if (!existing) {

    return res.status(404).json({ message: '评价不存在' });

  }

  const { type, period, content } = req.body;

  if (type && !['quarterly', 'annual', 'marriage'].includes(type)) {

    return res.status(400).json({ message: '评价类型不合法' });

  }

  db.prepare(

    `UPDATE evaluations

     SET type = COALESCE(?, type),

         period = COALESCE(?, period),

         content = COALESCE(?, content),

         updated_at = datetime('now')

     WHERE id = ?`

  ).run(type, period, content, evaluationId);

  const updated = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(evaluationId);

  const changes = diffFields(existing, updated, ['type', 'period', 'content']);

  if (Object.keys(changes).length > 0) {

    logAction({

      actorId: req.user.id,

      action: 'update',

      entityType: 'evaluations',

      entityId: evaluationId,

      detail: changes

    });

  }

  res.json(updated);

});



app.delete('/api/evaluations/:id', authenticate, requirePermission('evaluations.edit'), (req, res) => {

  const evaluationId = Number(req.params.id);

  const existing = db.prepare('SELECT id FROM evaluations WHERE id = ?').get(evaluationId);

  if (!existing) {

    return res.status(404).json({ message: '评价不存在' });

  }

  db.prepare('DELETE FROM evaluations WHERE id = ?').run(evaluationId);

  logAction({ actorId: req.user.id, action: 'delete', entityType: 'evaluations', entityId: evaluationId });

  res.json({ success: true });

});



app.get(

  '/api/growth',

  authenticate,

  requireAnyPermission(['growth.view.all', 'growth.edit.self']),

  (req, res) => {

  const personId = req.query.personId ? Number(req.query.personId) : null;

  const resolvedPersonId =

    personId || (req.user.role === 'user' ? req.user.personId : null);

  if (!resolvedPersonId) {

    return res.status(400).json({ message: '缺少人员编号' });

  }

  if (!canViewGrowth(req.user, resolvedPersonId)) {

    return res.status(403).json({ message: '无权查看成长轨迹' });

  }

  const rows = db

    .prepare('SELECT * FROM growth_events WHERE person_id = ? ORDER BY event_date DESC, id DESC')

    .all(resolvedPersonId);

  res.json(rows);

});



app.post('/api/growth', authenticate, (req, res) => {

  const { personId, eventDate, title, description, category } = req.body;

  if (!personId || !eventDate || !title) {

    return res.status(400).json({ message: '成长轨迹参数不完整' });

  }

  if (!canEditGrowth(req.user, personId)) {

    return res.status(403).json({ message: '无权维护成长轨迹' });

  }

  const insert = db.prepare(

    'INSERT INTO growth_events (person_id, event_date, title, description, category, created_by) VALUES (?,?,?,?,?,?)'

  );

  const eventId = insert.run(personId, eventDate, title, description || '', category || '', req.user.id)

    .lastInsertRowid;

  const created = db.prepare('SELECT * FROM growth_events WHERE id = ?').get(eventId);

  logAction({

    actorId: req.user.id,

    action: 'create',

    entityType: 'growth_events',

    entityId: eventId,

    detail: { personId, title }

  });

  res.status(201).json(created);

});



app.delete('/api/growth/:id', authenticate, (req, res) => {

  const eventId = Number(req.params.id);

  const existing = db.prepare('SELECT * FROM growth_events WHERE id = ?').get(eventId);

  if (!existing) {

    return res.status(404).json({ message: '成长轨迹不存在' });

  }

  if (!canEditGrowth(req.user, existing.person_id)) {

    return res.status(403).json({ message: '无权删除成长轨迹' });

  }

  db.prepare('DELETE FROM growth_events WHERE id = ?').run(eventId);

  logAction({ actorId: req.user.id, action: 'delete', entityType: 'growth_events', entityId: eventId });

  res.json({ success: true });

});



app.get('/api/certificates', authenticate, requirePermission('certificates.view'), (req, res) => {

  const personId = req.query.personId ? Number(req.query.personId) : null;

  const resolvedPersonId =

    personId || (req.user.role === 'user' ? req.user.personId : null);

  if (!resolvedPersonId) {

    return res.status(400).json({ message: '缺少人员编号' });

  }

  if (req.user.role === 'user' && req.user.personId !== resolvedPersonId) {

    return res.status(403).json({ message: '仅可查看本人证书' });

  }

  const rows = db

    .prepare('SELECT * FROM certificates WHERE person_id = ? ORDER BY uploaded_at DESC')

    .all(resolvedPersonId);

  res.json(rows);

});



app.post('/api/certificates', authenticate, upload.single('file'), (req, res) => {

  const { personId, name, issuedDate, description } = req.body;

  if (!personId || !name) {

    return res.status(400).json({ message: '证书名称与人员必填' });

  }

  if (!canManageCertificates(req.user, personId)) {

    return res.status(403).json({ message: '无权上传证书' });

  }

  const filePath = req.file ? req.file.filename : null;

  const insert = db.prepare(

    'INSERT INTO certificates (person_id, name, issued_date, file_path, description, uploaded_by) VALUES (?,?,?,?,?,?)'

  );

  const certId = insert.run(

    Number(personId),

    name,

    issuedDate || null,

    filePath,

    description || '',

    req.user.id

  ).lastInsertRowid;

  const created = db.prepare('SELECT * FROM certificates WHERE id = ?').get(certId);

  logAction({

    actorId: req.user.id,

    action: 'create',

    entityType: 'certificates',

    entityId: certId,

    detail: { personId: Number(personId), name }

  });

  res.status(201).json(created);

});



app.delete('/api/certificates/:id', authenticate, (req, res) => {

  const certId = Number(req.params.id);

  const existing = db.prepare('SELECT * FROM certificates WHERE id = ?').get(certId);

  if (!existing) {

    return res.status(404).json({ message: '证书不存在' });

  }

  if (!canManageCertificates(req.user, existing.person_id)) {

    return res.status(403).json({ message: '无权删除证书' });

  }

  if (existing.file_path) {

    const safeName = path.basename(existing.file_path);

    const fullPath = path.join(UPLOAD_DIR, safeName);

    if (fullPath.startsWith(UPLOAD_DIR) && fs.existsSync(fullPath)) {

      fs.unlinkSync(fullPath);

    }

  }

  db.prepare('DELETE FROM certificates WHERE id = ?').run(certId);

  logAction({ actorId: req.user.id, action: 'delete', entityType: 'certificates', entityId: certId });

  res.json({ success: true });

});



app.get('/api/certificates/:id/file', authenticate, requirePermission('certificates.view'), (req, res) => {

  const certId = Number(req.params.id);

  const existing = db.prepare('SELECT * FROM certificates WHERE id = ?').get(certId);

  if (!existing) {

    return res.status(404).json({ message: '证书不存在' });

  }

  if (req.user.role === 'user' && req.user.personId !== existing.person_id) {

    return res.status(403).json({ message: '无权查看证书附件' });

  }

  if (existing.file_path) {

    const safeName = path.basename(existing.file_path);

    const fullPath = path.join(UPLOAD_DIR, safeName);

    if (!fullPath.startsWith(UPLOAD_DIR) || !fs.existsSync(fullPath)) {

      return res.status(404).json({ message: '附件不存在' });

    }

    return res.sendFile(fullPath);

  }

  return res.status(404).json({ message: '附件不存在' });

});



app.get('/api/export/people', authenticate, requirePermission('export.excel'), async (req, res) => {

  const personId = req.query.personId ? Number(req.query.personId) : null;

  const people = personId

    ? db

        .prepare('SELECT id,name,title,department,focus,bio,icon,birth_date,gender,phone FROM people WHERE id = ?')

        .all(personId)

    : db

        .prepare('SELECT id,name,title,department,focus,bio,icon,birth_date,gender,phone FROM people ORDER BY id')

        .all();



  const dimensionStmt = db.prepare('SELECT month,category,detail FROM dimensions_monthly WHERE person_id = ?');

  const evaluationStmt = db.prepare('SELECT type,period,content,created_at FROM evaluations WHERE person_id = ?');

  const growthStmt = db.prepare('SELECT event_date,title,description,category FROM growth_events WHERE person_id = ?');

  const certStmt = db.prepare('SELECT name,issued_date,description,file_path FROM certificates WHERE person_id = ?');



  const workbook = new ExcelJS.Workbook();

  people.forEach((person) => {
    const rows = [
      ['????', ''],
      ['??', person.name],
      ['????', person.birth_date || ''],
      ['??', person.gender || ''],
      ['???', person.phone || ''],
      ['????', person.department || ''],
      ['????', person.title || ''],
      ['????', person.focus || ''],
      ['????', person.bio || ''],
      [''],
      ['????????', '']
    ];

    const dimensionRows = dimensionStmt.all(person.id);
    const monthMap = new Map();
    dimensionRows.forEach((dimension) => {
      if (!monthMap.has(dimension.month)) {
        monthMap.set(dimension.month, new Map());
      }
      monthMap.get(dimension.month).set(dimension.category, dimension.detail);
    });
    const months = Array.from(monthMap.keys()).sort((a, b) => b.localeCompare(a));
    if (!months.length) {
      months.push(getCurrentMonth());
    }
    rows.push(['??', ...DIMENSION_CATEGORIES]);
    months.forEach((month) => {
      const categoryMap = monthMap.get(month) || new Map();
      const row = [month, ...DIMENSION_CATEGORIES.map((category) => categoryMap.get(category) || '?')];
      rows.push(row);
    });

    rows.push(['']);
    rows.push(['????', '??', '??', '??', '????']);
    evaluationStmt.all(person.id).forEach((evaluation) => {
      rows.push([evaluation.type, evaluation.period, evaluation.content, evaluation.created_at]);
    });
    rows.push(['']);
    rows.push(['????', '??', '??', '??', '??']);
    growthStmt.all(person.id).forEach((event) => {
      rows.push([event.event_date, event.title, event.description || '', event.category || '']);
    });
    rows.push(['']);
    rows.push(['????', '????', '????', '??', '????']);
    certStmt.all(person.id).forEach((cert) => {
      rows.push([cert.name, cert.issued_date || '', cert.description || '', cert.file_path || '']);
    });
    const worksheet = workbook.addWorksheet(safeSheetName(person.name || `person-${person.id}`));

    rows.forEach((row) => worksheet.addRow(row));

  });



  res.setHeader('Content-Disposition', 'attachment; filename="talent-export.xlsx"');

  res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  logAction({ actorId: req.user.id, action: 'export', entityType: 'people', detail: { count: people.length } });

  const buffer = await workbook.xlsx.writeBuffer();

  res.send(Buffer.from(buffer));

});

app.post('/api/import/excel', authenticate, requirePermission('import.excel'), upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '??? Excel ??' });
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile(req.file.path);
  } catch (error) {
    return res.status(400).json({ message: 'Excel ????', detail: error.message });
  } finally {
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return res.status(400).json({ message: 'Excel ????' });
  }

  const headerMap = {};
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const key = normalizeExcelValue(cell).trim();
    if (key) {
      headerMap[colNumber] = key;
    }
  });

  const errors = [];
  const payload = [];
  const currentMonth = getCurrentMonth();

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    if (!row || row.actualCellCount === 0) {
      continue;
    }
    const rowData = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const key = headerMap[colNumber];
      if (!key) return;
      rowData[key] = normalizeExcelValue(cell).trim();
    });
    if (!Object.keys(rowData).length) {
      continue;
    }

    const name = rowData['??']?.toString().trim();
    const birthDate = rowData['????']?.toString().trim();
    const gender = rowData['??']?.toString().trim();
    const phone = rowData['???']?.toString().trim();
    const monthValue =
      rowData['??']?.toString().trim() || rowData['??']?.toString().trim() || rowData['month']?.toString().trim();
    const dimensionMonth = normalizeMonthInput(monthValue) || currentMonth;

    if (!name || !birthDate || !gender || !phone) {
      errors.push({ row: rowNumber, message: '??/????/??/???????' });
      continue;
    }

    const dimensions = DIMENSION_CATEGORIES.map((category) => ({
      category,
      detail: rowData[category] ? rowData[category].toString().trim() : ''
    }));

    payload.push({
      name,
      title: rowData['????']?.toString().trim() || '',
      department: rowData['????']?.toString().trim() || '',
      focus: rowData['????']?.toString().trim() || '',
      bio: rowData['????']?.toString().trim() || '',
      birth_date: birthDate,
      gender,
      phone,
      dimensions,
      dimensionMonth
    });
  }

  if (errors.length) {
    return res.status(400).json({ message: 'Excel ????', errors });
  }

  const insertPerson = db.prepare(
    'INSERT INTO people (name,title,department,focus,bio,icon,birth_date,gender,phone) VALUES (?,?,?,?,?,?,?,?,?)'
  );
  const updatePerson = db.prepare(
    `UPDATE people SET title = COALESCE(?, title),
      department = COALESCE(?, department), focus = COALESCE(?, focus),
      bio = COALESCE(?, bio), birth_date = COALESCE(?, birth_date),
      gender = COALESCE(?, gender), phone = COALESCE(?, phone)
     WHERE id = ?`
  );
  const findPersonByName = db.prepare('SELECT id FROM people WHERE name = ?');
  const deleteDimensions = db.prepare('DELETE FROM dimensions_monthly WHERE person_id = ? AND month = ?');
  const insertDimension = db.prepare(
    'INSERT INTO dimensions_monthly (person_id, category, month, detail) VALUES (?,?,?,?)'
  );

  const summary = db.transaction(() => {
    const stats = { created: 0, updated: 0 };
    payload.forEach((person) => {
      const existing = findPersonByName.get(person.name);
      const targetMonth = normalizeMonthInput(person.dimensionMonth) || currentMonth;
      const normalizedDimensions = normalizeDimensionList(person.dimensions);
      if (existing) {
        updatePerson.run(
          person.title,
          person.department,
          person.focus,
          person.bio,
          person.birth_date,
          person.gender,
          person.phone,
          existing.id
        );
        deleteDimensions.run(existing.id, targetMonth);
        normalizedDimensions.forEach((dimension) => {
          insertDimension.run(existing.id, dimension.category, targetMonth, dimension.detail);
        });
        stats.updated += 1;
      } else {
        const newId = insertPerson.run(
          person.name,
          person.title,
          person.department,
          person.focus,
          person.bio,
          '',
          person.birth_date,
          person.gender,
          person.phone
        ).lastInsertRowid;
        normalizedDimensions.forEach((dimension) => {
          insertDimension.run(newId, dimension.category, targetMonth, dimension.detail);
        });
        stats.created += 1;
      }
    });
    return stats;
  })();

  logAction({ actorId: req.user.id, action: 'import', entityType: 'people', detail: summary });
  res.json(summary);
});



if (process.env.NODE_ENV === 'production') {

  const distPath = path.join(__dirname, '..', 'client', 'dist');

  app.use(express.static(distPath));

  app.get('*', (_, res) => res.sendFile(path.join(distPath, 'index.html')));

}



function startServer() {

  return app.listen(PORT, () => {

    console.log(`人才档案服务已启动: http://localhost:${PORT}`);

  });

}



if (require.main === module) {

  startServer();

}



module.exports = { app, startServer };

