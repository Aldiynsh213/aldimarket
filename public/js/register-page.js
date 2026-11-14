const countries = [
  { code: 'ID', flag: '🇮🇩', name: 'Indonesia', dial: '+62' },
  { code: 'MY', flag: '🇲🇾', name: 'Malaysia', dial: '+60' },
  { code: 'SG', flag: '🇸🇬', name: 'Singapura', dial: '+65' },
  { code: 'PH', flag: '🇵🇭', name: 'Filipina', dial: '+63' },
  { code: 'TH', flag: '🇹🇭', name: 'Thailand', dial: '+66' },
  { code: 'VN', flag: '🇻🇳', name: 'Vietnam', dial: '+84' },
  { code: 'BN', flag: '🇧🇳', name: 'Brunei', dial: '+673' },
  { code: 'KH', flag: '🇰🇭', name: 'Kamboja', dial: '+855' },
  { code: 'MM', flag: '🇲🇲', name: 'Myanmar', dial: '+95' },
  { code: 'LA', flag: '🇱🇦', name: 'Laos', dial: '+856' },
  { code: 'TL', flag: '🇹🇱', name: 'Timor Leste', dial: '+670' },
  { code: 'AU', flag: '🇦🇺', name: 'Australia', dial: '+61' },
  { code: 'JP', flag: '🇯🇵', name: 'Jepang', dial: '+81' },
  { code: 'KR', flag: '🇰🇷', name: 'Korea Selatan', dial: '+82' },
  { code: 'CN', flag: '🇨🇳', name: 'China', dial: '+86' },
  { code: 'IN', flag: '🇮🇳', name: 'India', dial: '+91' },
  { code: 'SA', flag: '🇸🇦', name: 'Arab Saudi', dial: '+966' },
  { code: 'AE', flag: '🇦🇪', name: 'Uni Emirat Arab', dial: '+971' },
  { code: 'QA', flag: '🇶🇦', name: 'Qatar', dial: '+974' },
  { code: 'GB', flag: '🇬🇧', name: 'Inggris', dial: '+44' },
  { code: 'US', flag: '🇺🇸', name: 'Amerika Serikat', dial: '+1' }
];

let selectedCountry = countries[0];
let filteredCountries = [...countries];

function renderCountryList() {
  const list = document.getElementById('countryList');
  list.innerHTML = filteredCountries.map((country, index) => `
    <div class="country-item ${country.code === selectedCountry.code ? 'active' : ''}" onclick="selectCountry(${index})">
      <span class="flag">${country.flag}</span>
      <span class="cname">${country.name}</span>
      <span class="cdial">${country.dial}</span>
    </div>
  `).join('');
}

function filterCountries() {
  const query = document.getElementById('countrySearch').value.toLowerCase();
  filteredCountries = countries.filter((country) => country.name.toLowerCase().includes(query) || country.dial.includes(query));
  renderCountryList();
}

function selectCountry(index) {
  selectedCountry = filteredCountries[index];
  document.getElementById('selFlag').textContent = selectedCountry.flag;
  document.getElementById('selDial').textContent = selectedCountry.dial;
  closeCountry();
}

function toggleCountry() {
  const dd = document.getElementById('countryDropdown');
  dd.classList.toggle('open');
  if (dd.classList.contains('open')) {
    document.getElementById('countrySearch').focus();
    renderCountryList();
  }
}

function closeCountry() {
  document.getElementById('countryDropdown').classList.remove('open');
}

document.addEventListener('click', (event) => {
  if (!event.target.closest('.country-select-wrap')) closeCountry();
});

function checkStrength() {
  const pass = document.getElementById('password').value;
  const bars = ['s1','s2','s3','s4'].map((id) => document.getElementById(id));
  const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#27ae60'];
  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  bars.forEach((bar, i) => { bar.style.background = i < score ? colors[Math.max(score - 1, 0)] : 'var(--border)'; });
}

function checkUsername() {
  const val = document.getElementById('username').value.trim();
  const err = document.getElementById('errUsername');
  if (val.length < 4) {
    err.textContent = 'Min. 4 karakter';
    err.style.display = 'block';
    return;
  }
  err.style.display = 'none';
}

async function doRegister() {
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const username = document.getElementById('username').value.trim();
  const phoneNum = document.getElementById('phoneNum').value.replace(/\D/g, '');
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPass = document.getElementById('confirmPass').value;

  const errBox = document.getElementById('errBox');
  const succBox = document.getElementById('succBox');
  errBox.style.display = 'none';
  succBox.style.display = 'none';

  let valid = true;

  if (!firstName) {
    document.getElementById('errFirstName').textContent = 'Nama depan wajib diisi';
    document.getElementById('errFirstName').style.display = 'block';
    valid = false;
  } else {
    document.getElementById('errFirstName').style.display = 'none';
  }

  if (username.length < 4) {
    document.getElementById('errUsername').textContent = 'Username minimal 4 karakter';
    document.getElementById('errUsername').style.display = 'block';
    valid = false;
  } else {
    document.getElementById('errUsername').style.display = 'none';
  }

  if (phoneNum.length < 7) {
    document.getElementById('errPhone').textContent = 'Nomor telepon tidak valid';
    document.getElementById('errPhone').style.display = 'block';
    document.getElementById('phoneRow').classList.add('has-error');
    valid = false;
  } else {
    document.getElementById('errPhone').style.display = 'none';
    document.getElementById('phoneRow').classList.remove('has-error');
  }

  if (password.length < 8) {
    document.getElementById('errPass').textContent = 'Password min. 8 karakter';
    document.getElementById('errPass').style.display = 'block';
    valid = false;
  } else {
    document.getElementById('errPass').style.display = 'none';
  }

  if (password !== confirmPass) {
    document.getElementById('errConfirm').textContent = 'Kata sandi tidak sama';
    document.getElementById('errConfirm').style.display = 'block';
    valid = false;
  } else {
    document.getElementById('errConfirm').style.display = 'none';
  }

  if (!valid) return;

  const fullPhone = `${selectedCountry.dial}${phoneNum}`;

  try {
    const result = await window.AldiAPI.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        firstName,
        lastName,
        username,
        email,
        phone: fullPhone,
        password
      })
    });

    window.AldiAPI.setSession(result.user, result.token);
    succBox.textContent = 'Akun berhasil dibuat! Mengalihkan...';
    succBox.style.display = 'block';
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1400);
  } catch (error) {
    errBox.textContent = error.message;
    errBox.style.display = 'block';
  }
}

renderCountryList();
