import React, { useEffect, useMemo, useState } from 'react';
import { DIMENSION_COLORS } from '../constants';

function TalentPage({
  people,
  insights,
  meetings,
  selectedPerson,
  setSelectedPersonId,
  navigate,
  user,
  sensitiveUnmasked,
  hasPerm
}) {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('全部');
  const [dimensionTag, setDimensionTag] = useState('全部');
  const [detailTab, setDetailTab] = useState('overview');

  const departments = useMemo(
    () => Array.from(new Set(people.map((person) => person.department))).filter(Boolean),
    [people]
  );
  const dimensionTags = useMemo(
    () => Array.from(new Set(insights.map((item) => item.category))).filter(Boolean),
    [insights]
  );

  const filteredPeople = useMemo(
    () =>
      people.filter((person) => {
        const matchSearch =
          person.name.includes(search) ||
          (person.focus && person.focus.includes(search)) ||
          (person.department && person.department.includes(search));
        const matchDept = department === '全部' || person.department === department;
        const matchDimension =
          dimensionTag === '全部' ||
          (person.dimensions || []).some((dimension) => dimension.category === dimensionTag);
        return matchSearch && matchDept && matchDimension;
      }),
    [people, search, department, dimensionTag]
  );

  useEffect(() => {
    setDetailTab('overview');
  }, [selectedPerson?.id]);

  const relatedMeetings = useMemo(() => {
    if (!selectedPerson) return [];
    return meetings.filter((meeting) =>
      meeting.attendees?.some((attendee) => attendee.id === selectedPerson.id)
    );
  }, [meetings, selectedPerson]);

  const hasSensitivePermission = hasPerm && hasPerm('sensitive.view');
  const canViewSensitive =
    user &&
    selectedPerson &&
    (user.isSuperAdmin ||
      user.personId === selectedPerson.id ||
      (hasSensitivePermission && sensitiveUnmasked));
  const shouldMaskSensitive = selectedPerson && !canViewSensitive;

  const maskPhoneLocal = (phone) => {
    if (!phone) return '—';
    if (phone.length <= 7) return '••••';
    return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
  };
  const maskBirthDateLocal = (date) => {
    if (!date) return '—';
    return '****-**-**';
  };
  const getAge = (date) => {
    if (!date) return '—';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '—';
    const now = new Date();
    let age = now.getFullYear() - parsed.getFullYear();
    const hasBirthdayPassed =
      now.getMonth() > parsed.getMonth() ||
      (now.getMonth() === parsed.getMonth() && now.getDate() >= parsed.getDate());
    if (!hasBirthdayPassed) {
      age -= 1;
    }
    return age >= 0 ? `${age} 岁` : '—';
  };

  return (
    <section className="talent-page">
      <aside className="talent-sidebar">
        <div className="talent-filters">
          <div className="panel-subtitle">人才筛选</div>
          <h3>筛选条件</h3>
          <label>
            姓名/方向
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="姓名 / 方向" />
          </label>
          <label>
            部门
            <select value={department} onChange={(event) => setDepartment(event.target.value)}>
              <option value="全部">全部</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </label>
          <label>
            维度标签
            <select value={dimensionTag} onChange={(event) => setDimensionTag(event.target.value)}>
              <option value="全部">全部</option>
              {dimensionTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </label>
          <div className="filter-tags">
            <span>当前条件：</span>
            <div>
              <span className="filter-tag">{department}</span>
              <span className="filter-tag">{dimensionTag}</span>
            </div>
            <button
              className="ghost-button slim"
              onClick={() => {
                setSearch('');
                setDepartment('全部');
                setDimensionTag('全部');
              }}
            >
              重置
            </button>
          </div>
        </div>
        <div className="talent-list">
          <h4>人员列表</h4>
          <div className="talent-list-scroll">
            {filteredPeople.map((person) => (
              <button
                key={person.id}
                className={`talent-list-item ${selectedPerson && selectedPerson.id === person.id ? 'active' : ''}`}
                onClick={() => setSelectedPersonId(person.id)}
              >
                <p className="name">{person.name}</p>
                <p className="meta">
                  {person.title} · {person.department}
                </p>
                <span>{person.dimensions?.length || 0} 维</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="talent-detail-container">
        <div className="talent-primary">
          {selectedPerson ? (
            <>
              <div className="talent-header">
                <div>
                  <p className="name">
                    {selectedPerson.name}{' '}
                    <small>
                      {selectedPerson.title} · {selectedPerson.department}
                    </small>
                  </p>
                  <p className="focus">{selectedPerson.focus || '暂未填写聚焦方向'}</p>
                </div>
                {hasPerm && hasPerm('people.edit.all') && (
                  <button className="primary-button subtle" onClick={() => navigate('/profile')}>
                    进入管理后台
                  </button>
                )}
              </div>
              <p className="bio">{selectedPerson.bio || '欢迎补充个人亮点。'}</p>
              <div className="info-grid">
                <div>
                  <span>出生日期</span>
                  <strong>
                    {shouldMaskSensitive
                      ? maskBirthDateLocal(selectedPerson.birth_date)
                      : selectedPerson.birth_date || '—'}
                  </strong>
                </div>
                <div>
                  <span>年龄</span>
                  <strong>{shouldMaskSensitive ? '—' : getAge(selectedPerson.birth_date)}</strong>
                </div>
                <div>
                  <span>性别</span>
                  <strong>{selectedPerson.gender || '—'}</strong>
                </div>
                <div>
                  <span>手机号</span>
                  <strong>
                    {shouldMaskSensitive
                      ? maskPhoneLocal(selectedPerson.phone)
                      : selectedPerson.phone || '—'}
                  </strong>
                </div>
              </div>
            </>
          ) : (
            <p className="muted">选择左侧人员以查看详情。</p>
          )}
        </div>

        <div className="talent-tabs-panel">
          {selectedPerson && (
            <div className="talent-summary">
              <div>
                <p>维度数量</p>
                <strong>{selectedPerson.dimensions?.length || 0}</strong>
              </div>
              <div>
                <p>参会次数</p>
                <strong>{relatedMeetings.length}</strong>
              </div>
            </div>
          )}
          <div className="tab-header">
            {[
              { id: 'overview', label: '画像概览' },
              { id: 'dimensions', label: '维度列表' },
              { id: 'meetings', label: '参会会议' }
            ].map((tab) => (
              <button
                key={tab.id}
                className={`tab-link ${detailTab === tab.id ? 'active' : ''}`}
                onClick={() => setDetailTab(tab.id)}
                disabled={!selectedPerson}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="tab-body">
            {!selectedPerson && <p className="muted">暂无人员，请先选择。</p>}
            {selectedPerson && detailTab === 'overview' && (
              <div className="tab-panel">
                <h5>聚焦方向</h5>
                <p>{selectedPerson.focus || '暂无数据'}</p>
                <h5>简介亮点</h5>
                <p>{selectedPerson.bio || '欢迎补充个人亮点。'}</p>
              </div>
            )}
            {selectedPerson && detailTab === 'dimensions' && (
              <div className="tab-panel dimension-pills">
                {(selectedPerson.dimensions || []).map((dimension, index) => (
                  <div
                    key={dimension.id || `${dimension.category}-${index}`}
                    className="dimension-pill"
                    style={{ borderColor: DIMENSION_COLORS[index % DIMENSION_COLORS.length] }}
                  >
                    <div>
                      <p className="label">{dimension.category}</p>
                      <p className="detail">
                        {shouldMaskSensitive && dimension.category === '婚恋情况'
                          ? '已脱敏'
                          : dimension.detail}
                      </p>
                    </div>
                  </div>
                ))}
                {(!selectedPerson.dimensions || selectedPerson.dimensions.length === 0) && (
                  <p className="muted">尚未配置维度，可在下方维护区补充。</p>
                )}
              </div>
            )}
            {selectedPerson && detailTab === 'meetings' && (
              <div className="tab-panel">
                {relatedMeetings.length === 0 && <p className="muted">暂无参会记录。</p>}
                {relatedMeetings.map((meeting) => (
                  <div key={meeting.id} className="meeting-chip">
                    <p className="name">{meeting.topic}</p>
                    <p className="meta">
                      {meeting.meetingDate} · {meeting.location}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
      </div>
    </section>
  );
}

export default TalentPage;
