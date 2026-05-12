
const currentOwner = window.AldiAPI.getUser();
if (!currentOwner || currentOwner.role !== 'owner') {
  window.location.href = 'login.html';
}

const dashboardState = {
  dashboard: null,
  orders: [],
  products: [],
  customers: [],
  settings: null,
  orderFilter: 'all'
};

function formatRp(value) {
  return 'Rp ' + Number(value || 0).toLocaleString('id-ID');
}

function showToast(message) {
  const toast = document.getElementById('ownerToast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2400);
}

function setOwnerInfo() {
  const name = currentOwner.name || currentOwner.username || 'Owner';
  document.getElementById('ownerName').textContent = name;
  document.getElementById('ownerAvatar').textContent = name.split(' ').map((item) => item[0]).join('').slice(0, 2).toUpperCase();
}

function toggleSidebar(forceOpen) {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !sidebar.classList.contains('open');
  sidebar.classList.toggle('open', shouldOpen);
  overlay.classList.toggle('open', shouldOpen);
}
window.toggleSidebar = toggleSidebar;

function showPanel(tab) {
  document.querySelectorAll('.panel').forEach((panel) => panel.classList.toggle('active', panel.id === `panel-${tab}`));
  document.querySelectorAll('.tab-btn, .menu-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === tab));
  toggleSidebar(false);
}
window.showPanel = showPanel;

function statusBadge(value) {
  return `<span class="status ${value}">${({
    pending: 'Menunggu',
    process: 'Diproses',
    done: 'Selesai',
    cancel: 'Batal',
    waiting_payment: 'Menunggu Bayar',
    paid: 'Lunas',
    pay_later: 'Bayar Nanti',
    cancelled: 'Dibatalkan'
  })[value] || value}</span>`;
}

function renderStats() {
  const stats = dashboardState.dashboard?.stats || {};
  document.getElementById('statRevenue').textContent = formatRp(stats.revenue);
  document.getElementById('statOrders').textContent = stats.totalOrders || 0;
  document.getElementById('statActiveOrders').textContent = stats.activeOrders || 0;
  document.getElementById('statCustomers').textContent = stats.customers || 0;
  document.getElementById('statAvg').textContent = `AOV ${formatRp(stats.averageOrderValue)}`;
  document.getElementById('statRevenueNote').textContent = `${stats.totalOrders || 0} transaksi tercatat`;
}

function renderRevenueChart() {
  const bars = document.getElementById('revenueBars');
  const months = dashboardState.dashboard?.monthlyRevenue || [];
  if (!months.length) {
    bars.innerHTML = `<div class="empty" style="width:100%">Belum ada data revenue.</div>`;
    return;
  }
  const max = Math.max(...months.map((item) => item.revenue), 1);
  bars.innerHTML = months.map((item) => {
    const pct = Math.max(8, Math.round((item.revenue / max) * 100));
    return `
      <div class="bar-col">
        <div class="bar-money">${formatRp(item.revenue)}</div>
        <div class="bar" style="height:${pct}%"></div>
        <div class="bar-label">${item.label}</div>
      </div>
    `;
  }).join('');
}

function renderTopProducts() {
  const wrap = document.getElementById('topProductsList');
  const items = dashboardState.dashboard?.topProducts || [];
  if (!items.length) {
    wrap.innerHTML = `<div class="empty">Belum ada produk terjual.</div>`;
    return;
  }
  wrap.innerHTML = items.map((item) => `
    <div class="mini-item">
      <div class="mini-emoji">${item.emoji || '📦'}</div>
      <div>
        <div style="font-weight:600">${item.name}</div>
        <div class="muted">${item.qty} item terjual</div>
      </div>
      <div class="mono">${formatRp(item.revenue)}</div>
    </div>
  `).join('');
}

function renderLatestOrders() {
  const tbody = document.getElementById('latestOrdersBody');
  const items = dashboardState.dashboard?.latestOrders || [];
  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty">Belum ada order.</div></td></tr>`;
    return;
  }
  tbody.innerHTML = items.map((order) => `
    <tr>
      <td class="mono">${order.id}</td>
      <td>${order.userName || '-'}</td>
      <td>${order.items.map((item) => `${item.name} x${item.qty}`).join(', ')}</td>
      <td class="mono">${formatRp(order.total)}</td>
      <td>${statusBadge(order.paymentStatus || 'waiting_payment')}</td>
      <td>${statusBadge(order.status)}</td>
    </tr>
  `).join('');
}

function renderOrders() {
  const tbody = document.getElementById('ordersBody');
  let items = [...dashboardState.orders];
  if (dashboardState.orderFilter !== 'all') {
    items = items.filter((order) => order.status === dashboardState.orderFilter);
  }

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty">Tidak ada order untuk filter ini.</div></td></tr>`;
    return;
  }

  tbody.innerHTML = items.map((order) => `
    <tr>
      <td>
        <div class="mono">${order.id}</div>
        <div class="muted">${new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
      </td>
      <td>
        <div style="font-weight:600">${order.userName || '-'}</div>
        <div class="muted">${order.userPhone || '-'}</div>
      </td>
      <td style="min-width:230px">
        <div>${order.recipient?.address || '-'}</div>
        <div class="muted">${order.recipient?.city || ''} ${order.recipient?.post || ''}</div>
        <div class="muted">${order.items.map((item) => `${item.name} x${item.qty}`).join(', ')}</div>
      </td>
      <td class="mono">${formatRp(order.total)}</td>
      <td>
        <div>${order.paymentMethod || '-'}</div>
        <div style="margin-top:6px">${statusBadge(order.paymentStatus || 'waiting_payment')}</div>
      </td>
      <td>${statusBadge(order.status)}</td>
      <td>
        <div class="row-actions">
          ${order.status === 'pending' ? `<button class="small-btn success" onclick="updateOrderStatus('${order.id}','process')">Proses</button>` : ''}
          ${order.status === 'process' ? `<button class="small-btn success" onclick="updateOrderStatus('${order.id}','done')">Selesai</button>` : ''}
          ${['pending','process'].includes(order.status) ? `<button class="small-btn danger" onclick="updateOrderStatus('${order.id}','cancel')">Batal</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}
window.updateOrderStatus = async function updateOrderStatus(orderId, status) {
  try {
    await window.AldiAPI.request(`/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    showToast('Status order diperbarui');
    await reloadAll();
    showPanel('orders');
  } catch (error) {
    showToast(error.message);
  }
};

function fillProductForm(product = null) {
  document.getElementById('productId').value = product?.id || '';
  document.getElementById('productName').value = product?.name || '';
  document.getElementById('productPrice').value = product?.price || '';
  document.getElementById('productCategory').value = product?.category || 'atk';
  document.getElementById('productBadge').value = product?.badge || '';
  document.getElementById('productEmoji').value = product?.emoji || '';
  document.getElementById('productImage').value = product?.img || '';
  document.getElementById('productDesc').value = product?.desc || '';
  document.getElementById('productSubmitBtn').textContent = product ? 'Update Produk' : 'Simpan Produk';
}

function resetProductForm() {
  fillProductForm(null);
}
window.resetProductForm = resetProductForm;

function renderProducts() {
  const tbody = document.getElementById('productsBody');
  const items = dashboardState.products || [];
  document.getElementById('productCountBadge').textContent = `${items.length} produk`;

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty">Belum ada produk.</div></td></tr>`;
    return;
  }

  tbody.innerHTML = items.map((product) => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:12px">
          <div class="mini-emoji">${product.emoji || '📦'}</div>
          <div>
            <div style="font-weight:600">${product.name}</div>
            <div class="muted">${product.desc || '-'}</div>
          </div>
        </div>
      </td>
      <td>${product.category}</td>
      <td class="mono">${formatRp(product.price)}</td>
      <td>${product.badge || '—'}</td>
      <td>
        <div class="row-actions">
          <button class="small-btn" onclick="editProduct('${product.id}')">Edit</button>
          <button class="small-btn danger" onclick="deleteProduct('${product.id}')">Hapus</button>
        </div>
      </td>
    </tr>
  `).join('');
}
window.editProduct = function editProduct(productId) {
  const product = dashboardState.products.find((item) => String(item.id) === String(productId));
  if (!product) return;
  fillProductForm(product);
  showPanel('products');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteProduct = async function deleteProduct(productId) {
  if (!window.confirm('Hapus produk ini?')) return;
  try {
    await window.AldiAPI.request(`/admin/products/${productId}`, { method: 'DELETE' });
    showToast('Produk dihapus');
    await reloadAll();
    showPanel('products');
  } catch (error) {
    showToast(error.message);
  }
};

function renderCustomers() {
  const tbody = document.getElementById('customersBody');
  const customers = dashboardState.customers || [];
  document.getElementById('customerCountBadge').textContent = `${customers.length} pelanggan`;

  if (!customers.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty">Belum ada pelanggan.</div></td></tr>`;
    return;
  }

  tbody.innerHTML = customers.map((customer) => `
    <tr>
      <td class="mono">${customer.username}</td>
      <td>${customer.name || '-'}</td>
      <td>${customer.phone || '-'}</td>
      <td>${customer.email || '-'}</td>
      <td>${customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
    </tr>
  `).join('');
}

function renderPaymentSettings() {
  const payment = dashboardState.settings?.payment || {};
  document.getElementById('payDefaultMethod').value = payment.defaultMethod || 'manual_wallet';
  document.getElementById('payCurrency').value = payment.currency || 'IDR';
  document.getElementById('payWalletType').value = payment.walletType || '';
  document.getElementById('payWalletNumber').value = payment.walletNumber || '';
  document.getElementById('payWalletHolder').value = payment.walletHolder || '';
  document.getElementById('payQris').value = payment.qrisImageUrl || '';
  document.getElementById('payInstructions').value = payment.instructions || '';
  document.getElementById('payPaypalEnabled').value = String(Boolean(payment.paypalEnabled));
  document.getElementById('payPaypalClientId').value = payment.paypalClientId || '';
  document.getElementById('payPaypalSecret').value = payment.paypalSecret || '';
}

async function loadDashboard() {
  const result = await window.AldiAPI.request('/admin/dashboard');
  dashboardState.dashboard = result;
  renderStats();
  renderRevenueChart();
  renderTopProducts();
  renderLatestOrders();
}

async function loadOrders() {
  const result = await window.AldiAPI.request('/admin/orders');
  dashboardState.orders = result.orders || [];
  renderOrders();
}

async function loadProducts() {
  const result = await window.AldiAPI.request('/admin/products');
  dashboardState.products = result.products || [];
  renderProducts();
}

async function loadCustomers() {
  const result = await window.AldiAPI.request('/admin/customers');
  dashboardState.customers = result.customers || [];
  renderCustomers();
}

async function loadSettings() {
  const result = await window.AldiAPI.request('/admin/settings');
  dashboardState.settings = result.settings || {};
  renderPaymentSettings();
}

async function reloadAll() {
  try {
    await Promise.all([
      loadDashboard(),
      loadOrders(),
      loadProducts(),
      loadCustomers(),
      loadSettings()
    ]);
  } catch (error) {
    showToast(error.message);
  }
}
window.reloadAll = reloadAll;

document.getElementById('refreshBtn').addEventListener('click', reloadAll);
document.getElementById('goStoreBtn').addEventListener('click', () => { window.location.href = 'index.html'; });
document.getElementById('logoutBtn').addEventListener('click', () => {
  window.AldiAPI.clearSession();
  window.location.href = 'login.html';
});

document.querySelectorAll('.tab-btn, .menu-btn').forEach((btn) => {
  btn.addEventListener('click', () => showPanel(btn.dataset.tab));
});

document.getElementById('orderFilters').addEventListener('click', (event) => {
  const button = event.target.closest('.chip');
  if (!button) return;
  dashboardState.orderFilter = button.dataset.status;
  document.querySelectorAll('#orderFilters .chip').forEach((chip) => chip.classList.toggle('active', chip === button));
  renderOrders();
});

document.getElementById('productForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const productId = document.getElementById('productId').value;
  const payload = {
    name: document.getElementById('productName').value.trim(),
    price: Number(document.getElementById('productPrice').value),
    category: document.getElementById('productCategory').value,
    badge: document.getElementById('productBadge').value.trim(),
    emoji: document.getElementById('productEmoji').value.trim(),
    img: document.getElementById('productImage').value.trim(),
    desc: document.getElementById('productDesc').value.trim()
  };

  try {
    if (productId) {
      await window.AldiAPI.request(`/admin/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      showToast('Produk diperbarui');
    } else {
      await window.AldiAPI.request('/admin/products', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showToast('Produk ditambahkan');
    }
    resetProductForm();
    await Promise.all([loadProducts(), loadDashboard()]);
    showPanel('products');
  } catch (error) {
    showToast(error.message);
  }
});

document.getElementById('productResetBtn').addEventListener('click', resetProductForm);

document.getElementById('paymentForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    defaultMethod: document.getElementById('payDefaultMethod').value,
    currency: document.getElementById('payCurrency').value.trim(),
    walletType: document.getElementById('payWalletType').value.trim(),
    walletNumber: document.getElementById('payWalletNumber').value.trim(),
    walletHolder: document.getElementById('payWalletHolder').value.trim(),
    qrisImageUrl: document.getElementById('payQris').value.trim(),
    instructions: document.getElementById('payInstructions').value.trim(),
    paypalEnabled: document.getElementById('payPaypalEnabled').value === 'true',
    paypalClientId: document.getElementById('payPaypalClientId').value.trim(),
    paypalSecret: document.getElementById('payPaypalSecret').value.trim()
  };

  try {
    await window.AldiAPI.request('/admin/settings/payment', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    showToast('Payment settings disimpan');
    await loadSettings();
  } catch (error) {
    showToast(error.message);
  }
});

setOwnerInfo();
reloadAll();
