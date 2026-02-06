import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SECTION_ITEMS = [
  { id: 'profile', label: '基础资料' },
  { id: 'dimensions', label: '月度六维' },
  { id: 'growth', label: '成长轨迹' },
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
  growthEvents,
  setGrowthEvents,
  canEditGrowth,
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
    category: '',
    issuedDate: '',
    description: '',
    file: null
  });
  const [fileInputKey, setFileInputKey] = useState(0);
  const [growthForm, setGrowthForm] = useState({
    eventDate: '',
    title: '',
    description: '',
    category: ''
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
      payload.append('category', form.category.trim());
      payload.append('issuedDate', form.issuedDate);
      payload.append('description', form.description.trim());
      if (form.file) {
        payload.append('file', form.file);
      }
      const { data } = await axios.post(`${apiBase}/certificates`, payload, {
        headers: { ...authHeaders.headers, 'Content-Type': 'multipart/form-data' }
      });
      setCertificates((prev) => [data, ...prev]);
      setForm({ name: '', category: '', issuedDate: '', description: '', file: null });
      setFileInputKey((prev) => prev + 1);
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

  const handleGrowthSubmit = async (event) => {
    event.preventDefault();
    if (!selectedPerson) {
      setToast('请先选择人员');
      return;
    }
    if (!growthForm.eventDate || !growthForm.title.trim()) {
      setToast('请填写事件时间与标题');
      return;
    }
    try {
      const payload = {
        personId: selectedPerson.id,
        eventDate: growthForm.eventDate,
        title: growthForm.title.trim(),
        description: growthForm.description.trim(),
        category: growthForm.category.trim()
      };
      const { data } = await axios.post(`${apiBase}/growth`, payload, authHeaders);
      setGrowthEvents((prev) => [data, ...prev]);
      setGrowthForm((prev) => ({ ...prev, title: '', description: '' }));
      setToast('成长事件已添加');
    } catch (error) {
      setToast(error.response?.data?.message || '添加失败');
    }
  };

  const handleGrowthDelete = async (id) => {
    if (!window.confirm('确认删除该成长事件？')) return;
    try {
      await axios.delete(`${apiBase}/growth/${id}`, authHeaders);
      setGrowthEvents((prev) => prev.filter((item) => item.id !== id));
      setToast('成长事件已删除');
    } catch (error) {
      setToast(error.response?.data?.message || '删除失败');
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

          {activeSection === 'growth' && (
            <>
              <div className="panel">
                <div className="panel-head">
                  <h3>成长轨迹</h3>
                  <p className="panel-subtitle">记录培训、项目、获奖等关键节点</p>
                </div>
                <div className="growth-timeline">
                  {growthEvents.length === 0 && <p className="muted">暂无成长轨迹记录。</p>}
                  {growthEvents.map((item) => (
                    <div key={item.id} className="timeline-card">
                      <div className="timeline-date">{item.event_date}</div>
                      <div className="timeline-main">
                        <div className="timeline-head">
                          <div className="timeline-title">
                            <strong>{item.title}</strong>
                            {item.category && <span className="tag-pill">{item.category}</span>}
                          </div>
                          {canEditGrowth && (
                            <button className="danger-button slim" onClick={() => handleGrowthDelete(item.id)}>
                              删除
                            </button>
                          )}
                        </div>
                        <p>{item.description || '暂无描述'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {canEditGrowth && (
                <div className="panel">
                  <div className="panel-head">
                    <h3>新增成长事件</h3>
                    <p className="panel-subtitle">补充个人成长里程碑</p>
                  </div>
                  <form className="admin-form" onSubmit={handleGrowthSubmit}>
                    <div className="form-row">
                      <input
                        type="date"
                        value={growthForm.eventDate}
                        onChange={(event) => setGrowthForm((prev) => ({ ...prev, eventDate: event.target.value }))}
                      />
                      <input
                        placeholder="事件类型（可选）"
                        value={growthForm.category}
                        onChange={(event) => setGrowthForm((prev) => ({ ...prev, category: event.target.value }))}
                      />
                    </div>
                    <input
                      placeholder="事件标题"
                      value={growthForm.title}
                      onChange={(event) => setGrowthForm((prev) => ({ ...prev, title: event.target.value }))}
                    />
                    <textarea
                      placeholder="事件描述"
                      value={growthForm.description}
                      onChange={(event) => setGrowthForm((prev) => ({ ...prev, description: event.target.value }))}
                    />
                    <button className="primary-button" type="submit" disabled={!selectedPerson}>
                      保存成长事件
                    </button>
                  </form>
                </div>
              )}
            </>
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
                        <div className="certificate-head">
                          <strong>{item.name}</strong>
                          {item.category && <span className="tag-pill">{item.category}</span>}
                        </div>
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
                        placeholder="证书分类（可选）"
                        value={form.category}
                        onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                      />
                      <input
                        type="date"
                        value={form.issuedDate}
                        onChange={(event) => setForm((prev) => ({ ...prev, issuedDate: event.target.value }))}
                      />
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        key={fileInputKey}
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
