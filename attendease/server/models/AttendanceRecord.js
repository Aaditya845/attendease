const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  status: { type: String, enum: ['present', 'absent'], required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AttendanceRecord', recordSchema);
