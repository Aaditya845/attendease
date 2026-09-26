if (requireLoginOrRedirect()) {
  if (getRole() !== 'admin') {
    window.location.href = 'dashboard.html';
  } else {
    loadStudents();
  }
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  clearSession();
  window.location.href = 'index.html';
});

async function loadStudents() {
  const body = document.getElementById('studentTableBody');
  const emptyMsg = document.getElementById('noStudentsMsg');
  try {
    const students = await apiRequest('/admin/students');
    body.innerHTML = '';

    if (students.length === 0) {
      emptyMsg.style.display = 'block';
      return;
    }
    emptyMsg.style.display = 'none';

    students.forEach((s) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${escapeHtml(s.rollNumber)}</td>
        <td>${escapeHtml(s.name)}</td>
        <td>${s.subjectCount}</td>
        <td>${s.overall.percentage}%</td>
        <td><span class="status-pill status-${s.status}">${s.status}</span></td>
        <td><button class="btn-small" data-id="${s.id}" data-name="${escapeHtml(s.name)}">View</button></td>
      `;
      body.appendChild(row);
    });

    document.querySelectorAll('button[data-id]').forEach((btn) => {
      btn.addEventListener('click', () => loadDetail(btn.dataset.id, btn.dataset.name));
    });
  } catch (err) {
    if (err.message.includes('token') || err.message.includes('Admin')) {
      clearSession();
      window.location.href = 'index.html';
    }
  }
}

let currentStudentId = null;

async function loadDetail(studentId, name) {
  currentStudentId = studentId;
  const panel = document.getElementById('detailPanel');
  const title = document.getElementById('detailTitle');
  const body = document.getElementById('detailTableBody');

  try {
    const data = await apiRequest(`/admin/students/${studentId}`);
    title.textContent = `${name} — subject breakdown`;
    body.innerHTML = data.subjects.map((s) => `
      <tr>
        <td>${escapeHtml(s.name)} (${escapeHtml(s.code)})</td>
        <td>
          <input type="number" min="0" class="edit-present" data-subject-id="${s.id}" value="${s.present}" style="width:64px; display:inline-block;" />
        </td>
        <td>
          <input type="number" min="0" class="edit-total" data-subject-id="${s.id}" value="${s.total}" style="width:64px; display:inline-block;" />
        </td>
        <td>${s.percentage}%</td>
        <td><span class="status-pill status-${s.status}">${s.status}</span></td>
        <td>
          <div class="btn-row">
            <button class="btn-small present" data-subject-id="${s.id}" data-status="present">Mark Present</button>
            <button class="btn-small absent" data-subject-id="${s.id}" data-status="absent">Mark Absent</button>
            <button class="btn-small" data-subject-id="${s.id}" data-action="save">Save</button>
          </div>
        </td>
      </tr>
    `).join('');
    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    attachDetailHandlers();
  } catch (err) {
    alert(err.message);
  }
}

function attachDetailHandlers() {
  document.querySelectorAll('button[data-status]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await apiRequest(`/admin/students/${currentStudentId}/subjects/${btn.dataset.subjectId}/attendance`, {
          method: 'POST',
          body: JSON.stringify({ status: btn.dataset.status })
        });
        const name = document.getElementById('detailTitle').textContent.split(' —')[0];
        loadDetail(currentStudentId, name);
        loadStudents();
      } catch (err) {
        alert(err.message);
      }
    });
  });

  document.querySelectorAll('button[data-action="save"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const subjectId = btn.dataset.subjectId;
      const presentInput = document.querySelector(`.edit-present[data-subject-id="${subjectId}"]`);
      const totalInput = document.querySelector(`.edit-total[data-subject-id="${subjectId}"]`);
      try {
        await apiRequest(`/admin/students/${currentStudentId}/subjects/${subjectId}`, {
          method: 'PUT',
          body: JSON.stringify({
            present: parseInt(presentInput.value, 10),
            total: parseInt(totalInput.value, 10)
          })
        });
        const name = document.getElementById('detailTitle').textContent.split(' —')[0];
        loadDetail(currentStudentId, name);
        loadStudents();
      } catch (err) {
        alert(err.message);
      }
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
