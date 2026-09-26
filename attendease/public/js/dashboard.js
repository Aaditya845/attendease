if (requireLoginOrRedirect()) {
  loadDashboard();
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  clearSession();
  window.location.href = 'index.html';
});

let currentSubjects = [];

async function loadDashboard() {
  try {
    const data = await apiRequest('/subjects');
    currentSubjects = data.subjects;
    renderOverall(data.overall);
    renderTable(data.subjects);
    renderChart(data.subjects);
    populatePredictSelect(data.subjects);
    loadRecentRecords();
  } catch (err) {
    if (err.message.includes('token')) {
      clearSession();
      window.location.href = 'index.html';
    }
  }
}

function renderOverall(overall) {
  const el = document.getElementById('overallStats');
  el.innerHTML = `
    <div class="stat">
      <div class="num">${overall.percentage}%</div>
      <div class="label">Overall attendance</div>
    </div>
    <div class="stat">
      <div class="num">${overall.total}</div>
      <div class="label">Total lectures</div>
    </div>
    <div class="stat">
      <div class="num">${overall.present}</div>
      <div class="label">Present</div>
    </div>
    <div class="stat">
      <div class="num">${overall.total - overall.present}</div>
      <div class="label">Absent</div>
    </div>
  `;
}

function renderTable(subjects) {
  const body = document.getElementById('subjectTableBody');
  const emptyMsg = document.getElementById('noSubjectsMsg');
  body.innerHTML = '';

  if (subjects.length === 0) {
    emptyMsg.style.display = 'block';
    return;
  }
  emptyMsg.style.display = 'none';

  subjects.forEach((s) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(s.name)} <span style="color:var(--ink-soft);">(${escapeHtml(s.code)})</span></td>
      <td>${s.present}</td>
      <td>${s.total}</td>
      <td>${s.percentage}%</td>
      <td><span class="status-pill status-${s.status}">${s.status}</span></td>
    `;
    body.appendChild(row);
  });
}

function renderChart(subjects) {
  const el = document.getElementById('barChart');
  if (subjects.length === 0) {
    el.innerHTML = '<p class="empty-state">Add a subject to see the chart.</p>';
    return;
  }
  el.innerHTML = subjects.map((s) => {
    const color = s.status === 'Safe' ? 'var(--safe)' : s.status === 'Warning' ? 'var(--warning)' : 'var(--critical)';
    return `
      <div class="bar-row">
        <div class="bar-label">${escapeHtml(s.code)}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${Math.min(s.percentage, 100)}%; background:${color};"></div>
        </div>
        <div class="bar-pct">${s.percentage}%</div>
      </div>
    `;
  }).join('');
}

function populatePredictSelect(subjects) {
  const select = document.getElementById('predictSubject');
  select.innerHTML = subjects.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
}

document.getElementById('predictForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const subjectId = document.getElementById('predictSubject').value;
  const upcoming = document.getElementById('predictUpcoming').value;
  const resultEl = document.getElementById('predictResult');

  if (!subjectId) {
    resultEl.innerHTML = '<p class="empty-state">Add a subject first.</p>';
    return;
  }

  try {
    const data = await apiRequest(`/subjects/${subjectId}/predict?upcoming=${upcoming}`);
    resultEl.innerHTML = data.scenarios.map((s) => `
      <div class="predict-row">
        <span>Attend ${s.attended}/${s.of}</span>
        <span>${s.percentage}%</span>
      </div>
    `).join('') + `
      <p class="empty-state" style="margin-top:10px;">
        ${data.neededStreak === 0
          ? 'Already at or above the required attendance.'
          : `Need to attend the next ${data.neededStreak} lecture(s) in a row to reach ${data.requiredAttendance}%.`}
      </p>
    `;
  } catch (err) {
    resultEl.innerHTML = `<p class="error-msg">${err.message}</p>`;
  }
});

async function loadRecentRecords() {
  const el = document.getElementById('recentRecords');
  try {
    const records = await apiRequest('/subjects/records/recent');
    if (records.length === 0) {
      el.innerHTML = '<p class="empty-state">No attendance marked yet.</p>';
      return;
    }
    el.innerHTML = records.map((r) => `
      <div class="subject-card">
        <div>
          <div class="subject-name">${escapeHtml(r.subject?.name || 'Subject removed')}</div>
          <div class="subject-meta">${new Date(r.date).toLocaleString()}</div>
        </div>
        <span class="status-pill status-${r.status === 'present' ? 'Safe' : 'Critical'}">
          ${r.status === 'present' ? 'Present' : 'Absent'}
        </span>
      </div>
    `).join('');
  } catch (err) {
    el.innerHTML = '<p class="empty-state">Could not load recent records.</p>';
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
