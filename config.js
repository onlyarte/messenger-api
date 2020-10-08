require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  dbUrl: process.env.DB_URL,
  jwtSecret: process.env.JWT_SECRET,
};
