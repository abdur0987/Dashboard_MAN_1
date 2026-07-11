# Dashboard MAN 1 Bandar Lampung

Dashboard data madrasah dengan dua modul inti:

1. **EMIS** — profil sekolah, peserta didik, tingkat, gender, dan rombongan belajar.
2. **SIMPEG** — profil ASN/GTK, status kepegawaian, kualifikasi, dan sertifikasi.

## Teknologi

- Next.js 15, React 19, TypeScript, dan Tailwind CSS
- Recharts untuk visualisasi
- Drizzle ORM
- Turso/libSQL untuk database online, dengan SQLite sebagai fallback lokal
- Better Auth untuk login dan sesi admin

## Menjalankan lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3100`. Panel admin tersedia di `/admin` dan slideshow di
`/slideshow`.

Pada penggunaan pertama, pilih **Daftar** di halaman admin untuk membuat akun.
Nilai akun contoh pada form hanya untuk memudahkan pengembangan lokal dan harus
diganti sebelum produksi.

## Integrasi

- `GET /api/integrations/emis`
- `GET /api/integrations/simpeg`
- `GET /api/dashboard`
- `PUT /api/dashboard` (wajib sesi admin)

Isi `EMIS_API_URL`, `EMIS_API_TOKEN`, `SIMPEG_API_URL`, dan `SIMPEG_API_TOKEN`
untuk memakai layanan upstream. Selama nilainya kosong, endpoint integrasi
mengembalikan data dari database dashboard.

Database Turso `dashboard-man1-prod` sudah dibuat dan menjadi database aktif
untuk project ini. SQLite tetap tersedia sebagai fallback dengan mengosongkan
`TURSO_DATABASE_URL` dan `TURSO_AUTH_TOKEN`. Panduan lengkap tersedia di
`docs/turso-production.md`.
