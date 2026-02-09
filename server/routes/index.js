const authRoutes = require('./auth');
const profileRoutes = require('./profile');
const personnelRoutes = require('./personnel');
const dimensionRoutes = require('./dimensions');
const meetingRoutes = require('./meetings');
const userRoutes = require('./users');
const insightRoutes = require('./insights');
const evaluationRoutes = require('./evaluations');
const growthRoutes = require('./growth');
const certificateRoutes = require('./certificates');
const importRoutes = require('./import');
const exportRoutes = require('./export');
const logRoutes = require('./logs');

function registerRoutes(app) {
  app.use(authRoutes);
  app.use(profileRoutes);
  app.use(personnelRoutes);
  app.use(dimensionRoutes);
  app.use(meetingRoutes);
  app.use(userRoutes);
  app.use(insightRoutes);
  app.use(evaluationRoutes);
  app.use(growthRoutes);
  app.use(certificateRoutes);
  app.use(importRoutes);
  app.use(exportRoutes);
  app.use(logRoutes);
}

module.exports = {
  registerRoutes
};
