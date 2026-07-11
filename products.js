// Products page: grid + cart + WhatsApp checkout (ES module).
import { db, initAccountUI, onUserChange } from "./auth.js";
import {
  collection, query, orderBy, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const STORE_PHONE = "9647735128002";
const CART_KEY = "bnt_cart";

// ── Language toggle ───────────────────────────────────────────────────────
function setLang(lang) {
  const body = document.body;
  const titleEl = document.querySelector('title');
  const flower = '🌸 ';
  if (lang === 'ar') {
    body.classList.add('lang-ar'); body.classList.remove('lang-en');
    document.documentElement.lang = 'ar'; document.documentElement.dir = 'rtl';
    document.getElementById('btn-ar').classList.add('active');
    document.getElementById('btn-en').classList.remove('active');
    document.title = flower + (titleEl.dataset.ar || 'متجر بنت بغداد');
  } else {
    body.classList.add('lang-en'); body.classList.remove('lang-ar');
    document.documentElement.lang = 'en'; document.documentElement.dir = 'ltr';
    document.getElementById('btn-en').classList.add('active');
    document.getElementById('btn-ar').classList.remove('active');
    document.title = flower + (titleEl.dataset.en || 'Bnt Baghdad Shop');
  }
}
const sys = (navigator.language || navigator.userLanguage || 'ar').toLowerCase();
setLang(sys.startsWith('en') ? 'en' : 'ar');
document.getElementById('btn-en').addEventListener('click', () => setLang('en'));
document.getElementById('btn-ar').addEventListener('click', () => setLang('ar'));

// Set as soon as this module has executed (proves products.js loaded). products.html
// shows a hint if this never becomes true (e.g. opened as a file:// instead of via a server).
window.__productsReady = true;

// ── Helpers ───────────────────────────────────────────────────────────────
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function fmt(n) { return Number(n || 0).toLocaleString('en-US'); }
function fmtIQD(n) { return fmt(n) + ' IQD'; }

// ── Products grid ─────────────────────────────────────────────────────────
const grid = document.getElementById('products-grid');
let products = [];

async function loadProducts() {
  grid.innerHTML = '<p style="text-align:center;color:var(--muted)">…</p>';
  try {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProducts();
  } catch (e) {
    console.error('loadProducts failed:', e);
    grid.innerHTML = '<p style="text-align:center;color:var(--muted)">Could not load products. Check your Firestore rules.</p>';
  }
}

function renderProducts() {
  if (!products.length) {
    grid.innerHTML = '<p style="text-align:center;color:var(--muted)">No products yet.</p>';
    return;
  }
  grid.innerHTML = products.map(p => {
    const img = p.image
      ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" />`
      : `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3C/svg%3E" alt="" />`;
    return `
      <div class="product">
        ${img}
        <div class="p-body">
          <h3>${escapeHtml(p.name)}</h3>
          <div class="p-desc">${escapeHtml(p.description)}</div>
          <div class="p-price"><span>${escapeHtml(p.price)} IQD</span></div>
          <button class="order-btn add-cart" data-id="${escapeHtml(p.id)}">
            <span class="lang-en-only">Add to cart</span>
            <span class="lang-ar-only">أضف إلى السلة</span>
          </button>
        </div>
      </div>`;
  }).join('');
  grid.querySelectorAll('.add-cart').forEach(btn =>
    btn.addEventListener('click', () => addToCart(btn.dataset.id)));
}

// ── Cart (localStorage) ───────────────────────────────────────────────────
function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch (e) { return []; }
}
function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const cart = getCart();
  const existing = cart.find(i => i.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ id: p.id, name: p.name, price: p.price, image: p.image || '', qty: 1 });
  saveCart(cart);
  renderCart();
  openDrawer();
}

function changeQty(id, delta) {
  const cart = getCart();
  const it = cart.find(i => i.id === id);
  if (!it) return;
  it.qty += delta;
  const next = cart.filter(i => i.qty > 0);
  saveCart(next);
  renderCart();
}

function removeFromCart(id) {
  saveCart(getCart().filter(i => i.id !== id));
  renderCart();
}

const cartBody = document.getElementById('cart-body');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const drawer = document.getElementById('drawer');
const backdrop = document.getElementById('drawer-backdrop');

function renderCart() {
  const cart = getCart();
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  cartCount.textContent = totalQty;
  cartCount.style.display = totalQty ? 'inline-flex' : 'none';
  cartTotal.textContent = fmtIQD(total);

  if (!cart.length) {
    cartBody.innerHTML = '<p class="cart-empty"><span class="lang-en-only">Your cart is empty.</span><span class="lang-ar-only">سلتك فارغة.</span></p>';
    return;
  }
  cartBody.innerHTML = cart.map(i => `
    <div class="cart-item">
      ${i.image ? `<img src="${escapeHtml(i.image)}" alt="" />` : ''}
      <div class="ci-info">
        <div class="ci-name">${escapeHtml(i.name)}</div>
        <div class="ci-price">${escapeHtml(i.price)} IQD</div>
        <div class="ci-controls">
          <span class="qty">
            <button data-act="dec" data-id="${escapeHtml(i.id)}">−</button>
            <span>${i.qty}</span>
            <button data-act="inc" data-id="${escapeHtml(i.id)}">+</button>
          </span>
          <button class="ci-remove" data-act="rm" data-id="${escapeHtml(i.id)}">
            <span class="lang-en-only">Remove</span><span class="lang-ar-only">إزالة</span>
          </button>
        </div>
      </div>
    </div>`).join('');

  cartBody.querySelectorAll('[data-act]').forEach(btn => {
    const id = btn.dataset.id;
    if (btn.dataset.act === 'inc') btn.addEventListener('click', () => changeQty(id, 1));
    else if (btn.dataset.act === 'dec') btn.addEventListener('click', () => changeQty(id, -1));
    else if (btn.dataset.act === 'rm') btn.addEventListener('click', () => removeFromCart(id));
  });
}

function openDrawer() {
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  backdrop.hidden = false;
}
function closeDrawer() {
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  backdrop.hidden = true;
}

document.getElementById('cart-btn').addEventListener('click', openDrawer);
document.getElementById('drawer-close').addEventListener('click', closeDrawer);
backdrop.addEventListener('click', closeDrawer);

// ── Checkout → WhatsApp (bilingual) ───────────────────────────────────────
document.getElementById('checkout').addEventListener('click', () => {
  const cart = getCart();
  if (!cart.length) return;
  const lines = cart.map(i => {
    const line = Number(i.price) * i.qty;
    return `- ${i.name} x${i.qty} = ${fmt(line)} IQD (د.ع)`;
  });
  const total = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0);

  let text = "Hello, I would like to order:\n";
  text += "Order / الطلب:\n";
  text += lines.join("\n") + "\n";
  text += `Total / الإجمالي: ${fmt(total)} IQD (د.ع)\n`;

  window.open('https://wa.me/' + STORE_PHONE + '?text=' + encodeURIComponent(text), '_blank');
  saveCart([]);
  renderCart();
  closeDrawer();
});

// ── Account UI + init ─────────────────────────────────────────────────────
try {
  initAccountUI();
  onUserChange(() => {}); // ensure auth state is observed (admin gating not needed here)
} catch (e) {
  console.error('Account UI init failed:', e);
}
renderCart();
loadProducts();
