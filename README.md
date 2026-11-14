# Aldi Market

Toko online sederhana: katalog produk, register/login, checkout dengan pilihan pembayaran, dan dashboard owner. Backend Express + JWT, data disimpan di file JSON.

## Fitur
- Register / login dengan JWT dan bcrypt
- Katalog produk, keranjang, checkout (COD / e-wallet manual / PayPal sandbox)
- Dashboard owner: produk (tambah/ubah/hapus), order, analitik, pengaturan pembayaran

## Struktur
```
api/        route Express (auth, products, orders, admin, payment)
public/     frontend statis (HTML, CSS, JS, images)
scripts/    utilitas CLI (create-owner)
storage/    app-data.example.json (seed); app-data.json dibuat otomatis, tidak di-commit
docs/       catatan perubahan
server.js   entry point
```

## Menjalankan
```bash
npm install
cp .env.example .env        # isi JWT_SECRET dengan string acak panjang
npm start                   # http://localhost:3000
node scripts/create-owner.js <username> <email> <password>
```
Saat pertama jalan, `storage/app-data.json` disalin dari `app-data.example.json`.

## Keamanan
- `storage/app-data.json`, `.env` tidak boleh di-commit (sudah di `.gitignore`).
- Ganti `JWT_SECRET` sebelum deploy.
- Data JSON cocok untuk demo; untuk produksi pakai database.

## Lisensi
MIT
