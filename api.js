
(function initAldiMarketApi() {
  const API_BASE = `${window.location.origin}/api`;

  function getToken() {
    return sessionStorage.getItem('am_token') || '';
  }

  function getUser() {
    try {
      return JSON.parse(sessionStorage.getItem('am_user') || 'null');
    } catch (_error) {
      return null;
    }
  }

  function setSession(user, token) {
    sessionStorage.setItem('am_user', JSON.stringify(user));
    sessionStorage.setItem('am_token', token);
  }

  function clearSession() {
    sessionStorage.removeItem('am_user');
    sessionStorage.removeItem('am_token');
  }

  async function request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Request gagal.');
    }
    return data;
  }

  window.AldiAPI = {
    API_BASE,
    getToken,
    getUser,
    setSession,
    clearSession,
    request
  };
})();
