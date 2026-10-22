/* Lapisan data Vinn Caffe: Google Sheets (via Apps Script) atau mode lokal (localStorage). */
const DB = (() => {
  const remote = !!CONFIG.SCRIPT_URL;
  const ls = {
    g: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    s: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { throw new Error("Penyimpanan browser penuh"); } }
  };
  const p2 = n => String(n).padStart(2, "0");
  const stamp = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
  const apin = () => sessionStorage.getItem("vc_apin") || "";

  async function call(action, d = {}) {
    let r;
    try { r = await fetch(CONFIG.SCRIPT_URL, { method: "POST", body: JSON.stringify({ action, pin: apin(), ...d }) }); }
    catch { throw new Error("Tidak bisa terhubung ke server. Periksa internet."); }
    let j; try { j = await r.json(); } catch { throw new Error("Respon server tidak valid"); }
    if (!j.ok) throw new Error(j.error || "Permintaan gagal");
    return j;
  }
  const clone = o => JSON.parse(JSON.stringify(o));
  const lprods = () => { let p = ls.g("vc_products"); if (!p) { p = clone(SEED); ls.s("vc_products", p); } return p; };
  const lset = () => ({ ...CONFIG.SHOP, ...ls.g("vc_settings", {}) });
  const lpins = () => ({ user: CONFIG.DEFAULT_USER_PIN, admin: CONFIG.DEFAULT_ADMIN_PIN, ...ls.g("vc_pins", {}) });

  return {
    remote,
    setAuth: pin => pin ? sessionStorage.setItem("vc_apin", pin) : sessionStorage.removeItem("vc_apin"),
    async init() {
      if (!remote) return { products: lprods(), settings: lset() };
      try { const r = await call("init", { pin: "" }); ls.s("vc_cache", { products: r.products, settings: r.settings }); return r; }
      catch (e) { const c = ls.g("vc_cache"); if (c) return c; throw e; }
    },
    async login(pin) {
      if (remote) return (await call("login", { pin })).role;
      const p = lpins(); return pin === p.admin ? "admin" : pin === p.user ? "user" : null;
    },
    async checkout(o) {
      if (remote) return call("checkout", { order: o });
      const ps = lprods(), st = lset(), lines = []; let subtotal = 0;
      o.items.forEach(it => {
        const p = ps.find(x => x.code === it.code);
        if (!p || !p.active) throw new Error(`Menu ${it.code} tidak tersedia`);
        if (p.stock < it.qty) throw new Error(`Stok ${p.name} tidak cukup (sisa ${p.stock})`);
        subtotal += p.price * it.qty; lines.push({ p, qty: it.qty });
      });
      const fee = o.type === "delivery" ? +st.deliveryFee || 0 : 0, total = subtotal + fee, cash = o.method === "Tunai";
      const received = cash ? +o.received || 0 : null;
      if (cash && received < total) throw new Error("Uang diterima kurang dari total");
      lines.forEach(l => l.p.stock -= l.qty); ls.s("vc_products", ps);
      const orders = ls.g("vc_orders", []), now = new Date(), t = stamp(now), day = t.slice(0, 10);
      const n = orders.filter(x => x.time.startsWith(day)).length + 1;
      const order = { no: `VC-${day.slice(2).replace(/-/g, "")}-${String(n).padStart(4, "0")}`, time: t, customer: o.customer.trim(), phone: o.phone || "",
        type: o.type, address: o.type === "delivery" ? o.address : "", fee, subtotal, total, method: o.method, status: "Lunas", received,
        change: cash ? received - total : null,
        items: lines.map(l => ({ code: l.p.code, name: l.p.name, size: l.p.size_value ? `${l.p.size_value} ${l.p.size_unit}` : "", qty: l.qty, price: l.p.price })) };
      orders.unshift(order); ls.s("vc_orders", orders);
      return { order, products: ps };
    },
    async orders() { return remote ? (await call("orders")).orders : ls.g("vc_orders", []); },
    mine: () => ls.g("vc_my_orders", []),
    addMine(o) { const l = ls.g("vc_my_orders", []); l.unshift(o); ls.s("vc_my_orders", l.slice(0, 100)); },
    async saveProduct(p) {
      if (remote) return (await call("saveProduct", { product: p })).products;
      const ps = lprods(), i = ps.findIndex(x => x.code === p.code);
      i < 0 ? ps.push(p) : ps[i] = p; ls.s("vc_products", ps); return ps;
    },
    async deleteProduct(code) {
      if (remote) return (await call("deleteProduct", { code })).products;
      const ps = lprods().filter(x => x.code !== code); ls.s("vc_products", ps); return ps;
    },
    async adjustStock(code, delta) {
      if (remote) return (await call("adjustStock", { code, delta })).stock;
      const ps = lprods(), p = ps.find(x => x.code === code); p.stock = Math.max(0, p.stock + delta); ls.s("vc_products", ps); return p.stock;
    },
    async saveSettings(s) {
      if (remote) return (await call("saveSettings", { settings: s })).settings;
      const n = { ...lset(), ...s }; ls.s("vc_settings", n); return n;
    },
    async setPins(x) {
      if (remote) return call("setPins", x);
      ls.s("vc_pins", { ...lpins(), ...(x.userPin ? { user: x.userPin } : {}), ...(x.adminPin ? { admin: x.adminPin } : {}) });
    },
    async upload(dataUrl) { return remote ? (await call("uploadImage", { dataUrl })).url : dataUrl; },
    resetLocal() { ["vc_products", "vc_settings", "vc_orders", "vc_my_orders", "vc_pins"].forEach(k => localStorage.removeItem(k)); }
  };
})();
