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
  { name: '\u738b\u6668', email: 'admin@talent.local', role: 'admin', password: 'Admin#123', is_super_admin: 0 },
  { name: '\u674e\u8398', email: 'user@talent.local', role: 'user', password: 'User#123', is_super_admin: 0 },
  { name: '\u5c55\u793a\u8d26\u53f7', email: 'display@talent.local', role: 'display', password: 'Display#123', is_super_admin: 0 },
  {
    name: '\u8d85\u7ea7\u7ba1\u7406\u5458',
    email: 'super@talent.local',
    role: 'admin',
    password: 'Super#123',
    is_super_admin: 1,
    sensitive_unmasked: 1
  }
];

const defaultPeople = [
  {
    name: '\u738b\u6668',
    title: '\u6218\u7565\u4e0e\u653f\u7b56\u8d1f\u8d23\u4eba',
    department: '\u91d1\u5ca9\u9ad8\u65b0\u96c6\u56e2',
    focus: '\u7edf\u7b79\u533a\u57df\u4ea7\u4e1a\u534f\u540c\u94fe',
    bio: '\u4e3b\u5bfc\u4f01\u653f\u534f\u540c\u6cbb\u7406\u8bfe\u9898\uff0c\u5584\u4e8e\u8d44\u6e90\u5bf9\u63a5\u4e0e\u8de8\u90e8\u95e8\u534f\u4f5c\uff0c\u63a8\u52a8\u6218\u7565\u9879\u76ee\u5f62\u6210\u95ed\u73af\u3002',
    icon: '\uD83D\uDEF0\uFE0F'
  },
  {
    name: '\u674e\u8398',
    title: '\u9752\u5e74\u521b\u65b0\u4e13\u5458',
    department: '\u524d\u6d77\u53d1\u5c55\u4e2d\u5fc3',
    focus: '\u591a\u7ef4\u4eba\u624d\u8fd0\u8425\u4e0e\u793e\u7fa4\u6fc0\u6d3b',
    bio: '\u8d1f\u8d23\u9752\u5e74\u793a\u8303\u9879\u76ee\u7ba1\u7406\uff0c\u5584\u4e8e\u7528\u6570\u636e\u6d1e\u5bdf\u53d1\u6398\u4eba\u624d\u4eae\u70b9\uff0c\u8fde\u63a5\u591a\u65b9\u573a\u666f\u3002',
    icon: '\uD83D\uDCA1'
  },
  {
    name: '\u9648\u78ca',
    title: '\u57ce\u5e02\u66f4\u65b0\u7814\u7a76\u5458',
    department: '\u57ce\u5e02\u667a\u7814\u9662',
    focus: '\u6570\u636e\u6cbb\u7406\u4e0e\u7a7a\u95f4\u7b56\u7565',
    bio: '\u63a8\u8fdb\u57ce\u5e02\u6cbb\u7406\u4e2d\u67a2\u6570\u5b57\u5b6a\u751f\u5efa\u8bbe\uff0c\u5c06\u7814\u7a76\u6210\u679c\u8f6c\u5316\u4e3a\u843d\u5730\u65b9\u6848\u3002',
    icon: '\uD83C\uDF06'
  },
  {
    name: '\u8d75\u535a',
    title: '\u5148\u8fdb\u5236\u9020\u987e\u95ee',
    department: '\u667a\u80fd\u88c5\u5907\u8054\u76df',
    focus: '\u6838\u5fc3\u5de5\u827a\u56fd\u4ea7\u5316',
    bio: '\u8d1f\u8d23\u6d77\u5185\u5916\u4f9b\u5e94\u94fe\u534f\u540c\u4e0e\u6210\u679c\u8f6c\u5316\uff0c\u5584\u4e8e\u6784\u5efa\u6807\u51c6\u5316\u590d\u7528\u4f53\u7cfb\u3002',
    icon: '\u2699\uFE0F'
  },
  {
    name: '\u5218\u7545',
    title: '\u4ea7\u4e1a\u6295\u8d44\u7ecf\u7406',
    department: '\u4ea7\u6295\u96c6\u56e2',
    focus: '\u79d1\u6280\u6295\u540e\u8d4b\u80fd',
    bio: '\u5173\u6ce8\u786c\u79d1\u6280\u6295\u878d\u8d44\u4e0e\u4eba\u624d\u6fc0\u52b1\uff0c\u4e3a\u521b\u65b0\u56e2\u961f\u63d0\u4f9b\u5236\u5ea6\u4e0e\u8d44\u6e90\u652f\u6301\u3002',
    icon: '\uD83D\uDCC8'
  }
];

const baseDimensions = [
  { category: '\u5de5\u4f5c\u6210\u6548', detail: '\u72ec\u7acb\u5b8c\u6210\u7701\u7ea7\u91cd\u70b9\u9879\u76ee\u843d\u5730' },
  { category: '\u653f\u6cbb\u601d\u60f3', detail: '\u5b9a\u671f\u53c2\u52a0\u9ad8\u8d28\u91cf\u515a\u5efa\u5b66\u4e60\u7814\u8ba8' },
  { category: '\u751f\u6d3b\u65b9\u5f0f', detail: '\u4fdd\u6301\u8fd0\u52a8\u4e60\u60ef\u5e76\u7ec4\u7ec7\u56e2\u961f\u56e2\u5efa' },
  { category: '\u5bb6\u5ead\u5a5a\u59fb', detail: '\u6ce8\u91cd\u4eb2\u5b50\u966a\u4f34\uff0c\u53c2\u4e0e\u5bb6\u5ead\u6559\u80b2\u6d3b\u52a8' },
  { category: '\u798f\u5229\u8bc9\u6c42', detail: '\u5e0c\u671b\u516c\u53f8\u63d0\u4f9b\u6d77\u5916\u7814\u5b66\u4e0e\u5065\u5eb7\u4fdd\u969c' }
];

const defaultMeetings = [
  {
    topic: '\u5b66\u4e60\u8fdb\u8d77\u6700\u65b0\u6cbb\u7406\u7406\u5ff5\u4f1a\u8bae',
    meetingDate: '2026-01-15',
    location: '\u4f01\u653f\u5171\u5efa\u5c55\u5385',
    summary: '\u805a\u7126\u9ad8\u8d28\u91cf\u53d1\u5c55\u4e0e\u4f01\u653f\u8054\u52a8\uff0c\u5206\u4eab\u5178\u578b\u793a\u8303\u6848\u4f8b\u3002',
    category: '\u653f\u6cbb\u5b66\u4e60'
  },
  {
    topic: '\u5148\u8fdb\u5236\u9020\u97e7\u6027\u4f9b\u5e94\u94fe\u5ea7\u8c08',
    meetingDate: '2026-01-09',
    location: '\u667a\u80fd\u88c5\u5907\u8bd5\u5236\u573a',
    summary: '\u56f4\u7ed5\u667a\u80fd\u88c5\u5907\u56fd\u4ea7\u5316\u8def\u5f84\uff0c\u7814\u8ba8\u8d44\u6e90\u534f\u540c\u4e0e\u5173\u952e\u8282\u70b9\u3002',
    category: '\u4ea7\u4e1a\u8c03\u7814'
  },
  {
    topic: '\u9752\u5e74\u4eba\u624d\u653f\u6cbb\u601d\u60f3\u4e13\u9898\u4f1a',
    meetingDate: '2025-12-28',
    location: '\u524d\u6d77\u53d1\u5c55\u4e2d\u5fc3',
    summary: '\u56f4\u7ed5\u9752\u5e74\u5173\u5207\u4e0e\u4fdd\u969c\u8bae\u9898\uff0c\u5f62\u6210\u5e38\u6001\u5316\u8054\u7edc\u673a\u5236\u3002',
    category: '\u5de5\u4f1a\u6d3b\u52a8'
  }
];

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
    const insertPerson = db.prepare('INSERT INTO people (name,title,department,focus,bio,icon) VALUES (?,?,?,?,?,?)');
    const insertDimension = db.prepare('INSERT INTO dimensions (person_id,category,detail) VALUES (?,?,?)');
    const transaction = db.transaction(() => {
      defaultPeople.forEach((person, idx) => {
        const result = insertPerson.run(person.name, person.title, person.department, person.focus, person.bio, person.icon);
        const personId = result.lastInsertRowid;
        baseDimensions.forEach((dimension) => {
          insertDimension.run(personId, dimension.category, dimension.detail);
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

  if (ENABLE_DEMO_DATA) {
    const superEmail = 'super@talent.local';
    const existingSuper = db.prepare('SELECT id FROM users WHERE email = ?').get(superEmail);
    if (!existingSuper) {
      const hash = bcrypt.hashSync('Super#123', 10);
      const permissions = JSON.stringify(getDefaultPermissions('admin', true));
      db.prepare(
        'INSERT INTO users (name,email,role,password_hash,person_id,permissions,is_super_admin,sensitive_unmasked) VALUES (?,?,?,?,?,?,?,?)'
      ).run('\u8d85\u7ea7\u7ba1\u7406\u5458', superEmail, 'admin', hash, null, permissions, 1, 1);
    }
  }

  if (ENABLE_DEMO_DATA) {
    const ensureProfiles = [
      {
        email: 'user@talent.local',
        profile: {
          name: '\u674e\u8398',
          title: '\u9752\u5e74\u521b\u65b0\u4e13\u5458',
          department: '\u524d\u6d77\u53d1\u5c55\u4e2d\u5fc3',
          focus: '\u591a\u7ef4\u4eba\u624d\u8fd0\u8425\u4e0e\u793e\u7fa4\u6fc0\u6d3b',
          bio: '\u8d1f\u8d23\u9752\u5e74\u793a\u8303\u9879\u76ee\u7ba1\u7406\uff0c\u5584\u4e8e\u7528\u6570\u636e\u6d1e\u5bdf\u53d1\u6398\u4eba\u624d\u4eae\u70b9\uff0c\u8fde\u63a5\u591a\u65b9\u573a\u666f\u3002',
          icon: '\uD83D\uDCA1'
        }
      }
    ];
    const getUserByEmail = db.prepare('SELECT id, person_id FROM users WHERE email = ?');
    const getPersonById = db.prepare('SELECT name FROM people WHERE id = ?');
    const getPersonByName = db.prepare('SELECT id FROM people WHERE name = ?');
    const insertPerson = db.prepare('INSERT INTO people (name,title,department,focus,bio,icon) VALUES (?,?,?,?,?,?)');
    const updateUserPerson = db.prepare('UPDATE users SET person_id=? WHERE id=?');

    const assignMissingProfiles = db.transaction(() => {
      ensureProfiles.forEach(({ email, profile }) => {
        const user = getUserByEmail.get(email);
        if (!user) return;
        if (user.person_id) {
          const person = getPersonById.get(user.person_id);
          if (person && person.name === profile.name) {
            return;
          }
        }
        const existingPerson = getPersonByName.get(profile.name);
        let personId = existingPerson ? existingPerson.id : null;
        if (!personId) {
          personId = insertPerson.run(profile.name, profile.title, profile.department, profile.focus, profile.bio, profile.icon)
            .lastInsertRowid;
          baseDimensions.forEach((dimension, idx) => {
            db.prepare('INSERT INTO dimensions (person_id,category,detail) VALUES (?,?,?)').run(
              personId,
              dimension.category,
              dimension.detail
            );
          });
        }
        updateUserPerson.run(personId, user.id);
      });
    });
    assignMissingProfiles();
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
  ensureAdminUser();

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
