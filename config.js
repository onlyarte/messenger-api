require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  dbUrl: process.env.DB_URL,
  sessionSecret: process.env.SESSION_SECRET,
};
