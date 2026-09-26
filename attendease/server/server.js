require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');
const authRoutes = require('./routes/auth');
const subjectRoutes = require('./routes/subjects');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Only start listening when this file is run directly (not when required by tests)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  connectDB().finally(() => {
    app.listen(PORT, () => console.log(`AttendEase server running on port ${PORT}`));
  });
}

module.exports = app;
