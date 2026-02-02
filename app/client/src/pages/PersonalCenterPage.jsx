import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SECTION_ITEMS = [
  { id: 'profile', label: '基础资料' },
  { id: 'dimensions', label: '月度六维' },
  { id: 'evaluations', label: '评价记录' },
  { id: 'certificates', label: '证书管理' }
];

const EVALUATION_LABELS = {
  quarterly: '季度评价',
  annual: '年度综合评估',
  marriage: '婚恋补充评价'
};

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
  canEditSelected,
  evaluations,
  certificates,
  setCertificates,
  canManageCertificates,
  apiBase,
  authHeaders,
  setToast
}) {
  const [activeSection, setActiveSection] = useState('profile');
  const [form, setForm] = useState({
    name: '',
    issuedDate: '',
    description: '',
    file: null
  });

  useEffect(() => {
    if (user?.personId) {
      setSelectedPersonId(user.personId);
    }
  }, [user?.personId, setSelectedPersonId]);

  if (!user) {
    return (
      <section className="profile-page">
        <div className="panel">
          <p className="muted">请先登录再访问个人中心。</p>
        </div>
      </section>
    );
  }

  if (!user.personId) {
    return (
      <section className="profile-page">
        <div className="panel">
          <p className="muted">当前账号未绑定人才档案，请联系管理员。</p>
        </div>
      </section>
    );
  }

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!selectedPerson) {
      setToast('请先选择人员');
      return;
    }
    if (!form.name.trim()) {
      setToast('请填写证书名称');
      return;
    }
    try {
      const payload = new FormData();
      payload.append('personId', selectedPerson.id);
      payload.append('name', form.name.trim());
      payload.append('issuedDate', form.issuedDate);
      payload.append('description', form.description.trim());
      if (form.file) {
        payload.append('file', form.file);
      }
      const { data } = await axios.post(`${apiBase}/certificates`, payload, {
        headers: { ...authHeaders.headers, 'Content-Type': 'multipart/form-data' }
      });
      setCertificates((prev) => [data, ...prev]);
      setForm({ name: '', issuedDate: '', description: '', file: null });
      setToast('证书已上传');
    } catch (error) {
      setToast(error.response?.data?.message || '上传失败');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确认删除该证书？')) return;
    try {
      await axios.delete(`${apiBase}/certificates/${id}`, authHeaders);
      setCertificates((prev) => prev.filter((item) => item.id !== id));
      setToast('证书已删除');
    } catch (error) {
      setToast(error.response?.data?.message || '删除失败');
    }
  };

  const handleDownload = async (item) => {
    try {
      const response = await axios.get(`${apiBase}/certificates/${item.id}/file`, {
        ...authHeaders,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${item.name || 'certificate'}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setToast(error.response?.data?.message || '下载失败');
    }
  };

  return (
    <section className="profile-page">
      <div className="panel profile-banner">
        <div className="panel-head">
          <div>
            <p className="panel-subtitle">个人中心</p>
            <h2>个人档案维护</h2>
          </div>
        </div>
        {selectedPerson && (
          <div className="profile-name">
            <strong>{selectedPerson.name}</strong>
            <span>{selectedPerson.title || '未填写职务'}</span>
          </div>
        )}
      </div>

      <div className="profile-layout">
        <aside className="panel profile-sidebar">
          <div className="panel-head">
            <h3>功能导航</h3>
            <p className="panel-subtitle">逐项维护入口</p>
          </div>
          <div className="profile-nav">
            {SECTION_ITEMS.map((item) => (
              <button
                key={item.id}
                className={activeSection === item.id ? 'active' : ''}
                onClick={() => setActiveSection(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        <div className="profile-content">
          {activeSection === 'profile' && (
            <div className="panel profile-form">
              <div className="panel-head">
                <h3>基础资料</h3>
                <p className="panel-subtitle">仅可编辑本人信息</p>
              </div>
              <label>
                出生日期
                <input
                  type="date"
                  value={draftProfile.birth_date}
                  onChange={(event) => setDraftProfile((prev) => ({ ...prev, birth_date: event.target.value }))}
                  disabled={!canEditSelected}
                />
              </label>
              <label>
                性别
                <input
                  value={draftProfile.gender}
                  onChange={(event) => setDraftProfile((prev) => ({ ...prev, gender: event.target.value }))}
                  disabled={!canEditSelected}
                />
              </label>
              <label>
                手机号
                <input
                  value={draftProfile.phone}
                  onChange={(event) => setDraftProfile((prev) => ({ ...prev, phone: event.target.value }))}
                  disabled={!canEditSelected}
                />
              </label>
              <label>
                聚焦方向
                <textarea
                  value={draftProfile.focus}
                  onChange={(event) => setDraftProfile((prev) => ({ ...prev, focus: event.target.value }))}
                  disabled={!canEditSelected}
                />
              </label>
              <label>
                个人简介
                <textarea
                  value={draftProfile.bio}
                  onChange={(event) => setDraftProfile((prev) => ({ ...prev, bio: event.target.value }))}
                  disabled={!canEditSelected}
                />
              </label>
              <div className="profile-row">
                <label>
                  职务抬头
                  <input
                    value={draftProfile.title}
                    onChange={(event) => setDraftProfile((prev) => ({ ...prev, title: event.target.value }))}
                    disabled={!canEditSelected}
                  />
                </label>
                <label>
                  所属部门
                  <input
                    value={draftProfile.department}
                    onChange={(event) => setDraftProfile((prev) => ({ ...prev, department: event.target.value }))}
                    disabled={!canEditSelected}
                  />
                </label>
              </div>
              <button className="primary-button" onClick={saveProfile} disabled={!canEditSelected}>
                保存基础资料
              </button>
            </div>
          )}

          {activeSection === 'dimensions' && (
            <div className="panel profile-dimensions">
              <div className="panel-head">
                <div>
                  <h3>月度六维</h3>
                  <p className="panel-subtitle">按月提交，未填写默认“无”</p>
                </div>
                <label className="inline-field">
                  月份
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
                  保存本月画像
                </button>
              </div>
            </div>
          )}

          {activeSection === 'evaluations' && (
            <div className="panel">
              <div className="panel-head">
                <h3>评价记录</h3>
                <p className="panel-subtitle">来自领导与 HR 的评价，仅可查看</p>
              </div>
              <div className="evaluation-list">
                {!evaluations?.length && <p className="muted">暂无评价记录。</p>}
                {evaluations?.map((item) => (
                  <div key={item.id} className="evaluation-card">
                    <div>
                      <strong>{EVALUATION_LABELS[item.type] || '评价'}</strong>
                      <span>{item.period || '未填写周期'}</span>
                    </div>
                    <p>{item.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'certificates' && (
            <>
              <div className="panel">
                <div className="panel-head">
                  <h3>证书档案</h3>
                  <p className="panel-subtitle">{selectedPerson ? selectedPerson.name : '请选择人员'}</p>
                </div>
                <div className="certificate-list">
                  {certificates.length === 0 && <p className="muted">暂无证书记录。</p>}
                  {certificates.map((item) => (
                    <div key={item.id} className="certificate-card">
                      <div>
                        <strong>{item.name}</strong>
                        <span>{item.issued_date || '未填写时间'}</span>
                        <p>{item.description || '暂无描述'}</p>
                      </div>
                      <div className="certificate-actions">
                        {item.file_path && (
                          <button className="ghost-button slim" onClick={() => handleDownload(item)}>
                            下载附件
                          </button>
                        )}
                        {canManageCertificates && (
                          <button className="ghost-button slim" onClick={() => handleDelete(item.id)}>
                            删除
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {canManageCertificates && (
                <div className="panel">
                  <div className="panel-head">
                    <h3>上传证书</h3>
                    <p className="panel-subtitle">支持 PDF/JPG/PNG</p>
                  </div>
                  <form className="admin-form" onSubmit={handleUpload}>
                    <input
                      placeholder="证书名称"
                      value={form.name}
                      onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    />
                    <div className="form-row">
                      <input
                        type="date"
                        value={form.issuedDate}
                        onChange={(event) => setForm((prev) => ({ ...prev, issuedDate: event.target.value }))}
                      />
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(event) => setForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))}
                      />
                    </div>
                    <textarea
                      placeholder="证书描述"
                      value={form.description}
                      onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                    />
                    <button className="primary-button" type="submit" disabled={!selectedPerson}>
                      上传证书
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default PersonalCenterPage;
