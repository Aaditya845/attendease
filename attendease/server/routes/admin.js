const express = require('express');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const AttendanceRecord = require('../models/AttendanceRecord');
const requireAdmin = require('../middleware/adminAuth');
const { calculatePercentage, getStatus } = require('../utils/attendance');

const router = express.Router();
router.use(requireAdmin);

// Overview list: every student with their overall attendance
router.get('/students', async (req, res) => {
  const students = await Student.find({ role: 'student' })
    .select('name email rollNumber')
    .sort({ rollNumber: 1 });

  const results = await Promise.all(
    students.map(async (s) => {
      const subjects = await Subject.find({ student: s._id });
      const totalPresent = subjects.reduce((sum, x) => sum + x.present, 0);
      const totalLectures = subjects.reduce((sum, x) => sum + x.total, 0);
      const percentage = calculatePercentage(totalPresent, totalLectures);
      return {
        id: s._id,
        name: s.name,
        email: s.email,
        rollNumber: s.rollNumber,
        subjectCount: subjects.length,
        overall: { present: totalPresent, total: totalLectures, percentage },
        status: getStatus(percentage, 75)
      };
    })
  );

  res.json(results);
});

// Subject-wise breakdown for a single student
router.get('/students/:id', async (req, res) => {
  const student = await Student.findOne({ _id: req.params.id, role: 'student' }).select(
    'name email rollNumber'
  );
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const subjects = await Subject.find({ student: student._id });
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

  res.json({ student, subjects: withStats });
});

// Admin marks a single lecture present/absent for any student's subject
router.post('/students/:studentId/subjects/:subjectId/attendance', async (req, res) => {
  const { status } = req.body;
  if (!['present', 'absent'].includes(status)) {
    return res.status(400).json({ error: "status must be 'present' or 'absent'" });
  }

  const subject = await Subject.findOne({ _id: req.params.subjectId, student: req.params.studentId });
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

// Admin directly corrects a student's present/total counts for one subject
router.put('/students/:studentId/subjects/:subjectId', async (req, res) => {
  const { present, total } = req.body;
  const p = parseInt(present, 10);
  const t = parseInt(total, 10);

  if (Number.isNaN(p) || Number.isNaN(t) || p < 0 || t < 0 || p > t) {
    return res.status(400).json({ error: 'present must be a number between 0 and total' });
  }

  const subject = await Subject.findOneAndUpdate(
    { _id: req.params.subjectId, student: req.params.studentId },
    { present: p, total: t },
    { new: true }
  );
  if (!subject) return res.status(404).json({ error: 'Subject not found' });

  res.json({
    id: subject._id,
    present: subject.present,
    total: subject.total,
    percentage: calculatePercentage(subject.present, subject.total)
  });
});

module.exports = router;
