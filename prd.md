# PRODUCT REQUIREMENT DOCUMENT

## Dashboard MAN 1 Lampung Selatan — EMIS & SIMPEG

Versi: 1.0  
Status: Implementasi awal  
Tanggal: 11 Juli 2026

## 1. Ringkasan

Dashboard MAN 1 Lampung Selatan adalah aplikasi web untuk menyajikan data inti
madrasah dalam satu tampilan yang ringkas, visual, dan dapat dikelola. Versi
pertama dibatasi pada dua sumber utama:

1. **EMIS** untuk rekap dan profil sekolah serta peserta didik.
2. **SIMPEG** untuk profil dan statistik ASN/Guru dan Tenaga Kependidikan.

Dashboard memiliki tiga permukaan yang memakai sumber data yang sama:

- dashboard publik;
- panel admin terautentikasi;
- slideshow/presentation mode untuk layar pimpinan.

## 2. Tujuan

- Menyediakan ringkasan profil MAN 1 Lampung Selatan yang cepat dipahami.
- Menampilkan rekap siswa tanpa membuka laporan EMIS mentah.
- Menampilkan profil dan komposisi ASN/GTK dari SIMPEG.
- Menyediakan fondasi integrasi API resmi tanpa menaruh token di browser.
- Menyediakan pengelolaan data melalui panel admin.
- Menjaga dashboard, admin, dan slideshow tetap konsisten karena memakai database yang sama.

## 3. Pengguna

| Pengguna | Kebutuhan |
| --- | --- |
| Pimpinan madrasah | Ringkasan cepat untuk monitoring dan rapat |
| Tim data/operator | Validasi dan pemutakhiran data EMIS/SIMPEG |
| Admin | Mengelola indikator, tabel, profil, publikasi, dan kontak |
| Publik | Melihat profil dan statistik madrasah yang telah divalidasi |

## 4. Ruang Lingkup Versi Pertama

### 4.1 Modul EMIS

- Identitas sekolah: nama, NPSN, NSM, status, akreditasi, dan alamat.
- Total peserta didik.
- Rekap kelas X, XI, dan XII.
- Rekap gender.
- Jumlah rombongan belajar.
- Label sumber dan status validasi data.

### 4.2 Modul SIMPEG

- Total Guru dan Tenaga Kependidikan.
- Total ASN.
- Komposisi PNS, PPPK, dan non-ASN.
- Kualifikasi pendidikan terakhir.
- Jumlah ASN tersertifikasi.
- Profil pimpinan dan beberapa ASN terpilih dengan foto.

### 4.3 Panel Admin

- Masuk/keluar dengan Better Auth; pendaftaran publik dinonaktifkan.
- Mengubah nama pengguna dan password akun sendiri.
- Mengubah teks header, hero, footer, alamat, peta, serta kontak kantor.
- Memantau sinkronisasi otomatis EMIS/SIMPEG dan menjalankan sync pemulihan.
- Tidak dapat upload file, mengimpor dokumen, atau mengubah angka secara manual.

### 4.4 Slideshow

- Ringkasan umum.
- Slide EMIS.
- Slide SIMPEG.
- Slide profil ASN.
- Putar otomatis, jeda, navigasi, dan layar penuh.
- Mengambil data dari endpoint dashboard yang sama.

## 5. Di Luar Ruang Lingkup Saat Ini

- Sinkronisasi rinci peserta didik sebelum kontrak endpoint EMIS terpetakan dan tervalidasi.
- Penggajian, absensi rinci, SKP, dan data pribadi sensitif ASN.
- Portal siswa/orang tua.
- Pembayaran dan layanan akademik transaksional.
- Aplikasi mobile native.

## 6. Arsitektur

### Frontend

- Next.js 15 App Router
- React 19 dan TypeScript
- Tailwind CSS dengan tema Apple-inspired liquid glass
- Recharts
- Lucide icons

### Backend

- Next.js Route Handlers pada runtime Node.js
- Drizzle ORM
- Better Auth dengan email dan password
- API terproteksi untuk perubahan dashboard dan unggah file
- Adapter upstream untuk EMIS dan SIMPEG

### Database

- Turso/libSQL sebagai database online.
- SQLite lokal sebagai fallback pengembangan.
- Skema yang sama dipakai Better Auth dan konten dashboard.
- Seed idempoten ketika database kosong.

## 7. Alur Data

```text
EMIS API ------\
                > Adapter server -> Turso/libSQL -> Dashboard publik
SIMPEG API ----/                         |-------> Slideshow
                                         |-------> Panel admin
```

Adapter EMIS memverifikasi identitas sekolah melalui NSM. Adapter SIMPEG
melakukan autentikasi server-side, menyaring respons berdasarkan NPSN/NSM, dan
hanya meneruskan field publik yang aman. Jika API upstream gagal, endpoint
integrasi membaca fallback dari database dashboard dan memberi status
`fallback`.

## 8. Endpoint

| Method | Endpoint | Akses | Fungsi |
| --- | --- | --- | --- |
| GET | `/api/dashboard` | Publik | Mengambil seluruh data dashboard |
| PUT | `/api/admin/settings` | Admin | Menyimpan teks dan kontak publik |
| POST | `/api/admin/sync/emis` | Admin | Menjalankan sync EMIS pemulihan |
| POST | `/api/admin/sync/simpeg` | Admin | Menjalankan sync SIMPEG pemulihan |
| POST | `/api/cron/sync` | Cron secret | Menjalankan sync otomatis |
| GET | `/api/integrations/emis` | Publik | Adapter/fallback EMIS |
| GET | `/api/integrations/simpeg` | Publik | Adapter/fallback SIMPEG |
| ALL | `/api/auth/[...all]` | Sesuai Better Auth | Login dan sesi admin |

## 9. Model Data

### Indikator

- id
- nama
- deskripsi
- kategori (`EMIS` atau `SIMPEG`)
- satuan
- sumber
- tahun
- nilai
- status validasi

### Baris Data

- indikator
- kategori
- unit kerja
- periode
- tahun
- nilai
- satuan
- sumber

### Profil ASN

Pada versi awal profil menggunakan tabel aktivitas agar dapat dikelola melalui
panel konten yang sudah stabil. Pemetaan field:

- `title` = nama ASN;
- `caption` = jabatan;
- `imageUrl` = foto.

Migrasi ke tabel profil khusus dapat dilakukan ketika kontrak SIMPEG resmi telah
ditetapkan.

## 10. Autentikasi dan Keamanan

- Better Auth menyimpan user, account, session, dan verification di database.
- Perubahan profil/tampilan memerlukan sesi admin valid.
- Endpoint cron memerlukan bearer secret server-side.
- Token Turso, EMIS, dan SIMPEG hanya tersedia pada environment server.
- File `.env.local` tidak masuk Git.
- Secret pengembangan wajib diganti sebelum produksi.
- Data sensitif ASN tidak ditampilkan pada dashboard publik.

## 11. Status Validitas Data

Data berikut telah dipetakan dari referensi resmi madrasah:

- nama dan alamat sekolah;
- NPSN dan NSM;
- status dan akreditasi;
- total peserta didik pada referensi satuan pendidikan;
- nama kepala madrasah dan dokumentasi serah terima terbaru.

SIMPEG saat ini menyediakan snapshot profil yang cocok dengan identitas sekolah.
Data tersebut ditampilkan sebagai perlu validasi dan tidak dianggap sebagai
total pegawai definitif. Rincian tingkat, gender, rombel, non-ASN, dan
sertifikasi tidak diisi dengan angka contoh; UI menampilkan status menunggu
pemetaan sumber resmi.

## 12. Kebutuhan Fungsional

| Kode | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-01 | Menampilkan dashboard publik | Tinggi |
| FR-02 | Menampilkan modul EMIS | Tinggi |
| FR-03 | Menampilkan modul SIMPEG | Tinggi |
| FR-04 | Menampilkan profil ASN dengan foto | Tinggi |
| FR-05 | Menampilkan grafik dan tabel | Tinggi |
| FR-06 | Menampilkan sumber dan status data | Tinggi |
| FR-07 | Menampilkan slideshow dari data dashboard | Tinggi |
| FR-08 | Login admin | Tinggi |
| FR-09 | Admin mengelola akun dan tampilan publik | Tinggi |
| FR-10 | Sinkronisasi otomatis menyimpan snapshot | Tinggi |
| FR-11 | Adapter API EMIS/SIMPEG | Tinggi |
| FR-12 | Kontak dan peta madrasah | Sedang |

## 13. Kebutuhan Non-Fungsional

- Responsif untuk desktop, tablet, dan telepon.
- Tampilan liquid glass dengan kontras dan keterbacaan yang baik.
- Backend berjalan pada Node.js.
- Database dapat dipindahkan dari SQLite ke Turso tanpa mengubah komponen UI.
- Build, lint, dan route utama harus lulus sebelum rilis.
- Slideshow mendukung layar penuh dan reduced motion.

## 14. Kriteria Penerimaan Versi Pertama

- Proyek berada di folder `Dashboard_MAN_1` dan dapat dijalankan lokal.
- Halaman `/` menampilkan dua modul inti dan data dari database.
- Halaman `/slideshow` memakai data yang sama dengan dashboard.
- Halaman `/admin` menggunakan Better Auth.
- Endpoint pengaturan admin menolak pengguna tanpa sesi.
- Endpoint upload/import tidak tersedia.
- Endpoint EMIS/SIMPEG mengembalikan fallback saat upstream kosong.
- Konfigurasi Turso tersedia dan SQLite lokal tetap bekerja.
- Data contoh memiliki penanda yang jelas.
- `npm run lint` dan `npm run build` berhasil.

## 15. Tahap Berikutnya

1. Memverifikasi koneksi deployment ke `dashboard-man1-lamsel-prod`.
2. Menjaga `dashboard-man1-prod` sebagai rollback sampai cutover produksi tervalidasi.
3. Menetapkan transformasi respons EMIS rinci ke model dashboard.
4. Validasi angka bersama operator madrasah.
5. Membatasi pembuatan akun admin pada produksi.
6. Menambahkan role Super Admin, Admin Data, dan Admin Konten.
