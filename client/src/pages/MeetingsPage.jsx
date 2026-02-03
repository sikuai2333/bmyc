import React, { useEffect, useMemo, useState } from 'react';

const CATEGORY_COLORS = ['#4b8dff', '#5de0c4', '#ff9fce', '#f6bf4f', '#6f7bff', '#7dd3fc'];

function MeetingsPage({ meetings, selectedMeeting, setSelectedMeetingId, setSelectedPersonId }) {
  const [selectedCategory, setSelectedCategory] = useState('全部');

  const categories = useMemo(() => {
    const set = new Set();
    meetings.forEach((meeting) => {
      if (meeting.category) {
        set.add(meeting.category);
      }
    });
    return Array.from(set);
  }, [meetings]);

  const sortedMeetings = useMemo(
    () => meetings.slice().sort((a, b) => new Date(b.meetingDate) - new Date(a.meetingDate)),
    [meetings]
  );

  const filteredMeetings = useMemo(() => {
    return sortedMeetings.filter((meeting) => {
      if (selectedCategory !== '全部' && meeting.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [sortedMeetings, selectedCategory]);

  useEffect(() => {
    if (!filteredMeetings.length) {
      setSelectedMeetingId(null);
      return;
    }
    if (!selectedMeeting || !filteredMeetings.some((meeting) => meeting.id === selectedMeeting.id)) {
      setSelectedMeetingId(filteredMeetings[0].id);
    }
  }, [filteredMeetings, selectedMeeting, setSelectedMeetingId]);

  const stats = useMemo(() => {
    const total = meetings.length;
    const filtered = filteredMeetings.length;
    const attendeeTotal = filteredMeetings.reduce((sum, meeting) => sum + (meeting.attendees?.length || 0), 0);
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthCount = meetings.filter((meeting) => meeting.meetingDate?.startsWith(monthKey)).length;
    return { total, filtered, attendeeTotal, monthCount };
  }, [meetings, filteredMeetings]);

  const categoryStats = useMemo(() => {
    const base = filteredMeetings.length ? filteredMeetings : [];
    const total = base.length || 1;
    return categories.map((category, index) => {
      const count = base.filter((meeting) => meeting.category === category).length;
      return {
        category,
        count,
        ratio: Math.round((count / total) * 100),
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
      };
    });
  }, [categories, filteredMeetings]);

  return (
    <section className="meetings-page">
      <div className="meeting-header">
        <div className="meeting-stats">
          <div className="meeting-stat-card">
            <p>会议总量</p>
            <strong>{stats.total}</strong>
            <span>场</span>
          </div>
          <div className="meeting-stat-card">
            <p>筛选结果</p>
            <strong>{stats.filtered}</strong>
            <span>场</span>
          </div>
          <div className="meeting-stat-card">
            <p>本月会议</p>
            <strong>{stats.monthCount}</strong>
            <span>场</span>
          </div>
          <div className="meeting-stat-card">
            <p>参会人次</p>
            <strong>{stats.attendeeTotal}</strong>
            <span>人</span>
          </div>
        </div>
        <div className="meeting-filters">
          <div className="meeting-filter-row">
            <span className="filter-label">会议类型</span>
            <div className="meeting-filter-tags">
              <button
                type="button"
                className={`tag-pill ${selectedCategory === '全部' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('全部')}
              >
                全部
              </button>
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={`tag-pill ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          <div className="meeting-category-list">
            {categoryStats.map((item) => (
              <div key={item.category} className="meeting-category-row">
                <span className="meeting-category-name">{item.category}</span>
                <div className="meeting-category-bar">
                  <span
                    className="meeting-category-fill"
                    style={{ width: `${item.ratio}%`, background: item.color }}
                  />
                </div>
                <span className="meeting-category-value">{item.count}场</span>
              </div>
            ))}
            {categoryStats.length === 0 && <p className="muted">暂无会议类型数据</p>}
          </div>
        </div>
      </div>
      <div className="timeline">
        {filteredMeetings.length === 0 ? (
          <p className="muted">当前筛选条件下暂无会议。</p>
        ) : (
          filteredMeetings.map((meeting) => (
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
          ))
        )}
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
