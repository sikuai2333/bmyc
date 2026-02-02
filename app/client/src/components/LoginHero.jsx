import React from 'react';

function LoginHero({ loginForm, setLoginForm, onSubmit }) {
  return (
    <section className="login-hero">
      <div className="login-card">
        <div className="login-brand">
          <p className="eyebrow">金岩高新</p>
          <h3>统一身份中心</h3>
          <p>人才档案入口 · 角色分级访问</p>
        </div>
        <form className="login-form" onSubmit={onSubmit}>
          <label>
            <span>账号/邮箱</span>
            <input
              type="text"
              placeholder="输入账号或邮箱"
              value={loginForm.email}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </label>
          <label>
            <span>登录密码</span>
            <input
              type="password"
              placeholder="••••••••"
              value={loginForm.password}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
            />
          </label>
          <div className="login-actions">
            <button type="submit" className="primary-button">
              进入系统
            </button>
            <button
              type="button"
              className="ghost-button slim"
              onClick={() => setLoginForm({ email: '', password: '' })}
            >
              清空输入
            </button>
          </div>
        </form>
        <p className="login-hint">没有账号？请联系系统管理员开通。</p>
      </div>
    </section>
  );
}

export default LoginHero;
