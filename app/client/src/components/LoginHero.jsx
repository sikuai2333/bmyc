import React from 'react';

const ROLE_PRESETS = {
  user: { label: '普通用户', email: 'user@talent.local', password: 'User#123' },
  admin: { label: '管理员', email: 'admin@talent.local', password: 'Admin#123' },
  super: { label: '超级管理员', email: 'super@talent.local', password: 'Super#123' }
};

function LoginHero({ loginForm, setLoginForm, onSubmit }) {
  const selectedRole = loginForm.role || 'user';
  const selectedPreset = ROLE_PRESETS[selectedRole];

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
            <span>账号类型</span>
            <select
              value={selectedRole}
              onChange={(event) => {
                const role = event.target.value;
                const preset = ROLE_PRESETS[role];
                setLoginForm((prev) => ({
                  ...prev,
                  role,
                  email: preset.email,
                  password: preset.password
                }));
              }}
            >
              {Object.entries(ROLE_PRESETS).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </label>
          <div className="muted" style={{ fontSize: 12 }}>
            当前账号：{selectedPreset.email}
          </div>
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
              onClick={() =>
                setLoginForm({
                  role: 'user',
                  email: ROLE_PRESETS.user.email,
                  password: ROLE_PRESETS.user.password
                })
              }
            >
              重置选择
            </button>
          </div>
        </form>
        <p className="login-hint">没有账号？请联系系统管理员开通。</p>
      </div>
    </section>
  );
}

export default LoginHero;
