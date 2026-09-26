/**
 * Core attendance math for AttendEase.
 * Kept as pure functions (no DB, no I/O) so they can be unit-tested
 * quickly and reliably inside CI.
 */

function calculatePercentage(present, total) {
  if (!total || total <= 0) return 0;
  return Math.round((present / total) * 10000) / 100; // 2 decimal places
}

function getStatus(percentage, requiredAttendance = 75) {
  const warningFloor = requiredAttendance - 10;
  if (percentage >= requiredAttendance) return 'Safe';
  if (percentage >= warningFloor) return 'Warning';
  return 'Critical';
}

/**
 * "Can I miss the next lecture?" calculator.
 * Returns one scenario for every possible count of lectures attended
 * out of the given number of upcoming lectures.
 */
function predictAttendance(present, total, upcoming) {
  const safeUpcoming = Math.max(0, parseInt(upcoming, 10) || 0);
  const scenarios = [];
  for (let attended = safeUpcoming; attended >= 0; attended--) {
    const newPresent = present + attended;
    const newTotal = total + safeUpcoming;
    scenarios.push({
      attended,
      of: safeUpcoming,
      percentage: calculatePercentage(newPresent, newTotal)
    });
  }
  return scenarios;
}

/**
 * How many consecutive future lectures (all attended) are needed
 * to reach a target percentage.
 */
function lecturesNeededToReachTarget(present, total, targetPercentage) {
  if (calculatePercentage(present, total) >= targetPercentage) return 0;
  let p = present;
  let t = total;
  let needed = 0;
  const maxIterations = 100000;
  while (calculatePercentage(p, t) < targetPercentage && needed < maxIterations) {
    p += 1;
    t += 1;
    needed += 1;
  }
  return needed;
}

module.exports = {
  calculatePercentage,
  getStatus,
  predictAttendance,
  lecturesNeededToReachTarget
};
