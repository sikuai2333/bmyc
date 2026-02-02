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
const PersonalCenterPage = lazy(() => import('./pages/PersonalCenterPage'));


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

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const createEmptyDimensions = () =>
  DIMENSION_CATEGORIES.map((category) => ({
    category,
    detail: '\u65e0'
  }));

const NAV_ITEMS = [
  { label: '大屏总览', path: '/' },
  { label: '档案清单', path: '/talent' },
  { label: '成长轨迹', path: '/growth' },
  { label: '证书管理', path: '/certificates' },
  { label: '会议活动', path: '/meetings' },
  { label: '管理后台', path: '/profile', restricted: true }
];



const STORAGE_TOKEN_KEY = 'talent_dashboard_token';
const STORAGE_USER_KEY = 'talent_dashboard_user';
const STORAGE_ACCOUNT_KEY = 'talent_dashboard_account';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30000;



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
    email: '',
    password: ''
  });
  const [rememberAccount, setRememberAccount] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);
  const [lockRemaining, setLockRemaining] = useState(0);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const [people, setPeople] = useState([]);

  const [selectedPersonId, setSelectedPersonId] = useState(null);

  const [meetings, setMeetings] = useState([]);

  const [selectedMeetingId, setSelectedMeetingId] = useState(null);

  const [insights, setInsights] = useState([]);
  const [completionInsights, setCompletionInsights] = useState([]);
  const [draftProfile, setDraftProfile] = useState({
    focus: '',
    bio: '',
    title: '',
    department: '',
    birth_date: '',
    gender: '',
    phone: ''
  });
  const [dimensionMonth, setDimensionMonth] = useState(getCurrentMonth());
  const [dimensionMonthlyRows, setDimensionMonthlyRows] = useState([]);
  const [dimensionDrafts, setDimensionDrafts] = useState(createEmptyDimensions());
  const [evaluations, setEvaluations] = useState([]);

  const [growthEvents, setGrowthEvents] = useState([]);

  const [certificates, setCertificates] = useState([]);
  const [personDimensionStats, setPersonDimensionStats] = useState([]);
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
      const storedAccount = localStorage.getItem(STORAGE_ACCOUNT_KEY);
      if (storedAccount) {
        setLoginForm((prev) => ({ ...prev, email: storedAccount }));
        setRememberAccount(true);
      }

    } catch (error) {

      console.warn('加载本地会话失败', error);

    }

  }, []);

  useEffect(() => {
    if (!lockUntil) {
      setLockRemaining(0);
      return;
    }
    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
      setLockRemaining(remaining);
      if (remaining === 0) {
        setLockUntil(0);
        setFailedAttempts(0);
      }
    };
    updateRemaining();
    const timer = setInterval(updateRemaining, 1000);
    return () => clearInterval(timer);
  }, [lockUntil]);



  useEffect(() => {

    if (!token) {

      setPeople([]);

      setMeetings([]);

      setSelectedPersonId(null);

      setSelectedMeetingId(null);

      setEvaluations([]);

      setGrowthEvents([]);

      setCertificates([]);

      setCompletionInsights([]);

      setPersonDimensionStats([]);

      setLoadError('');

      return;

    }

    const fetchData = async () => {

      setLoading(true);

      try {

        const [peopleRes, meetingRes, insightRes, completionRes] = await Promise.all([

          axios.get(`${API_BASE}/personnel`, authHeaders),

          axios.get(`${API_BASE}/meetings`, authHeaders),

          axios.get(`${API_BASE}/insights/dimensions`, authHeaders),
          axios.get(`${API_BASE}/insights/completions`, { ...authHeaders, params: { months: 6 } })

        ]);

        setPeople(peopleRes.data);

        setMeetings(meetingRes.data);

        setInsights(insightRes.data);
        setCompletionInsights(completionRes.data || []);

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
      setDimensionMonthlyRows([]);
      setPersonDimensionStats([]);
      return;
    }
    const fetchExtras = async () => {
      const requests = {
        evaluations: hasPerm('evaluations.view')
          ? axios.get(`${API_BASE}/evaluations`, {
              ...authHeaders,
              params: { personId: selectedPersonId }
            })
          : Promise.resolve({ data: [] }),
        growth: hasPerm('growth.view.all') || hasPerm('growth.edit.self') || hasPerm('growth.edit.all')
          ? axios.get(`${API_BASE}/growth`, {
              ...authHeaders,
              params: { personId: selectedPersonId }
            })
          : Promise.resolve({ data: [] }),
        certificates: hasPerm('certificates.view')
          ? axios.get(`${API_BASE}/certificates`, {
              ...authHeaders,
              params: { personId: selectedPersonId }
            })
          : Promise.resolve({ data: [] }),
        dimensions: axios.get(`${API_BASE}/personnel/${selectedPersonId}/dimensions/monthly`, {
          ...authHeaders,
          params: { months: 6 }
        }),
        personDimensions: axios.get(`${API_BASE}/insights/person-dimensions`, {
          ...authHeaders,
          params: { personId: selectedPersonId }
        })
      };

      try {
        const [evalRes, growthRes, certRes, dimensionRes, personDimensionRes] = await Promise.all([
          requests.evaluations,
          requests.growth,
          requests.certificates,
          requests.dimensions,
          requests.personDimensions
        ]);
        setEvaluations(evalRes.data || []);
        setGrowthEvents(growthRes.data || []);
        setCertificates(certRes.data || []);
        setDimensionMonthlyRows(dimensionRes?.data?.rows || []);
        setPersonDimensionStats(personDimensionRes.data || []);
      } catch (error) {
        setEvaluations([]);
        setGrowthEvents([]);
        setCertificates([]);
        setDimensionMonthlyRows([]);
        setPersonDimensionStats([]);
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
      setDimensionDrafts(createEmptyDimensions());
    }
  }, [selectedPerson]);

  useEffect(() => {
    if (!token || !selectedPersonId) {
      setDimensionDrafts(createEmptyDimensions());
      return;
    }
    const fetchDimensionMonth = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/personnel/${selectedPersonId}/dimensions/monthly`, {
          ...authHeaders,
          params: { month: dimensionMonth }
        });
        const row = data?.rows?.find((item) => item.month === dimensionMonth) || data?.rows?.[0];
        if (row?.dimensions?.length) {
          setDimensionDrafts(row.dimensions.map((dimension) => ({ ...dimension })));
        } else {
          setDimensionDrafts(createEmptyDimensions());
        }
      } catch (error) {
        setDimensionDrafts(createEmptyDimensions());
      }
    };
    fetchDimensionMonth();
  }, [token, selectedPersonId, dimensionMonth, dataVersion]);


  const overview = useMemo(() => {
    const totalDimensions = people.reduce((sum, person) => sum + (person.dimensionMonthCount || 0), 0);
    const coveredCategories = insights.filter((item) => item.count > 0).length;
    const coverage = insights.length
      ? `${Math.round((coveredCategories / DIMENSION_CATEGORIES.length) * 100)}%`
      : '—';
    return [
      { label: '入库英才', value: people.length, unit: '人' },
      { label: '月度画像', value: totalDimensions, unit: '条' },
      { label: '政治思想会议', value: meetings.length, unit: '场' },
      { label: '维度覆盖率', value: coverage, unit: '' }
    ];
  }, [people, meetings, insights]);


  const trendingPeople = useMemo(
    () =>
      people
        .slice()
        .sort((a, b) => (b.dimensionMonthCount || 0) - (a.dimensionMonthCount || 0))
        .slice(0, 6),
    [people]
  );
  const accountStatus = useMemo(() => {
    const value = loginForm.email.trim();
    if (!value) {
      return { status: 'empty', valid: false, message: '支持姓名或手机号登录' };
    }
    const isPhone = /^1\\d{10}$/.test(value);
    if (isPhone) {
      return { status: 'valid', valid: true, message: '手机号格式正确' };
    }
    if (value.length >= 2) {
      return { status: 'valid', valid: true, message: '姓名格式可用' };
    }
    return { status: 'invalid', valid: false, message: '请输入正确的姓名或手机号' };
  }, [loginForm.email]);

  const passwordStatus = useMemo(() => {
    const value = loginForm.password;
    if (!value) {
      return { status: 'empty', valid: false, message: '建议至少 6 位，区分大小写' };
    }
    if (value.length < 6) {
      return { status: 'invalid', valid: false, message: '密码至少 6 位' };
    }
    return { status: 'valid', valid: true, message: '密码格式正确' };
  }, [loginForm.password]);

  useEffect(() => {
    if (!loginError || lockRemaining > 0) return;
    setLoginError('');
  }, [loginForm.email, loginForm.password, acceptPrivacy, lockRemaining]);
  const handleLogin = async (event) => {

    event.preventDefault();

    if (lockRemaining > 0) {
      setLoginError(`连续失败已锁定，请 ${lockRemaining}s 后再试`);
      return;
    }

    if (!accountStatus.valid || !passwordStatus.valid) {
      setLoginError(accountStatus.valid ? passwordStatus.message : accountStatus.message);
      return;
    }

    if (!acceptPrivacy) {
      setLoginError('请先阅读并同意相关协议');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      const payload = {
        email: loginForm.email.trim(),
        password: loginForm.password
      };
      const { data } = await axios.post(`${API_BASE}/login`, payload);

      setToken(data.token);
      setUser(data.user);
      setSensitiveUnmasked(Boolean(data.user?.sensitiveUnmasked));
      setFailedAttempts(0);
      setLockUntil(0);

      localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
      if (rememberAccount) {
        localStorage.setItem(STORAGE_ACCOUNT_KEY, payload.email);
      } else {
        localStorage.removeItem(STORAGE_ACCOUNT_KEY);
      }

      setToast(`欢迎 ${data.user.name} (${data.user.role})`);
      navigate('/');
    } catch (error) {
      const message = error.response?.data?.message || '登录失败';
      setLoginError(message);
      setToast(message);
      setFailedAttempts((prev) => {
        const next = prev + 1;
        if (next >= MAX_LOGIN_ATTEMPTS) {
          setLockUntil(Date.now() + LOCK_DURATION_MS);
          return 0;
        }
        return next;
      });
    } finally {
      setLoginLoading(false);
    }

  };



  const handleLogout = () => {

    setToken('');

    setUser(null);

    const remembered = rememberAccount ? localStorage.getItem(STORAGE_ACCOUNT_KEY) || '' : '';
    setLoginForm({
      email: remembered,
      password: ''
    });

    setSensitiveUnmasked(false);
    setLoginError('');

    localStorage.removeItem(STORAGE_TOKEN_KEY);

    localStorage.removeItem(STORAGE_USER_KEY);

    navigate('/');

    setToast('已安全退出');

  };

  const handleResetPassword = () => {
    setToast('请联系管理员重置密码');
  };

  const handleRegister = () => {
    setToast('注册入口暂未开放');
  };

  const handleThirdLogin = (provider) => {
    setToast(`${provider} 登录暂未接入`);
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



  const saveDimensions = async (monthOverride) => {
    if (!selectedPerson) return;
    try {
      const targetMonth = monthOverride || dimensionMonth || getCurrentMonth();
      const payload = dimensionDrafts.map(({ category, detail }) => ({
        category,
        detail: detail && String(detail).trim() ? String(detail).trim() : '\u65e0'
      }));
      const { data } = await axios.put(
        `${API_BASE}/personnel/${selectedPerson.id}/dimensions`,
        { dimensions: payload, month: targetMonth },
        authHeaders
      );
      setDimensionMonthlyRows((prev) => {
        const next = prev.filter((row) => row.month !== targetMonth);
        next.push({ month: targetMonth, dimensions: data });
        return next.sort((a, b) => b.month.localeCompare(a.month));
      });
      setToast('月度画像已更新');
      triggerDataRefresh();
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

    <div className={`app-shell${user ? '' : ' login-only'}`}>

      {user && (
        <header className="global-header">

          <div className="brand">

            <span className="badge">T·矩阵</span>

            <div>

              <h1>金岩高新百名英才档案管理</h1>

              <p>融合多维档案，洞察人才脉动</p>

            </div>

          </div>

          <nav className="global-nav">
            {NAV_ITEMS.filter((item) => item.path !== '/profile' || isAdmin).map((item) => (
              <button
                key={item.path}
                className={`nav-link ${
                  location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path))
                    ? 'active'
                    : ''
                }`}
                onClick={() => (item.restricted ? requireLogin(item.path) : navigate(item.path))}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="user-section">
            <>
              <div className="user-meta" style={{ borderColor: ROLE_COLORS[user.role] }}>
                <p>{user.name}</p>
                <span>{roleLabel}</span>
              </div>
              {user.role === 'user' && user.personId && (
                <button
                  className="ghost-button slim"
                  onClick={() => {
                    setSelectedPersonId(user.personId);
                    navigate('/me');
                  }}
                >
                  个人中心
                </button>
              )}
              {hasPerm('sensitive.view') && (
                <button className="ghost-button slim" onClick={toggleSensitiveView}>
                  {sensitiveUnmasked ? '脱敏显示' : '显示明文'}
                </button>
              )}
              <button className="ghost-button" onClick={handleLogout}>

                退出

              </button>

            </>
          </div>

        </header>
      )}



      {toast && <div className="toast">{toast}</div>}



      {!user ? (

        <LoginHero
          loginForm={loginForm}
          setLoginForm={setLoginForm}
          onSubmit={handleLogin}
          accountStatus={accountStatus}
          passwordStatus={passwordStatus}
          rememberAccount={rememberAccount}
          setRememberAccount={setRememberAccount}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          loginLoading={loginLoading}
          loginError={loginError}
          lockRemaining={lockRemaining}
          acceptPrivacy={acceptPrivacy}
          setAcceptPrivacy={setAcceptPrivacy}
          onResetPassword={handleResetPassword}
          onRegister={handleRegister}
          onThirdLogin={handleThirdLogin}
        />

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

                  completionInsights={completionInsights}
                  personDimensionStats={personDimensionStats}

                  trendingPeople={trendingPeople}

                  selectedPerson={selectedPerson}

                  selectedMeeting={selectedMeeting}

                  loading={loading}

                  setSelectedPersonId={setSelectedPersonId}

                  setSelectedMeetingId={setSelectedMeetingId}

                  isAdmin={isAdmin}
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
                  meetings={meetings}
                  selectedPerson={selectedPerson}
                  dimensionMonthlyRows={dimensionMonthlyRows}
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
              path="/me"
              element={
                user && user.role === 'user' ? (
                  <PersonalCenterPage
                    user={user}
                    selectedPerson={selectedPerson}
                    setSelectedPersonId={setSelectedPersonId}
                    draftProfile={draftProfile}
                    setDraftProfile={setDraftProfile}
                    dimensionMonth={dimensionMonth}
                    setDimensionMonth={setDimensionMonth}
                    dimensionDrafts={dimensionDrafts}
                    updateDimensionDraft={updateDimensionDraft}
                    saveProfile={saveProfile}
                    saveDimensions={saveDimensions}
                    canEditSelected={canEditSelected}
                    evaluations={evaluations}
                    certificates={certificates}
                    setCertificates={setCertificates}
                    canManageCertificates={canManageCertificates}
                    apiBase={API_BASE}
                    authHeaders={authHeaders}
                    setToast={setToast}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
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
                    dimensionMonth={dimensionMonth}
                    setDimensionMonth={setDimensionMonth}
                    dimensionDrafts={dimensionDrafts}
                    updateDimensionDraft={updateDimensionDraft}
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

