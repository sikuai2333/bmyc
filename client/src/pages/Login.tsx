import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import '../styles/login-legacy.css'

const UserIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z"
      fill="currentColor"
    />
  </svg>
)

const LockIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zm-7-2a2 2 0 0 1 4 0v2h-4V7zm3 9.73V18a1 1 0 0 1-2 0v-1.27a1.8 1.8 0 1 1 2 0z"
      fill="currentColor"
    />
  </svg>
)

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [roleKey, setRoleKey] = useState('')
  const [form, setForm] = useState({ account: '', password: '', remember: false })

  const roleOptions = [
    {
      key: 'super',
      label: '超管 · admin / admin@123',
      account: 'admin',
      password: 'admin@123'
    },
    {
      key: 'display',
      label: '展示 · display / display@123',
      account: 'display',
      password: 'display@123'
    },
    {
      key: 'user',
      label: '普通 · user / user@123',
      account: 'user',
      password: 'user@123'
    }
  ]

  const handleChange = (key: 'account' | 'password' | 'remember', value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleRoleSelect = (value: string) => {
    setRoleKey(value)
    const selected = roleOptions.find((item) => item.key === value)
    if (selected) {
      setForm((prev) => ({
        ...prev,
        account: selected.account,
        password: selected.password || ''
      }))
    }
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.account || !form.password) {
      setError('请输入账号和密码')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login({ account: form.account, password: form.password, remember: form.remember })
      navigate('/', { replace: true })
    } catch (err: unknown) {
      setError('登录失败，请检查账号或联系管理员')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="login-shell">
      <div className="login-card">
        <aside className="login-brand">
          <div className="brand-header">
            <img
              className="brand-logo-image"
              src="https://www.grkaolin.com/static/upload/image/20220105/1641388610665472.png"
              alt="金岩高新"
            />
            <div>
              <h2>金岩高新人才成长APP</h2>
              <p className="brand-slogan">专业、可信、可追溯的人才档案管理平台</p>
            </div>
          </div>
          <div className="brand-visual">
            <div className="visual-card feature">
              <div className="visual-row">
                <span className="visual-dot" />
                <p>六维画像 · 月度沉淀 · 成长全景</p>
              </div>
              <div className="visual-bars">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="visual-card feature">
              <div className="visual-row">
                <span className="visual-dot" />
                <p>统一档案 · 评价留痕 · 进展可见</p>
              </div>
              <div className="visual-bars">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </aside>

        <div className="login-panel">
          <div className="login-head">
            <h3>统一身份认证</h3>
            <p className="login-subtitle">企业内部使用，请使用统一账号登录</p>
          </div>

          <form className="login-form" onSubmit={onSubmit}>
            <label className="input-field" htmlFor="role-select">
              <span>账号类型</span>
              <div className="input-group">
                <select
                  id="role-select"
                  value={roleKey}
                  onChange={(event) => handleRoleSelect(event.target.value)}
                >
                  <option value="">选择账号类型（自动填充账号/密码）</option>
                  {roleOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className="input-field" htmlFor="login-account">
              <span>账号</span>
              <div className="input-group">
                <span className="input-icon">
                  <UserIcon />
                </span>
                <input
                  id="login-account"
                  value={form.account}
                  onChange={(event) => handleChange('account', event.target.value)}
                  placeholder="姓名 / 手机号"
                />
              </div>
            </label>

            <label className="input-field" htmlFor="login-password">
              <span>密码</span>
              <div className="input-group">
                <span className="input-icon">
                  <LockIcon />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => handleChange('password', event.target.value)}
                  placeholder="至少 6 位"
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? '隐藏' : '显示'}
                </button>
              </div>
            </label>

            {error ? <div className="login-alert">{error}</div> : null}

            <div className="login-actions">
              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? '登录中...' : '登录'}
              </button>
            </div>
          </form>

          <div className="login-assist">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(event) => handleChange('remember', event.target.checked)}
              />
              记住账号
            </label>
            <div className="assist-links">
              <button className="text-link" type="button" onClick={() => setError('功能暂未开放')}>
                英才账号注册
              </button>
              <button className="text-link" type="button" onClick={() => setError('功能暂未开放')}>
                重置密码
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="login-footer">
        <span>© 2026 金岩高新人才成长APP</span>
        <a className="footer-link" href="https://www.grkaolin.com/" target="_blank" rel="noreferrer">
          企业官网
        </a>
      </footer>
    </section>
  )
}
