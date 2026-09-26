/**
 * Seeds the database with demo data for CCA presentation purposes:
 * - 1 admin account
 * - 10 students, each with 5 subjects and a realistic attendance history
 *
 * Run with: npm run seed
 * (requires MONGODB_URI to be set, e.g. in a local .env file)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Student = require('./models/Student');
const Subject = require('./models/Subject');
const AttendanceRecord = require('./models/AttendanceRecord');

const SUBJECTS = [
  { name: 'Design and Analysis of Algorithms', code: 'DAA' },
  { name: 'Computer Networks', code: 'CN' },
  { name: 'Cloud Computing', code: 'CLOUD' },
  { name: 'Java Programming', code: 'JAVA' },
  { name: 'Mobile Application Development', code: 'MMA' }
];

const STUDENT_PASSWORD = 'student123';
const ADMIN_EMAIL = 'admin@attendease.test';
const ADMIN_PASSWORD = 'admin123';

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Add it to a local .env file first (see .env.example).');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB for seeding.');

  await AttendanceRecord.deleteMany({});
  await Subject.deleteMany({});
  await Student.deleteMany({});
  console.log('Cleared existing students, subjects, and attendance records.');

  const adminHashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await Student.create({
    name: 'Faculty Admin',
    email: ADMIN_EMAIL,
    password: adminHashed,
    rollNumber: 'ADMIN',
    role: 'admin'
  });
  console.log(`Admin created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);

  const hashedStudentPassword = await bcrypt.hash(STUDENT_PASSWORD, 10);

  for (let i = 1; i <= 10; i++) {
    const roll = `CS${String(i).padStart(3, '0')}`;
    const student = await Student.create({
      name: `Student ${i}`,
      email: `student${i}@attendease.test`,
      password: hashedStudentPassword,
      rollNumber: roll,
      role: 'student'
    });

    for (const subj of SUBJECTS) {
      const total = randomBetween(20, 32);
      const attendRate = Math.random() * (0.95 - 0.55) + 0.55; // between 55% and 95%
      const present = Math.min(total, Math.round(total * attendRate));

      const subject = await Subject.create({
        student: student._id,
        name: subj.name,
        code: subj.code,
        requiredAttendance: 75,
        present,
        total
      });

      const records = [];
      for (let d = 0; d < total; d++) {
        const isPresent = d < present;
        const date = new Date();
        date.setDate(date.getDate() - (total - d));
        records.push({ subject: subject._id, status: isPresent ? 'present' : 'absent', date });
      }
      await AttendanceRecord.insertMany(records);
    }

    console.log(`Seeded ${student.name} (${roll}) with ${SUBJECTS.length} subjects.`);
  }

  console.log('\nSeeding complete.');
  console.log(`Student logins: student1@attendease.test .. student10@attendease.test / password: ${STUDENT_PASSWORD}`);
  console.log(`Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
