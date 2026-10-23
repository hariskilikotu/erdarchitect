const app = require('./app');
const config = require('./config');
const db = require('./db/pool');

const server = app.listen(config.port, () => {
  console.log(`Contribution app running at http://localhost:${config.port}`);
});

function shutdown() {
  console.log('Shutting down...');
  server.close(() => db.end().finally(() => process.exit(0)));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
