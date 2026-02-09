const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'talent-secret';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '';
const NODE_ENV = process.env.NODE_ENV || 'development';

module.exports = {
  PORT,
  JWT_SECRET,
  CLIENT_ORIGIN,
  NODE_ENV
};
