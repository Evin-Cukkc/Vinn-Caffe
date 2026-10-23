/* Vinn Caffe — UI aplikasi (kunci PIN, menu, keranjang, checkout, struk, riwayat, admin) */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rp = n => "Rp " + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sz = p => p.size_value ? `${+p.size_value} ${p.size_unit}` : "";
const find = c => S.products.find(p => p.code === c);
const dstr = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const tdate = t => new Date(t.replace(" ", "T"));
const fdate = t => tdate(t).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
const ftime = t => t.slice(11, 19);
const I = {
  menu: '<svg viewBox="0 0 24 24"><path d="M4 11h13v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 12h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3v3M12 3v3"/></svg>',
  cart: '<svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>',
  hist: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  admin: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
  lock: '<svg viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>'
};
const S = { products: [], settings: {}, role: null, cart: {}, tab: "menu", cat: "Semua", q: "", co: null, adm: "ringkasan", orders: null, rc: null, det: null, pimg: null };
try { S.cart = JSON.parse(localStorage.getItem("vc_cart")) || {}; } catch { S.cart = {}; }
const saveCart = () => { try { localStorage.setItem("vc_cart", JSON.stringify(S.cart)); } catch {} };
const active = () => S.products.filter(p => p.active);
const lowList = () => S.products.filter(p => p.active && p.stock <= CONFIG.LOW_STOCK);
function sanitize() {
  Object.keys(S.cart).forEach(c => { const p = find(c); if (!p || !p.active || p.stock < 1) delete S.cart[c]; else S.cart[c] = Math.min(S.cart[c], p.stock); });
  saveCart();
}
let tt; function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2400); }
function modal(h) { const m = $("#modal"); m.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${h}</div>`; m.hidden = false; document.body.classList.add("lock-scroll"); }
function closeModal() { $("#modal").hidden = true; $("#modal").innerHTML = ""; document.body.classList.remove("lock-scroll"); }

/* ================= layar kunci ================= */
let pin = "", busy = false;
const FRAME = matchMedia("screen and (min-width:700px) and (min-height:600px) and (hover:hover) and (pointer:fine)");
const toTop = () => (FRAME.matches ? $("#scroll") : window).scrollTo(0, 0);
function fit() { document.documentElement.style.setProperty("--k", Math.min(1, (innerHeight - 24) / 880, (innerWidth - 24) / 421).toFixed(3)); }
function tick() {
  const d = new Date(); $("#sbTime").textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  $("#lkDate").textContent = d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
  $("#lkTime").innerHTML = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}<small>:${String(d.getSeconds()).padStart(2, "0")}</small>`;
}
function netInfo() {
  const c = navigator.connection || {}, on = navigator.onLine;
  $$(".stNet").forEach(e => e.innerHTML = `<i class="dot ${on ? "ok" : "no"}"></i>${on ? (c.effectiveType ? c.effectiveType.toUpperCase() : "Online") : "Offline"}`);
}
async function batInfo() {
  try {
    const b = await navigator.getBattery(), u = () => $$(".stBat").forEach(e => e.textContent = `${b.charging ? "⚡ " : ""}${Math.round(b.level * 100)}%`);
    u(); document.documentElement.style.setProperty("--lv", b.level); b.onlevelchange = b.onchargingchange = () => { u(); document.documentElement.style.setProperty("--lv", b.level); };
  } catch { $$(".stBat").forEach(e => e.textContent = ""); }
}
function drawPad() {
  const L = ["", "ABC", "DEF", "GHI", "JKL", "MNO", "PQRS", "TUV", "WXYZ"];
  $("#pad").innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-act="key" data-v="${n}" aria-label="${n}">${n}<small>${L[n - 1]}</small></button>`).join("") +
    `<button class="fn" data-act="pclear">Hapus</button><button data-act="key" data-v="0" aria-label="0">0<small></small></button><button class="fn" data-act="pback" aria-label="Hapus satu digit">⌫</button>`;
  $("#pad").insertAdjacentHTML("beforeend", `<span></span><button class="ok" data-act="pok">Masuk</button><span></span>`);
  dots();
}
const dots = () => $("#dots").innerHTML = Array.from({ length: Math.max(4, pin.length) }, (_, i) => `<i style="opacity:${i < pin.length ? 1 : .22}"></i>`).join("");
function lockMsg(m, bad) { $("#lkMsg").textContent = m; if (bad) { const d = $("#dots"); d.classList.remove("bad"); void d.offsetWidth; d.classList.add("bad"); } }
async function tryPin(final) {
  if (busy || pin.length < 4) return;
  busy = true; const cur = pin;
  try {
    const role = await DB.login(cur);
    if (role) { S.role = role; sessionStorage.setItem("vc_role", role); DB.setAuth(role === "admin" ? cur : ""); enter(); }
    else if (final) { pin = ""; dots(); lockMsg("PIN salah, coba lagi", true); }
  } catch (e) { if (final) { lockMsg(e.message, true); } }
  busy = false;
}
function enter() {
  pin = ""; dots(); lockMsg("Masukkan PIN");
  $("#lock").hidden = true; $("#app").hidden = false;
  sanitize(); nav(); go(S.role === "admin" ? "admin" : "menu");
  if (S.role === "admin") { const o = S.products.filter(p => p.active && p.stock === 0).length; if (o) toast(`${o} menu stok habis — cek dashboard`); }
}
function lockApp() { sessionStorage.removeItem("vc_role"); DB.setAuth(""); S.role = null; S.orders = null; S.co = null; $("#app").hidden = true; $("#lock").hidden = false; pin = ""; dots(); lockMsg("Masukkan PIN"); closeModal(); toTop(); }

/* ================= navigasi ================= */
function nav() {
  const t = [["menu", "Menu", I.menu], ["cart", "Keranjang", I.cart], ["hist", "Riwayat", I.hist]];
  if (S.role === "admin") t.push(["admin", "Admin", I.admin]);
  $("#nav").innerHTML = t.map(([k, l, ic]) => `<button data-act="tab" data-t="${k}">${ic}<span>${l}</span><i class="nb" id="nb-${k}" hidden></i></button>`).join("");
  badges();
}
function badges() {
  const n = Object.values(S.cart).reduce((a, b) => a + b, 0), c = $("#nb-cart");
  if (c) { c.hidden = !n; c.textContent = n; c.classList.add("g"); }
  const a = $("#nb-admin"); if (a) { const k = lowList().length; a.hidden = !k; a.textContent = k; }
}
const R = {};
function go(t, keepScroll) {
  if (t === "admin" && S.role !== "admin") t = "menu";
  S.tab = t; $$(".view").forEach(v => v.hidden = v.id !== "v-" + t);
  const main = ["menu", "cart", "hist", "admin"].includes(t); $("#nav").hidden = !main;
  $$("#nav button").forEach(b => b.classList.toggle("on", b.dataset.t === t));
  R[t](); if (!keepScroll) toTop();
}
const hdr = (title, back) => back ? `<header class="hd nav"><button class="ic" data-act="tab" data-t="${back}" aria-label="Kembali">${I.back}</button><h2>${title}</h2><span class="ic sp"></span></header>` : `<header class="hd big"><h2>${title}</h2></header>`;

/* ================= menu ================= */
R.menu = () => {
  $("#v-menu").innerHTML = `<header class="hd big"><div class="brand"><img src="assets/logo.svg" width="44" height="44" alt=""><div><h2>${esc(S.settings.shopName)}</h2><small>${S.role === "admin" ? "Mode admin" : "Kopi hangat, rasa yang menetap"}</small></div></div><button class="ic" data-act="lock" aria-label="Kunci aplikasi">${I.lock}</button></header>
  <div class="tools"><label class="search">${I.search}<input id="q" type="search" placeholder="Cari nama atau kode menu…" autocomplete="off" value="${esc(S.q)}" aria-label="Cari menu"></label><div class="chips" id="chips"></div></div>
  <p class="muted info" id="info"></p><div class="grid" id="grid"></div><p class="empty" id="none" hidden>Menu tidak ditemukan.<br>Coba kata kunci atau kategori lain.</p>`;
  grid();
};
function grid() {
  const cats = ["Semua", ...new Set(active().map(p => p.category))];
  if (!cats.includes(S.cat)) S.cat = "Semua";
  $("#chips").innerHTML = cats.map(c => `<button class="chip ${c === S.cat ? "on" : ""}" data-act="cat" data-v="${esc(c)}">${esc(c)}</button>`).join("");
  const q = S.q.trim().toLowerCase();
  const l = active().filter(p => (S.cat === "Semua" || p.category === S.cat) && (!q || [p.name, p.code, p.description].some(x => String(x).toLowerCase().includes(q))));
  $("#grid").innerHTML = l.map(p => { const out = p.stock < 1; return `<article class="card ${out ? "out" : ""}">
    <button class="ci" data-act="detail" data-code="${p.code}" aria-label="Detail ${esc(p.name)}"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">${out ? '<span class="soldout">Stok habis</span>' : p.stock <= CONFIG.LOW_STOCK ? `<span class="low">Sisa ${p.stock}</span>` : ""}</button>
    <div class="cb"><h3>${esc(p.name)}</h3><small>${esc(sz(p))} · Stok ${p.stock}</small>
    <div class="cf"><span class="price">${rp(p.price)}</span><button class="add" data-act="add" data-code="${p.code}" ${out ? "disabled" : ""} aria-label="Tambah ${esc(p.name)}">+</button></div></div></article>`; }).join("");
  $("#none").hidden = l.length > 0; $("#info").textContent = `${l.length} dari ${active().length} menu`;
}
function addCart(code, n) {
  const p = find(code), cur = S.cart[code] || 0;
  if (!p || p.stock < 1) { toast("Stok habis"); return false; }
  if (cur + n > p.stock) { toast(`Stok ${p.name} hanya ${p.stock}`); return false; }
  S.cart[code] = cur + n; saveCart(); badges(); return true;
}
function detail() {
  const p = find(S.det.code), n = S.det.n;
  modal(`<button class="x" data-act="close" aria-label="Tutup">✕</button><img class="dimg" src="${esc(p.image)}" alt="${esc(p.name)}"><div class="sb">
    <small class="muted">${esc(p.category)} · ${esc(p.code)} · ${esc(sz(p))}</small><h3>${esc(p.name)}</h3><p class="price" style="font-size:20px;margin:4px 0">${rp(p.price)}</p>
    <p class="muted" style="margin:0 0 6px">${esc(p.description)}</p><p class="note">${p.stock < 1 ? "Stok habis" : `Stok tersedia: ${p.stock}`}</p>
    <div style="display:flex;gap:12px;align-items:center;margin-top:10px"><div class="qty"><button data-act="dq" data-d="-1" aria-label="Kurangi">−</button><span>${n}</span><button data-act="dq" data-d="1" aria-label="Tambah">+</button></div>
    <button class="btn" style="flex:1" data-act="dadd" ${p.stock < 1 ? "disabled" : ""}>Tambah · ${rp(p.price * n)}</button></div></div>`);
}

/* ================= keranjang ================= */
const totals = () => {
  const sub = Object.entries(S.cart).reduce((s, [c, q]) => s + (find(c) ? find(c).price * q : 0), 0);
  const fee = S.co && S.co.type === "delivery" ? +S.settings.deliveryFee || 0 : 0;
  return { sub, fee, total: sub + fee };
};
R.cart = () => {
  const items = Object.entries(S.cart).filter(([c]) => find(c));
  $("#v-cart").innerHTML = hdr("Keranjang") + (items.length ? `<div class="pad16"><div class="box">${items.map(([c, q]) => { const p = find(c); return `<div class="li"><img src="${esc(p.image)}" alt="">
    <div><strong>${esc(p.name)}</strong><small>${esc(sz(p))} · ${rp(p.price)}</small><div class="qty"><button data-act="dec" data-code="${c}" aria-label="Kurangi">−</button><span>${q}</span><button data-act="inc" data-code="${c}" ${q >= p.stock ? "disabled" : ""} aria-label="Tambah">+</button></div>${q >= p.stock ? `<div class="note">Maksimal stok</div>` : ""}</div>
    <div class="r"><strong>${rp(p.price * q)}</strong><button class="link" data-act="del" data-code="${c}">Hapus</button></div></div>`; }).join("")}</div>
    <div class="box"><div class="row total" style="border:0;margin:0;padding:0"><span>Subtotal</span><b>${rp(totals().sub)}</b></div><p class="note" style="margin:6px 0 0">Biaya antar dihitung di halaman checkout.</p></div>
    <button class="btn dark block" data-act="checkout">Lanjut ke checkout</button><p style="text-align:center"><button class="link" data-act="clear">Kosongkan keranjang</button></p></div>`
    : `<div class="empty">Keranjang masih kosong.<br>Pilih menu favoritmu dulu.<br><button class="btn dark" data-act="tab" data-t="menu">Lihat menu</button></div>`);
  badges();
};

/* ================= checkout ================= */
const PAY = [["Tunai", ["Tunai"]], ["Transfer Bank", ["BRI", "BCA", "BNI"]], ["QRIS", ["QRIS"]], ["E-Wallet", ["DANA", "OVO", "GoPay"]]];
const mlabel = (g, i) => g === "Tunai" || g === "QRIS" ? g : `${g} ${i}`;
function fakeQR(seed) {
  const n = 25, m = []; let x = (seed * 2654435761) >>> 0 || 7;
  const rnd = () => (x = (x * 1664525 + 1013904223) >>> 0) / 4294967296;
  const fin = (r, c) => [[0, 0], [0, n - 7], [n - 7, 0]].some(([a, b]) => r >= a && r < a + 7 && c >= b && c < b + 7);
  let svg = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    let on;
    if (fin(r, c)) { const [a, b] = [[0, 0], [0, n - 7], [n - 7, 0]].find(([a, b]) => r >= a && r < a + 7 && c >= b && c < b + 7); const y = r - a, z = c - b; on = y === 0 || y === 6 || z === 0 || z === 6 || (y > 1 && y < 5 && z > 1 && z < 5); }
    else if (r === 7 || c === 7 || r === n - 8 || c === n - 8) on = false; else on = rnd() > .5;
    if (on) svg += `<rect x="${c}" y="${r}" width="1" height="1"/>`;
  }
  return `<svg class="qr" viewBox="-1 -1 ${n + 2} ${n + 2}" role="img" aria-label="Contoh kode QRIS (simulasi)" style="fill:#1a0f0a;stroke:none;width:190px;height:190px">${svg}</svg>`;
}
function payPanel() {
  const c = S.co, t = totals().total, P = CONFIG.PAY;
  if (c.method === "Tunai") {
    const amts = [50000, 100000, 200000].filter(a => a >= t);
    return `<div class="paybox"><label class="fld" style="color:inherit">Uang diterima (Rp)<input data-f="received" inputmode="numeric" pattern="[0-9]*" placeholder="Masukkan jumlah uang" value="${esc(c.received)}"></label>
      <div class="quick"><button data-act="cash" data-v="${t}">Uang pas</button>${amts.map(a => `<button data-act="cash" data-v="${a}">${rp(a)}</button>`).join("")}</div>
      <div class="row"><span>Kembalian</span><b id="chg"></b></div></div>`;
  }
  if (c.method.startsWith("Transfer")) { const b = c.method.split(" ").pop(); return `<div class="paybox">Transfer ${rp(t)} ke rekening <b>${b}</b><div class="big">${esc(P[b])}</div>a.n. ${esc(P.owner)}<p class="note" style="margin:8px 0 0">Simulasi — tidak ada uang yang benar-benar dipindahkan.</p></div>`; }
  if (c.method === "QRIS") return `<div class="paybox" style="text-align:center">Pindai untuk membayar ${rp(t)}${fakeQR(t)}<p class="note" style="margin:0">Contoh QRIS (simulasi), bukan kode pembayaran asli.</p></div>`;
  const w = c.method.split(" ").pop(); return `<div class="paybox">Kirim ${rp(t)} ke <b>${w}</b><div class="big">${esc(P[w])}</div>a.n. ${esc(P.owner)}<p class="note" style="margin:8px 0 0">Simulasi — tidak ada uang yang benar-benar dipindahkan.</p></div>`;
}
R.checkout = () => {
  if (!Object.keys(S.cart).length) return go("cart");
  S.co = S.co || { type: "pickup", name: "", phone: "", address: "", method: "Tunai", received: "" };
  const c = S.co, st = S.settings, t = totals(), del = c.type === "delivery";
  $("#v-checkout").innerHTML = hdr("Checkout", "cart") + `<div class="pad16">
  <section class="box"><h3>Periksa pesanan</h3>${Object.entries(S.cart).map(([k, q]) => { const p = find(k); return `<div class="row"><span>${q}× ${esc(p.name)} <small class="muted">${esc(sz(p))}</small></span><span>${rp(p.price * q)}</span></div>`; }).join("")}</section>
  <section class="box"><h3>Pengambilan</h3><div class="seg"><button class="${del ? "" : "on"}" data-act="ctype" data-v="pickup">Ambil di toko</button><button class="${del ? "on" : ""}" data-act="ctype" data-v="delivery">Antar (${rp(+st.deliveryFee || 0)})</button></div>
  <div class="shopbox"><b>${esc(st.shopName)}</b><span>${esc(st.address)}</span><span>Telp ${esc(st.phone)} · ${esc(st.hours)}</span>${del ? "" : "<span>Ambil pesanan di alamat ini.</span>"}</div><div style="height:12px"></div>
  <label class="fld" id="fl-name">${del ? "Nama penerima" : "Nama pembeli"}<input data-f="name" autocomplete="name" value="${esc(c.name)}" placeholder="Nama lengkap"></label>
  <label class="fld" id="fl-phone">${del ? "Nomor HP penerima" : "Nomor HP (opsional)"}<input data-f="phone" type="tel" inputmode="tel" autocomplete="tel" value="${esc(c.phone)}" placeholder="08xxxxxxxxxx"></label>
  ${del ? `<label class="fld" id="fl-address">Alamat lengkap<textarea data-f="address" rows="3" placeholder="Jalan, nomor, RT/RW, kelurahan, patokan">${esc(c.address)}</textarea></label><p class="note" style="margin:0">Pesanan dicatat bersama alamatnya. Tidak ada pelacakan kurir.</p>` : ""}</section>
  <section class="box"><h3>Metode pembayaran</h3>${PAY.map(([g, l]) => `${g !== "Tunai" && g !== "QRIS" ? `<div class="pg">${g}</div>` : ""}<div class="opts" style="margin-bottom:6px">${l.map(i => { const m = mlabel(g, i); return `<button class="opt ${c.method === m ? "on" : ""}" data-act="pm" data-v="${m}" aria-pressed="${c.method === m}">${i}</button>`; }).join("")}</div>`).join("")}${payPanel()}</section>
  <section class="box"><h3>Rincian pembayaran</h3><div class="row"><span>Subtotal</span><span>${rp(t.sub)}</span></div><div class="row"><span>Biaya pengantaran</span><span>${rp(t.fee)}</span></div><div class="row total"><span>Total pembayaran</span><b>${rp(t.total)}</b></div></section></div>
  <div class="bar"><button class="btn dark block" id="payBtn" data-act="pay">${c.method === "Tunai" ? "Selesaikan pesanan" : "Bayar"} · ${rp(t.total)}</button></div>`;
  chg();
};
function chg() { const e = $("#chg"); if (!e) return; const r = +S.co.received || 0, t = totals().total; e.textContent = !r ? "-" : r >= t ? rp(r - t) : "Kurang " + rp(t - r); }
function bad(id, msg) { const f = $("#" + id); if (f) { f.classList.add("err"); f.scrollIntoView({ block: "center", behavior: "smooth" }); const i = $("input,textarea", f); i && i.focus({ preventScroll: true }); } toast(msg); }
async function pay() {
  const c = S.co, t = totals(), del = c.type === "delivery";
  $$(".fld.err").forEach(f => f.classList.remove("err"));
  if (!c.name.trim()) return bad("fl-name", del ? "Isi nama penerima" : "Isi nama pembeli");
  if (del && c.phone.replace(/\D/g, "").length < 9) return bad("fl-phone", "Isi nomor HP yang valid");
  if (del && c.address.trim().length < 10) return bad("fl-address", "Isi alamat lengkap");
  if (c.method === "Tunai" && (+c.received || 0) < t.total) return toast("Uang diterima kurang dari total");
  const b = $("#payBtn"); b.disabled = true; b.textContent = "Memproses…";
  try {
    if (c.method !== "Tunai") await sleep(1200);
    const items = Object.entries(S.cart).map(([code, qty]) => ({ code, qty }));
    const before = new Set(S.products.filter(p => p.stock > 0).map(p => p.code));
    const r = await DB.checkout({ customer: c.name, phone: c.phone, type: c.type, address: c.address, method: c.method, received: c.method === "Tunai" ? +c.received : null, items });
    S.products = r.products; S.cart = {}; saveCart(); S.co = null; S.orders = null; DB.addMine(r.order);
    S.rc = { o: r.order, back: "menu" }; badges();
    const out = S.products.filter(p => p.stock === 0 && before.has(p.code)).map(p => p.name);
    go("receipt"); toast(out.length ? `Stok habis: ${out.join(", ")}` : "Pembayaran berhasil");
  } catch (e) {
    toast(e.message); b.disabled = false; b.textContent = "Coba lagi";
    try { const d = await DB.init(); S.products = d.products; S.settings = d.settings; sanitize(); badges(); if (S.tab === "checkout") R.checkout(); } catch {}
  }
}

/* ================= struk ================= */
function receiptHTML(o) {
  const st = S.settings, del = o.type === "delivery";
  return `<div class="paper" id="struk"><div class="hdc"><img src="assets/logo.svg" width="56" height="56" alt="Logo"><b>${esc(st.shopName.toUpperCase())}</b>${esc(st.address)}<br>Telp ${esc(st.phone)}</div><hr>
  <div class="r2"><span>No. Transaksi</span><b>${esc(o.no)}</b></div><div class="r2"><span>Tanggal</span><span>${fdate(o.time)}</span></div><div class="r2"><span>Jam</span><span>${ftime(o.time)}</span></div>
  <div class="r2"><span>${del ? "Penerima" : "Pembeli"}</span><span>${esc(o.customer)}</span></div>${o.phone ? `<div class="r2"><span>No. HP</span><span>${esc(o.phone)}</span></div>` : ""}
  <div class="r2"><span>Pengambilan</span><span>${del ? "Diantar" : "Ambil di toko"}</span></div>${del ? `<div>Alamat: ${esc(o.address)}</div>` : ""}<hr>
  ${o.items.map(i => `<div class="it"><div>${esc(i.name)} <small>${esc(i.size)}</small></div><div class="r2"><span>${i.qty} x ${rp(i.price)}</span><span>${rp(i.qty * i.price)}</span></div></div>`).join("")}<hr>
  <div class="r2"><span>Subtotal</span><span>${rp(o.subtotal)}</span></div><div class="r2"><span>Biaya pengantaran</span><span>${rp(o.fee)}</span></div><div class="r2 tt"><span>TOTAL</span><span>${rp(o.total)}</span></div><hr>
  <div class="r2"><span>Metode</span><span>${esc(o.method)}</span></div><div class="r2"><span>Status</span><b>${esc(o.status)}</b></div>
  ${o.method === "Tunai" && o.received != null ? `<div class="r2"><span>Uang diterima</span><span>${rp(o.received)}</span></div><div class="r2"><span>Kembalian</span><span>${rp(o.change)}</span></div>` : ""}<hr>
  <div class="ty">Terima kasih sudah berbelanja!<br>Simpan struk ini sebagai bukti.</div></div>`;
}
R.receipt = () => {
  if (!S.rc) return go("menu"); const o = S.rc.o;
  $("#v-receipt").innerHTML = hdr("Struk pembayaran", S.rc.back === "hist" ? "hist" : "") + receiptHTML(o) +
    `<div class="acts"><button class="btn dark" data-act="print">Cetak / PDF</button><button class="btn ghost" data-act="tab" data-t="${S.rc.back}">${S.rc.back === "hist" ? "Kembali" : "Selesai"}</button></div>`;
};
function printReceipt() { const old = document.title; document.title = "Struk " + S.rc.o.no; window.print(); setTimeout(() => document.title = old, 500); }

/* ================= riwayat ================= */
R.hist = async () => {
  const adm = S.role === "admin";
  $("#v-hist").innerHTML = hdr("Riwayat transaksi") + `<div class="pad16"><p class="muted">${adm ? "Memuat semua transaksi…" : ""}</p></div>`;
  let l; try { l = adm ? (S.orders = await DB.orders()) : DB.mine(); } catch (e) { $("#v-hist").innerHTML = hdr("Riwayat transaksi") + `<div class="empty">${esc(e.message)}</div>`; return; }
  if (S.tab !== "hist") return; S.list = l;
  $("#v-hist").innerHTML = hdr("Riwayat transaksi") + `<div class="pad16">${adm ? `<p class="note">${l.length} transaksi · total ${rp(l.reduce((s, o) => s + o.total, 0))}</p>` : `<p class="note">Menampilkan pesanan dari perangkat ini.</p>`}
  ${l.length ? l.map(o => `<button class="ol" data-act="order" data-no="${esc(o.no)}"><div class="row"><b>${esc(o.no)}</b><span class="chipst">${esc(o.status)}</span></div>
  <div class="row"><span>${esc(o.customer)} · ${o.type === "delivery" ? "Antar" : "Ambil"}</span><b>${rp(o.total)}</b></div><div class="row"><small class="muted">${fdate(o.time)} ${ftime(o.time)} · ${esc(o.method)}</small><small class="muted">${o.items.reduce((s, i) => s + i.qty, 0)} item</small></div></button>`).join("")
    : `<div class="empty">Belum ada transaksi.<br><button class="btn dark" data-act="tab" data-t="menu">Mulai pesan</button></div>`}</div>`;
};

/* ================= admin ================= */
const AT = [["ringkasan", "Ringkasan"], ["produk", "Produk"], ["setelan", "Pengaturan"]];
R.admin = async () => {
  const head = hdr("Dashboard admin") + `<div class="pad16" style="padding-bottom:0"><div class="seg n3">${AT.map(([k, l]) => `<button class="${S.adm === k ? "on" : ""}" data-act="atab" data-v="${k}">${l}</button>`).join("")}</div></div><div id="ab" class="pad16" style="padding-top:2px"></div>`;
  $("#v-admin").innerHTML = head;
  if (S.adm === "ringkasan") await admSummary(); else if (S.adm === "produk") admProducts(); else admSettings();
};
async function admSummary() {
  const ab = $("#ab"); ab.innerHTML = '<p class="muted">Memuat data…</p>';
  try { if (!S.orders) S.orders = await DB.orders(); } catch (e) { ab.innerHTML = `<div class="alert">${esc(e.message)}</div>`; S.orders = []; }
  if (S.tab !== "admin" || S.adm !== "ringkasan") return;
  const today = dstr(new Date()), os = S.orders.filter(o => o.time.startsWith(today));
  const out = S.products.filter(p => p.active && p.stock === 0), low = S.products.filter(p => p.active && p.stock > 0 && p.stock <= CONFIG.LOW_STOCK);
  ab.innerHTML = `<div class="stats"><div class="stat wide"><small>Pendapatan hari ini</small><b>${rp(os.reduce((s, o) => s + o.total, 0))}</b></div>
  <div class="stat"><small>Transaksi</small><b>${os.length}</b></div><div class="stat"><small>Item terjual</small><b>${os.reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0)}</b></div></div>
  <div class="box"><h3>Notifikasi stok</h3>${out.length + low.length ? "" : '<p class="muted" style="margin:0">Semua stok aman.</p>'}
  ${out.map(p => `<div class="alert"><span><b>${esc(p.name)}</b> stok habis</span><button class="btn sm dark" data-act="restock" data-code="${p.code}">Isi stok</button></div>`).join("")}
  ${low.map(p => `<div class="alert warn"><span><b>${esc(p.name)}</b> tersisa ${p.stock}</span><button class="btn sm dark" data-act="restock" data-code="${p.code}">Isi stok</button></div>`).join("")}</div>
  <div class="box"><h3>Transaksi terbaru</h3>${S.orders.slice(0, 5).map(o => `<div class="row"><span>${esc(o.no)} <small class="muted">${esc(o.customer)}</small></span><b>${rp(o.total)}</b></div>`).join("") || '<p class="muted" style="margin:0">Belum ada transaksi.</p>'}
  <p style="margin:10px 0 0"><button class="link" style="color:var(--mid)" data-act="tab" data-t="hist">Lihat semua transaksi</button></p></div>`;
}
function prow(p) {
  return `<div class="prow ${p.active ? "" : "off"}" id="pr-${p.code}"><img src="${esc(p.image)}" alt=""><div><div class="t"><div><strong>${esc(p.name)}</strong><br><small class="muted">${esc(p.code)} · ${esc(p.category)} · ${esc(sz(p))}</small></div><b class="price">${rp(p.price)}</b></div>
  <div class="ctl"><div class="qty"><button data-act="stk" data-code="${p.code}" data-d="-1" aria-label="Kurangi stok">−</button><span>${p.stock}</span><button data-act="stk" data-code="${p.code}" data-d="1" aria-label="Tambah stok">+</button></div>
  ${p.stock === 0 ? '<span class="chipst bad">Habis</span>' : p.stock <= CONFIG.LOW_STOCK ? '<span class="chipst warn">Menipis</span>' : ""}${p.active ? "" : '<span class="chipst bad">Disembunyikan</span>'}
  <button class="btn ghost sm" style="margin-left:auto" data-act="pedit" data-code="${p.code}">Ubah</button></div></div></div>`;
}
function admProducts() { $("#ab").innerHTML = `<button class="btn dark block" style="margin-bottom:12px" data-act="pedit">+ Tambah menu baru</button>${S.products.map(prow).join("") || '<div class="empty">Belum ada menu.</div>'}`; }
function nextCode(cat) {
  const pre = (cat || "X").trim()[0].toUpperCase();
  return pre + String(Math.max(0, ...S.products.filter(p => p.code.startsWith(pre)).map(p => parseInt(p.code.slice(1)) || 0)) + 1).padStart(2, "0");
}
function pform(code) {
  const p = code ? find(code) : { code: "", name: "", category: "Kopi", price: "", stock: "", size_value: "", size_unit: "ml", image: "", description: "", active: true };
  S.pimg = null; S.pcode = code || "";
  modal(`<button class="x" data-act="close" aria-label="Tutup">✕</button><div class="sb"><h3 style="margin-bottom:12px">${code ? "Ubah menu" : "Menu baru"}</h3>
  <img class="pv" id="pv" src="${esc(p.image)}" alt="" ${p.image ? "" : "hidden"}>
  <label class="fld">Gambar (ambil foto atau pilih dari galeri)<input type="file" id="pf-file" accept="image/*"></label>
  <label class="fld">atau alamat gambar / nama file<input id="pf-img" value="${esc(p.image)}" placeholder="images/nama.jpg atau https://…"></label>
  <label class="fld">Nama menu<input id="pf-name" value="${esc(p.name)}"></label>
  <div class="two"><label class="fld">Kategori<input id="pf-cat" list="cats" value="${esc(p.category)}"><datalist id="cats">${[...new Set(S.products.map(x => x.category))].map(c => `<option value="${esc(c)}">`).join("")}</datalist></label>
  <label class="fld">Harga (Rp)<input id="pf-price" type="number" inputmode="numeric" min="0" value="${p.price}"></label></div>
  <div class="two"><label class="fld">Stok<input id="pf-stock" type="number" inputmode="numeric" min="0" value="${p.stock}"></label>
  <div class="two" style="gap:6px"><label class="fld">Ukuran<input id="pf-sv" type="number" inputmode="decimal" min="0" step="any" value="${p.size_value}"></label><label class="fld">Satuan<select id="pf-su">${["g", "kg", "ml", "L"].map(u => `<option ${u === p.size_unit ? "selected" : ""}>${u}</option>`).join("")}</select></label></div></div>
  <label class="fld">Deskripsi<textarea id="pf-desc" rows="2">${esc(p.description)}</textarea></label>
  <label class="fld" style="grid-auto-flow:column;justify-content:start;align-items:center;gap:10px"><input id="pf-on" type="checkbox" style="width:20px;height:20px" ${p.active ? "checked" : ""}>Tampilkan di menu pembeli</label>
  <button class="btn dark block" id="pf-save" data-act="psave">Simpan menu</button>${code ? `<button class="btn danger block" style="margin-top:8px" data-act="pdel">Hapus menu</button>` : ""}</div>`);
}
async function psave() {
  const g = id => $("#" + id).value.trim(), b = $("#pf-save");
  const p = { code: S.pcode, name: g("pf-name"), category: g("pf-cat"), price: +g("pf-price"), stock: Math.floor(+g("pf-stock")), size_value: +g("pf-sv"), size_unit: g("pf-su"), image: g("pf-img"), description: g("pf-desc"), active: $("#pf-on").checked };
  if (!p.name) return toast("Isi nama menu"); if (!p.category) return toast("Isi kategori");
  if (!(p.price > 0)) return toast("Harga harus lebih dari 0"); if (!(p.stock >= 0)) return toast("Stok tidak valid");
  if (!(p.size_value > 0)) return toast("Isi ukuran menu (g/kg/ml/L)"); if (!p.image && !S.pimg) return toast("Tambahkan gambar menu");
  b.disabled = true; b.textContent = "Menyimpan…";
  try {
    if (S.pimg) p.image = await DB.upload(S.pimg);
    if (!p.code) p.code = nextCode(p.category);
    S.products = await DB.saveProduct(p); closeModal(); sanitize(); badges(); R.admin(); toast("Menu disimpan");
  } catch (e) { toast(e.message); b.disabled = false; b.textContent = "Simpan menu"; }
}
function shrink(file, max = 640) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", .78)); }; im.onerror = () => rej(new Error("Gambar tidak bisa dibaca")); im.src = r.result; };
    r.onerror = () => rej(new Error("File tidak bisa dibaca")); r.readAsDataURL(file);
  });
}
function admSettings() {
  const s = S.settings;
  $("#ab").innerHTML = `<section class="box"><h3>Informasi toko</h3>
  <label class="fld">Nama toko<input id="st-name" value="${esc(s.shopName)}"></label><label class="fld">Alamat toko<textarea id="st-addr" rows="2">${esc(s.address)}</textarea></label>
  <div class="two"><label class="fld">Telepon / WhatsApp<input id="st-phone" value="${esc(s.phone)}"></label><label class="fld">Biaya antar (Rp)<input id="st-fee" type="number" inputmode="numeric" min="0" value="${+s.deliveryFee || 0}"></label></div>
  <label class="fld">Jam buka<input id="st-hours" value="${esc(s.hours)}"></label><button class="btn dark block" data-act="ssave">Simpan informasi toko</button></section>
  <section class="box"><h3>Ganti PIN</h3><p class="note" style="margin-top:0">Kosongkan kolom yang tidak ingin diganti. PIN 4–6 angka.</p>
  <div class="two"><label class="fld">PIN pembeli baru<input id="pn-user" inputmode="numeric" maxlength="6" autocomplete="off"></label><label class="fld">PIN admin baru<input id="pn-admin" inputmode="numeric" maxlength="6" autocomplete="off"></label></div><button class="btn dark block" data-act="psetpin">Simpan PIN</button></section>
  <section class="box"><h3>Data</h3><p class="note" style="margin-top:0">${DB.remote ? "Terhubung ke Google Sheet." : "Mode lokal: data hanya tersimpan di browser ini. Isi SCRIPT_URL di config.js untuk memakai Google Sheet."}</p>
  <button class="btn ghost block" data-act="reload">Muat ulang data</button>${DB.remote ? "" : `<button class="btn danger block" style="margin-top:8px" data-act="resetlocal">Reset data lokal</button>`}</section>
  <button class="btn ghost block" data-act="lock">Kunci aplikasi</button>`;
}

/* ================= aksi & event ================= */
const A = {
  key: ({ v }) => { if (pin.length < 6) { pin += v; dots(); if (pin.length === 4 || pin.length === 6) tryPin(pin.length === 6); } },
  pback: () => { pin = pin.slice(0, -1); dots(); }, pclear: () => { pin = ""; dots(); lockMsg("Masukkan PIN"); },
  pok: () => pin.length < 4 ? lockMsg("PIN minimal 4 angka", true) : tryPin(true),
  lock: lockApp, close: closeModal, tab: ({ t }) => go(t),
  cat: ({ v }) => { S.cat = v; grid(); },
  detail: ({ code }) => { S.det = { code, n: 1 }; detail(); },
  dq: ({ d }) => { const p = find(S.det.code); S.det.n = Math.max(1, Math.min(p.stock || 1, S.det.n + +d)); detail(); },
  dadd: () => { if (addCart(S.det.code, S.det.n)) { toast(`${find(S.det.code).name} ×${S.det.n} ditambahkan`); closeModal(); } },
  add: ({ code }) => { if (addCart(code, 1)) toast(`${find(code).name} ditambahkan`); },
  inc: ({ code }) => { addCart(code, 1); R.cart(); },
  dec: ({ code }) => { S.cart[code] > 1 ? S.cart[code]-- : delete S.cart[code]; saveCart(); R.cart(); },
  del: ({ code }) => { delete S.cart[code]; saveCart(); R.cart(); },
  clear: () => { S.cart = {}; saveCart(); R.cart(); },
  checkout: () => go("checkout"),
  ctype: ({ v }) => { S.co.type = v; R.checkout(); },
  pm: ({ v }) => { S.co.method = v; R.checkout(); },
  cash: ({ v }) => { S.co.received = String(v); $("[data-f=received]").value = v; chg(); },
  pay,
  print: printReceipt,
  order: ({ no }) => { const o = (S.list || []).find(x => x.no === no); if (o) { S.rc = { o, back: "hist" }; go("receipt"); } },
  atab: ({ v }) => { S.adm = v; R.admin(); },
  restock: () => { S.adm = "produk"; R.admin(); },
  stk: async ({ code, d }) => {
    try { const n = await DB.adjustStock(code, +d); find(code).stock = n; $("#pr-" + code).outerHTML = prow(find(code)); badges(); if (n === 0) toast(`Stok ${find(code).name} habis`); }
    catch (e) { toast(e.message); }
  },
  pedit: ({ code }) => pform(code), psave,
  pdel: async () => {
    const p = find(S.pcode); if (!p || !confirm(`Hapus menu "${p.name}"?`)) return;
    try { S.products = await DB.deleteProduct(p.code); closeModal(); sanitize(); badges(); R.admin(); toast("Menu dihapus"); } catch (e) { toast(e.message); }
  },
  ssave: async () => {
    const g = id => $("#" + id).value.trim(); if (!g("st-name")) return toast("Isi nama toko");
    try { S.settings = await DB.saveSettings({ shopName: g("st-name"), address: g("st-addr"), phone: g("st-phone"), hours: g("st-hours"), deliveryFee: Math.max(0, +g("st-fee") || 0) }); toast("Informasi toko disimpan"); } catch (e) { toast(e.message); }
  },
  psetpin: async () => {
    const u = $("#pn-user").value.trim(), a = $("#pn-admin").value.trim();
    if (!u && !a) return toast("Isi PIN baru dulu");
    if ((u && !/^\d{4,6}$/.test(u)) || (a && !/^\d{4,6}$/.test(a))) return toast("PIN harus 4–6 angka");
    if (u && a && u === a) return toast("PIN pembeli dan admin harus berbeda");
    try { await DB.setPins({ userPin: u, adminPin: a }); if (a) DB.setAuth(a); $("#pn-user").value = $("#pn-admin").value = ""; toast("PIN disimpan"); } catch (e) { toast(e.message); }
  },
  reload: async () => { try { const d = await DB.init(); S.products = d.products; S.settings = d.settings; S.orders = null; sanitize(); badges(); R.admin(); toast("Data dimuat ulang"); } catch (e) { toast(e.message); } },
  resetlocal: () => { if (confirm("Hapus semua data lokal (menu, transaksi, PIN)?")) { DB.resetLocal(); location.reload(); } }
};
document.addEventListener("click", e => {
  if (e.target.id === "modal") return closeModal();
  const b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
  const f = A[b.dataset.act]; f && f(b.dataset, b);
});
document.addEventListener("input", e => {
  const t = e.target;
  if (t.id === "q") { S.q = t.value; grid(); }
  else if (t.dataset.f) { if (t.dataset.f === "received") t.value = t.value.replace(/\D/g, ""); S.co[t.dataset.f] = t.value; t.closest(".fld")?.classList.remove("err"); if (t.dataset.f === "received") chg(); }
});
document.addEventListener("change", async e => {
  if (e.target.id !== "pf-file" || !e.target.files[0]) return;
  try { S.pimg = await shrink(e.target.files[0]); const v = $("#pv"); v.src = S.pimg; v.hidden = false; } catch (x) { toast(x.message); }
});
addEventListener("keydown", e => {
  if (e.key === "Escape" && !$("#modal").hidden) closeModal();
  if (!$("#lock").hidden && /^\d$/.test(e.key)) A.key({ v: e.key });
  else if (!$("#lock").hidden && e.key === "Backspace") A.pback();
  else if (!$("#lock").hidden && e.key === "Enter") A.pok();
});
addEventListener("resize", fit); fit();
let deferred = null;
addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e; $("#install").hidden = false; });
$("#install").addEventListener("click", async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $("#install").hidden = true; });
addEventListener("appinstalled", () => $("#install").hidden = true);
if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !(matchMedia("(display-mode: standalone)").matches || navigator.standalone)) $("#ioshint").hidden = false;
 addEventListener("online", netInfo); addEventListener("offline", netInfo);

/* ================= mulai ================= */
(async function boot() {
  drawPad(); tick(); setInterval(tick, 1000); netInfo(); batInfo();
  try {
    const d = await DB.init(); S.products = d.products; S.settings = d.settings; $("#lkName").textContent = S.settings.shopName; document.title = S.settings.shopName;
    const r = sessionStorage.getItem("vc_role"); if (r && (r !== "admin" || sessionStorage.getItem("vc_apin"))) { S.role = r; enter(); const g = new URLSearchParams(location.search).get("go"); if (["cart", "hist"].includes(g)) go(g); }
  } catch (e) { lockMsg("Data belum termuat: " + e.message, true); S.settings = { ...CONFIG.SHOP }; }
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
