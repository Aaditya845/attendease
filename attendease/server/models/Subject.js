const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    requiredAttendance: { type: Number, default: 75 },
    present: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', subjectSchema);
