const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const dotenv = require('dotenv');
const { getDefaultPermissions, normalizePermissions } = require('./permissions');
const { DIMENSION_CATEGORIES, READING_CATEGORIES } = require('./config/constants');

dotenv.config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'bainyingcai.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
const ENABLE_DEMO_DATA = (process.env.ENABLE_DEMO_DATA ?? 'true').toLowerCase() !== 'false';
const ADMIN_NAME = process.env.ADMIN_NAME || '系统管理员';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@talent.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin#123';

if (!ENABLE_DEMO_DATA && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)) {
  throw new Error('ADMIN_EMAIL 和 ADMIN_PASSWORD 必须在关闭示例数据时提供');
}

const TEST_ACCOUNTS = [
  {
    user: {
      name: '\u6d4b\u8bd5\u8d26\u6237',
      email: 'test',
      role: 'user',
      password: 'test@123',
      is_super_admin: 0
    },
    person: {
      name: '\u6d4b\u8bd5\u8d26\u6237',
      title: '\u6570\u636e\u5206\u6790\u5b9e\u4e60\u751f',
      department: '\u4eba\u624d\u53d1\u5c55\u4e2d\u5fc3',
      focus: '\u4eba\u624d\u753b\u50cf\u4e0e\u6570\u636e\u6cbb\u7406',
      bio:
        '\u8d1f\u8d23\u5165\u804c\u8d44\u6599\u6570\u636e\u6574\u7406\u4e0e\u8bb0\u5f55\uff0c\u5c1d\u8bd5\u5efa\u7acb\u7edf\u8ba1\u770b\u677f\u4e0e\u5b66\u4e60\u6a21\u677f\u3002',
      icon: '\uD83E\uDDEA',
      phone: '13900001111',
      birth_date: '1999-08-16',
      gender: '\u7537'
    }
  },
  {
    user: {
      name: '\u6797\u82e5\u5b81',
      email: 'test2',
      role: 'user',
      password: 'test@234',
      is_super_admin: 0
    },
    person: {
      name: '\u6797\u82e5\u5b81',
      title: '\u8fd0\u8425\u5b9e\u4e60\u751f',
      department: '\u4ea7\u4e1a\u534f\u540c\u4e2d\u5fc3',
      focus: '\u9879\u76ee\u534f\u540c\u4e0e\u4fe1\u606f\u5f52\u6863',
      bio:
        '\u4e3b\u8981\u8d1f\u8d23\u9879\u76ee\u8fdb\u5ea6\u8bb0\u5f55\u3001\u65b9\u6848\u6574\u7406\u4e0e\u5185\u90e8\u4fe1\u606f\u8f6c\u8fbe\uff0c\u652f\u6301\u6570\u636e\u4f9b\u5e94\u3002',
      icon: '\uD83C\uDF19',
      phone: '13900002222',
      birth_date: '2000-03-22',
      gender: '\u5973'
    }
  },
  {
    user: {
      name: '\u5468\u5b50\u822a',
      email: 'test3',
      role: 'user',
      password: 'test@345',
      is_super_admin: 0
    },
    person: {
      name: '\u5468\u5b50\u822a',
      title: '\u7814\u7a76\u52a9\u7406',
      department: '\u6218\u7565\u89c4\u5212\u90e8',
      focus: '\u6218\u7565\u6570\u636e\u68b3\u7406',
      bio:
        '\u652f\u6301\u4ea7\u4e1a\u7814\u7a76\u6570\u636e\u6536\u96c6\uff0c\u8f93\u51fa\u521d\u6b65\u5206\u6790\u8bba\u8bc1\u4e0e\u65b0\u4eba\u624d\u8bc4\u4f30\u8bb0\u5f55\u3002',
      icon: '\uD83D\uDCCA',
      phone: '13900003333',
      birth_date: '1998-11-05',
      gender: '\u7537'
    }
  },
  {
    user: {
      name: '\u97e9\u8bed\u6850',
      email: 'test4',
      role: 'user',
      password: 'test@456',
      is_super_admin: 0
    },
    person: {
      name: '\u97e9\u8bed\u6850',
      title: '\u4ea7\u54c1\u52a9\u7406',
      department: '\u521b\u65b0\u5b75\u5316\u90e8',
      focus: '\u4e1a\u52a1\u9700\u6c42\u6574\u7406',
      bio:
        '\u534f\u52a9\u6536\u96c6\u4e1a\u52a1\u9700\u6c42\u53cd\u9988\uff0c\u8ddf\u8fdb\u7ed3\u679c\u4ea7\u51fa\u4e0e\u5f52\u6863\uff0c\u6c89\u6dc0\u6210\u957f\u8bb0\u5f55\u3002',
      icon: '\uD83E\uDD1D',
      phone: '13900004444',
      birth_date: '1999-06-18',
      gender: '\u5973'
    }
  }
];

const defaultUsers = [
  { name: '\u9773\u8d3a\u51ef', email: '\u9773\u8d3a\u51ef', role: 'user', password: '13696653085', is_super_admin: 0 },
  { name: '\u5c55\u793a\u8d26\u6237', email: 'display', role: 'display', password: 'display@123', is_super_admin: 0 },
  ...TEST_ACCOUNTS.map((item) => item.user),
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
  },
  ...TEST_ACCOUNTS.map((item) => item.person)
];

const DEMO_DIMENSION_DETAILS = {
  '\u601d\u60f3\u653f\u6cbb': [
    '\u53c2\u52a0\u4e3b\u9898\u515a\u8bfe\u4e0e\u4f01\u4e1a\u6587\u5316\u5b66\u4e60',
    '\u5b8c\u6210\u653f\u7b56\u5b66\u4e60\u7b14\u8bb0\u4e0e\u5fc3\u5f97\u5206\u4eab',
    '\u7ec4\u7ec7\u90e8\u95e8\u653f\u6cbb\u5b66\u4e60\u4e0e\u65b9\u6848\u8bba\u8bc1',
    '\u4e3b\u52a8\u53c2\u4e0e\u96c6\u4f53\u6d3b\u52a8\uff0c\u5f3a\u5316\u4ef7\u503c\u5bfc\u5411',
    '\u5b66\u4e60\u4f01\u4e1a\u5408\u89c4\u8981\u70b9\uff0c\u5b8c\u5584\u5de5\u4f5c\u89c4\u8303',
    '\u5206\u4eab\u653f\u6cbb\u5b66\u4e60\u8981\u70b9\u4e0e\u4e1a\u52a1\u7ed3\u5408\u5206\u6790'
  ],
  '\u4e1a\u52a1\u6c34\u5e73': [
    '\u5b8c\u6210\u4e1a\u52a1\u6d41\u7a0b\u89c4\u8303\u57f9\u8bad\u4e0e\u6d4b\u8bc4',
    '\u638c\u63e1\u7cfb\u7edf\u64cd\u4f5c\u8981\u70b9\uff0c\u80fd\u72ec\u7acb\u5904\u7406\u6863\u6848',
    '\u5b8c\u6210\u4e13\u9898\u9879\u76ee\u8c03\u7814\u8bb0\u5f55\u4e0e\u6574\u7406',
    '\u5b66\u4e60\u6570\u636e\u5206\u6790\u65b9\u6cd5\uff0c\u8f93\u51fa\u6a21\u5757\u65b9\u6848',
    '\u5173\u6ce8\u884c\u4e1a\u52a8\u6001\uff0c\u6574\u7406\u4e13\u9898\u4e1a\u52a1\u8d44\u6599',
    '\u8fde\u7eed\u63d0\u5347\u6587\u6863\u7f16\u5199\u4e0e\u5408\u89c4\u610f\u8bc6'
  ],
  '\u4e1a\u7ee9\u6210\u679c': [
    '\u53c2\u4e0e\u4e13\u9898\u6570\u636e\u76d8\u70b9\uff0c\u8f93\u51fa\u521d\u7248\u5206\u6790\u62a5\u544a',
    '\u5b8c\u6210\u6a21\u5757\u8bd5\u7528\uff0c\u6574\u7406\u95ee\u9898\u53ca\u6539\u8fdb\u5efa\u8bae',
    '\u8f93\u51fa\u9879\u76ee\u5468\u62a5\uff0c\u8bb0\u5f55\u76ee\u6807\u8fbe\u6210\u60c5\u51b5',
    '\u534f\u52a9\u5b8c\u6210\u5904\u7406\u624b\u518c\uff0c\u63d0\u5347\u534f\u4f5c\u6548\u7387',
    '\u62f7\u8d1d\u5de5\u4f5c\u7ecf\u9a8c\uff0c\u6d41\u7a0b\u6307\u5357\u66f4\u65b0',
    '\u5b8c\u6210\u6570\u636e\u68c0\u67e5\uff0c\u63d0\u4f9b\u4f18\u5316\u5efa\u8bae'
  ],
  '\u516b\u5c0f\u65f6\u5916\u4e1a\u4f59\u751f\u6d3b': [
    '\u53c2\u4e0e\u90e8\u95e8\u8fd0\u52a8\u6d3b\u52a8\uff0c\u4fdd\u6301\u826f\u597d\u72b6\u6001',
    '\u62a5\u540d\u5fd7\u613f\u6d3b\u52a8\uff0c\u4e92\u52a9\u4f18\u5148\u5b66\u4e60',
    '\u5b8c\u6210\u9a91\u884c\u4e0e\u8dd1\u6b65\u6253\u5361\uff0c\u5f3a\u5316\u4f53\u80fd',
    '\u53c2\u4e0e\u56e2\u961f\u62d3\u5c55\uff0c\u589e\u5f3a\u5360\u6d3b\u80fd\u91cf',
    '\u4fdd\u6301\u4f5c\u606f\u89c4\u5f8b\uff0c\u505a\u597d\u65f6\u95f4\u7ba1\u7406',
    '\u7efc\u5408\u5174\u8da3\u5b66\u4e60\uff0c\u7f6e\u987a\u5de5\u4f5c\u548c\u751f\u6d3b'
  ],
  '\u9605\u8bfb\u5b66\u4e60\u60c5\u51b5': [
    '\u9605\u8bfb\u300a\u4f01\u4e1a\u7ba1\u7406\u8981\u4e49\u300b\u5e76\u7b14\u8bb0',
    '\u5b8c\u6210\u4e13\u4e1a\u4e66\u7c4d\u4e0e\u4e1a\u52a1\u6587\u6863\u5b66\u4e60',
    '\u5b66\u4e60\u6570\u636e\u7edf\u8ba1\u57fa\u7840\uff0c\u5f62\u6210\u7b14\u8bb0',
    '\u5b8c\u6210\u4e1a\u52a1\u6848\u4f8b\u5206\u4eab\uff0c\u66f4\u65b0\u7b14\u8bb0',
    '\u7cbe\u8bfb\u884c\u4e1a\u62a5\u544a\uff0c\u63d0\u70bc\u4e3b\u8981\u7ed3\u8bba',
    '\u5b8c\u6210\u516c\u53f8\u5236\u5ea6\u5b66\u4e60\u4e0e\u6d4b\u9a8c'
  ],
  '\u5a5a\u604b\u60c5\u51b5': ['\u65e0', '\u65e0', '\u65e0', '\u65e0', '\u65e0', '\u65e0']
};

const buildRecentMonths = (count) => {
  const months = [];
  const cursor = new Date();
  cursor.setDate(1);
  for (let i = 0; i < count; i += 1) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, '0');
    months.push(`${year}-${month}`);
    cursor.setMonth(cursor.getMonth() - 1);
  }
  return months;
};

const buildDemoDimensions = (monthIndex) =>
  DIMENSION_CATEGORIES.map((category) => ({
    category,
    detail:
      DEMO_DIMENSION_DETAILS[category]?.[monthIndex % DEMO_DIMENSION_DETAILS[category].length] || '\u65e0'
  }));

const TEST_PERSON_NAMES = new Set(TEST_ACCOUNTS.map((account) => account.person.name));
const TEST_PERSON_PHONES = new Set(TEST_ACCOUNTS.map((account) => account.person.phone));

const isTestPerson = (person) =>
  TEST_PERSON_NAMES.has(person.name) || (person.phone && TEST_PERSON_PHONES.has(person.phone));

const hashSeed = (input) => {
  const text = String(input || '');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const createSeededRandom = (seed) => {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

const shuffleWithSeed = (list, rand) => {
  const items = [...list];
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
};

const buildRandomMonths = (seed, min = 2, max = 5) => {
  const recent = buildRecentMonths(6);
  const rand = createSeededRandom(seed);
  const baseCount = min + Math.floor(rand() * (max - min + 1));
  const count = Math.max(1, Math.min(max, baseCount));
  const currentMonth = recent[0];
  const others = shuffleWithSeed(recent.slice(1), rand);
  const picked = [currentMonth, ...others.slice(0, Math.max(0, count - 1))];
  return picked;
};

const buildDemoDimensionsForSeed = (seed, monthIndex) =>
  DIMENSION_CATEGORIES.map((category) => {
    if (category === '\u5a5a\u604b\u60c5\u51b5') {
      return { category, detail: '\u65e0' };
    }
    const items = DEMO_DIMENSION_DETAILS[category] || [];
    const indexOffset = items.length ? seed % items.length : 0;
    const detail = items.length ? items[(monthIndex + indexOffset) % items.length] : '\u65e0';
    return { category, detail: detail || '\u65e0' };
  });

const defaultMeetings = [
  {
    topic: '民主生活会',
    meetingDate: '2025-12-20',
    location: '总部党建会议室',
    summary: '围绕年度组织生活会要求，开展批评与自我批评。',
    category: '政治学习'
  },
  {
    topic: '意识形态专题学习会',
    meetingDate: '2025-11-18',
    location: '第一会议室',
    summary: '解读最新政策精神，强调正确舆论导向。',
    category: '政治学习'
  },
  {
    topic: '青年人才座谈会',
    meetingDate: '2025-10-25',
    location: '创新中心路演厅',
    summary: '围绕成长通道与能力提升，收集青年人才建议。',
    category: '人才发展'
  },
  {
    topic: '八小时外兴趣社群交流',
    meetingDate: '2025-10-12',
    location: '职工活动室',
    summary: '分享兴趣社群成果与活动计划。',
    category: '八小时外活动'
  },
  {
    topic: '志愿服务实践活动',
    meetingDate: '2025-09-28',
    location: '市民服务中心',
    summary: '组织参与志愿服务，形成社会责任实践记录。',
    category: '八小时外活动'
  },
  {
    topic: '政策解读与合规宣贯会',
    meetingDate: '2025-09-05',
    location: '报告厅',
    summary: '围绕合规要求与风险提示进行宣贯。',
    category: '政治学习'
  }
];

const defaultReadingZoneItems = [
  {
    title: '青年干部成长手册（精要版）',
    category: '电子书籍',
    summary: '围绕岗位认知、协同方法与成长路径整理的速读手册，适合碎片化阅读。',
    content:
      '本手册聚焦青年干部常见场景：任务拆解、跨部门协同、复盘方法与个人成长路径。\n' +
      '建议以 10-15 分钟完成一章阅读，并结合工作记录做简要沉淀。',
    cover_url:
      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80',
    source_url: 'https://www.grkaolin.com/',
    read_minutes: 12
  },
  {
    title: '产业前沿速递：2026 关键趋势',
    category: '行业前沿资讯',
    summary: '提炼产业政策、技术演进与组织变革的要点，便于快速了解方向。',
    content:
      '本期速递聚焦政策导向、智能化升级与协同创新实践。\n' +
      '推荐先阅读“趋势摘要”，再根据工作需要深入相关小节。',
    cover_url:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80',
    source_url: 'https://www.grkaolin.com/',
    read_minutes: 8
  },
  {
    title: '精品课程：组织力提升微课',
    category: '精品课程',
    summary: '以案例拆解的方式讲解组织力提升方法，适合移动端快速学习。',
    content:
      '课程包含三部分：目标共识、过程协同与结果复盘。\n' +
      '可拆分为多个 5 分钟小节，帮助快速完成学习与回顾。',
    cover_url:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
    source_url: 'https://www.grkaolin.com/',
    read_minutes: 20
  }
];

const RESET_MEETINGS = (process.env.RESET_MEETINGS ?? 'false').toLowerCase() === 'true';
const EXCLUDED_SPEAKER_NAMES = new Set(['靳贺凯']);

const pickSpeakerCandidate = (people = []) =>
  people.find((person) => person?.name && !EXCLUDED_SPEAKER_NAMES.has(person.name))?.id ||
  people.find((person) => person?.id)?.id ||
  null;

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

const seedTestDimensionsForPerson = (personId, seedKey, force = false) => {
  if (!personId) return false;
  const existingCount = db
    .prepare('SELECT COUNT(*) as count FROM dimensions_monthly WHERE person_id = ?')
    .get(personId).count;
  if (existingCount > 0 && !force) {
    return false;
  }
  if (existingCount > 0 && force) {
    db.prepare('DELETE FROM dimensions_monthly WHERE person_id = ?').run(personId);
  }
  const seed = hashSeed(seedKey);
  const months = buildRandomMonths(seed);
  const insertDimension = db.prepare(
    'INSERT INTO dimensions_monthly (person_id,category,month,detail) VALUES (?,?,?,?)'
  );
  const transaction = db.transaction(() => {
    months.forEach((monthKey, monthIndex) => {
      const dimensions = buildDemoDimensionsForSeed(seed, monthIndex);
      dimensions.forEach((dimension) => {
        insertDimension.run(personId, dimension.category, monthKey, dimension.detail);
      });
    });
  });
  transaction();
  return true;
};

const seedTestAccounts = (force = false) => {
  if (!ENABLE_DEMO_DATA) {
    return;
  }
  const insertPerson = db.prepare(
    'INSERT INTO people (name,title,department,focus,bio,icon,phone,birth_date,gender) VALUES (?,?,?,?,?,?,?,?,?)'
  );
  const insertUser = db.prepare(
    'INSERT INTO users (name,email,role,password_hash,person_id,permissions,is_super_admin,sensitive_unmasked) VALUES (?,?,?,?,?,?,?,?)'
  );
  TEST_ACCOUNTS.forEach((account) => {
    const { user, person } = account;
    const existingPerson = db
      .prepare('SELECT id FROM people WHERE name = ? OR phone = ?')
      .get(person.name, person.phone);
    const personId = existingPerson
      ? existingPerson.id
      : insertPerson.run(
          person.name,
          person.title,
          person.department,
          person.focus,
          person.bio,
          person.icon,
          person.phone,
          person.birth_date,
          person.gender
        ).lastInsertRowid;
    const existingUser = db.prepare('SELECT id, person_id FROM users WHERE email = ?').get(user.email);
    if (!existingUser) {
      const hash = bcrypt.hashSync(user.password, 10);
      const permissions = JSON.stringify(getDefaultPermissions(user.role, false));
      insertUser.run(user.name, user.email, user.role, hash, personId, permissions, 0, 0);
    } else if (!existingUser.person_id) {
      db.prepare('UPDATE users SET person_id = ? WHERE id = ?').run(personId, existingUser.id);
    }
    seedTestDimensionsForPerson(personId, `${person.name}-${person.phone}`, force);
  });
};

const ensureDisplayAccount = () => {
  if (!ENABLE_DEMO_DATA) {
    return;
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('display');
  if (existing) {
    return;
  }
  const hash = bcrypt.hashSync('display@123', 10);
  const permissions = JSON.stringify(getDefaultPermissions('display', false));
  db.prepare(
    'INSERT INTO users (name,email,role,password_hash,person_id,permissions,is_super_admin,sensitive_unmasked) VALUES (?,?,?,?,?,?,?,?)'
  ).run('\u5c55\u793a\u8d26\u6237', 'display', 'display', hash, null, permissions, 0, 0);
};

function init() {
  db.prepare(`CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT DEFAULT (datetime('now'))
    )`).run();
  const appliedMigrations = new Set(
    db.prepare('SELECT id FROM schema_migrations').all().map((row) => row.id)
  );

  if (!appliedMigrations.has('001_base')) {
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
      category TEXT,
      file_path TEXT,
      description TEXT,
      uploaded_by INTEGER,
      uploaded_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(person_id) REFERENCES people(id),
      FOREIGN KEY(uploaded_by) REFERENCES users(id)
    )`).run();

  const certificateColumns = db.prepare('PRAGMA table_info(certificates)').all();
  const hasCertificateCategory = certificateColumns.some((column) => column.name === 'category');
  if (!hasCertificateCategory) {
    db.prepare("ALTER TABLE certificates ADD COLUMN category TEXT DEFAULT ''").run();
  }

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

  db.prepare('INSERT INTO schema_migrations (id) VALUES (?)').run('001_base');
  }

  if (!appliedMigrations.has('002_reading_zone')) {
    db.prepare(`CREATE TABLE IF NOT EXISTS reading_zone_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        summary TEXT,
        content TEXT,
        cover_url TEXT,
        source_url TEXT,
        read_minutes INTEGER,
        published_at TEXT DEFAULT (datetime('now')),
        created_by INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT,
        FOREIGN KEY(created_by) REFERENCES users(id)
      )`).run();
    db.prepare('INSERT INTO schema_migrations (id) VALUES (?)').run('002_reading_zone');
  }

  const peopleCount = db.prepare('SELECT COUNT(*) as count FROM people').get().count;
  if (ENABLE_DEMO_DATA && peopleCount === 0) {
    const insertPerson = db.prepare(
      'INSERT INTO people (name,title,department,focus,bio,icon,phone,birth_date,gender) VALUES (?,?,?,?,?,?,?,?,?)'
    );
    const recentMonths = buildRecentMonths(6);
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
          person.phone,
          person.birth_date || '',
          person.gender || ''
        );
        const personId = result.lastInsertRowid;
        if (isTestPerson(person)) {
          const seed = hashSeed(`${person.name}-${person.phone}`);
          const months = buildRandomMonths(seed);
          months.forEach((monthKey, monthIndex) => {
            const dimensions = buildDemoDimensionsForSeed(seed, monthIndex);
            dimensions.forEach((dimension) => {
              insertDimension.run(personId, dimension.category, monthKey, dimension.detail);
            });
          });
        } else {
          recentMonths.forEach((monthKey, monthIndex) => {
            const dimensions = buildDemoDimensions(monthIndex);
            dimensions.forEach((dimension) => {
              insertDimension.run(personId, dimension.category, monthKey, dimension.detail);
            });
          });
        }
      });
    });
    transaction();
  }
  const dimensionMonthlyTotal = db.prepare('SELECT COUNT(*) as count FROM dimensions_monthly').get().count;
  if (ENABLE_DEMO_DATA && dimensionMonthlyTotal === 0 && peopleCount > 0) {
    const people = db.prepare('SELECT id, name, phone FROM people').all();
    const insertDimension = db.prepare(
      'INSERT INTO dimensions_monthly (person_id,category,month,detail) VALUES (?,?,?,?)'
    );
    const recentMonths = buildRecentMonths(6);
    const transaction = db.transaction(() => {
      people.forEach((person) => {
        if (isTestPerson(person)) {
          const seed = hashSeed(`${person.name}-${person.phone}`);
          const months = buildRandomMonths(seed);
          months.forEach((monthKey, monthIndex) => {
            const dimensions = buildDemoDimensionsForSeed(seed, monthIndex);
            dimensions.forEach((dimension) => {
              insertDimension.run(person.id, dimension.category, monthKey, dimension.detail);
            });
          });
        } else {
          recentMonths.forEach((monthKey, monthIndex) => {
            const dimensions = buildDemoDimensions(monthIndex);
            dimensions.forEach((dimension) => {
              insertDimension.run(person.id, dimension.category, monthKey, dimension.detail);
            });
          });
        }
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
    const people = db.prepare('SELECT id, name, phone FROM people').all();
    const peopleByName = new Map();
    const peopleByPhone = new Map();
    people.forEach((person) => {
      if (person.name) {
        peopleByName.set(person.name, person.id);
      }
      if (person.phone) {
        peopleByPhone.set(person.phone, person.id);
      }
    });
    const resolvePersonId = (user) => {
      if (!ENABLE_DEMO_DATA) {
        return user.person_id || null;
      }
      if (user.role !== 'user') {
        return null;
      }
      return peopleByName.get(user.name) || peopleByPhone.get(user.email) || null;
    };
    const insertUser = db.prepare(
      'INSERT INTO users (name,email,role,password_hash,person_id,permissions,is_super_admin,sensitive_unmasked) VALUES (?,?,?,?,?,?,?,?)'
    );
    const transaction = db.transaction(() => {
      baseUsers.forEach((user, idx) => {
        const hash = bcrypt.hashSync(user.password, 10);
        const personId = resolvePersonId(user);
        const isSuperAdmin = Number(user.is_super_admin) === 1 ? 1 : 0;
        const permissions = JSON.stringify(getDefaultPermissions(user.role, isSuperAdmin));
        const sensitiveUnmasked = user.sensitive_unmasked ? 1 : 0;
        insertUser.run(user.name, user.email, user.role, hash, personId, permissions, isSuperAdmin, sensitiveUnmasked);
      });
    });
    transaction();
  } else {
    const users = db
      .prepare('SELECT id, person_id, role, name, email, permissions, is_super_admin, sensitive_unmasked FROM users')
      .all();
    const people = db.prepare('SELECT id, name, phone FROM people').all();
    const peopleByName = new Map();
    const peopleByPhone = new Map();
    people.forEach((person) => {
      if (person.name) {
        peopleByName.set(person.name, person.id);
      }
      if (person.phone) {
        peopleByPhone.set(person.phone, person.id);
      }
    });
    const updatePerson = db.prepare('UPDATE users SET person_id=? WHERE id=?');
    users.forEach((user) => {
      if (!user.person_id && user.role === 'user') {
        const personId =
          peopleByName.get(user.name) ||
          (user.email ? peopleByPhone.get(user.email) : null) ||
          peopleByPhone.get(user.name) ||
          null;
        if (personId) {
          updatePerson.run(personId, user.id);
        }
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

  const ensureTestAccounts = () => {
    seedTestAccounts(false);
  };

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

  ensureTestAccounts();
  ensureDisplayAccount();

  fixCorruptedNames();

  const meetingCount = db.prepare('SELECT COUNT(*) as count FROM meetings').get().count;
  if (ENABLE_DEMO_DATA && (meetingCount === 0 || RESET_MEETINGS)) {
    const insertMeeting = db.prepare(
      'INSERT INTO meetings (topic, meetingDate, location, summary, category) VALUES (?,?,?,?,?)'
    );
    const insertAttendee = db.prepare('INSERT INTO meeting_attendees (meeting_id, person_id, role) VALUES (?,?,?)');
    const transaction = db.transaction(() => {
      if (RESET_MEETINGS && meetingCount > 0) {
        db.prepare('DELETE FROM meeting_attendees').run();
        db.prepare('DELETE FROM meetings').run();
      }
      defaultMeetings.forEach((meeting, idx) => {
        const result = insertMeeting.run(
          meeting.topic,
          meeting.meetingDate,
          meeting.location,
          meeting.summary,
          meeting.category || '\u653f\u6cbb\u5b66\u4e60'
        );
        const meetingId = result.lastInsertRowid;
        const people = db.prepare('SELECT id, name FROM people').all();
        const speakerId = pickSpeakerCandidate(people);
        people.forEach((person, pIdx) => {
          const shouldAttend = person.id === speakerId || (idx + pIdx) % 2 === 0;
          if (!shouldAttend) {
            return;
          }
          const role = person.id === speakerId ? '\u4e3b\u8bb2' : '\u53c2\u4f1a';
          insertAttendee.run(meetingId, person.id, role);
        });
      });
    });
    transaction();
  }

  const readingZoneCount = db.prepare('SELECT COUNT(*) as count FROM reading_zone_items').get().count;
  if (ENABLE_DEMO_DATA && readingZoneCount === 0) {
    const insertReading = db.prepare(
      'INSERT INTO reading_zone_items (title, category, summary, content, cover_url, source_url, read_minutes, created_by) VALUES (?,?,?,?,?,?,?,?)'
    );
    const transaction = db.transaction(() => {
      defaultReadingZoneItems.forEach((item) => {
        const category = READING_CATEGORIES.includes(item.category) ? item.category : READING_CATEGORIES[0] || item.category;
        insertReading.run(
          item.title,
          category,
          item.summary || '',
          item.content || '',
          item.cover_url || '',
          item.source_url || '',
          Number.isFinite(item.read_minutes) ? item.read_minutes : null,
          null
        );
      });
    });
    transaction();
  }

  if (ENABLE_DEMO_DATA) {
    const targetName = '靳贺凯';
    const target = db.prepare('SELECT id FROM people WHERE name = ?').get(targetName);
    if (target) {
      db.prepare("UPDATE meeting_attendees SET role = '\u53c2\u4f1a' WHERE person_id = ? AND role = '\u4e3b\u8bb2'")
        .run(target.id);
    }
    const meetingIds = db.prepare('SELECT id FROM meetings').all();
    const findSpeaker = db.prepare(
      "SELECT person_id FROM meeting_attendees WHERE meeting_id = ? AND role = '\u4e3b\u8bb2' LIMIT 1"
    );
    const findAltSpeaker = db.prepare(
      'SELECT ma.person_id FROM meeting_attendees ma JOIN people p ON p.id = ma.person_id WHERE ma.meeting_id = ? AND p.name <> ? LIMIT 1'
    );
    const findAny = db.prepare('SELECT person_id FROM meeting_attendees WHERE meeting_id = ? LIMIT 1');
    const updateSpeaker = db.prepare(
      "UPDATE meeting_attendees SET role = '\u4e3b\u8bb2' WHERE meeting_id = ? AND person_id = ?"
    );
    meetingIds.forEach((meeting) => {
      if (findSpeaker.get(meeting.id)) {
        return;
      }
      const candidate =
        (target ? findAltSpeaker.get(meeting.id, targetName)?.person_id : null) ||
        findAny.get(meeting.id)?.person_id ||
        null;
      if (candidate) {
        updateSpeaker.run(meeting.id, candidate);
      }
    });
  }
}

module.exports = {
  db,
  init,
  seedTestAccounts,
  close: () => db.close()
};

