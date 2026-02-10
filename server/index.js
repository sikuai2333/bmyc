const { createApp } = require('./app');
const { PORT } = require('./config/env');

let appInstance = null;

function getApp() {
  if (!appInstance) {
    appInstance = createApp();
  }
  return appInstance;
}

function startServer() {
  const app = getApp();
  return app.listen(PORT, () => {
    console.log(`人才档案服务已启动: http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { getApp, startServer, createApp };
