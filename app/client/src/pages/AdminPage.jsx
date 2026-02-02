import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DEFAULT_ICON, MEETING_CATEGORY_TAGS } from '../constants';
import { generateNumericPassword } from '../utils';

const ADMIN_SECTIONS = [
  { id: 'talent', label: '人才与账号' },
  { id: 'permissions', label: '权限配置' },
  { id: 'meetings', label: '会议活动' },
  { id: 'ops', label: '系统概览' }
];

function AdminPage({
  people,
  setPeople,
  users,
  setUsers,
  meetings,
  setMeetings,
  selectedPerson,
  setSelectedPersonId,
  setSelectedMeetingId,
  draftProfile,
  setDraftProfile,
  dimensionMonth,
  setDimensionMonth,
  dimensionDrafts,
  updateDimensionDraft,
  saveProfile,
  saveDimensions,
  canEditSelected,
  canManageUsers,
  canManagePermissions,
  hasPerm,
  setToast,
  authHeaders,
  apiBase,
  triggerDataRefresh
}) {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState('talent');
  const [personAccountForm, setPersonAccountForm] = useState({
    name: '',
    title: '',
    department: '',
    focus: '',
    bio: '',
    email: '',
    role: 'user',
    birth_date: '',
    gender: '',
    phone: '',
    sensitiveUnmasked: false
  });
  const [lastCredential, setLastCredential] = useState(null);
  const [meetingForm, setMeetingForm] = useState({
    topic: '',
    meetingDate: '',
    location: '',
    summary: '',
    category: MEETING_CATEGORY_TAGS[0],
    attendeeIds: []
  });
  const [meetingFilter, setMeetingFilter] = useState('全部');
  const [permissionCatalog, setPermissionCatalog] = useState([]);
  const [permissionTargetId, setPermissionTargetId] = useState(null);
  const [permissionDraft, setPermissionDraft] = useState([]);
  const [sensitiveDraft, setSensitiveDraft] = useState(false);
  const [logItems, setLogItems] = useState([]);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!selectedPerson && people.length) {
      setSelectedPersonId(people[0].id);
    }
  }, [people, selectedPerson, setSelectedPersonId]);

  useEffect(() => {
    if (!canManagePermissions || activePanel !== 'permissions') {
      return;
    }
    const fetchPermissions = async () => {
      try {
        const { data } = await axios.get(`${apiBase}/permissions`, authHeaders);
        setPermissionCatalog(data || []);
      } catch (error) {
        setToast(error.response?.data?.message || '加载权限清单失败');
      }
    };
    fetchPermissions();
  }, [canManagePermissions, activePanel, apiBase, authHeaders, setToast]);

  useEffect(() => {
    if (!permissionTargetId && users.length) {
      setPermissionTargetId(users[0].id);
    }
  }, [permissionTargetId, users]);

  useEffect(() => {
    if (!permissionTargetId) return;
    const target = users.find((item) => item.id === permissionTargetId);
    if (target) {
      setPermissionDraft(target.permissions || []);
      setSensitiveDraft(Boolean(target.sensitiveUnmasked));
    }
  }, [permissionTargetId, users]);

  useEffect(() => {
    if (activePanel !== 'ops' || !hasPerm('logs.view')) {
      return;
    }
    const fetchLogs = async () => {
      try {
        const { data } = await axios.get(`${apiBase}/logs`, authHeaders);
        setLogItems(data || []);
      } catch (error) {
        setToast(error.response?.data?.message || '加载日志失败');
      }
    };
    fetchLogs();
  }, [activePanel, apiBase, authHeaders, hasPerm, setToast]);

  const filteredMeetings = useMemo(() => {
    if (meetingFilter === '全部') {
      return meetings;
    }
    return meetings.filter((meeting) => meeting.category === meetingFilter);
  }, [meetings, meetingFilter]);

  const attendeeSummary = useMemo(
    () => people.filter((person) => meetingForm.attendeeIds.includes(person.id)),
    [people, meetingForm.attendeeIds]
  );

  const resetPersonAccountForm = () => {
    setPersonAccountForm({
      name: '',
      title: '',
      department: '',
      focus: '',
      bio: '',
      email: '',
      role: 'user',
      birth_date: '',
      gender: '',
      phone: '',
      sensitiveUnmasked: false
    });
  };

  const handleCreateTalentAccount = async (event) => {
    event.preventDefault();
    if (!personAccountForm.name.trim() || !personAccountForm.email.trim()) {
      setToast('请输入姓名与账号邮箱');
      return;
    }
    try {
      const personPayload = {
        name: personAccountForm.name.trim(),
        title: personAccountForm.title.trim(),
        department: personAccountForm.department.trim(),
        focus: personAccountForm.focus.trim(),
        bio: personAccountForm.bio.trim(),
        icon: DEFAULT_ICON,
        birth_date: personAccountForm.birth_date || '',
        gender: personAccountForm.gender || '',
        phone: personAccountForm.phone || ''
      };
      const { data: createdPerson } = await axios.post(`${apiBase}/personnel`, personPayload, authHeaders);
      const password = generateNumericPassword();
      const userPayload = {
        name: personAccountForm.name.trim(),
        email: personAccountForm.email.trim(),
        password,
        role: personAccountForm.role,
        personId: createdPerson.id,
        sensitiveUnmasked:
          personAccountForm.role === 'admin' ? personAccountForm.sensitiveUnmasked : false
      };
      const { data: createdUser } = await axios.post(`${apiBase}/users`, userPayload, authHeaders);
      setPeople((prev) => [createdPerson, ...prev]);
      setUsers((prev) => [...prev, createdUser]);
      setSelectedPersonId(createdPerson.id);
      setLastCredential({ email: createdUser.email, password, name: createdUser.name });
      resetPersonAccountForm();
      triggerDataRefresh();
      setToast(`已创建 ${createdPerson.name} 的账号`);
    } catch (error) {
      setToast(error.response?.data?.message || '新增人才与账号失败');
    }
  };

  const handleDeletePerson = async (id) => {
    if (!window.confirm('确定要删除该人才及其档案吗？')) return;
    try {
      await axios.delete(`${apiBase}/personnel/${id}`, authHeaders);
      setPeople((prev) => prev.filter((person) => person.id !== id));
      setUsers((prev) => prev.filter((account) => account.personId !== id));
      if (selectedPerson?.id === id) {
        setSelectedPersonId(null);
      }
      setToast('人才已删除');
    } catch (error) {
      setToast(error.response?.data?.message || '删除失败');
    }
  };

  const handleUserRoleChange = async (id, role) => {
    try {
      const { data } = await axios.put(
        `${apiBase}/users/${id}`,
        { role },
        authHeaders
      );
      setUsers((prev) => prev.map((userItem) => (userItem.id === id ? data : userItem)));
      setToast('权限已更新');
    } catch (error) {
      setToast(error.response?.data?.message || '更新权限失败');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('确认删除该账号？')) return;
    try {
      await axios.delete(`${apiBase}/users/${id}`, authHeaders);
      setUsers((prev) => prev.filter((userItem) => userItem.id !== id));
      setToast('账号已删除');
    } catch (error) {
      setToast(error.response?.data?.message || '删除账号失败');
    }
  };

  const togglePermission = (permissionKey) => {
    setPermissionDraft((prev) =>
      prev.includes(permissionKey)
        ? prev.filter((item) => item !== permissionKey)
        : [...prev, permissionKey]
    );
  };

  const savePermissions = async () => {
    if (!permissionTargetId) {
      setToast('请选择账号');
      return;
    }
    try {
      const payload = {
        permissions: permissionDraft,
        sensitiveUnmasked: sensitiveDraft
      };
      const { data } = await axios.put(`${apiBase}/users/${permissionTargetId}`, payload, authHeaders);
      setUsers((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      setToast('权限配置已更新');
    } catch (error) {
      setToast(error.response?.data?.message || '权限更新失败');
    }
  };

  const handleExport = async (onlySelected) => {
    try {
      setExporting(true);
      const params = onlySelected && selectedPerson ? { personId: selectedPerson.id } : {};
      const response = await axios.get(`${apiBase}/export/people`, {
        ...authHeaders,
        params,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = onlySelected && selectedPerson ? `${selectedPerson.name}-档案.xlsx` : '人才档案导出.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setToast(error.response?.data?.message || '导出失败');
    } finally {
      setExporting(false);
    }
  };

  const handleImportExcel = async () => {
    if (!importFile) {
      setToast('请先选择 Excel 文件');
      return;
    }
    try {
      setImporting(true);
      const payload = new FormData();
      payload.append('file', importFile);
      const { data } = await axios.post(`${apiBase}/import/excel`, payload, {
        headers: { ...authHeaders.headers, 'Content-Type': 'multipart/form-data' }
      });
      setToast(`导入完成：新增 ${data.created}，更新 ${data.updated}`);
      setImportFile(null);
      triggerDataRefresh();
    } catch (error) {
      const detail = error.response?.data?.errors?.[0]?.message;
      setToast(detail ? `导入失败：${detail}` : error.response?.data?.message || '导入失败');
    } finally {
      setImporting(false);
    }
  };

  const toggleAttendee = (personId) => {
    setMeetingForm((prev) => {
      const exists = prev.attendeeIds.includes(personId);
      return {
        ...prev,
        attendeeIds: exists
          ? prev.attendeeIds.filter((eid) => eid !== personId)
          : [...prev.attendeeIds, personId]
      };
    });
  };

  const clearAttendees = () => {
    setMeetingForm((prev) => ({ ...prev, attendeeIds: [] }));
  };

  const handleMeetingSubmit = async (event) => {
    event.preventDefault();
    if (!meetingForm.topic.trim() || !meetingForm.meetingDate) {
      setToast('请填写会议主题和时间');
      return;
    }
    try {
      const payload = {
        topic: meetingForm.topic.trim(),
        meetingDate: meetingForm.meetingDate,
        location: meetingForm.location.trim(),
        summary: meetingForm.summary.trim(),
        category: meetingForm.category,
        attendees: meetingForm.attendeeIds.map((personId) => ({
          personId,
          role: '参会'
        }))
      };
      const { data } = await axios.post(`${apiBase}/meetings`, payload, authHeaders);
      setMeetings((prev) => [data, ...prev]);
      setMeetingForm({
        topic: '',
        meetingDate: '',
        location: '',
        summary: '',
        category: meetingForm.category,
        attendeeIds: []
      });
      triggerDataRefresh();
      setToast('会议已创建');
    } catch (error) {
      setToast(error.response?.data?.message || '创建会议失败');
    }
  };

  const handleDeleteMeeting = async (id) => {
    if (!window.confirm('确认删除该会议？')) return;
    try {
      await axios.delete(`${apiBase}/meetings/${id}`, authHeaders);
      setMeetings((prev) => prev.filter((meeting) => meeting.id !== id));
      setToast('会议已删除');
    } catch (error) {
      setToast(error.response?.data?.message || '删除会议失败');
    }
  };

  const stats = [
    { label: '人才档案', value: people.length, detail: '可维护档案' },
    { label: '系统账号', value: users.length, detail: '含展示专用账号' },
    { label: '会议记录', value: meetings.length, detail: '政治思想/工会等' }
  ];

  return (
    <section className="admin-page">
      <aside className="admin-sidebar">
        <p className="eyebrow">全局管理</p>
        <h2>金岩高新 · 全局管理</h2>
        <nav className="admin-nav">
          {ADMIN_SECTIONS.filter(
            (section) => section.id !== 'permissions' || canManagePermissions
          ).map((section) => (
            <button
              key={section.id}
              className={activePanel === section.id ? 'active' : ''}
              onClick={() => setActivePanel(section.id)}
            >
              <span>{section.label}</span>
              {section.id === 'talent' && <small>{people.length}</small>}
              {section.id === 'meetings' && <small>{meetings.length}</small>}
              {section.id === 'ops' && <small>{users.length}</small>}
            </button>
          ))}
        </nav>
        <p className="sidebar-hint">选择模块以管理档案、会议以及系统配置。</p>
      </aside>
      <div className="admin-main">
        {activePanel === 'talent' && (
          <>
            {canManageUsers ? (
              <div className="admin-panel-grid two-columns">
                <div className="panel admin-section">
                  <div className="panel-head">
                    <p className="panel-subtitle">账号开户</p>
                    <h3>新增人才与账号</h3>
                  </div>
                  <form className="admin-form" onSubmit={handleCreateTalentAccount}>
                    <div className="form-row">
                      <input
                        placeholder="姓名*"
                        value={personAccountForm.name}
                        onChange={(event) => setPersonAccountForm((prev) => ({ ...prev, name: event.target.value }))}
                      />
                      <input
                        placeholder="登录邮箱 / 账号*"
                        value={personAccountForm.email}
                        onChange={(event) => setPersonAccountForm((prev) => ({ ...prev, email: event.target.value }))}
                      />
                    </div>
                    <div className="form-row">
                      <input
                        placeholder="职务"
                        value={personAccountForm.title}
                        onChange={(event) => setPersonAccountForm((prev) => ({ ...prev, title: event.target.value }))}
                      />
                      <input
                        placeholder="部门"
                        value={personAccountForm.department}
                        onChange={(event) => setPersonAccountForm((prev) => ({ ...prev, department: event.target.value }))}
                      />
                    </div>
                    <div className="form-row">
                      <input
                        type="date"
                        value={personAccountForm.birth_date}
                        onChange={(event) =>
                          setPersonAccountForm((prev) => ({ ...prev, birth_date: event.target.value }))
                        }
                      />
                      <select
                        value={personAccountForm.gender}
                        onChange={(event) =>
                          setPersonAccountForm((prev) => ({ ...prev, gender: event.target.value }))
                        }
                      >
                        <option value="">性别</option>
                        <option value="男">男</option>
                        <option value="女">女</option>
                        <option value="其他">其他</option>
                      </select>
                      <input
                        placeholder="手机号"
                        value={personAccountForm.phone}
                        onChange={(event) => setPersonAccountForm((prev) => ({ ...prev, phone: event.target.value }))}
                      />
                    </div>
                    <textarea
                      placeholder="聚焦方向"
                      value={personAccountForm.focus}
                      onChange={(event) => setPersonAccountForm((prev) => ({ ...prev, focus: event.target.value }))}
                    />
                    <textarea
                      placeholder="简介"
                      value={personAccountForm.bio}
                      onChange={(event) => setPersonAccountForm((prev) => ({ ...prev, bio: event.target.value }))}
                    />
                  <label>
                    权限角色
                    <select
                      value={personAccountForm.role}
                      onChange={(event) => setPersonAccountForm((prev) => ({ ...prev, role: event.target.value }))}
                    >
                      <option value="user">用户</option>
                      <option value="admin">管理员</option>
                      <option value="display">展示专用</option>
                    </select>
                  </label>
                  {personAccountForm.role === 'admin' && (
                    <label className="inline-toggle">
                      <input
                        type="checkbox"
                        checked={personAccountForm.sensitiveUnmasked}
                        onChange={(event) =>
                          setPersonAccountForm((prev) => ({
                            ...prev,
                            sensitiveUnmasked: event.target.checked
                          }))
                        }
                      />
                      <span>管理员默认不脱敏（HR 勾选）</span>
                    </label>
                  )}
                    <div className="form-actions">
                      <button className="primary-button" type="submit">
                        创建人才与账号
                      </button>
                      <button type="button" className="ghost-button slim" onClick={resetPersonAccountForm}>
                        重置
                      </button>
                    </div>
                  </form>
                  {lastCredential && (
                    <div className="credential-card">
                      <p>已为 {lastCredential.name} 创建账号：</p>
                      <p>
                        账号：<strong>{lastCredential.email}</strong>
                      </p>
                      <p>
                        初始密码：<code className="monospace">{lastCredential.password}</code>
                      </p>
                      <span>请尽快通知用户更改密码。</span>
                    </div>
                  )}
                </div>

                <div className="panel admin-section">
                  <div className="panel-head">
                    <p className="panel-subtitle">账号列表</p>
                    <h3>账户管理</h3>
                  </div>
                  <div className="admin-table">
                    <div className="admin-table-head">
                      <span>姓名</span>
                      <span>账号</span>
                      <span>角色</span>
                      <span>关联人员</span>
                      <span>操作</span>
                    </div>
                    {users.map((account) => (
                      <div key={account.id} className="admin-table-row">
                        <span>{account.name}</span>
                        <span>{account.email}</span>
                        <span>
                          <select
                            value={account.role}
                            onChange={(event) => handleUserRoleChange(account.id, event.target.value)}
                          >
                            <option value="user">用户</option>
                            <option value="admin">管理员</option>
                            <option value="display">展示专用</option>
                          </select>
                        </span>
                        <span>
                          {account.personId
                            ? people.find((person) => person.id === account.personId)?.name || '—'
                            : '—'}
                        </span>
                        <span>
                          <button className="ghost-button slim" onClick={() => handleDeleteUser(account.id)}>
                            删除
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="muted">当前账号无用户管理权限。</p>
            )}

            <div className="panel admin-section">
              <div className="panel-head">
                <p className="panel-subtitle">档案列表</p>
                <h3>人才档案总览</h3>
              </div>
              <div className="admin-list scrollable">
                {people.map((person) => (
                  <div key={person.id} className="admin-list-item">
                    <div>
                      <strong>{person.name}</strong>
                      <p>
                        {person.title} · {person.department}
                      </p>
                    </div>
                    <div className="admin-actions">
                      <button className="ghost-button slim" onClick={() => setSelectedPersonId(person.id)}>
                        编辑
                      </button>
                      <button className="ghost-button slim" onClick={() => handleDeletePerson(person.id)}>
                        删除
                      </button>
                    </div>
                  </div>
                ))}
                {people.length === 0 && <p className="muted">暂无档案，请先新增人才。</p>}
              </div>
            </div>

            {selectedPerson ? (
              <div className="profile-grid">
                <div className="panel profile-form">
                  <h3>基础资料</h3>
                  <div className="profile-row">
                    <label>
                      出生日期
                      <input
                        type="date"
                        value={draftProfile.birth_date}
                        onChange={(event) =>
                          setDraftProfile((prev) => ({ ...prev, birth_date: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      性别
                      <select
                        value={draftProfile.gender}
                        onChange={(event) =>
                          setDraftProfile((prev) => ({ ...prev, gender: event.target.value }))
                        }
                      >
                        <option value="">未填写</option>
                        <option value="男">男</option>
                        <option value="女">女</option>
                        <option value="其他">其他</option>
                      </select>
                    </label>
                  </div>
                  <label>
                    手机号
                    <input
                      value={draftProfile.phone}
                      onChange={(event) => setDraftProfile((prev) => ({ ...prev, phone: event.target.value }))}
                    />
                  </label>
                  <label>
                    聚焦方向
                    <textarea
                      value={draftProfile.focus}
                      onChange={(event) => setDraftProfile((prev) => ({ ...prev, focus: event.target.value }))}
                    />
                  </label>
                  <label>
                    关键简介
                    <textarea
                      value={draftProfile.bio}
                      onChange={(event) => setDraftProfile((prev) => ({ ...prev, bio: event.target.value }))}
                    />
                  </label>
                  <div className="profile-row">
                    <label>
                      职务抬头
                      <input
                        value={draftProfile.title}
                        onChange={(event) => setDraftProfile((prev) => ({ ...prev, title: event.target.value }))}
                      />
                    </label>
                    <label>
                      所属部门
                      <input
                        value={draftProfile.department}
                        onChange={(event) =>
                          setDraftProfile((prev) => ({ ...prev, department: event.target.value }))
                        }
                      />
                    </label>
                  </div>
                  <button className="primary-button" onClick={saveProfile} disabled={!canEditSelected}>
                    保存资料
                  </button>
                </div>

                <div className="panel profile-dimensions">
                  <div className="panel-head">
                    <div>
                      <h3>月度六维维护</h3>
                      <p className="panel-subtitle">按月记录，未填写则默认“无”。</p>
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
              </div>
            ) : (
              <p className="muted">请选择左侧人员后再进行信息维护。</p>
            )}
          </>
        )}

        {activePanel === 'permissions' && (
          <>
            {canManagePermissions ? (
              <div className="panel admin-section">
                <div className="panel-head">
                  <p className="panel-subtitle">权限配置</p>
                  <h3>权限配置中心</h3>
                </div>
                <div className="permission-grid">
                  <div className="permission-users">
                    <h4>选择账号</h4>
                    <div className="admin-list scrollable">
                      {users.map((account) => (
                        <button
                          key={account.id}
                          className={`admin-list-item ${
                            permissionTargetId === account.id ? 'active' : ''
                          }`}
                          onClick={() => setPermissionTargetId(account.id)}
                        >
                          <div>
                            <strong>{account.name}</strong>
                            <p>
                              {account.email} ·{' '}
                              {account.isSuperAdmin
                                ? '超级管理员'
                                : account.role === 'admin'
                                ? '管理员'
                                : account.role === 'display'
                                ? '展示专用'
                                : '用户'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="permission-config">
                    <div className="permission-header">
                      <div>
                        <h4>权限清单</h4>
                        <p className="panel-subtitle">勾选后保存即可生效</p>
                      </div>
                      <div className="permission-actions">
                        <label className="inline-toggle">
                          <input
                            type="checkbox"
                            checked={sensitiveDraft}
                            onChange={(event) => setSensitiveDraft(event.target.checked)}
                          />
                          <span>默认不脱敏显示</span>
                        </label>
                        <button className="primary-button subtle" onClick={savePermissions}>
                          保存权限
                        </button>
                      </div>
                    </div>
                    <div className="permission-list">
                      {permissionCatalog.map((item) => (
                        <label key={item.key} className="permission-item">
                          <input
                            type="checkbox"
                            checked={permissionDraft.includes(item.key)}
                            onChange={() => togglePermission(item.key)}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="muted">当前账号无权限管理权限。</p>
            )}
          </>
        )}

        {activePanel === 'meetings' && (
          <div className="meeting-admin">
            <div className="panel admin-section">
              <div className="panel-head">
                <p className="panel-subtitle">会议录入</p>
                <h3>创建会议与活动</h3>
              </div>
              <form className="admin-form" onSubmit={handleMeetingSubmit}>
                <input
                  placeholder="会议主题*"
                  value={meetingForm.topic}
                  onChange={(event) => setMeetingForm((prev) => ({ ...prev, topic: event.target.value }))}
                />
                <div className="form-row">
                  <input
                    type="date"
                    value={meetingForm.meetingDate}
                    onChange={(event) => setMeetingForm((prev) => ({ ...prev, meetingDate: event.target.value }))}
                  />
                  <input
                    placeholder="会议地点"
                    value={meetingForm.location}
                    onChange={(event) => setMeetingForm((prev) => ({ ...prev, location: event.target.value }))}
                  />
                </div>
                <textarea
                  placeholder="会议摘要"
                  value={meetingForm.summary}
                  onChange={(event) => setMeetingForm((prev) => ({ ...prev, summary: event.target.value }))}
                />
                <div className="meeting-tags">
                  {MEETING_CATEGORY_TAGS.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      className={`tag-pill ${meetingForm.category === tag ? 'active' : ''}`}
                      onClick={() => setMeetingForm((prev) => ({ ...prev, category: tag }))}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div>
                  <p className="panel-subtitle">选择参会人员</p>
                  <div className="attendee-toolbar">
                    <span>
                      已选 <strong>{attendeeSummary.length}</strong> / {people.length}
                    </span>
                    <button type="button" className="ghost-button slim" onClick={clearAttendees}>
                      清空
                    </button>
                  </div>
                  <div className="attendee-selector">
                    {people.map((person) => (
                      <label
                        key={person.id}
                        className={`attendee-pill ${meetingForm.attendeeIds.includes(person.id) ? 'checked' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={meetingForm.attendeeIds.includes(person.id)}
                          onChange={() => toggleAttendee(person.id)}
                        />
                        <div className="attendee-pill-body">
                          <div className="attendee-pill-row">
                            <span className="attendee-name">{person.name}</span>
                            <span className="attendee-tag">{person.department || '未分配'}</span>
                          </div>
                          <small>{person.title || '待补充职务'}</small>
                        </div>
                      </label>
                    ))}
                  </div>
                  {attendeeSummary.length === 0 && <p className="muted">尚未选择参会人员。</p>}
                </div>
                <button className="primary-button" type="submit">
                  保存会议
                </button>
              </form>
            </div>

            <div className="panel admin-section">
              <div className="panel-head">
                <p className="panel-subtitle">会议列表</p>
                <h3>活动看板</h3>
                <div className="tag-filter">
                  {['全部', ...MEETING_CATEGORY_TAGS].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`tag-pill ${meetingFilter === tag ? 'active' : ''}`}
                      onClick={() => setMeetingFilter(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div className="meeting-cards">
                {filteredMeetings.map((meeting) => (
                  <div key={meeting.id} className="meeting-card">
                    <div className="meeting-card-head">
                      <span className="meeting-category-chip">{meeting.category || '会议'}</span>
                      <span className="meeting-date">{meeting.meetingDate}</span>
                    </div>
                    <h4>{meeting.topic}</h4>
                    <p className="meta">{meeting.location || '地点待定'}</p>
                    <p className="description">{meeting.summary || '暂无摘要'}</p>
                    <div className="meeting-card-actions">
                      <button
                        className="ghost-button slim"
                        onClick={() => {
                          setSelectedMeetingId(meeting.id);
                          navigate('/meetings');
                        }}
                      >
                        查看详情
                      </button>
                      <button className="ghost-button slim" onClick={() => handleDeleteMeeting(meeting.id)}>
                        删除
                      </button>
                    </div>
                  </div>
                ))}
                {filteredMeetings.length === 0 && <p className="muted">暂无符合筛选的会议。</p>}
              </div>
            </div>
          </div>
        )}

        {activePanel === 'ops' && (
          <div className="ops-stack">
            <div className="panel admin-section">
              <div className="panel-head">
                <p className="panel-subtitle">系统概览</p>
                <h3>运行状态</h3>
              </div>
              <div className="ops-grid">
                {stats.map((item) => (
                  <article key={item.label} className="ops-card">
                    <p>{item.label}</p>
                    <strong>{item.value}</strong>
                    <span>{item.detail}</span>
                  </article>
                ))}
              </div>
              <button className="primary-button subtle" onClick={triggerDataRefresh}>
                手动刷新数据
              </button>
            </div>

            {hasPerm('export.excel') && (
              <div className="panel admin-section">
                <div className="panel-head">
                  <p className="panel-subtitle">Excel 工具</p>
                  <h3>数据导出</h3>
                </div>
                <div className="form-row">
                  <button
                    className="primary-button"
                    onClick={() => handleExport(false)}
                    disabled={exporting}
                  >
                    导出全部档案
                  </button>
                  <button
                    className="ghost-button"
                    onClick={() => handleExport(true)}
                    disabled={!selectedPerson || exporting}
                  >
                    导出当前人员
                  </button>
                </div>
                <p className="muted">导出格式为一人一表，包含六维、评价、成长、证书摘要。</p>
              </div>
            )}

            {hasPerm('import.excel') && (
              <div className="panel admin-section">
                <div className="panel-head">
                  <p className="panel-subtitle">Excel 工具</p>
                  <h3>批量导入</h3>
                </div>
                <div className="form-row">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(event) => setImportFile(event.target.files?.[0] || null)}
                  />
                  <button className="primary-button" onClick={handleImportExcel} disabled={importing}>
                    开始导入
                  </button>
                </div>
                <p className="muted">模板需包含姓名/出生日期/性别/手机号及六维列。</p>
              </div>
            )}

            {hasPerm('logs.view') && (
              <div className="panel admin-section">
                <div className="panel-head">
                  <p className="panel-subtitle">操作日志</p>
                  <h3>操作日志</h3>
                </div>
                <div className="log-list">
                  {logItems.length === 0 && <p className="muted">暂无日志记录。</p>}
                  {logItems.map((item) => (
                    <div key={item.id} className="log-item">
                      <div>
                        <strong>{item.action}</strong>
                        <span>{item.entity_type}</span>
                        {item.entity_id && <span>#{item.entity_id}</span>}
                      </div>
                      <p>
                        {item.actorName || '系统'} · {item.created_at}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default AdminPage;
