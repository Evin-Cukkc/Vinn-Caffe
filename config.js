/* Pengaturan Vinn Caffe */ 
const CONFIG = { 
  // URL Web App Apps Script (berakhiran /exec) — data tersimpan di Google Sheet.
  // Dikosongkan = mode lokal (data hanya di browser, cocok untuk uji coba). 
  SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzB5wyiRBHAgldE3Cb4duNDpcyhkvbEgRmS8--wqnVbsz1WCHK2AkkZEcz7MAbFT7VAsQ/exec", 
  DEFAULT_USER_PIN: "1234", // PIN pembeli (mode lokal / isi awal Sheet) 
  DEFAULT_ADMIN_PIN: "246810", // PIN admin (mode lokal / isi awal Sheet) 
  LOW_STOCK: 5, // stok <= angka ini dianggap menipis 
  SHOP: { 
    shopName: "Vinn Caffe", 
    address: "Jl. Contoh No. 12, Medan, Sumatera Utara", 
    phone: "0812-3456-7890", 
    hours: "Setiap hari, 08.00 – 22.00", 
    deliveryFee: 8000 
  }, 
  // Titik toko di peta (untuk pusat peta & jarak pengantaran). 
  // (di Google Maps: tekan lama lokasi toko lalu salin angka lat, lng). 
  MAP: { 
    lat: 3.5952, 
    lng: 98.6722, 
    zoom: 14 
  }, 
  // Nomor tujuan pembayaran (CONTOH / simulasi — ganti dengan milik toko) 
  PAY: { 
    owner: "Vinn Caffe", 
    BRI: "0123-01-000456-50-1", 
    BCA: "123 456 7890", 
    BNI: "098 765 4321", 
    DANA: "0812-3456-7890", 
    OVO: "0812-3456-7890", 
    GoPay: "0812-3456-7890" 
  } 
};
