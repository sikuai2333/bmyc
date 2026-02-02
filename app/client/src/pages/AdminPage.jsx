
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DEFAULT_ICON, MEETING_CATEGORY_TAGS } from '../constants';
import { generateNumericPassword } from '../utils';

const ADMIN_SECTIONS = [
  { id: 'people', label: '档案清单' },
  { id: 'accounts', label: '账号管理' },
  { id: 'permissions', label: '权限配置' },
  { id: 'meetings', label: '会议活动' },
  { id: 'ops', label: '系统概览' }
];

const ROLE_LABELS = {
  admin: '管理员',
  user: '用户',
  display: '展示专用'
};

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
  const [activePanel, setActivePanel] = useState('people');
  const [personAccountForm, setPersonAccountForm] = useState({
    name: '',
    title: '',
    department: '',
    focus: '',
    bio: '',
    email: '',
    birth_date: '',
    gender: '',
    phone: '',
    password: ''
  });
  const [lastCredential, setLastCredential] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetCredential, setResetCredential] = useState(null);
  const [peopleSearch, setPeopleSearch] = useState('');
  const [accountSearch, setAccountSearch] = useState('');
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
  const [accountFilter, setAccountFilter] = useState('all');

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

  const filteredPeople = useMemo(() => {
    if (!peopleSearch.trim()) return people;
    return people.filter((person) =>
      person.name.includes(peopleSearch) ||
      (person.department && person.department.includes(peopleSearch)) ||
      (person.title && person.title.includes(peopleSearch))
    );
  }, [people, peopleSearch]);

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

  const visibleUsers = useMemo(() => {
    if (accountFilter === 'linked') {
      return users.filter((account) => account.personId);
    }
    if (accountFilter === 'system') {
      return users.filter((account) => !account.personId);
    }
    return users;
  }, [accountFilter, users]);

  const filteredUsers = useMemo(() => {
    if (!accountSearch.trim()) return visibleUsers;
    return visibleUsers.filter((account) =>
      account.name.includes(accountSearch) || account.email.includes(accountSearch)
    );
  }, [visibleUsers, accountSearch]);

  const resetPersonAccountForm = () => {
    setPersonAccountForm({
      name: '',
      title: '',
      department: '',
      focus: '',
      bio: '',
      email: '',
      birth_date: '',
      gender: '',
      phone: '',
      password: ''
    });
  };

  const openCreateModal = () => {
    setCreateModalOpen(true);
    setLastCredential(null);
    resetPersonAccountForm();
  };

  const openEditModal = (personId) => {
    setSelectedPersonId(personId);
    setEditModalOpen(true);
  };

  const openResetModal = (account) => {
    setResetTarget(account);
    setResetPassword('');
    setResetCredential(null);
    setResetModalOpen(true);
  };

  const openPermissionPanel = (accountId) => {
    setPermissionTargetId(accountId);
    setActivePanel('permissions');
  };

  const handleCreateTalentAccount = async (event) => {
    event.preventDefault();
    if (!personAccountForm.name.trim() || !personAccountForm.email.trim()) {
      setToast('请输入姓名与账号');
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
      const password = personAccountForm.password.trim() || generateNumericPassword();
      const userPayload = {
        name: personAccountForm.name.trim(),
        email: personAccountForm.email.trim(),
        password,
        role: 'user',
        personId: createdPerson.id,
        sensitiveUnmasked: false
      };
      const { data: createdUser } = await axios.post(`${apiBase}/users`, userPayload, authHeaders);
      setPeople((prev) => [createdPerson, ...prev]);
      setUsers((prev) => [...prev, createdUser]);
      setSelectedPersonId(createdPerson.id);
      setLastCredential({ email: createdUser.email, password, name: createdUser.name });
      triggerDataRefresh();
      setToast(`已创建 ${createdPerson.name} 的账号`);
    } catch (error) {
      setToast(error.response?.data?.message || '新增人才与账号失败');
    }
  };
  const handleDeletePerson = async (id) => {
    if (!window.confirm('确认删除该人才及其档案吗？')) return;
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
      const { data } = await axios.put(`${apiBase}/users/${id}`, { role }, authHeaders);
      setUsers((prev) => prev.map((userItem) => (userItem.id === id ? data : userItem)));
      setToast('账号角色已更新');
    } catch (error) {
      setToast(error.response?.data?.message || '更新失败');
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (!resetTarget) return;
    const nextPassword = resetPassword.trim() || generateNumericPassword();
    try {
      const { data } = await axios.put(
        `${apiBase}/users/${resetTarget.id}`,
        { password: nextPassword },
        authHeaders
      );
      setUsers((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      setResetCredential({
        name: resetTarget.name,
        email: resetTarget.email,
        password: nextPassword
      });
      setResetPassword(nextPassword);
      setToast('密码已重置');
    } catch (error) {
      setToast(error.response?.data?.message || '重置失败');
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

  const selectAllAttendees = () => {
    setMeetingForm((prev) => ({ ...prev, attendeeIds: people.map((person) => person.id) }));
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
    { label: '系统账号', value: users.length, detail: '含展示/管理员账号' },
    { label: '会议记录', value: meetings.length, detail: '政治思想/业务培训等' }
  ];

  return (
    <section className="admin-page">
      <aside className="admin-sidebar">
        <p className="eyebrow">全局管理</p>
        <h2>金岩高新 · 管理后台</h2>
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
              {section.id === 'people' && <small>{people.length}</small>}
              {section.id === 'accounts' && <small>{users.length}</small>}
              {section.id === 'meetings' && <small>{meetings.length}</small>}
              {section.id === 'ops' && <small>{logItems.length}</small>}
            </button>
          ))}
        </nav>
        <p className="sidebar-hint">模块化管理档案、账号、权限与会议。</p>
      </aside>

      <div className="admin-main">
        {activePanel === 'people' && (
          <div className="panel admin-section">
            <div className="panel-head inline">
              <div>
                <p className="panel-subtitle">档案清单</p>
                <h3>人才档案列表</h3>
              </div>
              <div className="admin-toolbar">
                <input
                  className="admin-search"
                  placeholder="姓名 / 部门 / 职务"
                  value={peopleSearch}
                  onChange={(event) => setPeopleSearch(event.target.value)}
                />
              </div>
            </div>
            <div className="admin-list scrollable">
              {filteredPeople.map((person) => (
                <div key={person.id} className="admin-list-item">
                  <div>
                    <strong>{person.name}</strong>
                    <p>
                      {person.title || '未填写职务'} · {person.department || '未设置部门'}
                    </p>
                  </div>
                  <div className="admin-actions">
                    <button className="ghost-button slim" onClick={() => openEditModal(person.id)}>
                      编辑档案
                    </button>
                    {canManageUsers && (
                      <button className="ghost-button slim" onClick={() => handleDeletePerson(person.id)}>
                        删除
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {filteredPeople.length === 0 && <p className="muted">暂无档案记录。</p>}
            </div>
          </div>
        )}
        {activePanel === 'accounts' && (
          <div className="panel admin-section">
            <div className="panel-head">
              <p className="panel-subtitle">账号管理</p>
              <h3>账号列表</h3>
            </div>
            <div className="admin-toolbar">
              <input
                className="admin-search"
                placeholder="姓名 / 账号"
                value={accountSearch}
                onChange={(event) => setAccountSearch(event.target.value)}
              />
              <select
                className="admin-select"
                value={accountFilter}
                onChange={(event) => setAccountFilter(event.target.value)}
              >
                <option value="all">全部账号</option>
                <option value="linked">档案账号</option>
                <option value="system">系统账号</option>
              </select>
              {canManageUsers && (
                <button className="primary-button subtle" onClick={openCreateModal}>
                  新增人才账号
                </button>
              )}
              {hasPerm('export.excel') && (
                <>
                  <button className="ghost-button slim" onClick={() => handleExport(false)} disabled={exporting}>
                    导出全部
                  </button>
                  <button
                    className="ghost-button slim"
                    onClick={() => handleExport(true)}
                    disabled={!selectedPerson || exporting}
                  >
                    导出选中
                  </button>
                </>
              )}
              {hasPerm('import.excel') && (
                <>
                  <label className="ghost-button slim file-trigger">
                    选择文件
                    <input
                      className="file-input"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(event) => setImportFile(event.target.files?.[0] || null)}
                    />
                  </label>
                  <button
                    className="primary-button subtle"
                    onClick={handleImportExcel}
                    disabled={importing}
                  >
                    开始导入
                  </button>
                </>
              )}
            </div>
            {importFile && <p className="muted file-name">已选择文件：{importFile.name}</p>}
            <div className="admin-table">
              <div className="admin-table-head">
                <span>姓名</span>
                <span>账号</span>
                <span>角色</span>
                <span>绑定</span>
                <span>操作</span>
              </div>
              {filteredUsers.map((account) => (
                <div key={account.id} className="admin-table-row">
                  <span>
                    <strong>{account.name}</strong>
                  </span>
                  <span>{account.email}</span>
                  <span>
                    {canManageUsers && !account.isSuperAdmin ? (
                      <select
                        value={account.role}
                        onChange={(event) => handleUserRoleChange(account.id, event.target.value)}
                      >
                        <option value="user">用户</option>
                        <option value="admin">管理员</option>
                        <option value="display">展示专用</option>
                      </select>
                    ) : (
                      account.isSuperAdmin
                        ? '超级管理员'
                        : ROLE_LABELS[account.role] || account.role
                    )}
                  </span>
                  <span>{account.personId ? '绑定档案' : '系统账号'}</span>
                  <span className="admin-row-actions">
                    {canManagePermissions && (
                      <button className="ghost-button slim" onClick={() => openPermissionPanel(account.id)}>
                        修改权限
                      </button>
                    )}
                    {canManageUsers && (
                      <button className="ghost-button slim" onClick={() => openResetModal(account)}>
                        重置密码
                      </button>
                    )}
                    {canManageUsers && !account.isSuperAdmin && (
                      <button className="ghost-button slim" onClick={() => handleDeleteUser(account.id)}>
                        删除
                      </button>
                    )}
                  </span>
                </div>
              ))}
              {filteredUsers.length === 0 && <p className="muted">暂无账号记录。</p>}
            </div>
          </div>
        )}

        {activePanel === 'permissions' && (
          <>
            {canManagePermissions ? (
              <div className="panel admin-section">
                <div className="panel-head">
                  <p className="panel-subtitle">权限配置</p>
                  <h3>账号权限中心</h3>
                </div>
                <div className="permission-grid">
                  <div className="permission-users">
                    <h4>选择账号</h4>
                    <div className="admin-list scrollable">
                      {users.map((account) => (
                        <button
                          key={account.id}
                          className={`admin-list-item ${permissionTargetId === account.id ? 'active' : ''}`}
                          onClick={() => setPermissionTargetId(account.id)}
                        >
                          <div>
                            <strong>{account.name}</strong>
                            <p>
                              {account.email} ·{' '}
                              {account.isSuperAdmin
                                ? '超级管理员'
                                : ROLE_LABELS[account.role] || account.role}
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
                    <div className="attendee-actions">
                      <button type="button" className="ghost-button slim" onClick={selectAllAttendees}>
                        全选
                      </button>
                      <button type="button" className="ghost-button slim" onClick={clearAttendees}>
                        清空
                      </button>
                    </div>
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

      {createModalOpen && (
        <div className="modal-backdrop" onClick={() => setCreateModalOpen(false)}>
          <div className="modal-card wide" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>新增人才账号</h3>
                <p className="panel-subtitle">创建档案并生成登录账号</p>
              </div>
              <button className="modal-close" onClick={() => setCreateModalOpen(false)}>
                关闭
              </button>
            </div>
            <form className="admin-form" onSubmit={handleCreateTalentAccount}>
              <div className="form-row">
                <input
                  placeholder="姓名*"
                  value={personAccountForm.name}
                  onChange={(event) => setPersonAccountForm((prev) => ({ ...prev, name: event.target.value }))}
                />
                <input
                  placeholder="账号（姓名/手机号）*"
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
              <div className="form-row">
                <input
                  placeholder="登录密码"
                  value={personAccountForm.password}
                  onChange={(event) =>
                    setPersonAccountForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                />
                <button
                  type="button"
                  className="ghost-button slim"
                  onClick={() =>
                    setPersonAccountForm((prev) => ({
                      ...prev,
                      password: generateNumericPassword()
                    }))
                  }
                >
                  随机生成
                </button>
              </div>
              <textarea
                placeholder="聚焦方向"
                value={personAccountForm.focus}
                onChange={(event) => setPersonAccountForm((prev) => ({ ...prev, focus: event.target.value }))}
              />
              <textarea
                placeholder="个人简介"
                value={personAccountForm.bio}
                onChange={(event) => setPersonAccountForm((prev) => ({ ...prev, bio: event.target.value }))}
              />
              <div className="form-actions">
                <button className="primary-button" type="submit">
                  创建账号
                </button>
                <button type="button" className="ghost-button slim" onClick={resetPersonAccountForm}>
                  清空
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
                  密码：<strong>{lastCredential.password}</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {editModalOpen && selectedPerson && (
        <div className="modal-backdrop" onClick={() => setEditModalOpen(false)}>
          <div className="modal-card wide" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>编辑档案</h3>
                <p className="panel-subtitle">{selectedPerson.name}</p>
              </div>
              <button className="modal-close" onClick={() => setEditModalOpen(false)}>
                关闭
              </button>
            </div>
            <div className="profile-grid">
              <div className="panel profile-form">
                <div className="panel-head">
                  <h3>基础资料</h3>
                  <p className="panel-subtitle">仅管理员可编辑</p>
                </div>
                <label>
                  出生日期
                  <input
                    type="date"
                    value={draftProfile.birth_date}
                    onChange={(event) =>
                      setDraftProfile((prev) => ({ ...prev, birth_date: event.target.value }))
                    }
                    disabled={!canEditSelected}
                  />
                </label>
                <label>
                  性别
                  <select
                    value={draftProfile.gender}
                    onChange={(event) => setDraftProfile((prev) => ({ ...prev, gender: event.target.value }))}
                    disabled={!canEditSelected}
                  >
                    <option value="">未填写</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                    <option value="其他">其他</option>
                  </select>
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
                      onChange={(event) =>
                        setDraftProfile((prev) => ({ ...prev, department: event.target.value }))
                      }
                      disabled={!canEditSelected}
                    />
                  </label>
                </div>
                <button className="primary-button" onClick={saveProfile} disabled={!canEditSelected}>
                  保存基础资料
                </button>
              </div>

              <div className="panel profile-dimensions">
                <div className="panel-head">
                  <div>
                    <h3>月度六维</h3>
                    <p className="panel-subtitle">按月记录，未填写默认“无”</p>
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
          </div>
        </div>
      )}

      {resetModalOpen && resetTarget && (
        <div className="modal-backdrop" onClick={() => setResetModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>重置密码</h3>
                <p className="panel-subtitle">{resetTarget.name}</p>
              </div>
              <button className="modal-close" onClick={() => setResetModalOpen(false)}>
                关闭
              </button>
            </div>
            <form className="admin-form" onSubmit={handleResetPassword}>
              <input
                placeholder="新密码"
                value={resetPassword}
                onChange={(event) => setResetPassword(event.target.value)}
              />
              <div className="form-actions">
                <button
                  type="button"
                  className="ghost-button slim"
                  onClick={() => setResetPassword(generateNumericPassword())}
                >
                  随机生成
                </button>
                <button className="primary-button" type="submit">
                  确认重置
                </button>
              </div>
            </form>
            {resetCredential && (
              <div className="credential-card">
                <p>已重置 {resetCredential.name} 的密码：</p>
                <p>
                  账号：<strong>{resetCredential.email}</strong>
                </p>
                <p>
                  新密码：<strong>{resetCredential.password}</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminPage;
