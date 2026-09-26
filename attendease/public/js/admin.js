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

async function loadDetail(studentId, name) {
  const panel = document.getElementById('detailPanel');
  const title = document.getElementById('detailTitle');
  const body = document.getElementById('detailTableBody');

  try {
    const data = await apiRequest(`/admin/students/${studentId}`);
    title.textContent = `${name} — subject breakdown`;
    body.innerHTML = data.subjects.map((s) => `
      <tr>
        <td>${escapeHtml(s.name)} (${escapeHtml(s.code)})</td>
        <td>${s.present}</td>
        <td>${s.total}</td>
        <td>${s.percentage}%</td>
        <td><span class="status-pill status-${s.status}">${s.status}</span></td>
      </tr>
    `).join('');
    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    alert(err.message);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
