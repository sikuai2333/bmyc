import React from 'react';

const UserIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z"
      fill="currentColor"
    />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zm-7-2a2 2 0 0 1 4 0v2h-4V7zm3 9.73V18a1 1 0 0 1-2 0v-1.27a1.8 1.8 0 1 1 2 0z"
      fill="currentColor"
    />
  </svg>
);

function LoginHero({
  loginForm,
  setLoginForm,
  onSubmit,
  accountStatus,
  passwordStatus,
  rememberAccount,
  setRememberAccount,
  showPassword,
  setShowPassword,
  loginLoading,
  loginError,
  lockRemaining,
  acceptPrivacy,
  setAcceptPrivacy,
  onResetPassword,
  onRegister,
  onThirdLogin
}) {
  const accountHint = accountStatus.message || '';
  const passwordHint = passwordStatus.message || '建议至少 6 位，区分大小写';
  const accountClass = accountStatus.status === 'invalid' ? 'invalid' : accountStatus.status === 'valid' ? 'valid' : '';
  const passwordClass = passwordStatus.status === 'invalid' ? 'invalid' : passwordStatus.status === 'valid' ? 'valid' : '';
  const isLocked = lockRemaining > 0;

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
            <div className="visual-card">
              <div className="visual-row">
                <span className="visual-dot" />
              </div>
              <div className="visual-bars">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="visual-card feature">
              <p>六维画像 · 月度沉淀 · 成长全景</p>
            </div>
            <div className="visual-card feature">
              <p>统一档案 · 评价留痕 · 进展可见</p>
            </div>
          </div>
        </aside>

        <div className="login-panel">
          <div className="login-head">
            <h3>统一身份认证</h3>
          </div>

          <form className="login-form" onSubmit={onSubmit}>
            <label className="input-field">
              <span>姓名 / 手机号</span>
              <div className={`input-group ${accountClass}`}>
                <span className="input-icon">
                  <UserIcon />
                </span>
                <input
                  value={loginForm.email}
                  onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="请输入姓名或手机号"
                />
              </div>
              {accountHint && <small className={`field-hint ${accountClass}`}>{accountHint}</small>}
            </label>

            <label className="input-field">
              <span>密码</span>
              <div className={`input-group ${passwordClass}`}>
                <span className="input-icon">
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? '隐藏' : '显示'}
                </button>
              </div>
              <small className={`field-hint ${passwordClass}`}>{passwordHint}</small>
            </label>

            {(loginError || isLocked) && (
              <div className="login-alert">
                {isLocked ? `连续失败已锁定，请 ${lockRemaining}s 后再试` : loginError}
              </div>
            )}

            <div className="login-actions">
              <button className="primary-button" type="submit" disabled={loginLoading || isLocked}>
                {loginLoading ? '登录中...' : '登录'}
              </button>
              <button className="ghost-button slim" type="button" onClick={onResetPassword}>
                重置密码
              </button>
            </div>
          </form>

          <div className="login-assist">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={rememberAccount}
                onChange={(event) => setRememberAccount(event.target.checked)}
              />
              记住账号
            </label>
            <button className="text-link" type="button" onClick={onRegister}>
              英才账号注册
            </button>
          </div>

          <label className="privacy-row">
            <input
              type="checkbox"
              checked={acceptPrivacy}
              onChange={(event) => setAcceptPrivacy(event.target.checked)}
            />
            <span>
              我已阅读并同意《档案保密协议》《隐私协议》
            </span>
          </label>

          <div className="login-divider">
            <span>第三方登录</span>
          </div>

          <div className="third-login">
            <button type="button" className="third-button" onClick={() => onThirdLogin('企业微信')}>
              <span className="third-dot wecom" />企业微信
            </button>
            <button type="button" className="third-button" onClick={() => onThirdLogin('钉钉')}>
              <span className="third-dot dingtalk" />钉钉
            </button>
            <button type="button" className="third-button" onClick={() => onThirdLogin('飞书')}>
              <span className="third-dot feishu" />飞书
            </button>
          </div>

          <p className="login-security">建议在 HTTPS 环境下使用，传输自动加密。</p>
        </div>
      </div>

      <footer className="login-footer">
        <span>© 2026 金岩高新人才成长APP</span>
        <a className="footer-link" href="https://www.grkaolin.com/" target="_blank" rel="noreferrer">
          企业官网
        </a>
      </footer>
    </section>
  );
}

export default LoginHero;
