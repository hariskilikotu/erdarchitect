const path = require('path');
const express = require('express');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/contributions', require('./routes/contributions.routes'));

// Unknown API routes
app.use('/api', (req, res) => res.status(404).json({ message: 'Not found.' }));

app.use(errorHandler);

module.exports = app;
