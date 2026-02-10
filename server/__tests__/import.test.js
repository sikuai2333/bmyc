const test = require('node:test');
const assert = require('node:assert/strict');

process.env.DB_PATH = ':memory:';
process.env.ENABLE_DEMO_DATA = 'false';
process.env.ADMIN_EMAIL = 'unit-admin@talent.local';
process.env.ADMIN_PASSWORD = 'Unit#123';
process.env.ADMIN_NAME = '单测管理员';
process.env.JWT_SECRET = 'test-secret';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.PORT = '0';

const { db, close } = require('../db');
const { startServer } = require('../index');

let server;
let baseURL;

test.before(async () => {
  server = startServer();
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  baseURL = `http://127.0.0.1:${address.port}/api`;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  close();
});

test('bootstrap admin and import datasets', async () => {
  const adminRow = db.prepare('SELECT email, role FROM users').get();
  assert.equal(adminRow.email, process.env.ADMIN_EMAIL);
  assert.equal(adminRow.role, 'admin');

  const loginResponse = await fetch(`${baseURL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD
    })
  });
  assert.equal(loginResponse.status, 200);
  const loginData = await loginResponse.json();
  const token = loginData.token;
  assert.ok(token);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const peoplePayload = [
    {
      name: '李婷',
      title: '创新总监',
      department: '金岩高新·创新加速中心',
      focus: '跨部门协同与成果转化',
      bio: '负责统筹多维档案治理和成果孵化。',
      dimensions: [
        { category: '思想政治', detail: '定期组织青年理论学习' },
        { category: '业绩成果', detail: '推动 3 个示范项目落地' }
      ]
    },
    {
      name: '赵博',
      title: '智改智造牵头人',
      department: '金岩高新·AI制造事业部',
      focus: '智能产线升级',
      bio: '链接制造生态伙伴，推进智能产线部署。',
      dimensions: [{ category: '八小时外业余生活', detail: '积极参与企业工会活动' }]
    }
  ];

  const peopleImport = await fetch(`${baseURL}/import/people`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ people: peoplePayload })
  });
  assert.equal(peopleImport.status, 201);
  const peopleSummary = await peopleImport.json();
  assert.equal(peopleSummary.created, 2);

  const peopleResponse = await fetch(`${baseURL}/personnel`, { headers: { Authorization: `Bearer ${token}` } });
  const peopleData = await peopleResponse.json();
  assert.equal(peopleData.length, 2);
  const liTing = peopleData.find((person) => person.name === '李婷');
  assert.ok(liTing);
  assert.equal(liTing.dimensionCount, 6);
  assert.equal(liTing.dimensionMonthCount, 1);

  const meetingsPayload = [
    {
      topic: '季度人才盘点会',
      meetingDate: '2026-02-01',
      location: '数字治理会议室',
      summary: '围绕重点人才诉求与会议联动事项展开讨论。',
      category: '政治学习',
      attendees: [
        { personName: '李婷', role: '主持' },
        { personName: '赵博', role: '参会' }
      ]
    }
  ];

  const meetingImport = await fetch(`${baseURL}/import/meetings`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ meetings: meetingsPayload })
  });
  assert.equal(meetingImport.status, 201);
  const meetingSummary = await meetingImport.json();
  assert.equal(meetingSummary.created, 1);
  assert.equal(meetingSummary.attendeeLinked, 2);

  const meetingsResponse = await fetch(`${baseURL}/meetings`, { headers: { Authorization: `Bearer ${token}` } });
  const meetingsData = await meetingsResponse.json();
  assert.equal(meetingsData.length, 1);
  assert.equal(meetingsData[0].category, '政治学习');
  assert.equal(meetingsData[0].attendees.length, 2);
});
