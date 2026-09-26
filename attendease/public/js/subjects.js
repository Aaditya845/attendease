if (requireLoginOrRedirect()) {
  loadSubjects();
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  clearSession();
  window.location.href = 'index.html';
});

async function loadSubjects() {
  const listEl = document.getElementById('subjectList');
  try {
    const data = await apiRequest('/subjects');
    if (data.subjects.length === 0) {
      listEl.innerHTML = '<p class="empty-state">No subjects yet. Add your first one above.</p>';
      return;
    }
    listEl.innerHTML = data.subjects.map((s) => `
      <div class="subject-card">
        <div>
          <div class="subject-name">${escapeHtml(s.name)} (${escapeHtml(s.code)})</div>
          <div class="subject-meta">${s.present}/${s.total} lectures — ${s.percentage}% — required ${s.requiredAttendance}%</div>
        </div>
        <div class="btn-row">
          <button class="btn-small present" data-id="${s.id}" data-status="present">Present</button>
          <button class="btn-small absent" data-id="${s.id}" data-status="absent">Absent</button>
          <button class="btn-small danger" data-id="${s.id}" data-action="delete">Delete</button>
        </div>
      </div>
    `).join('');
    attachActionHandlers();
  } catch (err) {
    listEl.innerHTML = `<p class="error-msg">${err.message}</p>`;
  }
}

function attachActionHandlers() {
  document.querySelectorAll('button[data-status]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await apiRequest(`/subjects/${btn.dataset.id}/attendance`, {
          method: 'POST',
          body: JSON.stringify({ status: btn.dataset.status })
        });
        loadSubjects();
      } catch (err) {
        alert(err.message);
      }
    });
  });

  document.querySelectorAll('button[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this subject and all its attendance records?')) return;
      try {
        await apiRequest(`/subjects/${btn.dataset.id}`, { method: 'DELETE' });
        loadSubjects();
      } catch (err) {
        alert(err.message);
      }
    });
  });
}

document.getElementById('addSubjectForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('addSubjectError');
  errorEl.textContent = '';
  try {
    await apiRequest('/subjects', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('subName').value,
        code: document.getElementById('subCode').value,
        requiredAttendance: parseInt(document.getElementById('subRequired').value, 10)
      })
    });
    document.getElementById('addSubjectForm').reset();
    document.getElementById('subRequired').value = 75;
    loadSubjects();
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
