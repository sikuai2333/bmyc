const express = require('express');
const { db } = require('../db');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { logAction } = require('../utils/audit');

const router = express.Router();

router.get('/api/meetings', authenticate, requirePermission('meetings.view'), (req, res) => {
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

router.post('/api/meetings', authenticate, requirePermission('meetings.edit'), (req, res) => {
  const { topic, meetingDate, location, summary, attendees, category } = req.body;
  if (!topic || !meetingDate) {
    return res.status(400).json({ message: '请填写主题和时间' });
  }
  const insertMeeting = db.prepare(
    'INSERT INTO meetings (topic, meetingDate, location, summary, category) VALUES (?,?,?,?,?)'
  );
  const insertAttendee = db.prepare('INSERT INTO meeting_attendees (meeting_id, person_id, role) VALUES (?,?,?)');
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

router.delete('/api/meetings/:id', authenticate, requirePermission('meetings.edit'), (req, res) => {
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

router.get('/api/meetings/:id', authenticate, requirePermission('meetings.view'), (req, res) => {
  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(req.params.id);
  if (!meeting) {
    return res.status(404).json({ message: '会议不存在' });
  }
  const attendees = db
    .prepare(
      `SELECT p.id,p.name,p.title,ma.role
       FROM meeting_attendees ma
       JOIN people p ON ma.person_id = p.id
       WHERE ma.meeting_id = ?`
    )
    .all(meeting.id);
  res.json({ ...meeting, attendees });
});

module.exports = router;
