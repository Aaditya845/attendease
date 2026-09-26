const {
  calculatePercentage,
  getStatus,
  predictAttendance,
  lecturesNeededToReachTarget
} = require('../server/utils/attendance');

describe('calculatePercentage', () => {
  test('computes a basic percentage', () => {
    expect(calculatePercentage(20, 25)).toBe(80);
  });

  test('handles zero total safely instead of dividing by zero', () => {
    expect(calculatePercentage(0, 0)).toBe(0);
  });

  test('rounds to two decimal places', () => {
    expect(calculatePercentage(23, 31)).toBeCloseTo(74.19, 2);
  });
});

describe('getStatus', () => {
  test('flags attendance at or above the requirement as Safe', () => {
    expect(getStatus(85, 75)).toBe('Safe');
  });

  test('flags attendance in the 10-point buffer as Warning', () => {
    expect(getStatus(70, 75)).toBe('Warning');
  });

  test('flags attendance well below requirement as Critical', () => {
    expect(getStatus(50, 75)).toBe('Critical');
  });
});

describe('predictAttendance', () => {
  test('returns one scenario per possible outcome, best case first', () => {
    const result = predictAttendance(20, 25, 3);
    expect(result).toHaveLength(4); // attended 3, 2, 1, 0
    expect(result[0].attended).toBe(3);
    expect(result[0].percentage).toBeCloseTo(82.14, 1);
    expect(result[3].attended).toBe(0);
  });

  test('treats a negative or missing upcoming count as zero', () => {
    const result = predictAttendance(10, 10, -5);
    expect(result).toHaveLength(1);
    expect(result[0].of).toBe(0);
  });
});

describe('lecturesNeededToReachTarget', () => {
  test('returns 0 when already at or above target', () => {
    expect(lecturesNeededToReachTarget(80, 100, 75)).toBe(0);
  });

  test('returns a positive count when below target', () => {
    const needed = lecturesNeededToReachTarget(20, 30, 75);
    expect(needed).toBeGreaterThan(0);
  });
});
