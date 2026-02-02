import React, { useEffect } from 'react';

function PersonalCenterPage({
  user,
  selectedPerson,
  setSelectedPersonId,
  draftProfile,
  setDraftProfile,
  dimensionMonth,
  setDimensionMonth,
  dimensionDrafts,
  updateDimensionDraft,
  saveProfile,
  saveDimensions,
  canEditSelected
}) {
  useEffect(() => {
    if (user?.personId) {
      setSelectedPersonId(user.personId);
    }
  }, [user?.personId, setSelectedPersonId]);

  if (!user) {
    return (
      <section className="profile-page">
        <div className="panel">
          <p className="muted">{'\u8bf7\u5148\u767b\u5f55\u518d\u8bbf\u95ee\u4e2a\u4eba\u4e2d\u5fc3\u3002'}</p>
        </div>
      </section>
    );
  }

  if (!user.personId) {
    return (
      <section className="profile-page">
        <div className="panel">
          <p className="muted">{'\u5f53\u524d\u8d26\u53f7\u672a\u7ed1\u5b9a\u4eba\u624d\u6863\u6848\uff0c\u8bf7\u8054\u7cfb\u7ba1\u7406\u5458\u3002'}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="profile-page">
      <div className="panel profile-banner">
        <div className="panel-head">
          <div>
            <p className="panel-subtitle">{'\u4e2a\u4eba\u4e2d\u5fc3'}</p>
            <h2>{'\u4e2a\u4eba\u6863\u6848\u7ef4\u62a4'}</h2>
          </div>
          {!canEditSelected && <span className="tag-pill">{'\u5f53\u524d\u8d26\u53f7\u4ec5\u53ef\u67e5\u770b'}</span>}
        </div>
        {selectedPerson && (
          <div className="profile-name">
            <strong>{selectedPerson.name}</strong>
            <span>{selectedPerson.title || '\u672a\u586b\u5199\u804c\u52a1'}</span>
          </div>
        )}
      </div>

      <div className="profile-grid">
        <div className="panel profile-form">
          <div className="panel-head">
            <h3>{'\u57fa\u7840\u8d44\u6599'}</h3>
            <p className="panel-subtitle">{'\u4ec5\u53ef\u7f16\u8f91\u672c\u4eba\u4fe1\u606f'}</p>
          </div>
          <label>
            {'\u51fa\u751f\u65e5\u671f'}
            <input
              type="date"
              value={draftProfile.birth_date}
              onChange={(event) => setDraftProfile((prev) => ({ ...prev, birth_date: event.target.value }))}
              disabled={!canEditSelected}
            />
          </label>
          <label>
            {'\u6027\u522b'}
            <input
              value={draftProfile.gender}
              onChange={(event) => setDraftProfile((prev) => ({ ...prev, gender: event.target.value }))}
              disabled={!canEditSelected}
            />
          </label>
          <label>
            {'\u624b\u673a\u53f7'}
            <input
              value={draftProfile.phone}
              onChange={(event) => setDraftProfile((prev) => ({ ...prev, phone: event.target.value }))}
              disabled={!canEditSelected}
            />
          </label>
          <label>
            {'\u805a\u7126\u65b9\u5411'}
            <textarea
              value={draftProfile.focus}
              onChange={(event) => setDraftProfile((prev) => ({ ...prev, focus: event.target.value }))}
              disabled={!canEditSelected}
            />
          </label>
          <label>
            {'\u4e2a\u4eba\u7b80\u4ecb'}
            <textarea
              value={draftProfile.bio}
              onChange={(event) => setDraftProfile((prev) => ({ ...prev, bio: event.target.value }))}
              disabled={!canEditSelected}
            />
          </label>
          <div className="profile-row">
            <label>
              {'\u804c\u52a1\u62ac\u5934'}
              <input
                value={draftProfile.title}
                onChange={(event) => setDraftProfile((prev) => ({ ...prev, title: event.target.value }))}
                disabled={!canEditSelected}
              />
            </label>
            <label>
              {'\u6240\u5c5e\u90e8\u95e8'}
              <input
                value={draftProfile.department}
                onChange={(event) => setDraftProfile((prev) => ({ ...prev, department: event.target.value }))}
                disabled={!canEditSelected}
              />
            </label>
          </div>
          <button className="primary-button" onClick={saveProfile} disabled={!canEditSelected}>
            {'\u4fdd\u5b58\u57fa\u7840\u8d44\u6599'}
          </button>
        </div>

        <div className="panel profile-dimensions">
          <div className="panel-head">
            <div>
              <h3>{'\u6708\u5ea6\u516d\u7ef4'}</h3>
              <p className="panel-subtitle">{'\u6309\u6708\u63d0\u4ea4\uff0c\u672a\u586b\u5199\u9ed8\u8ba4\u201c\u65e0\u201d'}</p>
            </div>
            <label className="inline-field">
              {'\u6708\u4efd'}
              <input
                type="month"
                value={dimensionMonth}
                onChange={(event) => setDimensionMonth(event.target.value)}
                disabled={!canEditSelected}
              />
            </label>
          </div>
          <div className="dimension-grid">
            {dimensionDrafts.map((dimension, idx) => (
              <div key={dimension.id || idx} className="dimension-card">
                <div className="dimension-header">
                  <span>{dimension.category}</span>
                </div>
                <textarea
                  value={dimension.detail}
                  onChange={(event) => updateDimensionDraft(idx, 'detail', event.target.value)}
                  disabled={!canEditSelected}
                />
              </div>
            ))}
          </div>
          <div className="dimension-actions-row">
            <button
              className="primary-button"
              onClick={() => saveDimensions(dimensionMonth)}
              disabled={!canEditSelected}
            >
              {'\u4fdd\u5b58\u672c\u6708\u753b\u50cf'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PersonalCenterPage;
