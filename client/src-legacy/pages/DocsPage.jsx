import React from 'react';
import { DIMENSION_CATEGORIES, EVALUATION_TYPES } from '../constants';

function DocsPage({ user, roleLabel }) {
  const evaluationLabels = EVALUATION_TYPES.map((item) => item.label);
  const currentRole = user ? `${user.name} · ${roleLabel}` : '未登录';

  return (
    <section className="docs-page">
      <div className="panel docs-hero">
        <div>
          <p className="panel-subtitle">系统文档</p>
          <h2>金岩高新人才成长APP · 使用说明</h2>
          <p className="docs-lead">
            面向 HR、领导与应届生的统一档案平台，覆盖六维画像（月度）、评价管理、成长轨迹、
            会议活动与证书资产，确保数据可追溯、权限可分配、展示可控。
          </p>
        </div>
        <div className="docs-meta">
          <div>
            <span>当前登录</span>
            <strong>{currentRole}</strong>
          </div>
          <div>
            <span>核心模块</span>
            <strong>六维档案（月度） · 评价 · 成长 · 证书 · 会议</strong>
          </div>
          <div>
            <span>敏感字段</span>
            <strong>手机号 / 出生日期 / 婚恋详情</strong>
          </div>
        </div>
      </div>

      <div className="docs-grid">
        <div className="panel docs-card">
          <div className="panel-head">
            <h3>角色与权限分层</h3>
            <p className="panel-subtitle">角色可由超级管理员按需组合权限</p>
          </div>
          <div className="docs-role-grid">
            <article>
              <h4>超级管理员</h4>
              <p>全量权限、账号与权限配置、敏感信息默认可见。</p>
              <span className="role-tag">系统主人</span>
            </article>
            <article>
              <h4>管理员（HR/领导）</h4>
              <p>可维护全局档案与会议，领导可填写评价；HR 默认可见敏感信息，领导默认脱敏，可手动解锁。</p>
              <span className="role-tag">管理视图</span>
            </article>
            <article>
              <h4>展示专用</h4>
              <p>只读、永远脱敏，展示界面与领导一致但无编辑权限。</p>
              <span className="role-tag">汇报展示</span>
            </article>
            <article>
              <h4>普通用户</h4>
              <p>仅可编辑本人档案与六维数据，查看平台非敏感信息。</p>
              <span className="role-tag">自助维护</span>
            </article>
          </div>
        </div>

        <div className="panel docs-card">
          <div className="panel-head">
            <h3>六维画像范围</h3>
            <p className="panel-subtitle">分类固定，按月记录，不评分，可填写点评语句</p>
          </div>
          <div className="docs-chip-grid">
            {DIMENSION_CATEGORIES.map((item) => (
              <span key={item} className="tag-pill">
                {item}
              </span>
            ))}
          </div>
          <p className="muted">
            婚恋情况属于敏感内容，展示与导出时默认脱敏；月度未填写项默认记为“无”。
          </p>
        </div>
      </div>

      <div className="docs-grid">
        <div className="panel docs-card">
          <div className="panel-head">
            <h3>档案数据结构</h3>
            <p className="panel-subtitle">一人一档，字段可持续补充</p>
          </div>
          <div className="docs-table">
            <div className="docs-row">
              <span>基础档案</span>
              <strong>姓名 / 出生日期 / 性别 / 手机号 / 职务 / 部门 / 聚焦方向 / 简介</strong>
            </div>
            <div className="docs-row">
              <span>六维画像（月度）</span>
              <strong>月份 / 六维维度 / 记录内容（空则填“无”）</strong>
            </div>
            <div className="docs-row">
              <span>评价管理</span>
              <strong>{evaluationLabels.join(' / ')}</strong>
            </div>
            <div className="docs-row">
              <span>成长轨迹</span>
              <strong>时间 / 事件 / 描述 / 分类</strong>
            </div>
            <div className="docs-row">
              <span>证书信息</span>
              <strong>证书名称 / 颁发时间 / 附件 / 描述</strong>
            </div>
            <div className="docs-row">
              <span>会议活动</span>
              <strong>主题 / 时间 / 地点 / 摘要 / 参会人员</strong>
            </div>
          </div>
        </div>

        <div className="panel docs-card">
        <div className="panel-head">
          <h3>敏感信息与脱敏规则</h3>
          <p className="panel-subtitle">领导默认脱敏，HR 默认不脱敏，开关按账号记忆</p>
        </div>
        <ul className="docs-list">
          <li>手机号、出生日期、婚恋详情属于敏感字段。</li>
          <li>展示专用账号永远脱敏且不可解锁。</li>
          <li>HR 默认明文；领导默认脱敏，可一键切换并在本账号内持久化。</li>
          <li>普通用户可查看本人敏感信息，但不可查看他人明文。</li>
        </ul>
      </div>
      </div>

      <div className="panel docs-card">
        <div className="panel-head">
          <h3>关键流程指引</h3>
          <p className="panel-subtitle">从建档到展示的推荐路径</p>
        </div>
        <div className="docs-flow">
          <article>
            <h4>1. 新建人才与账号</h4>
            <p>管理员在管理后台创建人员档案，并自动生成对应账号。</p>
          </article>
          <article>
            <h4>2. 个人完善档案</h4>
            <p>应届生按月补充六维画像、个人资料与成长轨迹。</p>
          </article>
          <article>
            <h4>3. 领导评价</h4>
            <p>领导按季度/年度记录评价结果，支持婚恋补充评价。</p>
          </article>
          <article>
            <h4>4. 证书与活动</h4>
            <p>上传证书附件（pdf/jpg/png），录入会议活动与参会情况。</p>
          </article>
          <article>
            <h4>5. 汇报展示</h4>
            <p>展示账号打开脱敏大屏，随时用于上级汇报与审批演示。</p>
          </article>
        </div>
      </div>

      <div className="docs-grid">
        <div className="panel docs-card">
          <div className="panel-head">
            <h3>Excel 导入 / 导出</h3>
            <p className="panel-subtitle">导出为一人一表，导入支持校验</p>
          </div>
          <ul className="docs-list">
            <li>导出：一人一表，含月度六维矩阵、评价、成长与证书摘要。</li>
            <li>导入：模板需包含姓名、出生日期、性别、手机号、月份（可选）及六维字段列。</li>
            <li>校验：系统提示字段缺失或格式错误，避免脏数据进入档案库。</li>
          </ul>
        </div>

        <div className="panel docs-card">
          <div className="panel-head">
            <h3>操作日志与安全</h3>
            <p className="panel-subtitle">记录到人到字段，方便审计</p>
          </div>
          <ul className="docs-list">
            <li>操作日志记录操作者、时间与修改字段，管理员可统一查看。</li>
            <li>附件存储只读，避免证书文件被随意覆盖或删除。</li>
            <li>敏感信息默认脱敏，权限与开关状态按账号持久化。</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default DocsPage;
