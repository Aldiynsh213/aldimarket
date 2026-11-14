const currentUser = window.AldiAPI.getUser();
let paymentConfig = null;

function renderUserMenu() {
  const wrap = document.getElementById('userMenuWrap');
  if (!wrap) return;

  if (!currentUser) {
    wrap.innerHTML = `<a href="login.html" style="font-size:0.8rem;font-family:'Jost',sans-serif;font-weight:500;color:var(--c-ink);text-decoration:none;padding:0.4rem 0.9rem;border:1.5px solid var(--c-border);border-radius:20px;">Masuk</a>`;
    return;
  }

  const initials = (currentUser.name || currentUser.username || 'AM')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  wrap.innerHTML = `
    <div class="user-menu-wrap">
      <button class="user-btn" onclick="toggleUserMenu()">
        <div class="user-avatar">${initials}</div>
        ${(currentUser.name || currentUser.username).split(' ')[0]}
      </button>
      <div class="user-dropdown" id="userDd">
        <div style="padding:0.4rem 0.8rem 0.3rem;font-size:0.7rem;color:var(--c-muted);text-transform:uppercase;letter-spacing:0.06em">${currentUser.username || ''}</div>
        <div class="ud-divider"></div>
        <button class="ud-item" onclick="openOrderModal()">📦 Pesanan Saya</button>
        ${currentUser.role === 'owner' ? `<a href="owner.html" class="ud-item" style="text-decoration:none">📊 Dashboard Owner</a>` : ''}
        <button class="ud-item danger" onclick="doLogout()">Keluar</button>
      </div>
    </div>
  `;
}

function toggleUserMenu() {
  document.getElementById('userDd')?.classList.toggle('open');
}

function doLogout() {
  window.AldiAPI.clearSession();
  window.location.href = 'login.html';
}

document.addEventListener('click', (event) => {
  if (!event.target.closest('.user-menu-wrap')) {
    document.getElementById('userDd')?.classList.remove('open');
  }
});

async function getMyOrders() {
  if (!currentUser) return [];
  try {
    const result = await window.AldiAPI.request('/orders/me');
    return result.orders || [];
  } catch (error) {
    showToast(error.message);
    return [];
  }
}

async function openOrderModal() {
  const body = document.getElementById('omBody');

  if (!currentUser) {
    body.innerHTML = `<div class="om-empty"><span>🔒</span>Silakan login untuk melihat pesanan</div>`;
  } else {
    const orders = await getMyOrders();
    if (!orders.length) {
      body.innerHTML = `<div class="om-empty"><span>📦</span>Belum ada pesanan</div>`;
    } else {
      const statusLabel = { pending:'Menunggu', process:'Diproses', done:'Selesai', cancel:'Dibatalkan' };
      body.innerHTML = orders.map((order) => `
        <div class="order-item-card">
          <div class="oi-emoji">${order.items?.[0]?.emoji || '📦'}</div>
          <div class="oi-info">
            <div class="oi-name">${order.items.map(i => i.name + ' x' + i.qty).join(', ')}</div>
            <div class="oi-meta">${new Date(order.createdAt).toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'})} · ${order.paymentMethod || '-'}</div>
            <div class="oi-price">${formatRupiah(order.total)}</div>
            <div style="font-size:0.72rem;color:var(--c-muted);margin-top:0.3rem">${(order.paymentInstructions || []).join(' ')}</div>
          </div>
          <span class="oi-status status-${order.status}">${statusLabel[order.status] || order.status}</span>
        </div>
      `).join('');
    }
  }

  document.getElementById('orderOverlay').classList.add('open');
  document.getElementById('orderModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeOrderModal() {
  document.getElementById('orderOverlay').classList.remove('open');
  document.getElementById('orderModal').classList.remove('open');
  document.body.style.overflow = '';
}

async function loadPaymentMethods() {
  const select = document.getElementById('cfPaymentMethod');
  const hint = document.getElementById('paymentHint');
  if (!select || !hint) return;

  try {
    const result = await window.AldiAPI.request('/payment/public-config');
    paymentConfig = result.payment;
    select.innerHTML = (paymentConfig.methods || []).map((method) => `
      <option value="${method.id}" ${method.id === paymentConfig.defaultMethod ? 'selected' : ''}>
        ${method.label}
      </option>
    `).join('');
    updatePaymentHint();
  } catch (error) {
    select.innerHTML = `<option value="manual_wallet">Transfer Wallet Owner</option><option value="cod">COD</option>`;
    hint.textContent = 'Konfigurasi payment backend belum terbaca. Checkout tetap bisa lanjut.';
  }
}

function updatePaymentHint() {
  const select = document.getElementById('cfPaymentMethod');
  const hint = document.getElementById('paymentHint');
  if (!select || !hint) return;
  const method = select.value;
  if (method === 'cod') {
    hint.textContent = 'Pembayaran dilakukan saat barang diterima.';
    return;
  }
  if (paymentConfig) {
    const walletType = paymentConfig.walletType || 'wallet owner';
    const owner = paymentConfig.walletHolder ? ` atas nama ${paymentConfig.walletHolder}` : '';
    const hasNumber = paymentConfig.hasWalletNumber ? 'Nomor wallet sudah diatur owner.' : 'Owner belum mengisi nomor wallet.';
    hint.textContent = `Metode ini akan memberi instruksi transfer ke ${walletType}${owner}. ${hasNumber}`;
    return;
  }
  hint.textContent = 'Instruksi pembayaran akan tampil setelah order dibuat.';
}

async function openCheckout() {
  if (!cart.length) {
    showToast('Keranjang masih kosong!');
    return;
  }
  if (!currentUser) {
    showToast('Login dulu untuk checkout!');
    setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    return;
  }

  const summary = document.getElementById('checkoutSummary');
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  summary.innerHTML = `
    <div style="padding:0.5rem 0">
      ${cart.map((item) => `
        <div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid var(--c-border);font-size:0.85rem">
          <span>${item.name} x${item.qty}</span>
          <span style="font-weight:500">${formatRupiah(item.price * item.qty)}</span>
        </div>
      `).join('')}
      <div style="display:flex;justify-content:space-between;padding:0.8rem 0;font-weight:600;font-size:0.95rem">
        <span>Total</span>
        <span>${formatRupiah(total)}</span>
      </div>
    </div>
  `;

  if (currentUser.name) document.getElementById('cfName').value = currentUser.name;
  if (currentUser.phone) document.getElementById('cfPhone').value = currentUser.phone;
  await loadPaymentMethods();

  toggleCart();
  document.getElementById('checkoutOverlay').classList.add('open');
  document.getElementById('checkoutModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCheckoutModal() {
  document.getElementById('checkoutOverlay').classList.remove('open');
  document.getElementById('checkoutModal').classList.remove('open');
  document.body.style.overflow = '';
}

async function placeOrder() {
  const payload = {
    recipient: {
      name: document.getElementById('cfName').value.trim(),
      phone: document.getElementById('cfPhone').value.trim(),
      address: document.getElementById('cfAddress').value.trim(),
      city: document.getElementById('cfCity').value.trim(),
      post: document.getElementById('cfPost').value.trim()
    },
    paymentMethod: document.getElementById('cfPaymentMethod').value,
    items: cart.map((item) => ({ id: item.id, qty: item.qty }))
  };

  if (!payload.recipient.name || !payload.recipient.phone || !payload.recipient.address) {
    showToast('Isi data pengiriman dulu!');
    return;
  }

  try {
    const result = await window.AldiAPI.request('/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    cart = [];
    updateCartUI();
    closeCheckoutModal();
    showToast('✓ Pesanan berhasil dibuat!');

    const order = result.order;
    const body = document.getElementById('omBody');
    body.innerHTML = `
      <div class="order-item-card" style="margin-bottom:0">
        <div class="oi-emoji">${order.items?.[0]?.emoji || '📦'}</div>
        <div class="oi-info">
          <div class="oi-name">Order ${order.id}</div>
          <div class="oi-meta">${formatRupiah(order.total)} · ${order.paymentMethod}</div>
          <div style="font-size:0.75rem;color:var(--c-muted);margin-top:0.5rem;line-height:1.7">
            ${(order.paymentInstructions || []).map(line => `<div>• ${line}</div>`).join('')}
          </div>
        </div>
        <span class="oi-status status-${order.status}">Menunggu</span>
      </div>
    `;
    document.getElementById('orderOverlay').classList.add('open');
    document.getElementById('orderModal').classList.add('open');
    document.body.style.overflow = 'hidden';
  } catch (error) {
    showToast(error.message);
  }
}

document.getElementById('cfPaymentMethod')?.addEventListener('change', updatePaymentHint);

renderUserMenu();
window.toggleUserMenu = toggleUserMenu;
window.doLogout = doLogout;
window.openOrderModal = openOrderModal;
window.closeOrderModal = closeOrderModal;
window.openCheckout = openCheckout;
window.closeCheckoutModal = closeCheckoutModal;
window.placeOrder = placeOrder;
