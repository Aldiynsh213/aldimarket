async function doLogin() {
  const id = document.getElementById('loginId').value.trim();
  const pass = document.getElementById('loginPass').value;
  const err = document.getElementById('errorMsg');
  err.style.display = 'none';

  if (!id || !pass) {
    err.textContent = 'Isi semua kolom.';
    err.style.display = 'block';
    return;
  }

  try {
    const result = await window.AldiAPI.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: id,
        password: pass
      })
    });

    window.AldiAPI.setSession(result.user, result.token);
    window.location.href = result.user.role === 'owner' ? 'owner.html' : 'index.html';
  } catch (error) {
    err.textContent = error.message;
    err.style.display = 'block';
  }
}

document.getElementById('loginPass')?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') doLogin();
});
