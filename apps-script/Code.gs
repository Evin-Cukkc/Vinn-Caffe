/**
 * Vinn Caffe — backend Google Sheets (Apps Script)
 * Pasang di Spreadsheet: Extensions > Apps Script. Jalankan setup() sekali, lalu Deploy > Web app.
 */
const TZ = 'Asia/Jakarta';
const SHEETS = {
  Products: ['code','name','category','price','stock','size_value','size_unit','image','description','active','updated_at'],
  Orders: ['order_no','time','customer','phone','type','address','delivery_fee','subtotal','total','payment_method','payment_status','cash_received','cash_change'],
  OrderItems: ['order_no','code','name','size','qty','price','line_total'],
  Settings: ['key','value'],
  Ratings: ['time','order_no','code','stars','name','comment']
};
const TEXT_COLS = { Products:[1], Orders:[1,2,4,6], OrderItems:[1,2], Settings:[1,2], Ratings:[1,2,3] };
const SEED = [["K01","Espresso","Kopi",18000,40,60,"ml","images/espresso.jpg","Satu shot espresso pekat dengan crema tebal dan aroma biji kopi sangrai."],
  ["K02","Americano","Kopi",22000,40,250,"ml","images/americano.jpg","Espresso dengan air panas — ringan, bersih, dan tetap kuat rasanya."],
  ["K03","Cappuccino","Kopi",28000,35,200,"ml","images/cappuccino.jpg","Espresso, susu steam, dan busa susu lembut dalam takaran seimbang."],
  ["K04","Cold Brew","Kopi",30000,30,300,"ml","images/cold-brew.jpg","Kopi seduh dingin 12 jam. Halus, manis alami, rendah asam."],
  ["K05","Café Latte","Kopi",28000,35,250,"ml","images/latte.jpg","Espresso bertemu susu creamy dengan latte art khas Vinn Caffe."],
  ["K06","Hazelnut Latte","Kopi",32000,30,250,"ml","images/hazelnut-latte.jpg","Latte dengan sirup hazelnut yang gurih dan harum."],
  ["K07","Caramel Latte","Kopi",32000,30,250,"ml","images/caramel-latte.jpg","Latte lembut dengan saus karamel manis dan sedikit gosong."],
  ["K08","Vanilla Latte","Kopi",32000,30,250,"ml","images/vanilla-latte.jpg","Latte dengan vanila yang wangi, manis lembut di setiap tegukan."],
  ["K09","Caramel Macchiato","Kopi",34000,25,250,"ml","images/caramel-macchiato.jpg","Susu vanila, espresso, dan siraman karamel berpola lattice."],
  ["K10","Mocha","Kopi",34000,25,250,"ml","images/mocha.jpg","Espresso, cokelat, dan susu dengan topping krim untuk pecinta manis."],
  ["M01","Chicken Burger","Makanan",38000,20,220,"g","images/chicken-burger.jpg","Ayam krispi, keju leleh, selada, dan saus rahasia dalam roti brioche."],
  ["M02","Beef Burger","Makanan",45000,20,250,"g","images/beef-burger.jpg","Patty daging sapi juicy dengan keju cheddar leleh dan sayuran segar."],
  ["M03","Croissant","Makanan",25000,6,90,"g","images/croissant.jpg","Croissant butter berlapis, renyah di luar dan lembut di dalam."],
  ["M04","French Fries","Makanan",22000,30,150,"g","images/french-fries.jpg","Kentang goreng emas yang garing, disajikan dengan saus pilihan."],
  ["M05","Chicken Katsu Rice","Makanan",40000,18,350,"g","images/chicken-katsu.jpg","Katsu ayam renyah dengan nasi hangat, salad, dan saus katsu."],
  ["M06","Chicken Nugget","Makanan",28000,25,120,"g","images/chicken-nugget.jpg","Nugget ayam keemasan dengan saus celup."],
  ["M07","Choco Toast","Makanan",24000,20,180,"g","images/choco-toast.jpg","Roti panggang tebal dengan olesan cokelat yang meleleh."],
  ["M08","Club Sandwich","Makanan",35000,15,280,"g","images/club-sandwich.jpg","Roti panggang berlapis ayam, telur, sayuran, dan saus mayo."],
  ["M09","Chicken Wings","Makanan",36000,20,200,"g","images/chicken-wings.jpg","Sayap ayam dengan saus lengket manis-pedas dan saus cocol."],
  ["M10","Spaghetti Bolognese","Makanan",42000,15,300,"g","images/spaghetti-bolognese.jpg","Spaghetti saus daging bolognese, taburan keju dan herba."]];
const DEFAULT_SETTINGS = [
  ['shopName','Vinn Caffe'], ['address','Jl. Contoh No. 12, Medan, Sumatera Utara'], ['phone','0812-3456-7890'],
  ['hours','Setiap hari, 08.00 – 22.00'], ['deliveryFee','8000'], ['userPin','1234'], ['adminPin','246810']
];

/** Jalankan SEKALI dari editor: membuat sheet Products, Orders, OrderItems, Settings + 20 menu awal. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEETS).forEach(n => {
    const s = ss.getSheetByName(n) || ss.insertSheet(n), h = SHEETS[n];
    (TEXT_COLS[n] || []).forEach(c => s.getRange(1, c, s.getMaxRows(), 1).setNumberFormat('@'));
    s.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight('bold').setBackground('#2b1810').setFontColor('#f5ead8');
    s.setFrozenRows(1);
  });
  const d = ss.getSheetByName('Sheet1');
  if (d && d.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(d);
  const p = ss.getSheetByName('Products');
  if (p.getLastRow() < 2) {
    const now = now_();
    const rows = SEED.map(r => r.concat([true, now]));
    p.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
  const st = ss.getSheetByName('Settings');
  if (st.getLastRow() < 2) st.getRange(2, 1, DEFAULT_SETTINGS.length, 2).setValues(DEFAULT_SETTINGS);
  DriveApp.getRootFolder(); // memicu izin Drive (untuk unggah gambar menu)
}

function doGet() { return out_({ ok: true, msg: 'Vinn Caffe API aktif' }); }

function doPost(e) {
  let res;
  const lock = LockService.getScriptLock();
  try {
    const d = JSON.parse(e.postData.contents);
    lock.waitLock(20000);
    res = route_(d);
  } catch (err) { res = { ok: false, error: String(err.message || err) }; }
  finally { try { lock.releaseLock(); } catch (x) {} }
  return out_(res);
}

function route_(d) {
  switch (d.action) {
    case 'init': return { ok: true, products: products_(), settings: publicSettings_(), ratings: ratingSummary_() };
    case 'rate': return rate_(d);
    case 'reviews': return { ok: true, reviews: reviews_(String(d.code || '')) };
    case 'login': {
      const s = settings_();
      if (String(d.pin) === String(s.adminPin)) return { ok: true, role: 'admin' };
      if (String(d.pin) === String(s.userPin)) return { ok: true, role: 'user' };
      return { ok: true, role: null };
    }
    case 'checkout': return checkout_(d.order);
    case 'orders': admin_(d); return { ok: true, orders: orders_() };
    case 'saveProduct': admin_(d); saveProduct_(d.product); return { ok: true, products: products_() };
    case 'deleteProduct': admin_(d); deleteProduct_(d.code); return { ok: true, products: products_() };
    case 'adjustStock': admin_(d); return adjustStock_(d.code, Number(d.delta));
    case 'saveSettings': admin_(d); saveSettings_(d.settings); return { ok: true, settings: publicSettings_() };
    case 'setPins': admin_(d); setPins_(d); return { ok: true };
    case 'uploadImage': admin_(d); return { ok: true, url: uploadImage_(d.dataUrl) };
    default: throw new Error('Aksi tidak dikenal');
  }
}

/* ---------- util ---------- */
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function now_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss'); }
function sh_(n) { let s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(n); if (!s) { setup(); s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(n); } return s; }
function rows_(n) { const v = sh_(n).getDataRange().getValues(); const h = v.shift(); return v.filter(r => r[0] !== '').map(r => { const o = {}; h.forEach((k, i) => o[k] = r[i]); return o; }); }
const isOn_ = v => v === true || String(v).toUpperCase() === 'TRUE';
const str_ = v => v instanceof Date ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd HH:mm:ss') : String(v);
function settings_() { const o = {}; rows_('Settings').forEach(r => o[r.key] = String(r.value)); return o; }
function publicSettings_() { const s = settings_(); return { shopName: s.shopName, address: s.address, phone: s.phone, hours: s.hours, deliveryFee: Number(s.deliveryFee) || 0 }; }
function admin_(d) { if (String(d.pin) !== String(settings_().adminPin)) throw new Error('PIN admin salah'); }
function products_() {
  return rows_('Products').map(r => ({ code: String(r.code), name: r.name, category: r.category, price: Number(r.price), stock: Number(r.stock),
    size_value: Number(r.size_value), size_unit: r.size_unit, image: r.image, description: r.description, active: isOn_(r.active) }));
}

/* ---------- produk ---------- */
function saveProduct_(p) {
  if (!p || !p.code || !p.name) throw new Error('Data menu tidak lengkap');
  const s = sh_('Products'), H = SHEETS.Products;
  const row = H.map(k => k === 'updated_at' ? now_() : k === 'active' ? !!p.active : (p[k] == null ? '' : p[k]));
  const v = s.getDataRange().getValues();
  const i = v.findIndex((r, ix) => ix > 0 && String(r[0]) === String(p.code));
  if (i > 0) s.getRange(i + 1, 1, 1, H.length).setValues([row]); else s.appendRow(row);
}
function deleteProduct_(code) {
  const s = sh_('Products'), v = s.getDataRange().getValues();
  const i = v.findIndex((r, ix) => ix > 0 && String(r[0]) === String(code));
  if (i > 0) s.deleteRow(i + 1);
}
function adjustStock_(code, delta) {
  const s = sh_('Products'), v = s.getDataRange().getValues();
  const i = v.findIndex((r, ix) => ix > 0 && String(r[0]) === String(code));
  if (i < 1) throw new Error('Menu tidak ditemukan');
  const n = Math.max(0, Number(v[i][4]) + delta);
  s.getRange(i + 1, 5).setValue(n); s.getRange(i + 1, 11).setValue(now_());
  return { ok: true, stock: n };
}
function uploadImage_(dataUrl) {
  const m = /^data:(image\/[\w+.-]+);base64,(.+)$/.exec(dataUrl || '');
  if (!m) throw new Error('Format gambar tidak valid');
  const it = DriveApp.getFoldersByName('Vinn Caffe Images');
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder('Vinn Caffe Images');
  const file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], 'menu-' + Date.now() + '.jpg'));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://lh3.googleusercontent.com/d/' + file.getId();
}

/* ---------- pengaturan ---------- */
function setKeys_(obj) {
  const s = sh_('Settings'), v = s.getDataRange().getValues();
  Object.keys(obj).forEach(k => {
    const i = v.findIndex((r, ix) => ix > 0 && r[0] === k);
    if (i > 0) { s.getRange(i + 1, 2).setValue(String(obj[k])); v[i][1] = String(obj[k]); }
    else { s.appendRow([k, String(obj[k])]); v.push([k, String(obj[k])]); }
  });
}
function saveSettings_(x) {
  const o = {}; ['shopName', 'address', 'phone', 'hours', 'deliveryFee'].forEach(k => { if (x[k] != null) o[k] = x[k]; });
  setKeys_(o);
}
function setPins_(d) {
  const o = {};
  if (d.userPin) { if (!/^\d{4,6}$/.test(d.userPin)) throw new Error('PIN pembeli harus 4–6 digit'); o.userPin = d.userPin; }
  if (d.adminPin) { if (!/^\d{4,6}$/.test(d.adminPin)) throw new Error('PIN admin harus 4–6 digit'); o.adminPin = d.adminPin; }
  setKeys_(o);
}

/* ---------- transaksi ---------- */
function checkout_(o) {
  if (!o || !o.items || !o.items.length) throw new Error('Keranjang kosong');
  if (!o.customer || !String(o.customer).trim()) throw new Error('Nama pembeli wajib diisi');
  const delivery = o.type === 'delivery';
  if (delivery && (!o.phone || !o.address)) throw new Error('Nomor HP dan alamat wajib untuk pengantaran');
  const ps = sh_('Products'), v = ps.getDataRange().getValues();
  const lines = []; let subtotal = 0;
  o.items.forEach(it => {
    const i = v.findIndex((r, ix) => ix > 0 && String(r[0]) === String(it.code));
    const qty = Math.floor(Number(it.qty));
    if (i < 1 || !isOn_(v[i][9])) throw new Error('Menu ' + it.code + ' tidak tersedia');
    if (!(qty > 0)) throw new Error('Jumlah tidak valid');
    const stock = Number(v[i][4]);
    if (stock < qty) throw new Error('Stok ' + v[i][1] + ' tidak cukup (sisa ' + stock + ')');
    const price = Number(v[i][3]);
    subtotal += price * qty;
    lines.push({ i: i, code: String(v[i][0]), name: v[i][1], size: v[i][5] ? v[i][5] + ' ' + v[i][6] : '', qty: qty, price: price, stock: stock });
  });
  const fee = delivery ? (Number(settings_().deliveryFee) || 0) : 0, total = subtotal + fee;
  const cash = o.method === 'Tunai';
  const received = cash ? Number(o.received) || 0 : null;
  if (cash && received < total) throw new Error('Uang diterima kurang dari total');
  lines.forEach(l => { ps.getRange(l.i + 1, 5).setValue(l.stock - l.qty); ps.getRange(l.i + 1, 11).setValue(now_()); });
  const os = sh_('Orders'), time = now_(), day = time.slice(0, 10);
  const n = os.getDataRange().getValues().filter((r, ix) => ix > 0 && str_(r[1]).slice(0, 10) === day).length + 1;
  const no = 'VC-' + day.slice(2).replace(/-/g, '') + '-' + ('000' + n).slice(-4);
  const order = { no: no, time: time, customer: String(o.customer).trim(), phone: o.phone || '', type: delivery ? 'delivery' : 'pickup', address: delivery ? o.address : '',
    fee: fee, subtotal: subtotal, total: total, method: o.method, status: 'Lunas', received: received, change: cash ? received - total : null,
    items: lines.map(l => ({ code: l.code, name: l.name, size: l.size, qty: l.qty, price: l.price })) };
  os.appendRow([no, time, order.customer, order.phone, order.type, order.address, fee, subtotal, total, order.method, order.status, received == null ? '' : received, order.change == null ? '' : order.change]);
  const is = sh_('OrderItems'), rows = order.items.map(l => [no, l.code, l.name, l.size, l.qty, l.price, l.qty * l.price]);
  is.getRange(is.getLastRow() + 1, 1, rows.length, 7).setValues(rows);
  return { ok: true, order: order, products: products_() };
}
function orders_() {
  const items = {};
  rows_('OrderItems').forEach(r => (items[r.order_no] = items[r.order_no] || []).push({ code: String(r.code), name: r.name, size: r.size, qty: Number(r.qty), price: Number(r.price) }));
  return rows_('Orders').map(r => ({ no: String(r.order_no), time: str_(r.time), customer: r.customer, phone: String(r.phone), type: r.type, address: r.address,
    fee: Number(r.delivery_fee), subtotal: Number(r.subtotal), total: Number(r.total), method: r.payment_method, status: r.payment_status,
    received: r.cash_received === '' ? null : Number(r.cash_received), change: r.cash_change === '' ? null : Number(r.cash_change), items: items[r.order_no] || [] }))
    .sort((a, b) => a.time < b.time ? 1 : -1).slice(0, 500);
}


/* ---------- rating & ulasan ---------- */
function safeText_(s, n) { s = String(s || '').trim().slice(0, n); return /^[=+\-@]/.test(s) ? "'" + s : s; }
function ratingSummary_() {
  const m = {};
  rows_('Ratings').forEach(r => { const s = Number(r.stars) || 0; if (!s) return; const x = m[String(r.code)] || (m[String(r.code)] = { sum: 0, count: 0 }); x.sum += s; x.count++; });
  const o = {}; Object.keys(m).forEach(c => o[c] = { avg: Math.round(m[c].sum / m[c].count * 10) / 10, count: m[c].count }); return o;
}
function reviews_(code) {
  return rows_('Ratings').filter(r => String(r.code) === code).reverse().slice(0, 10)
    .map(r => ({ name: r.name, stars: Number(r.stars), comment: r.comment, time: String(r.time) }));
}
function rate_(d) {
  const code = String(d.code || ''), no = String(d.no || ''), stars = Math.round(Number(d.stars));
  if (!(stars >= 1 && stars <= 5)) throw new Error('Rating harus 1–5 bintang');
  if (!no || no.length > 40) throw new Error('Data rating tidak valid');
  if (!products_().some(p => p.code === code)) throw new Error('Menu tidak ditemukan');
  if (no.indexOf('D-') !== 0 && !rows_('OrderItems').some(i => String(i.order_no) === no && String(i.code) === code)) throw new Error('Nomor pesanan tidak cocok dengan menu');
  const name = safeText_(d.name, 40), comment = safeText_(d.comment, 200);
  const s = sh_('Ratings'), v = s.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) if (String(v[i][1]) === no && String(v[i][2]) === code) { s.getRange(i + 1, 4, 1, 3).setValues([[stars, name, comment]]); return { ok: true, summary: ratingSummary_()[code] }; }
  s.appendRow([now_(), no, code, stars, name, comment]);
  return { ok: true, summary: ratingSummary_()[code] };
}
