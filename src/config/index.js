require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgres://contrib_user:contrib_pass@localhost:5432/contributions',
  databaseSsl: process.env.DATABASE_SSL === 'true',
};

module.exports = config;
