import React, { useState } from 'react';

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
  onThirdLogin,
  demoAccounts,
  demoAccountKey,
  onDemoSelect
}) {
  const [agreementOpen, setAgreementOpen] = useState('');
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
          </div>

          <form className="login-form" onSubmit={onSubmit}>
            <label className="input-field">
              <span>演示账号</span>
              <div className="input-group">
                <select value={demoAccountKey} onChange={(event) => onDemoSelect(event.target.value)}>
                  <option value="">选择内置账号</option>
                  {demoAccounts.map((account) => (
                    <option key={account.key} value={account.key}>
                      {account.label}
                    </option>
                  ))}
                </select>
              </div>
            </label>
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

          <div className="privacy-row">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={acceptPrivacy}
                onChange={(event) => setAcceptPrivacy(event.target.checked)}
              />
              <span>我已阅读并同意</span>
            </label>
            <div className="privacy-links">
              <button type="button" className="text-link" onClick={() => setAgreementOpen('confidential')}>
                《档案保密协议》
              </button>
              <button type="button" className="text-link" onClick={() => setAgreementOpen('privacy')}>
                《隐私协议》
              </button>
            </div>
          </div>

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

      {agreementOpen && (
        <div className="modal-backdrop" onClick={() => setAgreementOpen('')}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>{agreementOpen === 'confidential' ? '档案保密协议' : '隐私协议'}</h3>
                <p className="panel-subtitle">更新日期：2026-02-03</p>
              </div>
              <button className="modal-close" onClick={() => setAgreementOpen('')}>
                关闭
              </button>
            </div>
            {agreementOpen === 'confidential' ? (
              <div className="agreement-content">
                <p>为保障人才档案信息安全与合规使用，平台用户需遵守本协议。</p>
                <h4>一、保密信息范围</h4>
                <p>包括但不限于：个人身份信息、联系方式、六维画像、评价记录、成长轨迹、证书材料、操作日志等。</p>
                <h4>二、使用原则</h4>
                <ul>
                  <li>仅在履行岗位职责、获得授权的情况下查阅或处理信息。</li>
                  <li>遵循最小必要原则，不得超范围获取或传播。</li>
                  <li>对敏感信息应优先使用脱敏视图。</li>
                </ul>
                <h4>三、用户义务</h4>
                <ul>
                  <li>不得擅自复制、外传、截图或向第三方披露。</li>
                  <li>发现异常访问、泄露风险应及时反馈管理员。</li>
                </ul>
                <h4>四、责任与处理</h4>
                <p>违反本协议将依据公司制度及相关法律法规处理。</p>
                <h4>五、生效方式</h4>
                <p>勾选同意即视为接受本协议内容。</p>
              </div>
            ) : (
              <div className="agreement-content">
                <p>本协议说明平台对个人信息的收集、使用、存储与保护方式。</p>
                <h4>一、收集的信息类型</h4>
                <ul>
                  <li>账号信息：姓名、手机号、登录凭证。</li>
                  <li>档案信息：六维画像、评价、成长轨迹、证书与附件。</li>
                  <li>使用日志：登录记录、操作日志等安全审计信息。</li>
                </ul>
                <h4>二、使用目的</h4>
                <ul>
                  <li>完成人才档案管理、评价与成长跟踪。</li>
                  <li>进行统计分析与管理决策支持。</li>
                  <li>保障系统安全与合规审计。</li>
                </ul>
                <h4>三、存储与安全</h4>
                <p>平台采取合理安全措施（权限控制、脱敏展示、日志审计等）保护信息安全。</p>
                <h4>四、共享与披露</h4>
                <p>未经授权不向无关第三方提供；依法配合监管要求。</p>
                <h4>五、个人权利</h4>
                <p>可通过管理员申请查询、更正或删除个人信息。</p>
                <h4>六、生效方式</h4>
                <p>勾选同意即视为接受本协议内容。</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default LoginHero;




