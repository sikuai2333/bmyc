const path = require('path');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const dotenv = require('dotenv');
const { getDefaultPermissions, normalizePermissions } = require('./permissions');

dotenv.config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'bainyingcai.db');
const db = new Database(dbPath);
const ENABLE_DEMO_DATA = (process.env.ENABLE_DEMO_DATA ?? 'true').toLowerCase() !== 'false';
const ADMIN_NAME = process.env.ADMIN_NAME || '系统管理员';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@talent.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin#123';

if (!ENABLE_DEMO_DATA && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)) {
  throw new Error('ADMIN_EMAIL 和 ADMIN_PASSWORD 必须在关闭示例数据时提供');
}

const defaultUsers = [
  { name: '\u9773\u8d3a\u51ef', email: '\u9773\u8d3a\u51ef', role: 'user', password: '13696653085', is_super_admin: 0 },
  { name: 'admin', email: 'admin', role: 'admin', password: 'admin@123', is_super_admin: 0 },
  {
    name: 'sikuai',
    email: 'sikuai',
    role: 'admin',
    password: 'sikuai@2333',
    is_super_admin: 1,
    sensitive_unmasked: 1
  }
];

const defaultPeople = [
  {
    name: '\u9773\u8d3a\u51ef',
    phone: '13696653085',
    icon: '\uD83D\uDC64'
  }
];

const baseDimensions = [];

const defaultMeetings = [];

const fixCorruptedNames = () => {
  const targetName = '\u9773\u8d3a\u51ef';
  const targetPhone = '13696653085';
  const targetEmail = targetName;
  const person = db.prepare('SELECT id, name FROM people WHERE phone = ?').get(targetPhone);
  if (person && person.name !== targetName) {
    db.prepare('UPDATE people SET name = ? WHERE id = ?').run(targetName, person.id);
  }
  if (person) {
    db.prepare(
      "UPDATE users SET name = ?, email = ? WHERE person_id = ? AND role = 'user' AND (name <> ? OR email <> ?)"
    ).run(targetName, targetEmail, person.id, targetName, targetEmail);
  }
};

function init() {
  db.prepare(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user','admin','display')),
      password_hash TEXT NOT NULL,
      person_id INTEGER,
      permissions TEXT,
      is_super_admin INTEGER DEFAULT 0,
      sensitive_unmasked INTEGER DEFAULT 0,
      FOREIGN KEY(person_id) REFERENCES people(id)
    )`).run();

  const userColumns = db.prepare('PRAGMA table_info(users)').all();
  const hasPersonId = userColumns.some((column) => column.name === 'person_id');
  if (!hasPersonId) {
    db.prepare('ALTER TABLE users ADD COLUMN person_id INTEGER REFERENCES people(id)').run();
  }
  const hasPermissions = userColumns.some((column) => column.name === 'permissions');
  if (!hasPermissions) {
    db.prepare('ALTER TABLE users ADD COLUMN permissions TEXT').run();
  }
  const hasSuperAdmin = userColumns.some((column) => column.name === 'is_super_admin');
  if (!hasSuperAdmin) {
    db.prepare('ALTER TABLE users ADD COLUMN is_super_admin INTEGER DEFAULT 0').run();
  }
  const hasSensitiveUnmasked = userColumns.some((column) => column.name === 'sensitive_unmasked');
  if (!hasSensitiveUnmasked) {
    db.prepare('ALTER TABLE users ADD COLUMN sensitive_unmasked INTEGER DEFAULT 0').run();
  }

  db.prepare(`CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      title TEXT,
      department TEXT,
      focus TEXT,
      bio TEXT,
      icon TEXT,
      birth_date TEXT,
      gender TEXT,
      phone TEXT
    )`).run();

  const peopleColumns = db.prepare('PRAGMA table_info(people)').all();
  const hasBirthDate = peopleColumns.some((column) => column.name === 'birth_date');
  if (!hasBirthDate) {
    db.prepare('ALTER TABLE people ADD COLUMN birth_date TEXT').run();
  }
  const hasGender = peopleColumns.some((column) => column.name === 'gender');
  if (!hasGender) {
    db.prepare('ALTER TABLE people ADD COLUMN gender TEXT').run();
  }
  const hasPhone = peopleColumns.some((column) => column.name === 'phone');
  if (!hasPhone) {
    db.prepare('ALTER TABLE people ADD COLUMN phone TEXT').run();
  }

  const dimensionColumns = db.prepare('PRAGMA table_info(dimensions)').all();
  const hasWeightColumn = dimensionColumns.some((column) => column.name === 'weight');
  if (hasWeightColumn) {
    const migrateDimensions = db.transaction(() => {
      db.prepare('ALTER TABLE dimensions RENAME TO dimensions_old').run();
      db.prepare(`CREATE TABLE dimensions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          person_id INTEGER NOT NULL,
          category TEXT NOT NULL,
          detail TEXT NOT NULL,
          FOREIGN KEY(person_id) REFERENCES people(id)
        )`).run();
      db.prepare(
        'INSERT INTO dimensions (id, person_id, category, detail) SELECT id, person_id, category, detail FROM dimensions_old'
      ).run();
      db.prepare('DROP TABLE dimensions_old').run();
    });
    migrateDimensions();
  } else {
    db.prepare(`CREATE TABLE IF NOT EXISTS dimensions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        person_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        detail TEXT NOT NULL,
        FOREIGN KEY(person_id) REFERENCES people(id)
      )`).run();
  }

  db.prepare(`CREATE TABLE IF NOT EXISTS dimensions_monthly (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      month TEXT NOT NULL,
      detail TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(person_id, category, month),
      FOREIGN KEY(person_id) REFERENCES people(id)
    )`).run();

  const dimensionMonthlyCount = db.prepare('SELECT COUNT(*) as count FROM dimensions_monthly').get().count;
  const dimensionLegacyCount = db.prepare('SELECT COUNT(*) as count FROM dimensions').get().count;
  if (dimensionMonthlyCount === 0 && dimensionLegacyCount > 0) {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    db.prepare(
      'INSERT INTO dimensions_monthly (person_id, category, month, detail) SELECT person_id, category, ?, detail FROM dimensions'
    ).run(currentMonth);
  }

  db.prepare(`CREATE TABLE IF NOT EXISTS meetings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      meetingDate TEXT NOT NULL,
      location TEXT,
      summary TEXT,
      category TEXT DEFAULT '\u653f\u6cbb\u5b66\u4e60'
    )`).run();

  db.prepare(`CREATE TABLE IF NOT EXISTS evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('quarterly','annual','marriage')),
      period TEXT NOT NULL,
      content TEXT NOT NULL,
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT,
      FOREIGN KEY(person_id) REFERENCES people(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    )`).run();

  db.prepare(`CREATE TABLE IF NOT EXISTS growth_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id INTEGER NOT NULL,
      event_date TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(person_id) REFERENCES people(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    )`).run();

  db.prepare(`CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      issued_date TEXT,
      file_path TEXT,
      description TEXT,
      uploaded_by INTEGER,
      uploaded_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(person_id) REFERENCES people(id),
      FOREIGN KEY(uploaded_by) REFERENCES users(id)
    )`).run();

  db.prepare(`CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      detail TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(actor_id) REFERENCES users(id)
    )`).run();

  const meetingColumns = db.prepare('PRAGMA table_info(meetings)').all();
  const hasCategoryColumn = meetingColumns.some((column) => column.name === 'category');
  if (!hasCategoryColumn) {
    db.prepare("ALTER TABLE meetings ADD COLUMN category TEXT DEFAULT '\u653f\u6cbb\u5b66\u4e60'").run();
  }

  db.prepare(`CREATE TABLE IF NOT EXISTS meeting_attendees (
      meeting_id INTEGER NOT NULL,
      person_id INTEGER NOT NULL,
      role TEXT,
      PRIMARY KEY (meeting_id, person_id),
      FOREIGN KEY(meeting_id) REFERENCES meetings(id),
      FOREIGN KEY(person_id) REFERENCES people(id)
    )`).run();

  const peopleCount = db.prepare('SELECT COUNT(*) as count FROM people').get().count;
  if (ENABLE_DEMO_DATA && peopleCount === 0) {
    const insertPerson = db.prepare(
      'INSERT INTO people (name,title,department,focus,bio,icon,phone) VALUES (?,?,?,?,?,?,?)'
    );
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const insertDimension = db.prepare(
      'INSERT INTO dimensions_monthly (person_id,category,month,detail) VALUES (?,?,?,?)'
    );
    const transaction = db.transaction(() => {
      defaultPeople.forEach((person, idx) => {
        const result = insertPerson.run(
          person.name,
          person.title,
          person.department,
          person.focus,
          person.bio,
          person.icon,
          person.phone
        );
        const personId = result.lastInsertRowid;
        baseDimensions.forEach((dimension) => {
          insertDimension.run(personId, dimension.category, currentMonth, dimension.detail);
        });
      });
    });
    transaction();
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const baseUsers = ENABLE_DEMO_DATA
      ? defaultUsers
      : [
          {
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            role: 'admin',
            password: ADMIN_PASSWORD
          }
        ];
    const personIds = db.prepare('SELECT id FROM people ORDER BY id').all().map((p) => p.id);
    const insertUser = db.prepare(
      'INSERT INTO users (name,email,role,password_hash,person_id,permissions,is_super_admin,sensitive_unmasked) VALUES (?,?,?,?,?,?,?,?)'
    );
    const transaction = db.transaction(() => {
      baseUsers.forEach((user, idx) => {
        const hash = bcrypt.hashSync(user.password, 10);
        const personId = ENABLE_DEMO_DATA ? personIds[idx] || null : user.person_id || null;
        const isSuperAdmin = Number(user.is_super_admin) === 1 ? 1 : 0;
        const permissions = JSON.stringify(getDefaultPermissions(user.role, isSuperAdmin));
        const sensitiveUnmasked = user.sensitive_unmasked ? 1 : 0;
        insertUser.run(user.name, user.email, user.role, hash, personId, permissions, isSuperAdmin, sensitiveUnmasked);
      });
    });
    transaction();
  } else {
    const users = db.prepare(
      'SELECT id, person_id, role, permissions, is_super_admin, sensitive_unmasked FROM users'
    ).all();
    const personIds = db.prepare('SELECT id FROM people ORDER BY id').all().map((p) => p.id);
    const updatePerson = db.prepare('UPDATE users SET person_id=? WHERE id=?');
    users.forEach((user, idx) => {
      if (!user.person_id && personIds[idx]) {
        updatePerson.run(personIds[idx], user.id);
      }
    });
    const updatePermissions = db.prepare(
      'UPDATE users SET permissions = COALESCE(?, permissions), is_super_admin = COALESCE(?, is_super_admin), sensitive_unmasked = COALESCE(?, sensitive_unmasked) WHERE id = ?'
    );
    users.forEach((user) => {
      const existingPermissions = normalizePermissions(user.permissions);
      if (existingPermissions.length === 0) {
        const defaults = getDefaultPermissions(user.role, user.is_super_admin === 1);
        updatePermissions.run(JSON.stringify(defaults), user.is_super_admin ?? 0, user.sensitive_unmasked ?? 0, user.id);
      }
    });
  }

  const ensureAdminUser = () => {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      return;
    }
    const existing = db
      .prepare('SELECT id, role, permissions, is_super_admin, sensitive_unmasked FROM users WHERE email = ?')
      .get(ADMIN_EMAIL);
    const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    const isSuperAdmin = 1;
    const permissions = JSON.stringify(getDefaultPermissions('admin', true));
    const sensitiveUnmasked = 1;
    if (existing) {
      db.prepare(
        'UPDATE users SET name = ?, role = ?, password_hash = ?, permissions = ?, is_super_admin = ?, sensitive_unmasked = ? WHERE id = ?'
      ).run(ADMIN_NAME, 'admin', hash, permissions, isSuperAdmin, sensitiveUnmasked, existing.id);
    } else {
      db.prepare(
        'INSERT INTO users (name,email,role,password_hash,person_id,permissions,is_super_admin,sensitive_unmasked) VALUES (?,?,?,?,?,?,?,?)'
      ).run(ADMIN_NAME, ADMIN_EMAIL, 'admin', hash, null, permissions, isSuperAdmin, sensitiveUnmasked);
    }
  };
  if (!ENABLE_DEMO_DATA) {
    ensureAdminUser();
  }

  fixCorruptedNames();

  const meetingCount = db.prepare('SELECT COUNT(*) as count FROM meetings').get().count;
  if (ENABLE_DEMO_DATA && meetingCount === 0) {
    const insertMeeting = db.prepare(
      'INSERT INTO meetings (topic, meetingDate, location, summary, category) VALUES (?,?,?,?,?)'
    );
    const insertAttendee = db.prepare('INSERT INTO meeting_attendees (meeting_id, person_id, role) VALUES (?,?,?)');
    const transaction = db.transaction(() => {
      defaultMeetings.forEach((meeting, idx) => {
        const result = insertMeeting.run(
          meeting.topic,
          meeting.meetingDate,
          meeting.location,
          meeting.summary,
          meeting.category || '\u653f\u6cbb\u5b66\u4e60'
        );
        const meetingId = result.lastInsertRowid;
        const personIds = db.prepare('SELECT id FROM people').all();
        personIds.forEach((person, pIdx) => {
          if ((idx + pIdx) % 2 === 0) {
            insertAttendee.run(meetingId, person.id, pIdx === 0 ? '\u4e3b\u8bb2' : '\u53c2\u4f1a');
          }
        });
      });
    });
    transaction();
  }
}

module.exports = {
  db,
  init,
  close: () => db.close()
};
