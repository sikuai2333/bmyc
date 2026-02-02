import React, { useMemo, useState } from 'react';

import { DIMENSION_CATEGORIES } from '../constants';



function TalentPage({

  people,

  meetings,

  selectedPerson,

  dimensionMonthlyRows,

  setSelectedPersonId,

  navigate,

  user,

  sensitiveUnmasked,

  hasPerm

}) {

  const [search, setSearch] = useState('');

  const [department, setDepartment] = useState('全部');




  const departments = useMemo(

    () => Array.from(new Set(people.map((person) => person.department))).filter(Boolean),

    [people]

  );



  const filteredPeople = useMemo(

    () =>

      people.filter((person) => {

        const matchSearch =

          person.name.includes(search) ||

          (person.focus && person.focus.includes(search)) ||

          (person.department && person.department.includes(search));

        const matchDept = department === '全部' || person.department === department;

        return matchSearch && matchDept;

      }),

    [people, search, department]

  );





  const relatedMeetings = useMemo(() => {
    if (!selectedPerson) return [];
    return meetings.filter((meeting) =>
      meeting.attendees?.some((attendee) => attendee.id === selectedPerson.id)
    );
  }, [meetings, selectedPerson]);

  const monthlyRows = useMemo(() => {
    if (!selectedPerson) return [];
    if (dimensionMonthlyRows && dimensionMonthlyRows.length) {
      return dimensionMonthlyRows;
    }
    const now = new Date();

    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return [
      {
        month,
        dimensions: DIMENSION_CATEGORIES.map((category) => ({ category, detail: '\u65e0' }))
      }
    ];
  }, [dimensionMonthlyRows, selectedPerson]);

  const sensitiveCategory = DIMENSION_CATEGORIES[DIMENSION_CATEGORIES.length - 1];





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

          

          <div className="filter-tags">

            <span>当前条件：</span>

            <div>

              <span className="filter-tag">{department}</span>

              {search && <span className="filter-tag">{'\u5173\u952e\u8bcd\uff1a'}{search}</span>}

            </div>

            <button

              className="ghost-button slim"

              onClick={() => {

                setSearch('');

                setDepartment('全部');


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

                <span>{person.dimensionMonthCount || 0} {'\u6708'}</span>

              </button>

            ))}

          </div>

        </div>

      </aside>



      <div className="talent-detail-container">
        <div className="talent-dimensions-panel">
          {selectedPerson ? (
            <>
              <div className="panel-head">
                <div>
                  <p className="panel-subtitle">{'\u516d\u7ef4\u753b\u50cf(\u6708\u5ea6)'}</p>
                  <h3>{'\u6708\u5ea6\u753b\u50cf\u89c4\u5212'}</h3>
                </div>
                <span className="panel-tag">
                  {monthlyRows.length
                    ? `\u6700\u8fd1 ${monthlyRows.length} \u4e2a\u6708`
                    : '\u6682\u65e0\u8bb0\u5f55'}
                </span>
              </div>
              <div className="talent-summary">
                <div>
                  <p>{'\u6708\u5ea6\u8bb0\u5f55'}</p>
                  <strong>{selectedPerson.dimensionMonthCount || monthlyRows.length}</strong>
                </div>
                <div>
                  <p>{'\u53c2\u4f1a\u6b21\u6570'}</p>
                  <strong>{relatedMeetings.length}</strong>
                </div>
              </div>
              <div className="monthly-dimension-table">
                <div className="monthly-table-row monthly-table-header">
                  <span>{'\u6708\u4efd'}</span>
                  {DIMENSION_CATEGORIES.map((category) => (
                    <span key={category}>{category}</span>
                  ))}
                </div>
                {monthlyRows.map((row) => (
                  <div key={row.month} className="monthly-table-row">
                    <span className="month">{row.month}</span>
                    {row.dimensions.map((dimension) => (
                      <span key={`${row.month}-${dimension.category}`}>
                        {dimension.category === sensitiveCategory && shouldMaskSensitive
                          ? '\u5df2\u8131\u654f'
                          : dimension.detail || '\u65e0'}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="muted">{'\u9009\u62e9\u5de6\u4fa7\u4eba\u5458\u4ee5\u67e5\u770b\u8be6\u60c5\u3002'}</p>
          )}
        </div>

        <div className="talent-primary">
          {selectedPerson ? (
            <>
              <div className="talent-header">
                <div>
                  <p className="name">
                    {selectedPerson.name}{' '}
                    <small>
                      {selectedPerson.title} {'\u00b7'} {selectedPerson.department}
                    </small>
                  </p>
                  <p className="focus">
                    {selectedPerson.focus || '\u6682\u672a\u586b\u5199\u805a\u7126\u65b9\u5411'}
                  </p>
                </div>
              </div>
              <p className="bio">
                {selectedPerson.bio || '\u6b22\u8fce\u8865\u5145\u4e2a\u4eba\u4eae\u70b9\u3002'}
              </p>
              <div className="info-grid">
                <div>
                  <span>{'\u51fa\u751f\u65e5\u671f'}</span>
                  <strong>
                    {shouldMaskSensitive
                      ? maskBirthDateLocal(selectedPerson.birth_date)
                      : selectedPerson.birth_date || '\u2014'}
                  </strong>
                </div>
                <div>
                  <span>{'\u5e74\u9f84'}</span>
                  <strong>{shouldMaskSensitive ? '\u2014' : getAge(selectedPerson.birth_date)}</strong>
                </div>
                <div>
                  <span>{'\u6027\u522b'}</span>
                  <strong>{selectedPerson.gender || '\u2014'}</strong>
                </div>
                <div>
                  <span>{'\u624b\u673a\u53f7'}</span>
                  <strong>
                    {shouldMaskSensitive
                      ? maskPhoneLocal(selectedPerson.phone)
                      : selectedPerson.phone || '\u2014'}
                  </strong>
                </div>
              </div>
              <div className="meeting-panel">
                <h5>{'\u53c2\u4f1a\u4f1a\u8bae'}</h5>
                {relatedMeetings.length === 0 && (
                  <p className="muted">{'\u6682\u65e0\u53c2\u4f1a\u8bb0\u5f55\u3002'}</p>
                )}
                {relatedMeetings.map((meeting) => (
                  <div key={meeting.id} className="meeting-chip">
                    <p className="name">{meeting.topic}</p>
                    <p className="meta">
                      {meeting.meetingDate} {'\u00b7'} {meeting.location}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="muted">{'\u9009\u62e9\u5de6\u4fa7\u4eba\u5458\u4ee5\u67e5\u770b\u8be6\u60c5\u3002'}</p>
          )}
        </div>
      </div>

    </section>

  );

}



export default TalentPage;

