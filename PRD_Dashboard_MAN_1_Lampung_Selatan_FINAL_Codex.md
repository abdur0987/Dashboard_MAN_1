# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## Dashboard Satu Data MAN 1 Lampung Selatan

**Repository target:** `abdur0987/Dashboard_MAN_1`  
**Repository referensi UX dan struktur produk:** `abdur0987/dashboard_kanwil`  
**Versi dokumen:** 2.0 — Dashboard terpadu tanpa login khusus pimpinan  
**Tanggal:** 15 Juli 2026  
**Status:** Siap digunakan sebagai instruksi implementasi Codex

---

## Keputusan Produk Terbaru — 15 Juli 2026

Ketentuan berikut menggantikan seluruh kebutuhan upload/import, bulk edit, dan
CMS data manual pada bagian lain dokumen ini:

- angka dashboard hanya berasal dari sinkronisasi otomatis EMIS dan SIMPEG;
- hasil sinkronisasi dinormalisasi dan disimpan sebagai snapshot pada database;
- admin tidak dapat upload file, mengimpor spreadsheet/dokumen, atau mengubah
  indikator dan angka secara manual;
- admin hanya mengelola profil akun sendiri, password, teks header/footer,
  serta alamat dan kontak kantor;
- sinkronisasi manual tetap tersedia sebagai tindakan pemulihan, sedangkan
  operasi normal menggunakan endpoint cron terproteksi.

---

## 1. Ringkasan Produk

Dashboard MAN 1 Lampung Selatan adalah dashboard satu data madrasah yang menggabungkan data EMIS, SIMPEG, serta data pendukung madrasah dalam satu halaman utama.

Produk harus mengikuti pola `dashboard_kanwil`:

- satu route dashboard utama pada `/`;
- satu komponen pengalaman dashboard;
- satu navigasi terpadu;
- satu sumber data dashboard yang sudah dinormalisasi;
- satu panel `/admin` untuk pengelolaan;
- satu mode slideshow;
- tidak ada dashboard publik dan dashboard pimpinan yang dipisahkan;
- tidak ada login khusus pimpinan;
- tidak ada widget yang berbeda berdasarkan jabatan pengguna pada halaman utama.

Semua pengunjung melihat dashboard agregat yang sama. Kepala madrasah, guru, pegawai, siswa, wali murid, masyarakat, dan pihak eksternal memperoleh informasi yang sama selama informasi tersebut aman untuk dipublikasikan.

Login hanya digunakan untuk administrator yang mengelola data, sinkronisasi, mapping, indikator, konten, dan konfigurasi melalui `/admin`.

---

## 2. Keputusan Produk Utama

### 2.1 Dashboard utama

Dashboard utama wajib:

- dapat diakses tanpa login;
- menampilkan data agregat yang aman;
- menampilkan status pembaruan data;
- menampilkan tren, target, kondisi, dan insight;
- menampilkan sumber setiap kelompok data;
- menggunakan satu tampilan yang sama untuk semua pengunjung;
- tetap berguna untuk masyarakat dan pengambilan keputusan pimpinan tanpa membuat area khusus pimpinan.

### 2.2 Panel admin

Panel `/admin` digunakan hanya untuk:

- login administrator;
- konfigurasi koneksi API;
- menjalankan sinkronisasi;
- melihat sync log;
- mapping field;
- validasi data;
- mengelola KPI dan target;
- mengelola konten;
- mengelola dataset dan publikasi;
- mengelola akun admin;
- melihat audit log.

### 2.3 Hal yang tidak boleh dibuat

Codex dilarang membuat:

- `/internal`;
- `/pimpinan`;
- `/executive-dashboard`;
- `/public-dashboard`;
- `/dashboard-pimpinan`;
- `InternalDashboardExperience`;
- `PublicDashboardExperience`;
- komponen dashboard khusus pimpinan;
- context AI berbeda untuk pimpinan;
- login pimpinan;
- role `pimpinan`;
- role-aware widget pada halaman `/`;
- endpoint publik dan internal yang menggandakan data yang sama.

---

## 3. Latar Belakang

MAN 1 Lampung Selatan membutuhkan dashboard yang tidak hanya menampilkan jumlah siswa dan pegawai, tetapi juga memberikan gambaran kondisi madrasah secara aktual.

Dashboard harus membantu menjawab:

1. Bagaimana kondisi peserta didik saat ini?
2. Bagaimana komposisi guru dan pegawai?
3. Apakah rasio guru dan siswa masih sehat?
4. Apakah jumlah rombongan belajar sesuai dengan jumlah siswa?
5. Apakah data EMIS dan SIMPEG berhasil diperbarui?
6. Data apa yang belum lengkap atau perlu divalidasi?
7. Indikator mana yang meningkat atau menurun?
8. Risiko apa yang perlu diperhatikan?
9. Prestasi dan kegiatan apa yang sedang berjalan?
10. Kapan data terakhir disinkronkan?

Dashboard harus mengubah data menjadi:

- informasi;
- tren;
- status;
- insight;
- peringatan;
- rekomendasi singkat.

---

## 4. Kondisi Repository Saat Ini

Repository `Dashboard_MAN_1` sudah memiliki fondasi berikut:

- Next.js 15;
- React 19;
- TypeScript;
- Tailwind CSS;
- Recharts;
- Drizzle ORM;
- Turso/libSQL untuk produksi;
- SQLite sebagai fallback lokal;
- Better Auth;
- halaman utama `/`;
- panel `/admin`;
- halaman `/slideshow`;
- endpoint `/api/dashboard`;
- endpoint `/api/integrations/emis`;
- endpoint `/api/integrations/simpeg`;
- AI assistant;
- impor XLSX, XLS, CSV, DOC, DOCX, dan PDF;
- dataset dan publikasi;
- prestasi dan kegiatan;
- kontak dan peta;
- fallback data database ketika upstream gagal.

Fondasi tersebut harus dipertahankan. Codex tidak boleh mengganti stack atau membangun ulang aplikasi dari nol.

---

## 5. Temuan Audit Repository

### 5.1 Integrasi EMIS

Kondisi saat ini:

- connector memanggil endpoint identitas madrasah berdasarkan NSM;
- data siswa, tingkat, gender, dan rombongan belajar belum sepenuhnya dipetakan;
- environment sudah menyediakan nama variabel public key dan private key;
- public/private key belum digunakan oleh connector;
- mekanisme signature resmi belum terdokumentasi di repository.

Kebutuhan:

- buat adapter autentikasi EMIS yang terisolasi;
- jangan menebak format signature;
- dukung mode autentikasi berdasarkan konfigurasi;
- mapping endpoint harus mudah diperbarui;
- data hasil sinkronisasi harus disimpan sebagai snapshot;
- dashboard tidak boleh bergantung pada upstream setiap kali halaman dibuka.

### 5.2 Integrasi SIMPEG

Kondisi saat ini:

- login dilakukan server-side;
- token digunakan untuk mengambil data pegawai;
- pegawai difilter berdasarkan NPSN, NSM, atau nama satuan kerja;
- data yang diteruskan ke dashboard sudah dibatasi;
- pagination belum dipastikan mengambil seluruh record;
- jumlah pegawai dapat tidak lengkap jika endpoint memiliki lebih dari satu halaman.

Kebutuhan:

- implementasikan pagination sampai semua halaman selesai;
- simpan metadata total upstream;
- hitung coverage hasil filter;
- simpan snapshot hasil agregasi;
- jangan menyimpan password atau token pada database;
- jangan meneruskan NIP, NIK, alamat, nomor telepon, atau payload mentah ke frontend.

### 5.3 Penyimpanan data

Kondisi saat ini:

- integrasi live ditambal ke data dashboard di memori;
- cache integrasi berlaku sekitar lima menit;
- histori sync belum tersimpan dengan baik;
- chart historis belum sepenuhnya berasal dari snapshot periodik;
- kegagalan upstream menghasilkan fallback database.

Kebutuhan:

- tambahkan tabel sync run;
- tambahkan snapshot EMIS dan SIMPEG;
- simpan last successful sync;
- jangan menghapus snapshot lama ketika sync gagal;
- grafik tren harus membaca snapshot historis;
- data dashboard harus selalu tersedia walaupun API pusat sedang gagal.

### 5.4 Panel admin

Kondisi saat ini:

- admin dapat mendaftar dari form;
- form masih memiliki email dan password contoh;
- semua pengguna yang berhasil login dapat melakukan perubahan;
- penyimpanan dashboard dilakukan dengan mengganti kumpulan data sekaligus;
- belum tersedia audit log yang memadai.

Kebutuhan:

- nonaktifkan public signup;
- hapus credential contoh dari form;
- hanya akun admin yang sudah dibuat yang dapat login;
- lindungi semua mutation pada server;
- validasi payload menggunakan schema;
- gunakan endpoint granular;
- gunakan transaksi database;
- tambahkan audit log.

### 5.5 AI assistant

Kondisi saat ini:

- assistant membaca data dashboard;
- assistant memiliki fallback rule-based;
- terdapat logika lama yang masih terkait Kanwil, PPID, kabupaten/kota, dan dataset lain;
- rata-rata indikator dapat mencampur siswa, pegawai, rombel, dan nilai;
- hasil tersebut dapat tampil seolah-olah persentase.

Kebutuhan:

- hapus seluruh konteks yang tidak relevan dengan MAN 1 Lampung Selatan;
- jangan menghitung rata-rata antarindikator yang berbeda satuan;
- gunakan KPI yang memiliki definisi dan denominator;
- semua pengunjung mendapat konteks AI yang sama;
- AI hanya menerima agregat yang aman;
- AI tidak boleh menerima raw payload EMIS atau SIMPEG;
- AI harus menyatakan ketika data belum tersedia.

---

## 6. Tujuan Produk

### 6.1 Tujuan utama

1. Menghubungkan data EMIS dan SIMPEG secara aman.
2. Menyediakan satu dashboard terpadu seperti `dashboard_kanwil`.
3. Menampilkan kondisi madrasah secara mudah dipahami.
4. Menyediakan tren dan insight, bukan hanya angka total.
5. Menampilkan kualitas dan kesegaran data.
6. Menyediakan fallback ketika upstream bermasalah.
7. Memberikan ringkasan yang berguna bagi masyarakat dan pimpinan pada halaman yang sama.
8. Mengurangi proses rekap manual.
9. Menyediakan pengelolaan admin yang aman.
10. Menjaga privasi data siswa dan pegawai.

### 6.2 Indikator keberhasilan

Produk dianggap berhasil apabila:

- halaman utama dapat dibuka tanpa login;
- semua pengunjung melihat struktur dan data dashboard yang sama;
- total siswa dapat diperbarui dari EMIS atau snapshot resmi;
- total pegawai dapat diperbarui dari seluruh halaman SIMPEG;
- setiap kelompok data menampilkan waktu update;
- kegagalan API tidak membuat dashboard kosong;
- dashboard memiliki data historis;
- insight menggunakan formula yang dapat dijelaskan;
- tidak ada data pribadi sensitif pada halaman utama;
- admin dapat menjalankan dan memantau sinkronisasi;
- build dan lint berhasil;
- tidak ada credential nyata dalam repository;
- performa halaman tetap baik pada perangkat desktop dan mobile.

---

## 7. Non-Goals Versi 1

Versi pertama tidak mencakup:

- aplikasi akademik lengkap;
- penginputan nilai rapor siswa;
- absensi siswa per individu;
- aplikasi BK;
- pembayaran sekolah;
- penggajian;
- daftar NIP pegawai;
- daftar NISN siswa;
- detail alamat siswa;
- detail gaji pegawai;
- replacement EMIS;
- replacement SIMPEG;
- SSO Kemenag;
- mobile app native;
- dashboard khusus pimpinan;
- login untuk masyarakat;
- login untuk kepala madrasah;
- role operator yang kompleks;
- real-time websocket;
- prediksi AI yang mengambil keputusan otomatis.

---

## 8. Pengguna Produk

### 8.1 Pengunjung dashboard

Pengunjung dapat berupa:

- masyarakat;
- siswa;
- wali murid;
- guru;
- pegawai;
- kepala madrasah;
- komite;
- alumni;
- instansi terkait.

Semua pengunjung:

- membuka route `/`;
- melihat data agregat yang sama;
- melihat sumber dan waktu pembaruan;
- menggunakan filter yang sama;
- menggunakan AI assistant dengan konteks publik yang sama;
- membuka slideshow;
- melihat prestasi, publikasi, dataset, kontak, dan lokasi.

Tidak ada perbedaan tampilan berdasarkan jabatan.

### 8.2 Administrator

Administrator:

- membuka `/admin`;
- login dengan akun admin;
- mengatur sumber data;
- menjalankan sync;
- memeriksa error;
- melakukan mapping;
- mengelola indikator dan target;
- mengelola konten;
- mengelola publikasi;
- melihat audit log;
- mengubah profil akun admin.

Hanya administrator yang membutuhkan autentikasi.

---

## 9. Prinsip Data

1. **Official first**  
   Data API resmi menjadi sumber utama.

2. **Snapshot first**  
   Dashboard membaca snapshot lokal terbaru, bukan memanggil upstream saat render.

3. **Last known good**  
   Snapshot terakhir yang berhasil tetap digunakan ketika sync berikutnya gagal.

4. **Public aggregation**  
   Halaman utama hanya memuat agregat aman.

5. **Explainable metrics**  
   Setiap KPI memiliki formula, numerator, denominator, unit, sumber, dan periode.

6. **No false precision**  
   Jangan menampilkan angka desimal jika sumber tidak mendukung.

7. **Freshness visible**  
   Tanggal dan waktu update selalu ditampilkan.

8. **No silent fallback**  
   Status fallback atau stale harus terlihat.

9. **No mixed-unit average**  
   Angka dengan unit berbeda tidak boleh dirata-ratakan.

10. **Privacy by default**  
    Data individu tidak boleh masuk ke payload dashboard.

---

## 10. Arsitektur Target

```text
EMIS API
   │
   ├── EMIS Auth Adapter
   ├── EMIS Endpoint Adapter
   └── EMIS Normalizer
   │
   ▼
Sync Service ──► Sync Runs ──► EMIS Snapshots
   │
SIMPEG API
   │
   ├── Login Adapter
   ├── Pagination
   ├── Unit Filter
   └── SIMPEG Normalizer
   │
   ▼
Sync Service ──► Sync Runs ──► SIMPEG Snapshots
   │
   ▼
KPI Engine
   │
   ├── KPI Values
   ├── Data Quality
   ├── Alerts
   └── Insight Rules
   │
   ▼
Dashboard Read Model
   │
   ├── GET /api/dashboard
   ├── DashboardExperience
   ├── SlideshowExperience
   └── AI Assistant
```

### 10.1 Keputusan arsitektur wajib

- route utama tetap `/`;
- route admin tetap `/admin`;
- route slideshow tetap `/slideshow`;
- satu `DashboardExperience`;
- satu `DashboardData`;
- satu endpoint read model utama;
- tidak ada dashboard berdasarkan role;
- tidak ada session check untuk mengubah data yang tampil pada `/`;
- session hanya digunakan untuk melindungi `/admin` dan endpoint mutation;
- upstream hanya dipanggil oleh sync service;
- dashboard membaca database lokal;
- connector dipisahkan dari komponen UI;
- normalizer dipisahkan dari transport API;
- KPI dipisahkan dari raw snapshot;
- AI membaca read model yang sudah aman.

---

## 11. Information Architecture Dashboard Utama

Urutan halaman mengikuti pola dashboard Kanwil, tetapi isi disesuaikan dengan madrasah.

### 11.1 Header dan navigasi

Navigasi utama:

1. Beranda
2. Ringkasan
3. EMIS
4. SIMPEG
5. Kinerja
6. Insight
7. Prestasi
8. Dataset
9. Publikasi
10. Kontak
11. Lokasi
12. Slideshow
13. Admin

Ketentuan:

- sticky header;
- mobile menu;
- tombol refresh membaca ulang database;
- tidak menjalankan sync upstream dari tombol publik;
- logo MAN 1 Lampung Selatan;
- tahun pelajaran aktif;
- indikator status data ringkas.

### 11.2 Hero

Hero menampilkan:

- nama madrasah;
- tagline Satu Data Madrasah;
- deskripsi singkat;
- NPSN;
- NSM;
- status negeri;
- akreditasi;
- foto kampus;
- tombol lihat data;
- tombol slideshow.

### 11.3 Status sumber data

Tampilkan card status:

- EMIS;
- SIMPEG;
- Database;
- Waktu update.

Status yang didukung:

- `fresh`;
- `stale`;
- `fallback`;
- `syncing`;
- `failed`;
- `not_configured`.

Contoh:

> EMIS — Fresh  
> Diperbarui 15 Juli 2026, 07.30 WIB.

> SIMPEG — Stale  
> Menggunakan snapshot terakhir 14 Juli 2026, 23.10 WIB.

Jangan menampilkan:

- URL privat;
- token;
- email API;
- error stack;
- response body;
- key;
- password.

### 11.4 Ringkasan kondisi madrasah

Tampilkan 5–8 card utama:

- Peserta didik;
- Rombongan belajar;
- Guru dan tenaga kependidikan;
- PNS;
- PPPK;
- Guru tersertifikasi;
- Rasio siswa-guru;
- Data quality score.

Setiap card memiliki:

- nilai;
- unit;
- periode;
- trend;
- sumber;
- status validasi;
- tooltip definisi.

### 11.5 Ringkasan naratif

Tampilkan ringkasan otomatis yang sama untuk semua pengunjung.

Contoh:

> MAN 1 Lampung Selatan memiliki 1.024 peserta didik dalam 30 rombongan belajar. Jumlah siswa meningkat 3,8% dibanding periode sebelumnya. Rasio siswa terhadap guru berada pada 15:1. Data EMIS terakhir diperbarui hari ini, sedangkan data SIMPEG menggunakan snapshot kemarin. Area yang perlu diperhatikan adalah kelengkapan data sertifikasi dan pemetaan guru per mata pelajaran.

Ringkasan dibuat dari rule engine terlebih dahulu. AI hanya merapikan bahasa jika tersedia.

---

## 12. Modul EMIS

### 12.1 Profil lembaga

Tampilkan:

- nama madrasah;
- NSM;
- NPSN;
- status lembaga;
- jenjang;
- alamat agregat;
- kecamatan;
- kabupaten;
- provinsi;
- akreditasi;
- status registrasi;
- tahun pelajaran aktif;
- waktu sinkronisasi.

### 12.2 Peserta didik

KPI:

- total siswa aktif;
- siswa kelas X;
- siswa kelas XI;
- siswa kelas XII;
- siswa laki-laki;
- siswa perempuan;
- pertumbuhan siswa;
- rata-rata siswa per rombel.

Visualisasi:

- bar chart siswa per tingkat;
- donut gender;
- line chart jumlah siswa per periode;
- card pertumbuhan;
- tabel ringkas.

### 12.3 Rombongan belajar

KPI:

- total rombel;
- rombel per tingkat;
- rata-rata siswa per rombel;
- tingkat dengan kepadatan tertinggi;
- tren pertumbuhan rombel.

Insight contoh:

> Rata-rata kepadatan kelas XI lebih tinggi 12% dibanding rata-rata madrasah.

### 12.4 Kualitas data EMIS

Tampilkan secara agregat:

- persentase field wajib terisi;
- jumlah record perlu validasi;
- jumlah data tidak konsisten;
- jumlah data tidak diperbarui;
- waktu sinkronisasi;
- coverage endpoint.

Jangan menampilkan daftar nama siswa bermasalah pada dashboard utama.

---

## 13. Modul SIMPEG

### 13.1 Ringkasan pegawai

KPI:

- total guru dan tenaga kependidikan;
- total ASN;
- PNS;
- PPPK;
- non-ASN jika tersedia;
- guru;
- tenaga kependidikan;
- pegawai aktif;
- coverage filter satuan kerja.

### 13.2 Pendidikan terakhir

Tampilkan:

- S3;
- S2;
- S1/D4;
- Diploma;
- SMA/sederajat;
- belum terpetakan.

Visualisasi:

- horizontal bar;
- percentage progress;
- tabel agregat.

### 13.3 Sertifikasi

Tampilkan jika field tersedia:

- guru tersertifikasi;
- guru belum tersertifikasi;
- persentase sertifikasi;
- data sertifikasi belum lengkap.

Jika field belum tersedia:

- jangan menampilkan angka `0` seolah-olah valid;
- tampilkan status “data belum tersedia”;
- tampilkan sumber dan alasan.

### 13.4 Komposisi status pegawai

Tampilkan:

- PNS;
- PPPK;
- non-ASN;
- status lain;
- belum terpetakan.

### 13.5 Data aman

Data berikut tidak boleh masuk ke halaman utama:

- NIP;
- NIK;
- nomor KK;
- alamat rumah;
- nomor telepon;
- email pribadi;
- gaji;
- rekening;
- data kesehatan;
- password;
- token;
- dokumen kepegawaian;
- payload mentah.

Nama pegawai sebaiknya tidak diambil otomatis untuk daftar publik. Profil kepala madrasah dan pejabat yang memang dipublikasikan harus berasal dari konten admin, bukan otomatis dari seluruh data SIMPEG.

---

## 14. Modul Kinerja Madrasah

### 14.1 KPI prioritas

| KPI | Formula | Sumber | Unit |
|---|---|---|---|
| Pertumbuhan siswa | `(siswa sekarang - siswa sebelumnya) / siswa sebelumnya × 100` | EMIS snapshot | persen |
| Rasio siswa-guru | `total siswa / total guru` | EMIS + SIMPEG | rasio |
| Rata-rata siswa per rombel | `total siswa / total rombel` | EMIS | siswa |
| Guru minimal S1/D4 | `guru S1/D4+ / total guru × 100` | SIMPEG | persen |
| Guru tersertifikasi | `guru bersertifikat / total guru × 100` | SIMPEG | persen |
| Kelengkapan data EMIS | `field valid / field wajib × 100` | EMIS validation | persen |
| Coverage SIMPEG | `pegawai cocok / total upstream × 100` | SIMPEG | persen |
| Freshness data | berdasarkan umur snapshot | Sync metadata | status |
| Kondisi sarpras baik | `sarpras baik / total sarpras × 100` | Data lokal/EMIS | persen |
| Kelulusan | `siswa lulus / peserta akhir × 100` | Data lokal | persen |

### 14.2 Target

Setiap KPI dapat memiliki:

- target tahunan;
- target semester;
- nilai aktual;
- gap;
- status;
- sumber;
- penanggung jawab data;
- tanggal update.

Status:

- tercapai;
- mendekati target;
- perlu perhatian;
- belum tersedia.

### 14.3 Madrasah Performance Score

Performance score boleh ditampilkan jika seluruh komponennya memiliki formula yang konsisten.

Komponen awal:

- peserta didik: 20%;
- SDM: 20%;
- kualitas pendidikan: 25%;
- sarana: 15%;
- kualitas data: 10%;
- pelayanan dan prestasi: 10%.

Ketentuan:

- setiap subscore harus 0–100;
- bobot harus terlihat;
- komponen tanpa data tidak boleh otomatis bernilai 0;
- jika coverage kurang, tampilkan “belum cukup data”;
- skor tidak boleh dihitung dari jumlah siswa dan jumlah pegawai secara langsung;
- admin dapat mengubah bobot;
- halaman utama dapat membuka rincian formula.

---

## 15. Insight dan Alert Engine

### 15.1 Prinsip

Insight harus:

- berasal dari rule yang eksplisit;
- menggunakan snapshot yang valid;
- memiliki severity;
- menyebut sumber;
- menyebut periode;
- tidak mengarang sebab;
- tidak menyebut individu;
- sama untuk semua pengunjung.

### 15.2 Rule awal

#### Pertumbuhan siswa

```text
Jika pertumbuhan siswa > 5%:
  insight = "Jumlah peserta didik meningkat signifikan."
  severity = positive
```

#### Kepadatan rombel

```text
Jika siswa per rombel > target kepadatan:
  insight = "Kepadatan rombongan belajar melebihi target."
  severity = warning
```

#### Rasio siswa-guru

```text
Jika rasio siswa-guru > target:
  insight = "Rasio siswa terhadap guru perlu dipantau."
  severity = warning
```

#### Kualifikasi guru

```text
Jika persentase guru minimal S1/D4 < target:
  insight = "Kualifikasi akademik guru belum mencapai target."
  severity = warning
```

#### Sertifikasi

```text
Jika coverage field sertifikasi < 80%:
  insight = "Data sertifikasi belum cukup untuk menyimpulkan capaian."
  severity = data_quality
```

#### Freshness

```text
Jika snapshot EMIS lebih dari 24 jam:
  status = stale
```

```text
Jika snapshot SIMPEG lebih dari 7 hari:
  status = stale
```

#### API gagal

```text
Jika sync terbaru gagal dan snapshot lama tersedia:
  status = fallback
  insight = "Dashboard memakai snapshot terakhir yang berhasil."
```

#### Data kosong

```text
Jika endpoint sukses tetapi hasil filter 0:
  jangan langsung menyimpan 0 sebagai nilai final;
  tandai sebagai anomaly;
  pertahankan last known good;
```

### 15.3 Tampilan insight

Setiap insight memiliki:

- judul;
- deskripsi;
- kategori;
- severity;
- nilai terkait;
- periode;
- sumber;
- waktu dibuat;
- status aktif atau selesai.

Kategori:

- positif;
- informasi;
- perhatian;
- kualitas data;
- integrasi.

---

## 16. Data Quality Score

### 16.1 Komponen

| Komponen | Bobot |
|---|---:|
| Kelengkapan | 35% |
| Validitas | 25% |
| Konsistensi | 20% |
| Kesegaran | 15% |
| Duplikasi | 5% |

### 16.2 Aturan

- skor dihitung terpisah untuk EMIS dan SIMPEG;
- skor gabungan hanya dibuat dari skor persentase;
- issue individu tidak ditampilkan pada halaman utama;
- dashboard hanya menampilkan jumlah issue per kategori;
- detail issue tersedia di admin;
- issue dapat memiliki status open, reviewing, resolved, ignored;
- perubahan status dicatat dalam audit log.

### 16.3 Tampilan

Dashboard menampilkan:

- skor EMIS;
- skor SIMPEG;
- skor keseluruhan;
- tren;
- jumlah issue;
- waktu penilaian;
- kategori masalah terbesar.

---

## 17. Integrasi EMIS

### 17.1 Environment

Gunakan nama environment berikut tanpa memasukkan nilai nyata ke repository:

```env
EMIS_PUBLIC_URL_API=
EMIS_PUBLIC_KEY=
EMIS_PRIVATE_KEY=
EMIS_NSM=131118010001
```

### 17.2 Authentication adapter

Buat interface:

```ts
type EmisAuthContext = {
  method: string;
  headers: Record<string, string>;
  query?: Record<string, string>;
};
```

Buat fungsi:

```ts
buildEmisAuthContext(input): Promise<EmisAuthContext>
```

Ketentuan:

- implementasi tidak boleh berada di client component;
- key hanya dibaca server-side;
- jangan log key;
- jangan log signature;
- jangan mengarang skema autentikasi;
- jika dokumentasi resmi belum tersedia, adapter dapat memiliki mode `none`, `headers`, atau `custom`;
- beri TODO yang jelas untuk kontrak resmi.

### 17.3 Endpoint registry

Buat registry configurable:

```ts
const emisEndpoints = {
  institutionByNsm: "...",
  studentSummary: "...",
  studentByGrade: "...",
  studentByGender: "...",
  studyGroups: "...",
};
```

Jangan menyebarkan path endpoint di banyak file.

### 17.4 Normalisasi

Raw EMIS harus dipetakan ke model internal:

```ts
type EmisNormalizedSnapshot = {
  institution: {
    name: string;
    nsm: string;
    npsn: string;
    status?: string;
    accreditation?: string;
  };
  students: {
    total?: number;
    grade10?: number;
    grade11?: number;
    grade12?: number;
    male?: number;
    female?: number;
  };
  studyGroups: {
    total?: number;
    grade10?: number;
    grade11?: number;
    grade12?: number;
  };
  coverage: number;
  warnings: string[];
};
```

### 17.5 Validasi

- NSM harus cocok;
- NPSN harus cocok jika tersedia;
- nilai tidak boleh negatif;
- total gender tidak boleh melebihi total siswa tanpa warning;
- total tingkat tidak boleh melebihi total siswa tanpa warning;
- missing field tidak dikonversi menjadi 0;
- parsing error dicatat;
- raw payload tidak dikirim ke client.

---

## 18. Integrasi SIMPEG

### 18.1 Environment

```env
SIMPEG_PUBLIC_URL_API=
SIMPEG_PUBLIC_EMAIL=
SIMPEG_PUBLIC_PASSWORD=
SIMPEG_NSM=131118010001
SIMPEG_NPSN=10816233
SIMPEG_UNIT_NAME=MAN 1 Lampung Selatan
```

### 18.2 Login

- login server-side;
- token hanya berada di memory selama proses sync;
- token tidak disimpan di database;
- token tidak dikembalikan ke browser;
- body login tidak dicatat;
- gunakan timeout;
- error disanitasi.

### 18.3 Pagination

Connector wajib:

1. login;
2. membaca metadata total dan size;
3. mengambil halaman pertama;
4. menentukan jumlah halaman;
5. mengambil halaman berikutnya;
6. mencegah infinite loop;
7. menggabungkan record;
8. deduplicate;
9. memfilter unit kerja;
10. membuat agregat;
11. menyimpan snapshot.

Batas aman:

- `MAX_PAGES`;
- `MAX_RECORDS`;
- timeout per request;
- retry terbatas;
- backoff.

### 18.4 Filter unit kerja

Match berjenjang:

1. NSM exact;
2. NPSN exact;
3. kode satuan kerja jika tersedia;
4. nama satuan kerja yang sudah dinormalisasi.

Setiap hasil match memiliki alasan:

```ts
type EmployeeMatchReason =
  | "nsm"
  | "npsn"
  | "satker_code"
  | "unit_name";
```

Dashboard hanya membaca agregat. Detail record hanya digunakan selama normalisasi server-side.

### 18.5 Normalisasi

```ts
type SimpegNormalizedSnapshot = {
  totals: {
    employees?: number;
    teachers?: number;
    staff?: number;
    pns?: number;
    pppk?: number;
    nonAsn?: number;
  };
  education: {
    s3?: number;
    s2?: number;
    s1d4?: number;
    diploma?: number;
    secondary?: number;
    unknown?: number;
  };
  certification: {
    certified?: number;
    uncertified?: number;
    unknown?: number;
  };
  upstreamTotal?: number;
  filteredTotal?: number;
  pageCount?: number;
  coverage?: number;
  warnings: string[];
};
```

### 18.6 Validasi

- total kategori tidak boleh negatif;
- filtered total tidak boleh melebihi upstream total;
- jika filtered total tiba-tiba turun drastis, tandai anomaly;
- hasil 0 tidak otomatis mengganti snapshot valid sebelumnya;
- pendidikan yang tidak dikenali masuk `unknown`;
- status pegawai yang tidak dikenali masuk `other`;
- sertifikasi missing masuk `unknown`.

---

## 19. Data Snapshot dan Histori

### 19.1 Tujuan

Snapshot diperlukan untuk:

- fallback;
- tren;
- audit;
- perbandingan periode;
- analisis perubahan;
- menghindari panggilan API saat render.

### 19.2 Frekuensi awal

- EMIS: 4 kali sehari atau sesuai batas API;
- SIMPEG: 1 kali sehari;
- KPI: setelah sync berhasil;
- data quality: setelah normalisasi;
- insight: setelah KPI dihitung;
- slideshow: membaca read model yang sama.

### 19.3 Last known good

Ketika sync gagal:

- simpan sync run sebagai failed;
- jangan menghapus snapshot sebelumnya;
- dashboard tetap memakai snapshot berhasil terakhir;
- status menjadi fallback atau stale;
- tampilkan waktu snapshot;
- admin melihat error rinci yang sudah disanitasi.

---

## 20. Data Model

Gunakan Drizzle ORM dan migrasi yang kompatibel dengan SQLite/libSQL.

### 20.1 `integration_sources`

Field:

- `id`;
- `code`;
- `name`;
- `base_url_masked`;
- `enabled`;
- `sync_frequency`;
- `freshness_threshold_minutes`;
- `last_success_at`;
- `last_attempt_at`;
- `last_status`;
- `created_at`;
- `updated_at`.

Jangan menyimpan credential.

### 20.2 `sync_runs`

Field:

- `id`;
- `source_code`;
- `trigger_type`;
- `started_at`;
- `finished_at`;
- `status`;
- `records_received`;
- `records_matched`;
- `records_rejected`;
- `page_count`;
- `duration_ms`;
- `error_code`;
- `error_summary`;
- `created_by`;
- `created_at`.

Status:

- queued;
- running;
- success;
- partial;
- failed.

### 20.3 `institution_snapshots`

Field:

- `id`;
- `sync_run_id`;
- `period`;
- `name`;
- `nsm`;
- `npsn`;
- `status`;
- `accreditation`;
- `registered_status`;
- `source_updated_at`;
- `captured_at`.

### 20.4 `student_aggregate_snapshots`

Field:

- `id`;
- `sync_run_id`;
- `period`;
- `school_year`;
- `semester`;
- `students_total`;
- `grade_10`;
- `grade_11`;
- `grade_12`;
- `male`;
- `female`;
- `study_groups_total`;
- `study_groups_10`;
- `study_groups_11`;
- `study_groups_12`;
- `coverage`;
- `quality_score`;
- `captured_at`.

Nullable values harus tetap null jika data tidak tersedia.

### 20.5 `employee_aggregate_snapshots`

Field:

- `id`;
- `sync_run_id`;
- `period`;
- `employees_total`;
- `teachers_total`;
- `staff_total`;
- `pns_total`;
- `pppk_total`;
- `non_asn_total`;
- `education_s3`;
- `education_s2`;
- `education_s1d4`;
- `education_diploma`;
- `education_secondary`;
- `education_unknown`;
- `certified_total`;
- `uncertified_total`;
- `certification_unknown`;
- `upstream_total`;
- `filtered_total`;
- `page_count`;
- `coverage`;
- `quality_score`;
- `captured_at`.

### 20.6 `kpi_definitions`

Field:

- `id`;
- `code`;
- `name`;
- `description`;
- `category`;
- `unit`;
- `formula_type`;
- `formula_config`;
- `direction`;
- `public_visible`;
- `enabled`;
- `sort_order`;
- `created_at`;
- `updated_at`.

### 20.7 `kpi_values`

Field:

- `id`;
- `kpi_id`;
- `period`;
- `value`;
- `numerator`;
- `denominator`;
- `target`;
- `status`;
- `source_summary`;
- `calculated_at`.

### 20.8 `kpi_targets`

Field:

- `id`;
- `kpi_id`;
- `period`;
- `target_value`;
- `warning_threshold`;
- `critical_threshold`;
- `notes`;
- `created_at`;
- `updated_at`.

### 20.9 `data_quality_issues`

Field:

- `id`;
- `source_code`;
- `sync_run_id`;
- `issue_type`;
- `severity`;
- `record_reference_hash`;
- `message`;
- `status`;
- `first_seen_at`;
- `last_seen_at`;
- `resolved_at`;
- `resolved_by`.

Jangan menyimpan NIP, NIK, atau NISN mentah sebagai reference.

### 20.10 `insights`

Field:

- `id`;
- `code`;
- `category`;
- `severity`;
- `title`;
- `description`;
- `metric_code`;
- `metric_value`;
- `period`;
- `source_summary`;
- `active`;
- `generated_at`;
- `expired_at`.

### 20.11 `audit_logs`

Field:

- `id`;
- `actor_user_id`;
- `action`;
- `entity_type`;
- `entity_id`;
- `before_summary`;
- `after_summary`;
- `ip_address`;
- `user_agent`;
- `created_at`.

Audit summary tidak boleh menyimpan credential.

### 20.12 User admin

Gunakan tabel Better Auth yang sudah ada.

Tambahkan field atau tabel sederhana untuk menentukan admin, misalnya:

- `is_admin`;
- atau tabel `admin_users`.

Tidak perlu role matrix kompleks.

---

## 21. Dashboard Read Model

Buat service:

```ts
getUnifiedDashboardData(): Promise<DashboardData>
```

Service menggabungkan:

- profil madrasah;
- snapshot EMIS terbaru;
- snapshot SIMPEG terbaru;
- histori;
- KPI;
- target;
- data quality;
- insight;
- prestasi;
- publikasi;
- dataset;
- kontak;
- status sync.

Ketentuan:

- tidak memanggil upstream;
- tidak membaca credential;
- tidak mengembalikan raw payload;
- tidak mengembalikan PII;
- dapat digunakan `/`, `/slideshow`, dan AI assistant;
- output konsisten;
- nullable dipertahankan;
- setiap kelompok memiliki metadata sumber.

---

## 22. API Aplikasi

### 22.1 Public read API

#### `GET /api/dashboard`

Mengembalikan satu read model agregat.

Response mencakup:

- profile;
- status sumber;
- last updated;
- metrics;
- EMIS summary;
- SIMPEG summary;
- KPI;
- trends;
- data quality;
- insights;
- content;
- contacts.

Tidak memerlukan login.

#### `GET /api/dashboard/status`

Opsional untuk status ringkas:

- source;
- status;
- last success;
- freshness;
- record count.

Tidak boleh mengembalikan error teknis rinci.

#### `POST /api/assistant`

Tidak memerlukan login.

Ketentuan:

- rate limit;
- context publik yang sama untuk semua;
- hanya data agregat;
- tidak menggunakan session untuk memperluas data;
- tidak menerima raw payload;
- fallback rule-based.

### 22.2 Admin API

Semua endpoint admin wajib session admin.

#### Sinkronisasi

- `POST /api/admin/sync/emis`
- `POST /api/admin/sync/simpeg`
- `GET /api/admin/sync-runs`
- `GET /api/admin/sync-runs/:id`
- `POST /api/admin/integrations/:source/test`

#### Mapping

- `GET /api/admin/mappings`
- `PUT /api/admin/mappings/:id`

#### KPI dan target

- `GET /api/admin/kpis`
- `POST /api/admin/kpis`
- `PATCH /api/admin/kpis/:id`
- `DELETE /api/admin/kpis/:id`
- `PUT /api/admin/kpis/:id/target`

#### Data quality

- `GET /api/admin/data-quality/issues`
- `PATCH /api/admin/data-quality/issues/:id`

#### Insight

- `GET /api/admin/insights`
- `POST /api/admin/insights/recalculate`
- `PATCH /api/admin/insights/:id`

#### Konten

Gunakan endpoint granular untuk:

- publications;
- datasets;
- release schedules;
- activities;
- awards;
- videos;
- contact;
- location.

### 22.3 Endpoint lama

`PUT /api/dashboard` yang mengganti seluruh data sekaligus harus dihentikan secara bertahap.

Strategi:

1. tandai deprecated;
2. panel admin baru memakai endpoint granular;
3. tambahkan validasi ketat selama masa transisi;
4. hapus setelah seluruh panel berpindah;
5. jangan melakukan clear seluruh tabel untuk perubahan kecil.

---

## 23. Panel Admin

### 23.1 Login admin

- hanya sign in;
- public sign up dinonaktifkan;
- form tidak berisi email/password contoh;
- Better Auth secret wajib dari environment;
- tidak ada fallback secret di production;
- perubahan email memerlukan verifikasi atau re-authentication;
- password policy minimum;
- rate limit;
- session timeout;
- logout;
- revoke session lain saat password diganti.

### 23.2 Ringkasan admin

Tampilkan:

- status EMIS;
- status SIMPEG;
- sync terakhir;
- durasi sync;
- snapshot aktif;
- issue kualitas data;
- KPI perlu perhatian;
- jumlah konten;
- error terbaru.

### 23.3 Integrasi

Fitur:

- status konfigurasi;
- base URL masked;
- test connection;
- sync manual;
- daftar sync runs;
- error summary;
- jumlah record;
- jumlah halaman;
- coverage;
- last known good.

Credential tetap dikelola melalui environment, bukan disimpan dari form.

### 23.4 Mapping

Fitur:

- daftar field upstream;
- field canonical;
- transform;
- status mapping;
- contoh nilai yang sudah disanitasi;
- validasi;
- test normalizer;
- versioning mapping.

### 23.5 KPI

Fitur:

- CRUD definisi;
- target;
- bobot;
- urutan;
- visibility;
- preview;
- recalculation;
- formula description.

### 23.6 Data quality

Fitur:

- filter sumber;
- severity;
- issue type;
- status;
- waktu pertama ditemukan;
- waktu terakhir ditemukan;
- resolve;
- ignore dengan catatan;
- export ringkasan.

### 23.7 Konten

Pertahankan fitur yang sudah ada:

- indikator;
- data tabel;
- dataset;
- jadwal rilis;
- geotagging;
- prestasi;
- kegiatan;
- video;
- kontak;
- AI training jika masih relevan.

Pisahkan data API otomatis dan konten manual agar sinkronisasi tidak menimpa konten.

### 23.8 Akun admin

Fitur:

- ubah nama;
- ubah email;
- ubah password;
- lihat sesi;
- logout;
- audit perubahan.

Tidak perlu menu role dan permission kompleks pada versi ini.

---

## 24. AI Assistant

### 24.1 Tujuan

Assistant membantu pengunjung:

- membaca ringkasan;
- memahami indikator;
- melihat tren;
- mengetahui sumber data;
- mengetahui status pembaruan;
- mengetahui prestasi dan kegiatan;
- menemukan kontak.

### 24.2 Satu konteks untuk semua

Semua pengunjung mendapat context yang sama.

Dilarang:

- memeriksa session untuk menambah data;
- memberi jawaban khusus pimpinan;
- menampilkan issue individu;
- menampilkan action plan internal;
- menampilkan error API rinci;
- menampilkan PII;
- mengirim raw dataset ke OpenAI.

### 24.3 Rule-based first

Pertanyaan umum harus dapat dijawab tanpa OpenAI:

- berapa jumlah siswa;
- berapa jumlah guru;
- status EMIS;
- status SIMPEG;
- data terakhir diperbarui kapan;
- bagaimana rasio siswa-guru;
- indikator mana yang meningkat;
- apa prestasi terbaru;
- di mana lokasi madrasah.

### 24.4 OpenAI optional

Jika API key tersedia:

- gunakan Responses API;
- kirim context minimal;
- batasi token;
- timeout;
- rate limit;
- cache pertanyaan umum;
- fallback lokal jika gagal;
- jangan log jawaban bersama data sensitif.

### 24.5 Perbaikan legacy

Hapus intent atau teks terkait:

- Kanwil Kemenag Lampung;
- PPID;
- SIMANDA;
- penduduk;
- kabupaten/kota lain;
- Bimas Islam;
- SPAK;
- IPS;
- dataset lama yang bukan milik MAN 1 Lampung Selatan.

---

## 25. Slideshow

Route `/slideshow` membaca `getUnifiedDashboardData()` yang sama.

Slide awal:

1. Profil madrasah
2. Ringkasan siswa
3. Komposisi tingkat
4. Komposisi gender
5. Ringkasan guru dan pegawai
6. Pendidikan terakhir
7. KPI kinerja
8. Kualitas data
9. Insight
10. Prestasi
11. Kontak

Ketentuan:

- auto play;
- pause;
- next;
- previous;
- fullscreen;
- responsif;
- status update;
- tidak ada data yang berbeda dari halaman utama;
- tidak ada login.

---

## 26. Keamanan

### 26.1 Credential

Credential yang pernah dibagikan di luar secret manager harus dianggap terekspos.

Tindakan:

- rotasi EMIS public/private key;
- ganti password akun API SIMPEG;
- gunakan credential baru;
- simpan hanya di environment hosting;
- jangan simpan di PRD;
- jangan simpan di issue;
- jangan simpan di prompt Codex;
- jangan simpan di `.env.example`;
- jangan log credential.

### 26.2 Environment validation

Aplikasi harus gagal startup di production jika:

- Better Auth secret tidak ada;
- secret masih nilai contoh;
- URL wajib invalid;
- admin allowlist tidak ada jika dipakai;
- mode production memakai fallback auth secret.

### 26.3 Route protection

Lindungi:

- `/admin`;
- seluruh `/api/admin/*`;
- import;
- mutation;
- test connection;
- sync manual;
- account settings.

Jangan melindungi:

- `/`;
- `/slideshow`;
- `GET /api/dashboard`;
- `POST /api/assistant`, tetapi tetap rate-limited.

### 26.4 Input validation

Gunakan Zod atau schema validator setara untuk:

- API payload;
- query;
- form;
- import;
- URL;
- tanggal;
- angka;
- enum;
- file type;
- file size.

### 26.5 File import

- batasi ukuran;
- whitelist ekstensi;
- validasi MIME;
- sanitasi nama;
- jangan mengeksekusi macro;
- parsing server-side;
- timeout;
- limit baris;
- preview sebelum simpan;
- import tidak langsung menimpa data API resmi.

### 26.6 Logging

Dilarang log:

- Authorization;
- Cookie;
- password;
- EMIS key;
- signature;
- SIMPEG token;
- body login;
- raw employee record;
- raw student record;
- OpenAI key.

---

## 27. Reliability dan Observability

### 27.1 Reliability

- timeout request;
- retry terbatas;
- exponential backoff;
- last known good;
- transaction;
- idempotent sync;
- deduplication;
- lock agar sync tidak berjalan ganda;
- graceful fallback;
- anomaly detection;
- nullable-safe UI.

### 27.2 Observability

Metric:

- sync success rate;
- sync duration;
- API latency;
- records received;
- records matched;
- page count;
- normalization error;
- snapshot age;
- dashboard response time;
- AI fallback rate.

Log event:

- sync started;
- sync succeeded;
- sync partial;
- sync failed;
- anomaly found;
- snapshot activated;
- KPI calculated;
- admin mutation;
- login failed;
- import completed.

---

## 28. UX dan Desain

### 28.1 Prinsip

- mengikuti visual language `dashboard_kanwil`;
- modern;
- elegan;
- identitas hijau dan emas;
- glass panel secukupnya;
- tidak terlalu ramai;
- card memiliki hierarchy;
- angka mudah dibaca;
- sumber data jelas;
- mobile friendly;
- chart memiliki empty state;
- chart tidak menampilkan nol palsu.

### 28.2 Status warna

- hijau: fresh/tercapai;
- kuning: perlu perhatian/stale;
- merah: gagal/kritis;
- biru: informasi;
- abu-abu: belum tersedia;
- ungu: insight.

Warna bukan satu-satunya penanda. Selalu sertakan teks dan icon.

### 28.3 Empty state

Contoh:

> Data komposisi gender belum tersedia dari endpoint EMIS yang aktif.

Bukan:

> 0 siswa laki-laki dan 0 siswa perempuan.

### 28.4 Source tooltip

Setiap KPI memiliki tooltip:

- definisi;
- formula;
- sumber;
- periode;
- waktu update;
- status validasi.

---

## 29. Performance

Target awal:

- Lighthouse performance minimal 80 pada desktop;
- LCP di bawah 3 detik pada koneksi wajar;
- endpoint dashboard tidak memanggil upstream;
- response dashboard dapat di-cache singkat;
- chart lazy render;
- image menggunakan Next Image;
- bundle client tidak memuat library server;
- komponen admin tidak masuk bundle halaman utama;
- data historis dibatasi sesuai kebutuhan.

---

## 30. Accessibility

- heading terstruktur;
- landmark;
- keyboard navigation;
- focus state;
- aria label;
- contrast memadai;
- chart memiliki ringkasan tekstual;
- table dapat discroll;
- icon tidak menjadi satu-satunya informasi;
- tombol memiliki label;
- slideshow dapat dihentikan.

---

## 31. File Map Implementasi

### 31.1 File yang dipertahankan

- `app/page.tsx`
- `app/admin/page.tsx`
- `app/slideshow/page.tsx`
- `components/dashboard/dashboard-experience.tsx`
- `components/admin/admin-experience.tsx`
- `components/slideshow/slideshow-experience.tsx`
- `lib/db/schema.ts`
- `lib/services/dashboard.ts`
- `lib/types.ts`

### 31.2 Refactor utama

#### Integration

Pisahkan file besar upstream menjadi:

- `lib/integrations/emis/client.ts`
- `lib/integrations/emis/auth.ts`
- `lib/integrations/emis/endpoints.ts`
- `lib/integrations/emis/normalizer.ts`
- `lib/integrations/emis/validator.ts`
- `lib/integrations/simpeg/client.ts`
- `lib/integrations/simpeg/auth.ts`
- `lib/integrations/simpeg/pagination.ts`
- `lib/integrations/simpeg/filter.ts`
- `lib/integrations/simpeg/normalizer.ts`
- `lib/integrations/simpeg/validator.ts`
- `lib/integrations/sync-service.ts`

#### Dashboard services

- `lib/services/unified-dashboard.ts`
- `lib/services/kpi-engine.ts`
- `lib/services/insight-engine.ts`
- `lib/services/data-quality.ts`
- `lib/services/freshness.ts`

#### Repositories

- `lib/repositories/sync-run-repository.ts`
- `lib/repositories/emis-snapshot-repository.ts`
- `lib/repositories/simpeg-snapshot-repository.ts`
- `lib/repositories/kpi-repository.ts`
- `lib/repositories/insight-repository.ts`

#### Validation

- `lib/validation/admin.ts`
- `lib/validation/import.ts`
- `lib/validation/integration.ts`
- `lib/validation/kpi.ts`

#### Security

- `lib/security/require-admin.ts`
- `lib/security/rate-limit.ts`
- `lib/security/sanitize-log.ts`
- `lib/security/mask-secret.ts`

### 31.3 Komponen dashboard

Boleh memecah `DashboardExperience` menjadi section tanpa membuat dashboard kedua:

- `components/dashboard/sections/hero-section.tsx`
- `components/dashboard/sections/source-status-section.tsx`
- `components/dashboard/sections/executive-summary-section.tsx`
- `components/dashboard/sections/emis-section.tsx`
- `components/dashboard/sections/simpeg-section.tsx`
- `components/dashboard/sections/performance-section.tsx`
- `components/dashboard/sections/data-quality-section.tsx`
- `components/dashboard/sections/insight-section.tsx`
- `components/dashboard/sections/achievement-section.tsx`
- `components/dashboard/sections/data-portal-section.tsx`
- `components/dashboard/sections/contact-section.tsx`

Semua section tetap dirender oleh satu `DashboardExperience`.

### 31.4 Route yang tidak boleh dibuat

- `app/internal/page.tsx`
- `app/pimpinan/page.tsx`
- `app/executive/page.tsx`
- `app/public-dashboard/page.tsx`
- `app/dashboard-pimpinan/page.tsx`
- `app/api/internal/*`
- `app/api/public/*`
- `app/api/pimpinan/*`

---

## 32. Tahapan Implementasi

# Phase 0 — Security & Stability

Prioritas P0:

1. Rotasi credential di luar repository.
2. Nonaktifkan public signup.
3. Hapus credential contoh dari form.
4. Wajibkan Better Auth secret production.
5. Tambahkan `requireAdmin()`.
6. Lindungi seluruh mutation.
7. Tambahkan Zod.
8. Sanitasi log.
9. Tambahkan rate limit.
10. Validasi file import.
11. Tambahkan audit log dasar.
12. Hentikan bulk replace untuk perubahan kecil.
13. Hapus logic AI legacy paling berbahaya.
14. Pastikan `.env*` tetap diabaikan Git.

Definition of Done:

- signup publik tidak tersedia;
- admin route aman;
- credential tidak tampil;
- mutation tanpa session menghasilkan 401;
- lint berhasil;
- build berhasil.

# Phase 1 — Integration Foundation

1. Pisahkan connector EMIS.
2. Pisahkan connector SIMPEG.
3. Implementasikan pagination.
4. Tambahkan timeout dan retry.
5. Tambahkan normalizer.
6. Tambahkan validator.
7. Tambahkan sync runs.
8. Tambahkan snapshot.
9. Tambahkan last known good.
10. Tambahkan status freshness.
11. Tambahkan fixture test.
12. Dashboard membaca snapshot.

Definition of Done:

- dashboard tidak memanggil upstream saat render;
- sync EMIS dapat menghasilkan snapshot;
- sync SIMPEG mengambil seluruh halaman;
- kegagalan sync tidak menghapus data;
- status terlihat.

# Phase 2 — Unified Dashboard

1. Refactor satu `DashboardExperience`.
2. Ikuti information architecture `dashboard_kanwil`.
3. Tambahkan source status.
4. Tambahkan ringkasan otomatis.
5. Tambahkan EMIS section.
6. Tambahkan SIMPEG section.
7. Tambahkan empty state.
8. Tambahkan source tooltip.
9. Tambahkan filter periode.
10. Pastikan mobile responsive.
11. Update slideshow.

Definition of Done:

- satu route utama;
- satu dashboard untuk semua;
- tidak ada login pimpinan;
- tidak ada role-aware widget;
- semua chart memiliki sumber;
- mobile layout baik.

# Phase 3 — KPI, Insight, dan Data Quality

1. Tambahkan definisi KPI.
2. Tambahkan target.
3. Tambahkan KPI engine.
4. Tambahkan insight rules.
5. Tambahkan data quality score.
6. Tambahkan anomaly detection.
7. Tambahkan histori.
8. Tambahkan performance score dengan coverage guard.
9. Tambahkan penjelasan formula.
10. Tambahkan admin management.

Definition of Done:

- KPI tidak mencampur unit;
- insight dapat dijelaskan;
- issue individu tidak muncul di publik;
- formula dan sumber terlihat.

# Phase 4 — Admin Governance

1. Endpoint granular.
2. Sync control.
3. Sync log.
4. Mapping.
5. KPI target.
6. Data quality workflow.
7. Content management.
8. Account security.
9. Audit log.
10. Import preview.

Definition of Done:

- admin dapat mengelola tanpa bulk replace;
- semua perubahan tercatat;
- tidak ada menu role kompleks;
- credential tidak dikelola dari browser.

# Phase 5 — AI Safe Mode

1. Bersihkan knowledge legacy.
2. Rule-based answers.
3. Unified public context.
4. Minimal OpenAI context.
5. Rate limit.
6. Timeout.
7. Cache.
8. Safe fallback.
9. Source citation dalam jawaban.
10. Data unavailable response.

Definition of Done:

- semua pengguna mendapat context sama;
- tidak ada mode pimpinan;
- tidak ada PII ke OpenAI;
- jawaban tidak mengarang;
- assistant tetap bekerja tanpa API key.

---

## 33. Acceptance Criteria

### 33.1 Produk

- [ ] Hanya ada satu dashboard utama pada `/`.
- [ ] Dashboard dapat diakses tanpa login.
- [ ] Semua pengunjung melihat data yang sama.
- [ ] Tidak ada login pimpinan.
- [ ] Tidak ada dashboard internal.
- [ ] Tidak ada role-aware widget.
- [ ] `/admin` tetap tersedia untuk pengelolaan.
- [ ] `/slideshow` membaca data yang sama.

### 33.2 EMIS

- [ ] Identitas madrasah tervalidasi dengan NSM.
- [ ] Key tidak terekspos ke frontend.
- [ ] Connector terpisah dari UI.
- [ ] Mapping nullable.
- [ ] Snapshot tersimpan.
- [ ] Error tidak menghapus snapshot.
- [ ] Data siswa per tingkat dapat ditampilkan ketika endpoint tersedia.
- [ ] Data gender dapat ditampilkan ketika endpoint tersedia.
- [ ] Rombel dapat ditampilkan ketika endpoint tersedia.

### 33.3 SIMPEG

- [ ] Login server-side.
- [ ] Pagination mengambil semua halaman.
- [ ] Token tidak disimpan.
- [ ] Unit filter dapat dijelaskan.
- [ ] Agregat status pegawai tersedia.
- [ ] Agregat pendidikan tersedia.
- [ ] Sertifikasi memiliki unknown state.
- [ ] Hasil 0 anomali tidak menimpa last known good.
- [ ] PII tidak muncul pada dashboard.

### 33.4 Dashboard

- [ ] Status sumber terlihat.
- [ ] Last updated terlihat.
- [ ] Fresh/stale/fallback terlihat.
- [ ] Setiap KPI memiliki definisi.
- [ ] Setiap chart memiliki empty state.
- [ ] Trend membaca snapshot.
- [ ] Ringkasan naratif berbasis rule.
- [ ] Insight memiliki sumber.
- [ ] Tidak ada rata-rata lintas unit.
- [ ] Tidak ada angka nol palsu.

### 33.5 Admin

- [ ] Public signup nonaktif.
- [ ] Credential contoh dihapus.
- [ ] Mutation dilindungi.
- [ ] Endpoint granular.
- [ ] Audit log aktif.
- [ ] Import tervalidasi.
- [ ] Sync manual tersedia.
- [ ] Sync history tersedia.
- [ ] Akun admin dapat dikelola.
- [ ] Tidak ada role matrix kompleks.

### 33.6 Security

- [ ] Tidak ada secret pada Git.
- [ ] Tidak ada secret pada log.
- [ ] Better Auth secret wajib.
- [ ] Rate limit aktif.
- [ ] Input validation aktif.
- [ ] File upload dibatasi.
- [ ] AI tidak menerima PII.
- [ ] Raw payload tidak dikembalikan.
- [ ] Error publik disanitasi.

### 33.7 Engineering

- [ ] `npm run lint` berhasil.
- [ ] `npm run build` berhasil.
- [ ] migration berhasil pada SQLite.
- [ ] migration berhasil pada Turso/libSQL.
- [ ] connector memiliki fixture test.
- [ ] unit test KPI berhasil.
- [ ] integration test sync berhasil.
- [ ] E2E dashboard berhasil.
- [ ] E2E admin auth berhasil.

---

## 34. Test Plan

### 34.1 Unit test

EMIS:

- join URL;
- auth builder;
- normalizer;
- missing field;
- negative value;
- identity mismatch;
- gender mismatch;
- grade mismatch.

SIMPEG:

- login response;
- pagination satu halaman;
- pagination banyak halaman;
- duplicate;
- MAX_PAGES;
- filter NSM;
- filter NPSN;
- filter unit name;
- education classifier;
- employment classifier;
- certification unknown.

KPI:

- pertumbuhan;
- ratio;
- percentage;
- missing denominator;
- zero denominator;
- target status;
- weighted score;
- insufficient coverage.

Insight:

- positive;
- warning;
- stale;
- failed sync;
- anomaly zero;
- no data.

### 34.2 Integration test

- sync EMIS success;
- sync EMIS failed;
- sync SIMPEG success;
- partial page failure;
- snapshot activated;
- last known good retained;
- concurrent sync lock;
- dashboard read model;
- admin mutation unauthorized;
- admin mutation authorized.

### 34.3 E2E

- buka `/` tanpa login;
- semua section tampil;
- filter bekerja;
- refresh bekerja;
- slideshow bekerja;
- AI fallback bekerja;
- buka `/admin` tanpa session diarahkan ke login;
- login admin;
- run test connection;
- run sync;
- lihat sync log;
- ubah konten;
- logout.

### 34.4 Security test

- secret tidak terdapat dalam bundle;
- response integration tidak mengandung token;
- log sanitizer;
- rate limit;
- upload file invalid;
- oversized file;
- unauthorized mutation;
- signup tidak tersedia;
- default secret production ditolak.

---

## 35. Deployment

### 35.1 Environment produksi

Gunakan secret manager hosting.

Environment minimal:

```env
NODE_ENV=production

TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

BETTER_AUTH_URL=
BETTER_AUTH_SECRET=
NEXT_PUBLIC_BETTER_AUTH_URL=

EMIS_PUBLIC_URL_API=
EMIS_PUBLIC_KEY=
EMIS_PRIVATE_KEY=
EMIS_NSM=131118010001

SIMPEG_PUBLIC_URL_API=
SIMPEG_PUBLIC_EMAIL=
SIMPEG_PUBLIC_PASSWORD=
SIMPEG_NSM=131118010001
SIMPEG_NPSN=10816233
SIMPEG_UNIT_NAME=MAN 1 Lampung Selatan

OPENAI_API_KEY=
OPENAI_MODEL=
CRON_SECRET=
```

### 35.2 Deploy checklist

1. Rotasi credential.
2. Set environment.
3. Jalankan migration.
4. Buat akun admin pertama secara aman.
5. Nonaktifkan signup.
6. Test EMIS.
7. Test SIMPEG.
8. Run initial sync.
9. Verifikasi snapshot.
10. Verifikasi dashboard.
11. Verifikasi no PII.
12. Verifikasi slideshow.
13. Verifikasi admin.
14. Verifikasi log.
15. Verifikasi backup.

### 35.3 Backup

- backup Turso;
- export schema;
- retention snapshot;
- backup sebelum migration;
- dokumentasi restore;
- rollback migration;
- jangan memasukkan credential dalam backup aplikasi.

---

## 36. Instruksi Langsung untuk Codex

Gunakan dokumen ini sebagai sumber kebutuhan utama.

### 36.1 Aturan kerja

1. Audit repository sebelum mengubah kode.
2. Jangan mengganti stack.
3. Pertahankan Next.js 15, React 19, TypeScript, Tailwind, Recharts, Drizzle, Turso/SQLite, dan Better Auth.
4. Pertahankan satu dashboard utama pada `/`.
5. Ikuti pola `abdur0987/dashboard_kanwil`.
6. Jangan membuat dashboard khusus pimpinan.
7. Jangan membuat login pimpinan.
8. Jangan membuat role-aware widget.
9. Login hanya untuk `/admin`.
10. Nonaktifkan public signup.
11. Jangan memasukkan credential nyata.
12. Jangan menebak signature EMIS.
13. Implementasikan pagination SIMPEG.
14. Simpan snapshot.
15. Gunakan last known good.
16. Jangan panggil upstream saat render dashboard.
17. Jangan mengirim PII ke OpenAI.
18. Jangan menghitung rata-rata lintas unit.
19. Buat fixture test.
20. Pertahankan fitur lama yang relevan.
21. Gunakan migration aman.
22. Hindari bulk replace.
23. Jalankan lint dan build.
24. Dokumentasikan field yang belum tersedia.
25. Jangan menyatakan data live jika sebenarnya fallback.

### 36.2 Urutan pekerjaan pertama

Kerjakan dalam urutan:

1. Security audit.
2. Auth hardening.
3. Connector refactor.
4. SIMPEG pagination.
5. Sync runs.
6. Snapshot.
7. Unified read model.
8. Dashboard refactor.
9. KPI engine.
10. Insight engine.
11. Data quality.
12. Admin granular API.
13. AI cleanup.
14. Tests.
15. Documentation.

### 36.3 Perintah verifikasi

```bash
npm install
npm run lint
npm run build
npm run db:generate
npm run db:migrate
```

Jika test script ditambahkan:

```bash
npm test
```

### 36.4 Laporan akhir Codex

Codex harus melaporkan:

- temuan audit tambahan;
- daftar file dibuat;
- daftar file diubah;
- migration;
- perubahan autentikasi;
- perubahan connector;
- pagination;
- hasil mapping;
- field EMIS belum tersedia;
- field SIMPEG belum tersedia;
- hasil fixture;
- hasil lint;
- hasil build;
- langkah deployment;
- langkah rollback;
- risiko tersisa.

---

## 37. Prompt Siap Tempel ke Codex

```text
Baca PRD_Dashboard_MAN_1_Lampung_Selatan_Codex.md dan gunakan sebagai sumber kebutuhan utama untuk repository abdur0987/Dashboard_MAN_1.

Repository referensi struktur produk dan UX adalah abdur0987/dashboard_kanwil.

Keputusan produk yang tidak boleh diubah:
- hanya ada satu dashboard utama pada route /;
- dashboard utama dapat diakses tanpa login;
- semua pengunjung melihat dashboard dan data agregat yang sama;
- tidak ada login khusus pimpinan;
- tidak ada dashboard pimpinan;
- tidak ada /internal, /executive-dashboard, /public-dashboard, atau route produk kedua;
- tidak ada role-aware widget pada halaman utama;
- login hanya digunakan oleh administrator pada /admin;
- /slideshow membaca read model yang sama;
- data pribadi siswa dan pegawai tidak boleh tampil.

Kerjakan Phase 0 dan Phase 1 terlebih dahulu.

Jangan mengganti stack. Pertahankan Next.js 15, React 19, TypeScript, Tailwind CSS, Recharts, Drizzle ORM, Turso/SQLite, dan Better Auth.

Jangan memasukkan credential nyata ke source code, .env.example, log, dokumentasi, issue, commit, atau pull request.

Jangan menebak mekanisme signature EMIS. Buat abstraction autentikasi yang configurable dan tandai kebutuhan kontrak resmi.

Implementasikan pagination SIMPEG sampai seluruh halaman selesai diambil. Simpan sync runs dan snapshot. Dashboard harus membaca snapshot lokal dan tetap menggunakan last known good ketika upstream gagal.

Nonaktifkan public signup. Hapus email/password contoh dari form admin. Wajibkan Better Auth secret di production. Lindungi semua endpoint mutation dengan session admin.

Ganti pola bulk PUT /api/dashboard dengan endpoint granular dan transaksi database.

Perbaiki AI assistant agar:
- konteks sama untuk semua pengunjung;
- tidak memiliki mode pimpinan;
- tidak menggunakan data Kanwil, PPID, SIMANDA, Bimas, SPAK, IPS, penduduk, atau wilayah lain;
- tidak menghitung rata-rata indikator berbeda satuan;
- tidak mengirim raw data atau PII ke OpenAI;
- dapat fallback ke rule-based answer.

Buat fixture test EMIS dan SIMPEG. CI dan test tidak boleh memakai credential atau API live.

Setelah perubahan, jalankan:
npm install
npm run lint
npm run build
npm run db:generate
npm run db:migrate

Laporkan semua file yang diubah, migration, hasil connector, hasil pagination, field yang belum dapat dipetakan, hasil lint/build/test, langkah deployment, rollback, dan risiko tersisa.
```

---

## 38. Keputusan Produk Akhir

Dashboard MAN 1 Lampung Selatan harus menjadi satu dashboard terpadu seperti Dashboard Kanwil.

Model akhirnya:

```text
/                → dashboard utama untuk semua
/slideshow       → presentasi dari data yang sama
/admin           → login dan pengelolaan administrator
/api/dashboard   → read model agregat publik
/api/assistant   → assistant agregat yang sama untuk semua
/api/admin/*     → endpoint pengelolaan yang dilindungi
```

Tidak ada:

```text
/pimpinan
/internal
/executive-dashboard
/public-dashboard
dashboard berbasis role
login kepala madrasah
login pimpinan
```

Informasi yang berguna untuk pimpinan tetap ditampilkan pada dashboard utama, tetapi dalam bentuk agregat aman yang juga dapat dibaca masyarakat.

Dashboard dianggap selesai ketika:

- data terbaru tersedia;
- status sumber jelas;
- tren dapat dipahami;
- insight dapat dijelaskan;
- data sensitif terlindungi;
- kegagalan API tidak membuat dashboard kosong;
- admin dapat mengelola data dengan aman;
- seluruh pengunjung memperoleh pengalaman dashboard yang sama.
