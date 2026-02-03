## 金岩高新百名英才档案 – 本地运行说明

### 快速启动

```bash
cd app
npm install
npm run dev
```

开发模式会同时启动：

- `npm run dev:server` → Express + better-sqlite3 API（默认端口 `4000`）
- `npm --prefix client run dev` → Vite 前端（默认端口 `5173`）

### 生产环境配置

服务器端通过环境变量控制数据来源及种子逻辑，`.env` 示例：

```
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=talent-secret
ENABLE_DEMO_DATA=false
ADMIN_NAME=系统管理员
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=StrongPass#2024
DB_PATH=./data/bainyingcai.db
```

- `ENABLE_DEMO_DATA=false` 时将不会写入任何示例人员 / 会议数据，仅按 `ADMIN_*` 创建首个管理员账号。
- `DB_PATH` 可覆盖默认的 SQLite 路径，方便使用临时或网络磁盘。

### 管理员批量导入接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/api/import/people` | 批量导入或更新人才档案（含多维度）。 |
| `POST` | `/api/import/meetings` | 批量导入政治思想会议及参会名单。 |

请求头需携带 `Authorization: Bearer <token>`，payload 形如：

```json
{
  "people": [
    {
      "name": "李婷",
      "department": "金岩高新·创新加速中心",
      "title": "创新总监",
      "focus": "跨部门协同与成果转化",
      "bio": "负责统筹多维档案治理。",
      "dimensions": [
        { "category": "政治思想", "detail": "定期组织青年理论学习" },
        { "category": "工作成效", "detail": "推动 3 个示范项目落地" }
      ]
    }
  ]
}
```

会议导入支持按 `personId` 或 `personName` 关联既有人才：

```json
{
  "meetings": [
    {
      "topic": "季度人才盘点会",
      "meetingDate": "2026-02-01",
      "location": "数字治理会议室",
      "attendees": [
        { "personName": "李婷", "role": "主持" },
        { "personId": 2, "role": "参会" }
      ]
    }
  ]
}
```

### 前端体验要点

- 登录页不再暴露示例账号，请使用单位统一账号；首次登录需由管理员在后台创建。
- 大屏柱状图自动统计最近 6 个月会议量；若画像维度尚未导入，将提示“暂无画像统计”。
- 个人中心新增“批量数据导入”面板，仅管理员可见，可直接粘贴 JSON 同步人才与会议。

### 测试

运行 Node 原生测试（自动覆盖数据库引导与导入 API）：

```bash
cd app
npm test
```
