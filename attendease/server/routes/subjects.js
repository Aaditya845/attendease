const express = require('express');
const Subject = require('../models/Subject');
const AttendanceRecord = require('../models/AttendanceRecord');
const requireAuth = require('../middleware/auth');
const {
  calculatePercentage,
  getStatus,
  predictAttendance,
  lecturesNeededToReachTarget
} = require('../utils/attendance');

const router = express.Router();
router.use(requireAuth);

// List all subjects for the logged-in student, with computed stats + overall summary
router.get('/', async (req, res) => {
  const subjects = await Subject.find({ student: req.studentId }).sort({ createdAt: 1 });

  const withStats = subjects.map((s) => {
    const percentage = calculatePercentage(s.present, s.total);
    return {
      id: s._id,
      name: s.name,
      code: s.code,
      present: s.present,
      total: s.total,
      requiredAttendance: s.requiredAttendance,
      percentage,
      status: getStatus(percentage, s.requiredAttendance)
    };
  });

  const totalPresent = subjects.reduce((sum, s) => sum + s.present, 0);
  const totalLectures = subjects.reduce((sum, s) => sum + s.total, 0);

  res.json({
    subjects: withStats,
    overall: {
      present: totalPresent,
      total: totalLectures,
      percentage: calculatePercentage(totalPresent, totalLectures)
    }
  });
});

router.post('/', async (req, res) => {
  const { name, code, requiredAttendance } = req.body;
  if (!name || !code) {
    return res.status(400).json({ error: 'Subject name and code are required' });
  }

  const subject = await Subject.create({
    student: req.studentId,
    name,
    code,
    requiredAttendance: requiredAttendance || 75
  });

  res.status(201).json(subject);
});

router.delete('/:id', async (req, res) => {
  await Subject.deleteOne({ _id: req.params.id, student: req.studentId });
  await AttendanceRecord.deleteMany({ subject: req.params.id });
  res.status(204).end();
});

// Mark a single lecture as present or absent
router.post('/:id/attendance', async (req, res) => {
  const { status } = req.body;
  if (!['present', 'absent'].includes(status)) {
    return res.status(400).json({ error: "status must be 'present' or 'absent'" });
  }

  const subject = await Subject.findOne({ _id: req.params.id, student: req.studentId });
  if (!subject) return res.status(404).json({ error: 'Subject not found' });

  subject.total += 1;
  if (status === 'present') subject.present += 1;
  await subject.save();
  await AttendanceRecord.create({ subject: subject._id, status });

  res.json({
    id: subject._id,
    present: subject.present,
    total: subject.total,
    percentage: calculatePercentage(subject.present, subject.total)
  });
});

// "Can I miss the next lecture?" calculator
router.get('/:id/predict', async (req, res) => {
  const upcoming = parseInt(req.query.upcoming, 10) || 1;
  const subject = await Subject.findOne({ _id: req.params.id, student: req.studentId });
  if (!subject) return res.status(404).json({ error: 'Subject not found' });

  const scenarios = predictAttendance(subject.present, subject.total, upcoming);
  const neededStreak = lecturesNeededToReachTarget(
    subject.present,
    subject.total,
    subject.requiredAttendance
  );

  res.json({ scenarios, neededStreak, requiredAttendance: subject.requiredAttendance });
});

// Recent attendance records across all subjects, most recent first
router.get('/records/recent', async (req, res) => {
  const subjects = await Subject.find({ student: req.studentId }).select('_id');
  const subjectIds = subjects.map((s) => s._id);

  const records = await AttendanceRecord.find({ subject: { $in: subjectIds } })
    .sort({ date: -1 })
    .limit(15)
    .populate('subject', 'name code');

  res.json(records);
});

module.exports = router;
