import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate
} from 'react-router-dom';
import axios from 'axios';
import LoginHero from './components/LoginHero';
import { DIMENSION_CATEGORIES } from './constants';
import './App.css';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TalentPage = lazy(() => import('./pages/TalentPage'));
const EvaluationPage = lazy(() => import('./pages/EvaluationPage'));
const GrowthPage = lazy(() => import('./pages/GrowthPage'));
const CertificatesPage = lazy(() => import('./pages/CertificatesPage'));
const MeetingsPage = lazy(() => import('./pages/MeetingsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const DocsPage = lazy(() => import('./pages/DocsPage'));

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

const NAV_ITEMS = [
  { label: '大屏总览', path: '/' },
  { label: '人才信息采集', path: '/talent' },
  { label: '评价管理', path: '/evaluations' },
  { label: '成长轨迹', path: '/growth' },
  { label: '证书管理', path: '/certificates' },
  { label: '会议活动', path: '/meetings' },
  { label: '系统文档', path: '/docs' },
  { label: '管理后台', path: '/profile', restricted: true }
];

const STORAGE_TOKEN_KEY = 'talent_dashboard_token';

const STORAGE_USER_KEY = 'talent_dashboard_user';

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
  const [loginForm, setLoginForm] = useState({
    role: 'user',
    email: 'user@talent.local',
    password: 'User#123'
  });
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
  const canManagePermissions = hasPerm('permissions.manage');
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
    setLoginForm({
      role: 'user',
      email: 'user@talent.local',
      password: 'User#123'
    });
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
          <Suspense
            fallback={
              <div className="dashboard-empty">
                <p className="muted">页面加载中...</p>
              </div>
            }
          >
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
                  navigate={navigate}
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
            <Route path="/docs" element={<DocsPage user={user} roleLabel={roleLabel} />} />
            <Route
              path="/profile"
              element={
                isAdmin ? (
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
                    canManagePermissions={canManagePermissions}
                    hasPerm={hasPerm}
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
          </Suspense>
        </main>
      )}
    </div>
  );
}

export default App;
