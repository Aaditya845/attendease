# AttendEase — Student Attendance Analytics System

AttendEase lets a student record attendance per subject and instantly see whether
they are safely above the required percentage, instead of calculating it by hand.

## Features

- Student registration and login (JWT-based auth, hashed passwords)
- Add subjects with a custom required-attendance threshold
- Mark each lecture Present / Absent with one click
- Dashboard: overall attendance, subject-wise table, status pills (Safe / Warning / Critical), bar chart
- "Can I miss the next lecture?" predictor — shows the resulting percentage for every possible outcome of the next *N* lectures, and how many lectures in a row you'd need to attend to get back above the requirement
- Recent attendance record log

## Tech stack

| Layer      | Technology                |
|------------|----------------------------|
| Frontend   | HTML, CSS, vanilla JavaScript |
| Backend    | Node.js, Express           |
| Database   | MongoDB Atlas (Mongoose)   |
| Auth       | JWT + bcrypt               |
| Testing    | Jest                       |
| CI/CD      | GitHub Actions             |
| Hosting    | Render                     |

## Project structure

```
attendease/
├── public/            # static frontend (HTML/CSS/JS)
├── server/
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routes (auth, subjects)
│   ├── middleware/      # JWT auth middleware
│   ├── utils/           # pure attendance-calculation logic
│   └── server.js
├── tests/               # Jest unit tests
├── .github/workflows/ci.yml
└── package.json
```

## Running locally

```bash
npm install
cp .env.example .env     # then fill in MONGODB_URI and JWT_SECRET
npm run dev               # starts the server with nodemon
```

Visit `http://localhost:3000`.

## Running tests

```bash
npm test
```

Tests exercise the pure attendance-calculation functions (`server/utils/attendance.js`)
directly, so they run instantly in CI with no database dependency.

## How attendance is calculated

```
Attendance % = (Lectures attended / Total lectures held) × 100
```

Status is derived from a configurable required percentage per subject:

- At or above the requirement → **Safe**
- Within 10 points below it → **Warning**
- More than 10 points below it → **Critical**

## Deployment

The app is deployed on Render as a Node web service, connected directly to this
GitHub repository. Every push to `main` triggers the GitHub Actions pipeline
(install → test → build check → deploy), and Render redeploys automatically.

## Viva-ready Q&A

**How is attendance calculated?**
Attendance percentage = present lectures ÷ total lectures × 100.

**Why Node.js and Express?**
Node lets the whole stack use JavaScript; Express provides routing and
middleware for the REST API with minimal boilerplate.

**Why MongoDB?**
Student, subject, and attendance-record data is naturally document-shaped and
varies slightly per student, which suits a flexible schema well.

**What is CI?**
Continuous Integration automatically installs dependencies, runs tests, and
verifies the build every time code is pushed.

**What is CD?**
Continuous Deployment takes a build that passed CI and deploys it to the
hosting platform without manual steps.

**What happens when a test fails?**
The workflow stops at the failed step and the `deploy` job — which depends on
`build-and-test` — never runs, so a broken build is never shipped.
