
# Aldi Market — Full Upgrade

## Yang sudah di-upgrade
- Backend Express sekarang benar-benar dipakai oleh frontend
- Register / login / session pakai API + JWT
- Order customer tersimpan di backend JSON store
- Dashboard owner ambil analytics dari backend
- Produk owner bisa tambah / edit / hapus
- Payment settings bisa diatur dari dashboard owner
- Customer checkout bisa pilih metode bayar
- Owner dashboard lebih mobile-friendly

## Menjalankan project
1. Buka terminal di folder project
2. Copy `.env.example` menjadi `.env`
3. Jalankan:
   - `npm install` (jika diperlukan)
   - `npm start`
4. Buka `http://localhost:3000`

## Akun owner bawaan
- Username: `AldiYnsh123`
- Phone: `08xxxxxxxxxx`
- Password: `Aldiynsh123@`

## Cara link ke wallet owner
Masuk ke dashboard owner → tab **Payment** lalu isi:
- Default method
- Jenis wallet (DANA / OVO / GoPay / ShopeePay / Bank)
- Nomor wallet / rekening
- Nama pemilik wallet
- QRIS image URL (opsional)
- Instruksi pembayaran

Setelah disimpan, checkout customer otomatis menampilkan instruksi transfer ke wallet owner.

## Kalau mau pakai gateway beneran
Arsitekturnya sudah disiapkan supaya nanti bisa ganti ke:
- Midtrans Snap
- Xendit
- PayPal

Tempat integrasi paling gampang:
- public config: `api/payment.js`
- order creation: `api/orders.js`
- owner settings: `api/admin.js`

## Catatan storage
Data disimpan di:
- `storage/app-data.json`

Ini memudahkan demo lokal. Kalau nanti mau produksi, tinggal ganti store ini ke MySQL/PostgreSQL.
