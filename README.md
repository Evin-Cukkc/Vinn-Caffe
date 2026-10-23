# Vinn Caffe — APK Shop (web app untuk HP)

Aplikasi toko kopi & makanan berbentuk website yang tampil seperti aplikasi HP (PWA): layar kunci PIN, menu, keranjang, checkout, pembayaran (simulasi), struk cetak/PDF, riwayat, dan dashboard admin. Data bisa disimpan di **Google Sheet** lewat Apps Script.

## Tampilan
- **Laptop/PC:** halaman otomatis tampil di dalam bingkai iPhone 15 (393×852, Dynamic Island, status bar, tombol samping) dan mengecil otomatis mengikuti tinggi jendela.
- **HP/tablet:** tanpa bingkai, layar penuh seperti aplikasi.
- Gaya aplikasi: font Inter, judul besar, tab bar & header translucent, bottom sheet, tombol dengan efek tekan, animasi pindah halaman.

## Memasang sebagai aplikasi (PWA)
- **Android/Chrome:** buka situsnya (HTTPS) → muncul tombol **Pasang aplikasi di layar utama** di layar PIN, atau menu ⋮ › *Install app*.
- **iPhone/Safari:** Bagikan › **Tambah ke Layar Utama**.
- **Desktop Chrome/Edge:** ikon pasang di address bar.
- File PWA: `manifest.json` (ikon biasa + maskable, screenshot, shortcut Keranjang/Riwayat), `sw.js` (offline: semua file & foto menu di-cache; data Sheet selalu diambil langsung), `assets/icon-*.png`, `vercel.json` / `_headers` (header cache untuk Vercel / Netlify).
- Setelah mengubah file, naikkan angka `CACHE` di `sw.js` (mis. `vinn-caffe-v4`) agar pengguna mendapat versi baru.

## Coba cepat (mode lokal)
1. Ekstrak zip, buka folder `vinn-caffe` di VS Code → jalankan dengan **Live Server** (atau `python3 -m http.server` lalu buka `http://localhost:8000`).
2. PIN pembeli **1234**, PIN admin **246810**.
3. `config.js` sudah berisi `SCRIPT_URL` Google Sheet. Kosongkan nilainya jika ingin mencoba mode lokal (data hanya di browser).

## Menyambungkan ke Google Sheet
1. Buat Google Sheet baru → menu **Extensions › Apps Script**.
2. Hapus isi `Code.gs` bawaan, tempel seluruh isi file `apps-script/Code.gs`, lalu **Save**.
3. Pilih fungsi **`setup`** → **Run**, lalu beri izin (termasuk Google Drive untuk unggah gambar). Ini membuat 4 sheet otomatis:
   - `Products` — kode, nama, kategori, harga, stok, ukuran + satuan, gambar, deskripsi, aktif (sudah berisi 20 menu)
   - `Orders` — data transaksi (nomor, waktu, pembeli, antar/ambil, alamat, ongkir, subtotal, total, metode, status, uang diterima, kembalian)
   - `OrderItems` — rincian barang tiap transaksi
   - `Settings` — nama toko, alamat, telepon, jam buka, ongkir, PIN
4. **Deploy › New deployment › Web app** → *Execute as*: **Me**, *Who has access*: **Anyone** → Deploy → salin URL berakhiran `/exec`.
5. Tempel URL itu ke `SCRIPT_URL` di **`config.js`**, lalu unggah folder ke hosting HTTPS (Vercel, Netlify, GitHub Pages).
6. Setiap kali `Code.gs` diubah: **Deploy › Manage deployments › Edit › New version**.

Zona waktu transaksi di server memakai `Asia/Jakarta` (konstanta `TZ` di `Code.gs`).

## Fitur
- Layar kunci: tanggal, jam berjalan, status jaringan & baterai (jika browser mengizinkan), PIN ala HP. PIN pembeli masuk ke toko; PIN admin membuka dashboard.
- 20 menu (10 kopi, 10 makanan) dengan gambar, harga, stok, ukuran (g/kg/ml/L); pencarian + filter kategori.
- Keranjang: ubah jumlah (dibatasi stok), hapus, total otomatis.
- Pengambilan: ambil di toko (alamat toko tampil) atau antar (nama penerima, HP, alamat; ongkir diatur admin). Tidak ada pelacakan kurir.
- Pilih lokasi antar di peta: tombol **Pilih lokasi di peta** membuka peta (OpenStreetMap). Pembeli bisa mencari alamat, memakai GPS (**lokasi saya**), atau menggeser peta sampai pin tepat; alamat terisi otomatis lalu bisa diedit, ditambah detail (no. rumah, RT/RW, patokan). Jarak dari toko ditampilkan, dan struk/Sheet menyimpan tautan Google Maps ke titik tersebut. Koordinat toko diatur di `CONFIG.MAP` pada `config.js`. Peta & pencarian memakai layanan gratis OpenStreetMap/Nominatim (butuh internet; jika peta gagal dimuat, alamat bisa ditulis manual).
- Checkout: rincian pesanan, ongkir, total. Pembayaran simulasi: Tunai (uang diterima + kembalian), Transfer BRI/BCA/BNI, QRIS, DANA/OVO/GoPay.
- Struk: logo, nama & alamat toko, kontak, nomor transaksi, tanggal-jam, pembeli, barang, subtotal, ongkir, total, metode, status, uang diterima & kembalian. Tombol **Cetak / simpan PDF** (lebar kertas thermal 80 mm).
- Stok berkurang otomatis setelah transaksi; stok habis → tombol beli nonaktif; admin mendapat notifikasi stok habis/menipis.
- Admin: ringkasan hari ini, tambah/ubah/hapus menu (termasuk foto), atur stok, riwayat semua transaksi, ubah info toko, ongkir, dan PIN.

- Rating & ulasan: pembeli memberi 1–5 bintang dari struk atau detail menu (pembeli yang sudah memesan ditandai lewat nomor pesanan; selain itu dihitung per perangkat). Rata-rata tampil di kartu menu; admin melihat menu dengan rating tertinggi. Data tersimpan di sheet `Ratings` — setelah memperbarui `Code.gs`, buat **New version** di Deploy.

## Yang perlu Anda sesuaikan
- `config.js`: alamat, telepon, jam buka toko, nomor rekening/e-wallet (saat ini **contoh**), PIN awal.
- Semua itu juga bisa diubah dari Admin › Pengaturan setelah login.

## Catatan keamanan
- Dengan Google Sheet, PIN dicek di server dan perintah admin selalu diverifikasi ulang, tetapi PIN disimpan sebagai teks di sheet `Settings`. Batasi akses edit Spreadsheet hanya untuk pemilik, dan ganti PIN awal.
- Pembayaran hanya simulasi (tidak memproses uang asli).
- Riwayat pembeli hanya tersimpan di perangkat yang dipakai; admin melihat semua transaksi dari Sheet.

## Struktur
```
index.html  style.css  app.js  map.js  db.js  config.js  menu.js  sw.js  manifest.json  vercel.json  _headers
apps-script/Code.gs   backend Google Sheets
assets/  logo & ikon      images/  foto 20 menu
```
