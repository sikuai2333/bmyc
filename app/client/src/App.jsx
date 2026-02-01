import { useEffect, useMemo, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate
} from 'react-router-dom';
import axios from 'axios';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
  CartesianGrid,
  LabelList
} from 'recharts';
import './App.css';

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (() => {
    if (typeof window === 'undefined') {
      return 'http://localhost:4000/api';
    }
    const { protocol, hostname, port } = window.location;
    const inferredPort = !port ? '' : port === '5173' ? '4000' : port;
    const portSuffix = inferredPort ? `:${inferredPort}` : '';
    return `${protocol}//${hostname}${portSuffix}/api`;
  })();
const ROLE_COLORS = { admin: '#f6bf4f', user: '#5dc0ff', display: '#3fe0b8' };
const DIMENSION_COLORS = ['#92a8ff', '#f78fb3', '#60d7bb', '#ffc15b', '#77a1ff', '#fd81c0'];
const NAV_ITEMS = [
  { label: '大屏总览', path: '/' },
  { label: '人才信息采集', path: '/talent' },
  { label: '评价管理', path: '/evaluations' },
  { label: '成长轨迹', path: '/growth' },
  { label: '证书管理', path: '/certificates' },
  { label: '会议联动', path: '/meetings' },
  { label: '管理后台', path: '/profile', restricted: true }
];
const STORAGE_TOKEN_KEY = 'talent_dashboard_token';
const STORAGE_USER_KEY = 'talent_dashboard_user';
const MEETING_CATEGORY_TAGS = ['政治学习', '工会活动', '项目研讨', '产业调研', '团建活动', '培训提升'];
const ADMIN_SECTIONS = [
  { id: 'talent', label: '人才与账号' },
  { id: 'meetings', label: '会议活动' },
  { id: 'ops', label: '系统概览' }
];
const DEFAULT_ICON = '⭐';
const DIMENSION_CATEGORIES = [
  '思想政治',
  '业务水平',
  '业绩成果',
  '八小时外业余生活',
  '阅读学习情况',
  '婚恋情况'
];
const EVALUATION_TYPES = [
  { value: 'quarterly', label: '季度评价' },
  { value: 'annual', label: '年度综合评估' },
  { value: 'marriage', label: '婚恋情况补充' }
];
const generateNumericPassword = () => {
  const digits = '0123456789';
  let password = '';
  for (let index = 0; index < 8; index += 1) {
    password += digits[Math.floor(Math.random() * digits.length)];
  }
  return password;
};

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

function AppShell() {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [people, setPeople] = useState([]);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [insights, setInsights] = useState([]);
  const [draftProfile, setDraftProfile] = useState({
    focus: '',
    bio: '',
    title: '',
    department: '',
    birth_date: '',
    gender: '',
    phone: ''
  });
  const [dimensionDrafts, setDimensionDrafts] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [growthEvents, setGrowthEvents] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [sensitiveUnmasked, setSensitiveUnmasked] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [loadError, setLoadError] = useState('');
  const [users, setUsers] = useState([]);

  const triggerDataRefresh = () => setDataVersion((prev) => prev + 1);

  const navigate = useNavigate();
  const location = useLocation();

  const selectedPerson = useMemo(
    () => people.find((person) => person.id === selectedPersonId),
    [people, selectedPersonId]
  );
  const selectedMeeting = useMemo(
    () => meetings.find((meeting) => meeting.id === selectedMeetingId),
    [meetings, selectedMeetingId]
  );
  const authHeaders = useMemo(
    () => ({
      headers: { Authorization: token ? `Bearer ${token}` : undefined }
    }),
    [token]
  );
  const isSuperAdmin = user?.isSuperAdmin;
  const hasPerm = (permission) => Boolean(user && (user.isSuperAdmin || user.permissions?.includes(permission)));
  const isAdmin = hasPerm('people.edit.all') || hasPerm('users.manage') || hasPerm('permissions.manage');
  const canManageUsers = hasPerm('users.manage') || hasPerm('permissions.manage');
  const roleLabel = user
    ? user.isSuperAdmin
      ? '超级管理员'
      : user.role === 'admin'
      ? '管理员'
      : user.role === 'display'
      ? '展示专用'
      : '用户'
    : '';

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(STORAGE_TOKEN_KEY);
      const storedUser = localStorage.getItem(STORAGE_USER_KEY);
      if (storedToken) {
        setToken(storedToken);
      }
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setSensitiveUnmasked(Boolean(parsedUser.sensitiveUnmasked));
      }
    } catch (error) {
      console.warn('加载本地会话失败', error);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setPeople([]);
      setMeetings([]);
      setSelectedPersonId(null);
      setSelectedMeetingId(null);
      setEvaluations([]);
      setGrowthEvents([]);
      setCertificates([]);
      setLoadError('');
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      try {
        const [peopleRes, meetingRes, insightRes] = await Promise.all([
          axios.get(`${API_BASE}/personnel`, authHeaders),
          axios.get(`${API_BASE}/meetings`, authHeaders),
          axios.get(`${API_BASE}/insights/dimensions`, authHeaders)
        ]);
        setPeople(peopleRes.data);
        setMeetings(meetingRes.data);
        setInsights(insightRes.data);
        if (!selectedPersonId && peopleRes.data.length > 0) {
          setSelectedPersonId(peopleRes.data[0].id);
        }
        if (!selectedMeetingId && meetingRes.data.length > 0) {
          setSelectedMeetingId(meetingRes.data[0].id);
        }
        setLoadError('');
      } catch (error) {
        const message = error.response?.data?.message || '加载数据失败';
        setToast(message);
        setLoadError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, dataVersion]);

  useEffect(() => {
    if (!token || !selectedPersonId) {
      setEvaluations([]);
      setGrowthEvents([]);
      setCertificates([]);
      return;
    }
    const fetchExtras = async () => {
      try {
        const [evalRes, growthRes, certRes] = await Promise.all([
          axios.get(`${API_BASE}/evaluations`, {
            ...authHeaders,
            params: { personId: selectedPersonId }
          }),
          axios.get(`${API_BASE}/growth`, {
            ...authHeaders,
            params: { personId: selectedPersonId }
          }),
          axios.get(`${API_BASE}/certificates`, {
            ...authHeaders,
            params: { personId: selectedPersonId }
          })
        ]);
        setEvaluations(evalRes.data || []);
        setGrowthEvents(growthRes.data || []);
        setCertificates(certRes.data || []);
      } catch (error) {
        setEvaluations([]);
        setGrowthEvents([]);
        setCertificates([]);
      }
    };
    fetchExtras();
  }, [token, selectedPersonId, dataVersion]);

  useEffect(() => {
    if (!token || !canManageUsers) {
      setUsers([]);
      return;
    }
    const fetchUsers = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(data);
      } catch (error) {
        setToast(error.response?.data?.message || '加载账号失败');
      }
    };
    fetchUsers();
  }, [token, canManageUsers, dataVersion]);

  useEffect(() => {
    if (selectedPerson) {
      setDraftProfile({
        focus: selectedPerson.focus || '',
        bio: selectedPerson.bio || '',
        title: selectedPerson.title || '',
        department: selectedPerson.department || '',
        birth_date: selectedPerson.birth_date || '',
        gender: selectedPerson.gender || '',
        phone: selectedPerson.phone || ''
      });
      setDimensionDrafts(selectedPerson.dimensions?.map((dimension) => ({ ...dimension })) || []);
    } else {
      setDraftProfile({
        focus: '',
        bio: '',
        title: '',
        department: '',
        birth_date: '',
        gender: '',
        phone: ''
      });
      setDimensionDrafts([]);
    }
  }, [selectedPerson]);

  const overview = useMemo(() => {
    const totalDimensions = people.reduce((sum, person) => sum + (person.dimensions?.length || 0), 0);
    return [
      { label: '入库英才', value: people.length, unit: '人' },
      { label: '多维画像', value: totalDimensions, unit: '条' },
      { label: '政治思想会议', value: meetings.length, unit: '场' },
      { label: '维度覆盖率', value: insights.length ? `${Math.min(100, insights.length * 6)}%` : '—', unit: '' }
    ];
  }, [people, meetings, insights]);

  const trendingPeople = useMemo(
    () =>
      people
        .slice()
        .sort((a, b) => (b.dimensions?.length || 0) - (a.dimensions?.length || 0))
        .slice(0, 6),
    [people]
  );
  const handleLogin = async (event) => {
    event.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      setToast('请输入完整账号信息');
      return;
    }
    try {
      const { data } = await axios.post(`${API_BASE}/login`, loginForm);
      setToken(data.token);
      setUser(data.user);
      setSensitiveUnmasked(Boolean(data.user?.sensitiveUnmasked));
      localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
      setToast(`欢迎 ${data.user.name} (${data.user.role})`);
      navigate('/');
    } catch (error) {
      setToast(error.response?.data?.message || '登录失败');
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    setLoginForm({ email: '', password: '' });
    setSensitiveUnmasked(false);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    navigate('/');
    setToast('已安全退出');
  };

  const toggleSensitiveView = async () => {
    const nextValue = !sensitiveUnmasked;
    try {
      await axios.put(
        `${API_BASE}/profile/sensitive`,
        { sensitiveUnmasked: nextValue },
        authHeaders
      );
      setSensitiveUnmasked(nextValue);
      setUser((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, sensitiveUnmasked: nextValue };
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      setToast(error.response?.data?.message || '更新脱敏设置失败');
    }
  };

  const updateDimensionDraft = (idx, key, value) => {
    setDimensionDrafts((prev) =>
      prev.map((dimension, index) => (index === idx ? { ...dimension, [key]: value } : dimension))
    );
  };

  const addDimensionDraft = () => {
    setDimensionDrafts((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, category: DIMENSION_CATEGORIES[0], detail: '请输入描述' }
    ]);
  };

  const removeDimensionDraft = (idx) => {
    setDimensionDrafts((prev) => prev.filter((_, index) => index !== idx));
  };

  const saveProfile = async () => {
    if (!selectedPerson) return;
    try {
      const { data } = await axios.put(
        `${API_BASE}/personnel/${selectedPerson.id}`,
        draftProfile,
        authHeaders
      );
      setPeople((prev) =>
        prev.map((person) => (person.id === data.id ? { ...person, ...data } : person))
      );
      setToast('资料已更新');
    } catch (error) {
      setToast(error.response?.data?.message || '更新失败');
    }
  };

  const saveDimensions = async () => {
    if (!selectedPerson) return;
    try {
      const payload = dimensionDrafts.map(({ category, detail }) => ({
        category,
        detail
      }));
      const { data } = await axios.put(
        `${API_BASE}/personnel/${selectedPerson.id}/dimensions`,
        { dimensions: payload },
        authHeaders
      );
      setPeople((prev) =>
        prev.map((person) =>
          person.id === selectedPerson.id ? { ...person, dimensions: data } : person
        )
      );
      setToast('多维度数据已更新');
    } catch (error) {
      setToast(error.response?.data?.message || '更新失败');
    }
  };

  const canEditSelected =
    user &&
    selectedPerson &&
    (hasPerm('people.edit.all') ||
      (hasPerm('people.edit.self') && user.personId === selectedPerson.id));
  const canEditDimensions =
    user &&
    selectedPerson &&
    (hasPerm('dimensions.edit.all') ||
      (hasPerm('dimensions.edit.self') && user.personId === selectedPerson.id));
  const canEditGrowth =
    user &&
    selectedPerson &&
    (hasPerm('growth.edit.all') ||
      (hasPerm('growth.edit.self') && user.personId === selectedPerson.id));
  const canEditEvaluations = hasPerm('evaluations.edit');
  const canManageCertificates =
    user &&
    selectedPerson &&
    (hasPerm('certificates.upload') || hasPerm('certificates.delete')) &&
    (hasPerm('people.edit.all') || user.personId === selectedPerson.id);

  const requireLogin = (path) => {
    if (!user) {
      setToast('请先登录以访问该页面');
      return false;
    }
    if (path === '/profile' && !isAdmin) {
      setToast('只有管理员可以进入管理后台');
      return false;
    }
    navigate(path);
    return true;
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div className="app-shell">
      <header className="global-header">
        <div className="brand">
          <span className="badge">T·矩阵</span>
          <div>
            <h1>金岩高新百名英才档案管理</h1>
            <p>融合多维档案，洞察人才脉动</p>
          </div>
        </div>
        {user && (
          <nav className="global-nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.path}
                className={`nav-link ${
                  location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path))
                    ? 'active'
                    : ''
                }`}
                onClick={() => (item.restricted ? requireLogin(item.path) : navigate(item.path))}
                disabled={item.restricted && !isAdmin}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}
        <div className="user-section">
          {user ? (
            <>
              <div className="user-meta" style={{ borderColor: ROLE_COLORS[user.role] }}>
                <p>{user.name}</p>
                <span>{roleLabel}</span>
              </div>
              {hasPerm('sensitive.view') && (
                <button className="ghost-button slim" onClick={toggleSensitiveView}>
                  {sensitiveUnmasked ? '脱敏显示' : '显示明文'}
                </button>
              )}
              <button className="ghost-button" onClick={handleLogout}>
                退出
              </button>
            </>
          ) : (
            <p className="user-tip">请登录以解锁多维档案</p>
          )}
        </div>
      </header>

      {toast && <div className="toast">{toast}</div>}

      {!user ? (
        <LoginHero loginForm={loginForm} setLoginForm={setLoginForm} onSubmit={handleLogin} />
      ) : (
        <main className="page-content">
          <Routes>
            <Route
              path="/"
              element={
                <DashboardPage
                  overview={overview}
                  people={people}
                  meetings={meetings}
                  insights={insights}
                  trendingPeople={trendingPeople}
                  selectedPerson={selectedPerson}
                  selectedMeeting={selectedMeeting}
                  loading={loading}
                  setSelectedPersonId={setSelectedPersonId}
                  setSelectedMeetingId={setSelectedMeetingId}
                  canEditSelected={canEditSelected}
                  navigate={navigate}
                  loadError={loadError}
                  onRetry={triggerDataRefresh}
                />
              }
            />
            <Route
              path="/talent"
              element={
                <TalentPage
                  people={people}
                  insights={insights}
                  meetings={meetings}
                  selectedPerson={selectedPerson}
                  setSelectedPersonId={setSelectedPersonId}
                  canEditSelected={canEditSelected}
                  canEditDimensions={canEditDimensions}
                  navigate={navigate}
                  draftProfile={draftProfile}
                  setDraftProfile={setDraftProfile}
                  dimensionDrafts={dimensionDrafts}
                  updateDimensionDraft={updateDimensionDraft}
                  addDimensionDraft={addDimensionDraft}
                  removeDimensionDraft={removeDimensionDraft}
                  saveProfile={saveProfile}
                  saveDimensions={saveDimensions}
                  user={user}
                  sensitiveUnmasked={sensitiveUnmasked}
                  hasPerm={hasPerm}
                />
              }
            />
            <Route
              path="/evaluations"
              element={
                <EvaluationPage
                  people={people}
                  selectedPerson={selectedPerson}
                  setSelectedPersonId={setSelectedPersonId}
                  evaluations={evaluations}
                  setEvaluations={setEvaluations}
                  canEditEvaluations={canEditEvaluations}
                  apiBase={API_BASE}
                  authHeaders={authHeaders}
                  setToast={setToast}
                />
              }
            />
            <Route
              path="/growth"
              element={
                <GrowthPage
                  people={people}
                  selectedPerson={selectedPerson}
                  setSelectedPersonId={setSelectedPersonId}
                  growthEvents={growthEvents}
                  setGrowthEvents={setGrowthEvents}
                  canEditGrowth={canEditGrowth}
                  apiBase={API_BASE}
                  authHeaders={authHeaders}
                  setToast={setToast}
                />
              }
            />
            <Route
              path="/certificates"
              element={
                <CertificatesPage
                  people={people}
                  selectedPerson={selectedPerson}
                  setSelectedPersonId={setSelectedPersonId}
                  certificates={certificates}
                  setCertificates={setCertificates}
                  canManageCertificates={canManageCertificates}
                  apiBase={API_BASE}
                  authHeaders={authHeaders}
                  setToast={setToast}
                />
              }
            />
            <Route
              path="/meetings"
              element={
                <MeetingsPage
                  meetings={meetings}
                  selectedMeeting={selectedMeeting}
                  setSelectedMeetingId={setSelectedMeetingId}
                  setSelectedPersonId={setSelectedPersonId}
                />
              }
            />
            <Route
              path="/profile"
              element={
                user?.role === 'admin' ? (
                  <AdminPage
                    people={people}
                    setPeople={setPeople}
                    users={users}
                    setUsers={setUsers}
                    meetings={meetings}
                    setMeetings={setMeetings}
                    selectedPerson={selectedPerson}
                    setSelectedPersonId={setSelectedPersonId}
                    setSelectedMeetingId={setSelectedMeetingId}
                    draftProfile={draftProfile}
                    setDraftProfile={setDraftProfile}
                    dimensionDrafts={dimensionDrafts}
                    updateDimensionDraft={updateDimensionDraft}
                    addDimensionDraft={addDimensionDraft}
                    removeDimensionDraft={removeDimensionDraft}
                    saveProfile={saveProfile}
                    saveDimensions={saveDimensions}
                    canEditSelected={canEditSelected}
                    canManageUsers={canManageUsers}
                    setToast={setToast}
                    authHeaders={authHeaders}
                    apiBase={API_BASE}
                    triggerDataRefresh={triggerDataRefresh}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      )}
    </div>
  );
}

function LoginHero({ loginForm, setLoginForm, onSubmit }) {
  return (
    <section className="login-hero">
      <div className="login-card">
        <div className="login-brand">
          <p className="eyebrow">Identity Cloud</p>
          <h3>统一身份中心</h3>
          <p>多角色准入 · 零阻塞体验</p>
        </div>
        <form className="login-form" onSubmit={onSubmit}>
          <label>
            <span>账户名</span>
            <input
              type="text"
              placeholder="输入邮箱或本地账号"
              value={loginForm.email}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </label>
          <label>
            <span>访问密码</span>
            <input
              type="password"
              placeholder="••••••••"
              value={loginForm.password}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
            />
          </label>
          <div className="login-actions">
            <button type="submit" className="primary-button">
              进入大屏
            </button>
            <button
              type="button"
              className="ghost-button slim"
              onClick={() => setLoginForm({ email: '', password: '' })}
            >
              清空
            </button>
          </div>
        </form>
        <p className="login-hint">
          没有账号？请联系系统管理员开通。当前默认管理员账号/密码：<strong>sikuai / sikuai</strong>
        </p>
      </div>
    </section>
  );
}

function DashboardPage({
  overview,
  people,
  meetings,
  insights,
  trendingPeople,
  selectedPerson,
  selectedMeeting,
  loading,
  setSelectedPersonId,
  setSelectedMeetingId,
  canEditSelected,
  navigate,
  loadError,
  onRetry
}) {
  const visiblePeople = people;
  const meetingsPreview = meetings;

  const monthlyActivitySeries = useMemo(() => {
    const parsedDates = [];
    const monthCounts = meetings.reduce((acc, meeting) => {
      const date = new Date(meeting.meetingDate);
      if (Number.isNaN(date.getTime())) {
        return acc;
      }
      parsedDates.push(date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {});
    const anchor = parsedDates.length
      ? parsedDates.reduce((latest, current) => (current > latest ? current : latest), parsedDates[0])
      : new Date();
    const monthsToShow = 6;
    return Array.from({ length: monthsToShow }, (_, idx) => {
      const offset = monthsToShow - 1 - idx;
      const current = new Date(anchor.getFullYear(), anchor.getMonth() - offset, 1);
      const year = current.getFullYear();
      const month = current.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, '0')}`;
      return {
        key,
        month: `${month}月`,
        fullLabel: `${year}年${month}月`,
        count: monthCounts[key] || 0,
        fill: DIMENSION_COLORS[idx % DIMENSION_COLORS.length]
      };
    });
  }, [meetings]);

  const dimensionDistribution = useMemo(() => {
    if (!insights.length) return [];
    const total = insights.reduce((sum, item) => sum + (item.count || 0), 0) || 1;
    return insights.map((item, idx) => ({
      name: item.category,
      value: item.count,
      percentage: Math.round(((item.count || 0) / total) * 100),
      fill: DIMENSION_COLORS[idx % DIMENSION_COLORS.length]
    }));
  }, [insights]);

  if (loadError && visiblePeople.length === 0 && meetings.length === 0) {
    return (
      <section className="dashboard-empty">
        <h2>数据加载失败</h2>
        <p>{loadError}</p>
        <button className="ghost-button slim" onClick={onRetry}>
          重新加载
        </button>
      </section>
    );
  }

  return (
    <section className="dashboard-three">
      <div className="dashboard-col dashboard-left">
        <div className="panel stats-panel">
          <div className="panel-head inline">
            <div>
              <p className="panel-subtitle">Overview</p>
              <h3>核心指标</h3>
            </div>
            <button className="ghost-button slim" onClick={() => navigate('/profile')} disabled={!canEditSelected}>
              {canEditSelected ? '维护档案' : '不可编辑'}
            </button>
          </div>
          <div className="kpi-grid">
            {overview.map((item) => (
              <article key={item.label} className="kpi-card">
                <p>{item.label}</p>
                <h3>
                  {item.value}
                  <span>{item.unit}</span>
                </h3>
              </article>
            ))}
          </div>
        </div>

        <div className="panel person-panel">
          <div className="panel-head">
            <h3>人员信息列表</h3>
            <p>点击即可查看画像</p>
          </div>
          {loading && <p className="muted">正在加载...</p>}
          <div className="dashboard-person-list">
            {visiblePeople.map((person) => (
              <button
                key={person.id}
                className={`dashboard-person ${selectedPerson?.id === person.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedPersonId(person.id);
                  navigate('/talent');
                }}
              >
                <div>
                  <p className="name">{person.name}</p>
                  <p className="meta">
                    {person.title} · {person.department}
                  </p>
                </div>
                <span className="value">{person.dimensions?.length || 0} 维</span>
              </button>
            ))}
          </div>
          <button className="ghost-button slim" onClick={() => navigate('/talent')}>
            前往画像页
          </button>
        </div>
      </div>

      <div className="dashboard-col dashboard-center">
        <div className="panel chart-panel">
          <div className="panel-head">
            <h3>月度会议与画像视图</h3>
          </div>
          <div className="chart-grid">
            <div className="chart-card">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyActivitySeries} margin={{ top: 20, right: 24, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="#eef2ff" strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke="#7a89b5" />
                  <YAxis yAxisId="left" stroke="#7a89b5" width={36} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e8eeff', borderRadius: 10 }}
                    labelStyle={{ color: '#4d5a7a' }}
                    formatter={(value) => [`${value} 场`, '会议 / 活动']}
                    labelFormatter={(value, payload) =>
                      (payload && payload.length && payload[0].payload.fullLabel) || value
                    }
                  />
                  <Bar dataKey="count" yAxisId="left" barSize={28} radius={[10, 10, 0, 0]}>
                    {monthlyActivitySeries.map((entry) => (
                      <Cell key={entry.key} fill={entry.fill} />
                    ))}
                    <LabelList
                      dataKey="count"
                      position="top"
                      offset={12}
                      fill="#4c5694"
                      formatter={(value) => `${value} 场`}
                    />
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card pie-card">
              {dimensionDistribution.length === 0 ? (
                <p className="chart-empty muted">暂无画像统计，导入人才维度后将自动生成。</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dimensionDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      stroke="none"
                      strokeWidth={0}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                    >
                      {dimensionDistribution.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} stroke="none" strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-col dashboard-right">
        <div className="panel meeting-panel">
          <div className="panel-head inline">
            <div>
              <h3>会议活动列表</h3>
            </div>
            <button className="ghost-button slim" onClick={() => navigate('/meetings')}>
              查看全部
            </button>
          </div>
          <div className="meeting-board-list">
            {meetingsPreview.map((meeting) => (
              <button
                key={meeting.id}
                className={`meeting-board-item ${selectedMeeting?.id === meeting.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedMeetingId(meeting.id);
                  navigate('/meetings');
                }}
              >
                <p className="name">{meeting.topic}</p>
                <div className="meta meeting-meta">
                  <span className="meeting-category-chip">{meeting.category || '会议'}</span>
                  <span>
                    {meeting.meetingDate} · {meeting.location}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="panel talent-stream">
          <div className="panel-head">
            <h3>人才热度流</h3>
            <p>维度越多越靠前</p>
          </div>
          {loading && <p className="muted">正在刷新...</p>}
          <div className="heat-list">
            {trendingPeople.map((person, index) => (
              <button
                key={person.id}
                className="heat-item"
                onClick={() => {
                  setSelectedPersonId(person.id);
                  navigate('/talent');
                }}
              >
                <span className="rank">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <p className="name">
                    {person.name} <small>{person.title}</small>
                  </p>
                  <p className="meta">{person.department}</p>
                </div>
                <span className="value">{person.dimensions?.length || 0} 维</span>
              </button>
            ))}
          </div>
        </div>
        {selectedPerson && (canEditSelected || canEditDimensions) && (
          <div className="talent-edit-grid">
            {canEditSelected && (
              <div className="panel edit-panel">
                <div className="panel-head">
                  <h3>基础档案维护</h3>
                  <span className="panel-subtitle">仅可编辑本人信息</span>
                </div>
                <div className="form-row">
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
                  <label>
                    手机号
                    <input
                      value={draftProfile.phone}
                      onChange={(event) =>
                        setDraftProfile((prev) => ({ ...prev, phone: event.target.value }))
                      }
                    />
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    职务抬头
                    <input
                      value={draftProfile.title}
                      onChange={(event) =>
                        setDraftProfile((prev) => ({ ...prev, title: event.target.value }))
                      }
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
                <label>
                  聚焦方向
                  <textarea
                    value={draftProfile.focus}
                    onChange={(event) =>
                      setDraftProfile((prev) => ({ ...prev, focus: event.target.value }))
                    }
                  />
                </label>
                <label>
                  个人简介
                  <textarea
                    value={draftProfile.bio}
                    onChange={(event) => setDraftProfile((prev) => ({ ...prev, bio: event.target.value }))}
                  />
                </label>
                <button className="primary-button" onClick={saveProfile}>
                  保存基础资料
                </button>
              </div>
            )}

            {canEditDimensions && (
              <div className="panel edit-panel">
                <div className="panel-head">
                  <h3>六维画像维护</h3>
                  <button className="ghost-button slim" onClick={addDimensionDraft}>
                    + 新增维度条目
                  </button>
                </div>
                <div className="dimension-grid">
                  {dimensionDrafts.map((dimension, idx) => (
                    <div key={dimension.id || idx} className="dimension-card">
                      <div className="dimension-header">
                        <select
                          value={dimension.category}
                          onChange={(event) => updateDimensionDraft(idx, 'category', event.target.value)}
                        >
                          {DIMENSION_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        value={dimension.detail}
                        onChange={(event) => updateDimensionDraft(idx, 'detail', event.target.value)}
                      />
                      <div className="dimension-actions">
                        <button onClick={() => removeDimensionDraft(idx)}>移除</button>
                      </div>
                    </div>
                  ))}
                  {dimensionDrafts.length === 0 && <p className="muted">暂无维度记录，可添加。</p>}
                </div>
                <div className="dimension-actions-row">
                  <button className="primary-button" onClick={saveDimensions}>
                    保存六维画像
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function TalentPage({
  people,
  insights,
  meetings,
  selectedPerson,
  setSelectedPersonId,
  canEditSelected,
  canEditDimensions,
  navigate,
  draftProfile,
  setDraftProfile,
  dimensionDrafts,
  updateDimensionDraft,
  addDimensionDraft,
  removeDimensionDraft,
  saveProfile,
  saveDimensions,
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
    (user.isSuperAdmin || hasSensitivePermission || user.personId === selectedPerson.id);
  const shouldMaskSensitive =
    selectedPerson &&
    (!canViewSensitive ||
      (hasSensitivePermission && !sensitiveUnmasked && user?.personId !== selectedPerson.id));

  const maskPhoneLocal = (phone) => {
    if (!phone) return '—';
    if (phone.length <= 7) return '••••';
    return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
  };
  const maskBirthDateLocal = (date) => {
    if (!date) return '—';
    return '****-**-**';
  };

  return (
    <section className="talent-page">
      <aside className="talent-sidebar">
        <div className="talent-filters">
          <div className="panel-subtitle">Filter</div>
          <h3>筛选条件</h3>
          <label>
            搜索
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
            <button className="ghost-button slim" onClick={() => {
              setSearch('');
              setDepartment('全部');
              setDimensionTag('全部');
            }}>
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

function EvaluationPage({
  people,
  selectedPerson,
  setSelectedPersonId,
  evaluations,
  setEvaluations,
  canEditEvaluations,
  apiBase,
  authHeaders,
  setToast
}) {
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    type: EVALUATION_TYPES[0].value,
    period: '',
    content: ''
  });

  const filteredPeople = useMemo(
    () =>
      people.filter((person) =>
        person.name.includes(search) ||
        (person.department && person.department.includes(search)) ||
        (person.title && person.title.includes(search))
      ),
    [people, search]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedPerson) {
      setToast('请先选择人员');
      return;
    }
    if (!form.period || !form.content.trim()) {
      setToast('请补全评价周期与内容');
      return;
    }
    try {
      const payload = {
        personId: selectedPerson.id,
        type: form.type,
        period: form.period.trim(),
        content: form.content.trim()
      };
      const { data } = await axios.post(`${apiBase}/evaluations`, payload, authHeaders);
      setEvaluations((prev) => [data, ...prev]);
      setForm((prev) => ({ ...prev, content: '' }));
      setToast('评价已保存');
    } catch (error) {
      setToast(error.response?.data?.message || '保存评价失败');
    }
  };

  return (
    <section className="module-page">
      <aside className="talent-sidebar">
        <div className="talent-filters">
          <div className="panel-subtitle">Filter</div>
          <h3>人员搜索</h3>
          <label>
            关键词
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="姓名 / 部门" />
          </label>
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
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="module-detail">
        <div className="panel">
          <div className="panel-head">
            <h3>评价记录</h3>
            <p className="panel-subtitle">{selectedPerson ? selectedPerson.name : '请选择人员'}</p>
          </div>
          <div className="evaluation-list">
            {evaluations.length === 0 && <p className="muted">暂无评价记录。</p>}
            {evaluations.map((item) => {
              const typeLabel = EVALUATION_TYPES.find((type) => type.value === item.type)?.label || item.type;
              return (
                <div key={item.id} className="evaluation-card">
                  <div>
                    <strong>{typeLabel}</strong>
                    <span>{item.period}</span>
                  </div>
                  <p>{item.content}</p>
                  {item.created_at && <small>创建时间：{item.created_at}</small>}
                </div>
              );
            })}
          </div>
        </div>

        {canEditEvaluations && (
          <div className="panel">
            <div className="panel-head">
              <h3>新增评价</h3>
              <p className="panel-subtitle">由领导填写季度/年度评价</p>
            </div>
            <form className="admin-form" onSubmit={handleSubmit}>
              <label>
                评价类型
                <select
                  value={form.type}
                  onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
                >
                  {EVALUATION_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                评价周期
                <input
                  placeholder="例如 2026Q1 / 2026年度"
                  value={form.period}
                  onChange={(event) => setForm((prev) => ({ ...prev, period: event.target.value }))}
                />
              </label>
              <label>
                评价内容
                <textarea
                  value={form.content}
                  onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                />
              </label>
              <button className="primary-button" type="submit" disabled={!selectedPerson}>
                保存评价
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

function GrowthPage({
  people,
  selectedPerson,
  setSelectedPersonId,
  growthEvents,
  setGrowthEvents,
  canEditGrowth,
  apiBase,
  authHeaders,
  setToast
}) {
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    eventDate: '',
    title: '',
    description: '',
    category: ''
  });

  const filteredPeople = useMemo(
    () =>
      people.filter((person) =>
        person.name.includes(search) ||
        (person.department && person.department.includes(search)) ||
        (person.title && person.title.includes(search))
      ),
    [people, search]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedPerson) {
      setToast('请先选择人员');
      return;
    }
    if (!form.eventDate || !form.title.trim()) {
      setToast('请填写事件时间与标题');
      return;
    }
    try {
      const payload = {
        personId: selectedPerson.id,
        eventDate: form.eventDate,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim()
      };
      const { data } = await axios.post(`${apiBase}/growth`, payload, authHeaders);
      setGrowthEvents((prev) => [data, ...prev]);
      setForm((prev) => ({ ...prev, title: '', description: '' }));
      setToast('成长事件已添加');
    } catch (error) {
      setToast(error.response?.data?.message || '添加失败');
    }
  };

  const handleDelete = async (id) => {
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
    <section className="module-page">
      <aside className="talent-sidebar">
        <div className="talent-filters">
          <div className="panel-subtitle">Filter</div>
          <h3>人员搜索</h3>
          <label>
            关键词
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="姓名 / 部门" />
          </label>
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
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="module-detail">
        <div className="panel">
          <div className="panel-head">
            <h3>成长轨迹</h3>
            <p className="panel-subtitle">{selectedPerson ? selectedPerson.name : '请选择人员'}</p>
          </div>
          <div className="growth-timeline">
            {growthEvents.length === 0 && <p className="muted">暂无成长轨迹记录。</p>}
            {growthEvents.map((item) => (
              <div key={item.id} className="timeline-card">
                <div className="timeline-date">{item.event_date}</div>
                <div>
                  <strong>{item.title}</strong>
                  {item.category && <span className="tag-pill">{item.category}</span>}
                  <p>{item.description || '暂无描述'}</p>
                  {canEditGrowth && (
                    <button className="ghost-button slim" onClick={() => handleDelete(item.id)}>
                      删除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {canEditGrowth && (
          <div className="panel">
            <div className="panel-head">
              <h3>新增成长事件</h3>
              <p className="panel-subtitle">记录培训、项目、获奖等关键节点</p>
            </div>
            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <input
                  type="date"
                  value={form.eventDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, eventDate: event.target.value }))}
                />
                <input
                  placeholder="事件类型（可选）"
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                />
              </div>
              <input
                placeholder="事件标题"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              />
              <textarea
                placeholder="事件描述"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              />
              <button className="primary-button" type="submit" disabled={!selectedPerson}>
                保存成长事件
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

function CertificatesPage({
  people,
  selectedPerson,
  setSelectedPersonId,
  certificates,
  setCertificates,
  canManageCertificates,
  apiBase,
  authHeaders,
  setToast
}) {
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '',
    issuedDate: '',
    description: '',
    file: null
  });

  const filteredPeople = useMemo(
    () =>
      people.filter((person) =>
        person.name.includes(search) ||
        (person.department && person.department.includes(search)) ||
        (person.title && person.title.includes(search))
      ),
    [people, search]
  );

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
    <section className="module-page">
      <aside className="talent-sidebar">
        <div className="talent-filters">
          <div className="panel-subtitle">Filter</div>
          <h3>人员搜索</h3>
          <label>
            关键词
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="姓名 / 部门" />
          </label>
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
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="module-detail">
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
      </div>
    </section>
  );
}

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
  dimensionDrafts,
  updateDimensionDraft,
  addDimensionDraft,
  removeDimensionDraft,
  saveProfile,
  saveDimensions,
  canEditSelected,
  canManageUsers,
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
    phone: ''
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

  useEffect(() => {
    if (!selectedPerson && people.length) {
      setSelectedPersonId(people[0].id);
    }
  }, [people, selectedPerson, setSelectedPersonId]);

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
      phone: ''
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
        personId: createdPerson.id
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
        <p className="eyebrow">Global Admin</p>
        <h2>金岩高新 · 全局管理</h2>
        <nav className="admin-nav">
          {ADMIN_SECTIONS.map((section) => (
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
                    <p className="panel-subtitle">一体化开户</p>
                    <h3>新增人才 & 账号</h3>
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
                    <p className="panel-subtitle">账号一览</p>
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
                    <h3>多维度维护</h3>
                    <button className="ghost-button slim" onClick={addDimensionDraft} disabled={!canEditSelected}>
                      + 新增维度
                    </button>
                  </div>
                  <div className="dimension-grid">
                    {dimensionDrafts.map((dimension, idx) => (
                      <div key={dimension.id || idx} className="dimension-card">
                        <div className="dimension-header">
                          <select
                            value={dimension.category}
                            onChange={(event) => updateDimensionDraft(idx, 'category', event.target.value)}
                          >
                            {DIMENSION_CATEGORIES.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </div>
                        <textarea
                          value={dimension.detail}
                          onChange={(event) => updateDimensionDraft(idx, 'detail', event.target.value)}
                        />
                        <div className="dimension-actions">
                          <button onClick={() => removeDimensionDraft(idx)}>移除</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="dimension-actions-row">
                    <button className="primary-button" onClick={saveDimensions} disabled={!canEditSelected}>
                      保存多维度
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="muted">请选择左侧人员后再进行信息维护。</p>
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
                    placeholder="地点"
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
          <div className="panel admin-section">
            <div className="panel-head">
              <p className="panel-subtitle">System</p>
              <h3>运行概览</h3>
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
        )}
      </div>
    </section>
  );
}

export default App;

