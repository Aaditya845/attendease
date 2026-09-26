const express = require('express');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
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

module.exports = router;
