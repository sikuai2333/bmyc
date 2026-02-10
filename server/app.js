const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { init } = require('./db');
const { corsOptions } = require('./middleware/cors');
const { registerRoutes } = require('./routes');
const { NODE_ENV } = require('./config/env');

function createApp() {
  init();

  const app = express();
  app.use(cors(corsOptions));
  app.use(bodyParser.json({ limit: '4mb' }));

  registerRoutes(app);

  if (NODE_ENV === 'production') {
    const distPath = path.join(__dirname, '..', 'client', 'dist');
    app.use(express.static(distPath));
    app.get('/*', (_, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  return app;
}

module.exports = {
  createApp
};
