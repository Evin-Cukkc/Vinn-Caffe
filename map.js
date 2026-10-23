/* Vinn Caffe — pemilih lokasi pengantaran
   Peta: Leaflet + OpenStreetMap (dimuat hanya saat dibutuhkan)
   Cari alamat & alamat dari titik: Nominatim (OpenStreetMap), GPS: Geolocation API */
const MapPicker = (() => {
  const LF = "https://unpkg.com/leaflet@1.9.4/dist/";
  const NOM = "https://nominatim.openstreetmap.org/";
  const shop = () => Object.assign({ lat: 3.5952, lng: 98.6722, zoom: 14 }, CONFIG.MAP || {});
  let lp = null, map = null, cur = null, seq = 0, timer = 0, results = [], onPick = null;

  const load = () => {
    if (window.L) return Promise.resolve();
    if (lp) return lp;
    lp = new Promise((ok, no) => {
      const fail = () => { lp = null; no(new Error("Peta tidak dapat dimuat. Periksa koneksi internet.")); };
      const css = document.createElement("link"); css.rel = "stylesheet"; css.href = LF + "leaflet.css"; document.head.appendChild(css);
      const js = document.createElement("script"); js.src = LF + "leaflet.js"; js.onload = ok; js.onerror = fail; document.head.appendChild(js);
    });
    return lp;
  };

  const km = (a, b, c, d) => {
    const r = x => x * Math.PI / 180, h = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(h));
  };
  const fmtKm = k => k < 1 ? Math.round(k * 1000) + " m" : k.toFixed(1).replace(".", ",") + " km";
  const distText = (lat, lng) => { const s = shop(); return `± ${fmtKm(km(s.lat, s.lng, lat, lng))} dari ${CONFIG.SHOP.shopName} (garis lurus)`; };

  function nameOf(r) {
    const a = r.address || {};
    const place = a.amenity || a.shop || a.tourism || a.leisure || (a.building && a.building !== "yes" ? a.building : "");
    const road = [a.road || a.pedestrian || a.footway || a.path, a.house_number].filter(Boolean).join(" ");
    const parts = [place, road, a.neighbourhood || a.hamlet, a.village || a.suburb, a.city_district || a.municipality, a.city || a.town || a.county, a.state];
    const out = parts.filter((x, i, arr) => x && arr.indexOf(x) === i).join(", ");
    return out || (r.display_name || "").split(", ").slice(0, 5).join(", ");
  }

  function setInfo(addr, sub, ok) {
    const a = $("#mp-addr"), d = $("#mp-dist"), b = $("#mp-ok");
    if (!a) return;
    a.textContent = addr; d.textContent = sub || ""; b.disabled = !ok;
  }

  function schedule(delay = 550) {
    clearTimeout(timer);
    setInfo("Mencari alamat…", "", false);
    timer = setTimeout(reverse, delay);
  }

  async function reverse() {
    if (!map) return;
    const id = ++seq, c = map.getCenter();
    let place = "";
    try {
      const r = await fetch(`${NOM}reverse?format=jsonv2&lat=${c.lat}&lon=${c.lng}&zoom=18&addressdetails=1&accept-language=id`);
      if (!r.ok) throw 0;
      const j = await r.json();
      if (!j.error) place = nameOf(j);
    } catch {}
    if (id !== seq || !map) return;
    cur = { lat: c.lat, lng: c.lng, place };
    setInfo(place || "Nama jalan tidak ditemukan di titik ini", distText(c.lat, c.lng) + (place ? "" : " · Anda bisa menulis alamat sendiri"), true);
  }

  function hideRes() { const u = $("#mp-res"); if (u) { u.hidden = true; u.innerHTML = ""; } }

  async function search() {
    const q = ($("#mp-q").value || "").trim();
    if (q.length < 3) return toast("Ketik minimal 3 huruf");
    const u = $("#mp-res"), s = shop();
    u.hidden = false; u.innerHTML = '<li class="none">Mencari…</li>';
    try {
      const vb = [s.lng - .3, s.lat + .3, s.lng + .3, s.lat - .3].join(",");
      const r = await fetch(`${NOM}search?format=jsonv2&q=${encodeURIComponent(q)}&countrycodes=id&limit=6&addressdetails=1&accept-language=id&viewbox=${vb}`);
      if (!r.ok) throw 0;
      results = await r.json();
    } catch { u.innerHTML = '<li class="none">Pencarian gagal. Periksa koneksi lalu coba lagi.</li>'; return; }
    u.innerHTML = results.length
      ? results.map((r, i) => { const n = nameOf(r).split(", "); return `<li><button data-act="mpick" data-i="${i}"><b>${esc(n[0])}</b><small>${esc(n.slice(1).join(", ") || r.display_name || "")}</small></button></li>`; }).join("")
      : '<li class="none">Tidak ada hasil. Coba nama jalan atau daerah lain.</li>';
  }

  function locate() {
    if (!navigator.geolocation) return toast("Perangkat ini tidak mendukung lokasi");
    toast("Mencari lokasi Anda…");
    navigator.geolocation.getCurrentPosition(
      p => { hideRes(); map && map.setView([p.coords.latitude, p.coords.longitude], 17); },
      e => toast(e.code === 1 ? "Izin lokasi ditolak. Aktifkan izin lokasi di pengaturan browser." : "Lokasi belum ditemukan, coba lagi"),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
  }

  async function open(opts) {
    await load();
    onPick = opts.onPick;
    const s = shop(), has = typeof opts.lat === "number" && typeof opts.lng === "number";
    modal(`<div class="mp-head"><h3>Pilih lokasi pengantaran</h3><button class="x" data-act="close" aria-label="Tutup">${I.x}</button></div>
      <div class="mp-search"><input id="mp-q" type="search" enterkeyhint="search" autocomplete="off" placeholder="Cari jalan, gedung, atau daerah"><button class="btn" data-act="msearch">Cari</button></div>
      <div class="mp-wrap"><div id="mp-map"></div>
        <svg class="mp-pin" id="mp-pin" viewBox="0 0 40 50" aria-hidden="true"><path d="M20 49C20 49 4 31 4 19a16 16 0 0 1 32 0c0 12-16 30-16 30z" fill="#b3361b" stroke="#fff" stroke-width="2.5"/><circle cx="20" cy="19" r="6" fill="#fff"/></svg>
        <ul class="mp-res" id="mp-res" hidden></ul>
        <button class="mp-loc" data-act="mlocate" aria-label="Gunakan lokasi saya"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg></button></div>
      <div class="mp-info"><div class="mp-addr" id="mp-addr">Geser peta sampai pin tepat di lokasi pengantaran</div><small id="mp-dist"></small><button class="btn dark block" id="mp-ok" data-act="mconfirm" disabled>Gunakan lokasi ini</button></div>`, "mapsheet");
    map = L.map("mp-map", { zoomControl: false, attributionControl: true }).setView([has ? opts.lat : s.lat, has ? opts.lng : s.lng], has ? 17 : s.zoom);
    map.attributionControl.setPrefix(false);
    L.control.zoom({ position: "bottomright", zoomInTitle: "Perbesar", zoomOutTitle: "Perkecil" }).addTo(map);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(map);
    const pin = $("#mp-pin");
    map.on("movestart", () => { pin.classList.add("lift"); hideRes(); });
    map.on("moveend", () => { pin.classList.remove("lift"); schedule(); });
    map.on("click", hideRes);
    $("#mp-q").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); search(); } });
    setTimeout(() => { if (map) { map.invalidateSize(); schedule(0); } }, 300);
  }

  function destroy() { clearTimeout(timer); seq++; if (map) { map.remove(); map = null; } }

  const acts = {
    msearch: search,
    mlocate: locate,
    mpick: ({ i }) => { const r = results[+i]; if (!r || !map) return; hideRes(); map.setView([+r.lat, +r.lon], 17); },
    mconfirm: () => { if (!cur) return; const c = cur; closeModal(); onPick && onPick(c); }
  };
  return { open, destroy, acts, distText };
})();
Object.assign(A, MapPicker.acts);
