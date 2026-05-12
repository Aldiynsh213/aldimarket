(function initLoader() {
  const letters = document.querySelectorAll('.loader-logo span');
  letters.forEach((el, i) => { el.style.animationDelay = `${i * 0.07}s`; });
  const total = letters.length * 70 + 1400;
  setTimeout(() => {
    document.getElementById('loader')?.classList.add('hidden');
    triggerHeroReveal();
  }, total);
})();

function triggerHeroReveal() {
  document.querySelectorAll('#hero .reveal').forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), i * 120);
  });
}

const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

document.querySelectorAll('.reveal').forEach((el) => revealObs.observe(el));

const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  navbar?.classList.toggle('scrolled', window.scrollY > 60);
});

hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
});

function closeMenu() {
  hamburger?.classList.remove('open');
  navLinks?.classList.remove('open');
}

const themeToggle = document.getElementById('themeToggle');
let isDark = false;
themeToggle?.addEventListener('click', () => {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  themeToggle.textContent = isDark ? '🌙' : '☀️';
});

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

const fallbackProducts = [
  { id:1, name:'Pulpen Pilot G2', category:'atk', price:15000, desc:'Pulpen gel premium dengan tinta halus, nyaman untuk menulis lama.', badge:'Best', img:'images/products/pulpen-pilot.jpg', emoji:'✒️' },
  { id:2, name:'Buku Agenda Premium', category:'atk', price:45000, desc:'Agenda hard cover elegan, kertas tebal anti tembus.', badge:null, img:'images/products/agenda.jpg', emoji:'📓' },
  { id:3, name:'Stabilo Boss Set', category:'atk', price:28000, desc:'Set stabilo 6 warna untuk highlight dokumen penting.', badge:'Sale', img:'images/products/stabilo.jpg', emoji:'🖍️' },
  { id:4, name:'Staples + Isi Lengkap', category:'atk', price:32000, desc:'Staples besi tahan lama, sudah termasuk 1000 isi staples.', badge:null, img:'images/products/staples.jpg', emoji:'📎' },
  { id:5, name:'Penggaris Besi 30cm', category:'atk', price:18000, desc:'Penggaris stainless presisi tinggi untuk kebutuhan kantor.', badge:null, img:'images/products/penggaris.jpg', emoji:'📏' },
  { id:6, name:'Sticky Notes Pastel', category:'atk', price:22000, desc:'Sticky notes warna pastel, mudah ditempel dan dilepas.', badge:'New', img:'images/products/sticky-notes.jpg', emoji:'🗒️' },
  { id:7, name:'Mouse Wireless Logitech', category:'aksesoris', price:185000, desc:'Mouse wireless ergonomis, baterai tahan lama.', badge:'Best', img:'images/products/mouse-logitech.jpg', emoji:'🖱️' },
  { id:8, name:'Mousepad XL Desk Mat', category:'aksesoris', price:95000, desc:'Desk mat luas, permukaan halus untuk mouse dan keyboard.', badge:null, img:'images/products/mousepad.jpg', emoji:'🖱️' },
  { id:9, name:'Stand Laptop Adjustable', category:'aksesoris', price:145000, desc:'Stand laptop aluminium, tinggi dapat diatur.', badge:'New', img:'images/products/stand-laptop.jpg', emoji:'💻' },
  { id:10, name:'Headset Office Premium', category:'aksesoris', price:220000, desc:'Headset jernih untuk meeting dan kerja hybrid.', badge:null, img:'images/products/headset.jpg', emoji:'🎧' },
  { id:11, name:'USB Hub 4 Port', category:'aksesoris', price:75000, desc:'USB hub praktis untuk ekspansi port perangkat kerja.', badge:null, img:'images/products/usb-hub.jpg', emoji:'🔌' },
  { id:12, name:'Webcam HD 1080p', category:'aksesoris', price:310000, desc:'Webcam full HD untuk meeting dan streaming profesional.', badge:'New', img:'images/products/webcam.jpg', emoji:'📷' },
  { id:13, name:'Kemeja Pria Formal', category:'fashion', price:185000, desc:'Kemeja formal bahan adem untuk kerja harian.', badge:'Best', img:'images/products/kemeja-pria.jpg', emoji:'👔' },
  { id:14, name:'Kemeja Wanita Elegan', category:'fashion', price:175000, desc:'Kemeja wanita dengan cutting rapi dan tampilan elegan.', badge:null, img:'images/products/kemeja-wanita.jpg', emoji:'👗' },
  { id:15, name:'Celana Bahan Pria', category:'fashion', price:195000, desc:'Celana bahan nyaman untuk kantor dan acara formal.', badge:null, img:'images/products/celana-pria.jpg', emoji:'👖' },
  { id:16, name:'Sepatu Kerja Pria', category:'fashion', price:385000, desc:'Sepatu kerja premium, nyaman dipakai seharian.', badge:'Best', img:'images/products/sepatu-pria.jpg', emoji:'👞' },
  { id:17, name:'Tas Kerja Ransel Laptop', category:'fashion', price:275000, desc:'Tas kerja anti air dengan slot laptop.', badge:'New', img:'images/products/tas-ransel.jpg', emoji:'🎒' },
  { id:18, name:'Dompet Kulit Pria', category:'fashion', price:145000, desc:'Dompet kulit slim minimalis dengan banyak slot kartu.', badge:null, img:'images/products/dompet.jpg', emoji:'👛' }
];

let products = [];
let cart = [];
let modalProductId = null;
let currentCategory = 'all';
let currentSearch = '';

function formatRupiah(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

function getCatLabel(cat) {
  const map = {
    atk: '📝 ATK',
    aksesoris: '💻 Aksesoris',
    fashion: '👔 Fashion'
  };
  return map[cat] || cat;
}

async function loadProducts() {
  try {
    const result = await window.AldiAPI.request('/products');
    products = result.products || [];
  } catch (_error) {
    products = fallbackProducts;
    showToast('Mode offline produk aktif.');
  }
  applyFilter();
}

function renderProducts(list) {
  const grid = document.getElementById('productGrid');
  const noResult = document.getElementById('noResult');
  if (!grid || !noResult) return;

  if (!list.length) {
    grid.innerHTML = '';
    noResult.style.display = 'block';
    return;
  }

  noResult.style.display = 'none';

  grid.innerHTML = list.map((p) => `
    <div class="product-card reveal" onclick="openModal(${p.id})">
      <div class="product-img">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
        <img src="${p.img}" alt="${p.name}" loading="lazy"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"/>
        <span class="product-emoji" style="display:none">${p.emoji || '📦'}</span>
      </div>
      <div class="product-info">
        <p class="product-cat">${getCatLabel(p.category)}</p>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc-short">${p.desc || ''}</p>
        <div class="product-footer">
          <span class="product-price">${formatRupiah(p.price)}</span>
          <button class="product-add" onclick="event.stopPropagation(); addToCart(${p.id})">+ Keranjang</button>
        </div>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.reveal').forEach((el) => revealObs.observe(el));
}

function filterCategory(cat) {
  currentCategory = cat;
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    const text = btn.textContent.toLowerCase();
    btn.classList.toggle('active', text.includes(cat === 'all' ? 'semua' : cat));
  });
  applyFilter();
}

function filterProducts() {
  currentSearch = (document.getElementById('searchInput')?.value || '').toLowerCase();
  applyFilter();
}

function applyFilter() {
  let list = [...products];
  if (currentCategory !== 'all') {
    list = list.filter((item) => item.category === currentCategory);
  }
  if (currentSearch) {
    list = list.filter((item) =>
      item.name.toLowerCase().includes(currentSearch) ||
      (item.desc || '').toLowerCase().includes(currentSearch)
    );
  }
  renderProducts(list);
}

function toggleCart() {
  document.getElementById('cartSidebar')?.classList.toggle('open');
  document.getElementById('cartOverlay')?.classList.toggle('open');
  document.body.style.overflow = document.getElementById('cartSidebar')?.classList.contains('open') ? 'hidden' : '';
}

function addToCart(id) {
  const product = products.find((item) => Number(item.id) === Number(id));
  if (!product) return;
  const existing = cart.find((item) => Number(item.id) === Number(id));
  if (existing) existing.qty += 1;
  else cart.push({ ...product, qty: 1 });
  updateCartUI();
  showToast(`✓ ${product.name} ditambahkan`);
}

function removeFromCart(id) {
  cart = cart.filter((item) => Number(item.id) !== Number(id));
  updateCartUI();
}

function changeCartQty(id, delta) {
  const item = cart.find((entry) => Number(entry.id) === Number(id));
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(id);
    return;
  }
  updateCartUI();
}

function updateCartUI() {
  window.cart = cart;
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const itemsEl = document.getElementById('cartItems');
  const countEl = document.getElementById('cartCount');
  const totalEl = document.getElementById('cartTotal');

  if (countEl) countEl.textContent = count;
  if (totalEl) totalEl.textContent = formatRupiah(total);

  if (!itemsEl) return;

  if (!cart.length) {
    itemsEl.innerHTML = '<p class="cart-empty">Keranjang masih kosong</p>';
    return;
  }

  itemsEl.innerHTML = cart.map((item) => `
    <div class="cart-item">
      <div class="cart-item-img">
        <img src="${item.img}" alt="${item.name}"
             onerror="this.style.display='none'; this.parentElement.textContent='${item.emoji || '📦'}'"/>
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatRupiah(item.price * item.qty)}</div>
        <div class="cart-item-qty">
          <button onclick="changeCartQty(${item.id}, -1)">−</button>
          <span>${item.qty}</span>
          <button onclick="changeCartQty(${item.id}, 1)">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${item.id})">✕</button>
    </div>
  `).join('');
}

function checkoutWA() {
  if (!cart.length) return showToast('Keranjang masih kosong!');
  const waNumber = '6285692664690';
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const lines = cart.map((item) => `• ${item.name} x${item.qty} = ${formatRupiah(item.price * item.qty)}`).join('\n');
  const msg = encodeURIComponent(
    `Halo Aldi Market! Saya ingin memesan:\n\n${lines}\n\nTotal: ${formatRupiah(total)}\n\nMohon konfirmasi ya.`
  );
  window.open(`https://wa.me/${waNumber}?text=${msg}`, '_blank');
}

function openModal(id) {
  const product = products.find((item) => Number(item.id) === Number(id));
  if (!product) return;

  modalProductId = id;
  document.getElementById('modalQty').textContent = '1';
  document.getElementById('modalCategory').textContent = getCatLabel(product.category);
  document.getElementById('modalTitle').textContent = product.name;
  document.getElementById('modalPrice').textContent = formatRupiah(product.price);
  document.getElementById('modalDesc').textContent = product.desc || '';

  const imgWrap = document.getElementById('modalImg');
  imgWrap.innerHTML = `
    <img src="${product.img}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover"
         onerror="this.style.display='none'; this.parentElement.innerHTML+='<span style=\\'font-size:4rem\\'>${product.emoji || '📦'}</span>'"/>
  `;

  document.getElementById('modalOverlay')?.classList.add('open');
  document.getElementById('productModal')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay')?.classList.remove('open');
  document.getElementById('productModal')?.classList.remove('open');
  document.body.style.overflow = '';
}

function changeQty(delta) {
  const el = document.getElementById('modalQty');
  const value = Number(el.textContent || 1) + delta;
  if (value >= 1) el.textContent = String(value);
}

function addFromModal() {
  const qty = Number(document.getElementById('modalQty').textContent || '1');
  for (let i = 0; i < qty; i += 1) addToCart(modalProductId);
  closeModal();
  toggleCart();
}

window.filterCategory = filterCategory;
window.filterProducts = filterProducts;
window.toggleCart = toggleCart;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeCartQty = changeCartQty;
window.checkoutWA = checkoutWA;
window.openModal = openModal;
window.closeModal = closeModal;
window.changeQty = changeQty;
window.addFromModal = addFromModal;
window.closeMenu = closeMenu;
window.showToast = showToast;
window.formatRupiah = formatRupiah;
window.cart = cart;

loadProducts().then(() => updateCartUI());
