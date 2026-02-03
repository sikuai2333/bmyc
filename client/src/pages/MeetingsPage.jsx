import React, { useMemo } from 'react';

function MeetingsPage({ meetings, selectedMeeting, setSelectedMeetingId, setSelectedPersonId }) {
  const sortedMeetings = useMemo(
    () => meetings.slice().sort((a, b) => new Date(b.meetingDate) - new Date(a.meetingDate)),
    [meetings]
  );

  return (
    <section className="meetings-page">
      <div className="timeline">
        {sortedMeetings.map((meeting) => (
          <button
            key={meeting.id}
            className={`timeline-item ${selectedMeeting && selectedMeeting.id === meeting.id ? 'active' : ''}`}
            onClick={() => setSelectedMeetingId(meeting.id)}
          >
            <p className="date">{meeting.meetingDate}</p>
            <span className="meeting-category-chip">{meeting.category || '会议'}</span>
            <p className="topic">{meeting.topic}</p>
            <p className="location">{meeting.location}</p>
          </button>
        ))}
      </div>
      <div className="meeting-detail-panel">
        {selectedMeeting ? (
          <>
            <h3>{selectedMeeting.topic}</h3>
            <div className="meta meeting-meta">
              <span className="meeting-category-chip">{selectedMeeting.category || '会议'}</span>
              <span>
                {selectedMeeting.meetingDate} · {selectedMeeting.location}
              </span>
            </div>
            <p className="description">{selectedMeeting.summary}</p>
            <h4>参会人才</h4>
            <div className="attendee-grid">
              {selectedMeeting.attendees?.map((attendee) => (
                <button key={attendee.id} className="attendee-chip" onClick={() => setSelectedPersonId(attendee.id)}>
                  {attendee.name} · {attendee.role}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="muted">请选择左侧任一会议以查看详情。</p>
        )}
      </div>
    </section>
  );
}

export default MeetingsPage;
