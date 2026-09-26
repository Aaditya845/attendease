if (getToken()) {
  window.location.href = 'dashboard.html';
}

const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

tabLogin.addEventListener('click', () => {
  tabLogin.classList.add('active');
  tabRegister.classList.remove('active');
  loginForm.style.display = 'flex';
  registerForm.style.display = 'none';
});

tabRegister.addEventListener('click', () => {
  tabRegister.classList.add('active');
  tabLogin.classList.remove('active');
  registerForm.style.display = 'flex';
  loginForm.style.display = 'none';
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('loginError');
  errorEl.textContent = '';
  try {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
      })
    });
    setSession(data.token, data.name);
    window.location.href = 'dashboard.html';
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('registerError');
  errorEl.textContent = '';
  try {
    await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('regName').value,
        rollNumber: document.getElementById('regRoll').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value
      })
    });
    tabLogin.click();
    document.getElementById('loginEmail').value = document.getElementById('regEmail').value;
  } catch (err) {
    errorEl.textContent = err.message;
  }
});
