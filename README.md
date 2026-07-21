# Dashboard Satu Data MAN 1 Lampung Selatan

Dashboard agregat publik untuk tiga sumber operasional: database MySQL lokal,
GIS Madrasah Kemenag, dan API website MAN 1. Halaman `/`, `/slideshow`, panel
admin, dan AI membaca read model snapshot yang sama; upstream tidak dipanggil
setiap kali halaman publik dibuka.

## Snapshot awal terverifikasi

- Database lokal: 302 siswa, 14 rombel, dan 63 GTK.
- GIS Madrasah Kemenag: 302 siswa, 142 laki-laki, 160 perempuan, 14 rombel,
  46 guru, dan 17 tenaga kependidikan.
- Total siswa, rombel, dan GTK cocok antara database lokal dan GIS.
- Pembagian GTK berbeda: database lokal mengklasifikasikan 53 guru/calon guru
  dan 10 tendik, sedangkan GIS mengklasifikasikan 46 guru dan 17 tendik.
- API `man1lamsel.sch.id` belum tersedia; adapter dan kontraknya sudah disiapkan.

## Menjalankan lokal

```bash
nvm use
npm install
npm run dev
```

Project menggunakan Node.js 24.14.x. Jalankan `nvm use` sebelum `npm install`
atau `npm run dev` agar binary native SQLite memakai ABI Node yang sama.

Buka `http://localhost:3100`. Dashboard publik tersedia di `/`, slideshow di
`/slideshow`, dan login administrator di `/admin`.

Untuk memastikan pengembangan lokal tidak menyentuh Turso, gunakan
`DATABASE_MODE=sqlite` dan `SQLITE_DB_PATH=./data/dashboard-man1.sqlite` pada
`.env.local`. Deployment production menggunakan `DATABASE_MODE=turso`.

Perintah Drizzle khusus lokal:

```bash
npm run db:local:migrate
npm run db:local:studio
```

Public signup dinonaktifkan. Buat akun admin melalui prosedur bootstrap yang
aman, lalu masukkan emailnya ke `ADMIN_EMAILS` (dipisahkan koma jika lebih dari
satu). Production akan menolak startup jika `BETTER_AUTH_SECRET`,
`BETTER_AUTH_URL`, atau `ADMIN_EMAILS` belum valid.

## Sinkronisasi

Endpoint publik hanya membaca snapshot:

- `GET /api/dashboard`
- `GET /api/integrations/emis`
- `GET /api/integrations/simpeg`
- `GET /api/integrations/gis`
- `GET /api/integrations/website`
- `POST /api/assistant`

Endpoint admin berikut memerlukan session dan email dalam allowlist:

- `POST /api/admin/sync/mirror`
- `POST /api/admin/sync/gis`
- `POST /api/admin/sync/website`
- `GET /api/admin/sync-runs`
- `PUT /api/admin/settings`

Panel admin tidak menerima dump SQL mentah dan tidak dapat mengubah angka
indikator secara manual. Dump diimpor melalui MAMP/DBeaver, lalu admin menekan
**Baca ulang database lokal**. Panel menampilkan status sumber, jadwal,
perbandingan indikator, peringatan selisih, dan riwayat sinkronisasi.

Sync run menyimpan status, jumlah record, page count, error yang sudah
disanitasi, serta snapshot agregat. Kegagalan atau hasil nol anomali tidak
menghapus last-known-good.

### Sinkronisasi otomatis

Endpoint `POST /api/cron/sync` menggunakan
`Authorization: Bearer <CRON_SECRET>`. Workflow
`.github/workflows/sync-integrations.yml` memanggil endpoint setiap enam jam.
Endpoint hanya menjalankan sumber yang sudah jatuh tempo:

- GIS Madrasah: setiap 24 jam;
- Website MAN 1: setiap 6 jam setelah endpoint diaktifkan;
- Database lokal: manual setelah dump baru diimpor.
Tambahkan dua GitHub Actions secret berikut setelah aplikasi online:

- `DASHBOARD_SYNC_URL`: alamat dasar deployment, tanpa slash di akhir;
- `CRON_SECRET`: nilai yang sama dengan environment server.

### Konfigurasi EMIS

Adapter mendukung mode `none`, `headers`, dan `partner-login`. Nama header,
endpoint agregat, dan field mapping dapat ditentukan melalui environment.
Kontrak partner yang sudah diverifikasi pada endpoint resmi memakai JSON
`public_key`/`private_key` dan mengembalikan token pada `results.token`.

Untuk `partner-login`, konfigurasi tambahan minimal:

```env
EMIS_AUTH_MODE=partner-login
EMIS_PARTNER_LOGIN_FORMAT=json
EMIS_PARTNER_PUBLIC_FIELD=public_key
EMIS_PARTNER_PRIVATE_FIELD=private_key
EMIS_PARTNER_TOKEN_PATH=results.token
EMIS_ENDPOINT_STUDENT_SUMMARY=
EMIS_FIELD_STUDENTS_TOTAL=
EMIS_FIELD_GRADE_10=
EMIS_FIELD_GRADE_11=
EMIS_FIELD_GRADE_12=
EMIS_FIELD_STUDY_GROUPS_TOTAL=
EMIS_SYNC_PERIOD=2025/2026 Genap
EMIS_SYNC_SCHOOL_YEAR=2025/2026
EMIS_SYNC_SEMESTER=Genap
```

Gender hanya boleh dipetakan ketika endpoint resmi mengizinkan agregasi.

### Konfigurasi SIMPEG

Connector melakukan login server-side, pagination dengan batas aman, retry,
deduplikasi, filter berjenjang NSM/NPSN/kode satker/nama unit, serta deteksi
halaman berulang. Jika upstream mengabaikan pagination, sync berstatus
`partial` dan tidak menetapkan total pegawai definitif.

### Database lokal

Sebagai sumber cadangan lokal, aplikasi dapat membaca database MySQL mitra di
jaringan LAN. Gunakan akun khusus dengan hak `SELECT` saja dan simpan seluruh
kredensial `MIRROR_DB_*` di `.env.local`. Jangan gunakan akun `root` pada
aplikasi dan jangan commit kredensial tersebut.

Pemeriksaan awal hanya membaca metadata tabel dan kolom:

```bash
npm run db:mirror:inspect
```

Data mentah beridentitas seperti nama, NIK, NISN, nomor KK, tanggal lahir, dan
alamat tidak disalin. Integrasi dashboard hanya boleh menjalankan query agregat
berdasarkan NSM/NPSN, kemudian menyimpan snapshot angka ke SQLite lokal.

Untuk salinan lokal hasil dump, buat tiga view aman:

- `v_man1_institution_summary`;
- `v_man1_student_summary`;
- `v_man1_employee_summary`.

Akun `dashboard_reader` hanya diberi `SELECT` pada ketiga view tersebut. Jalankan
sinkronisasi view ke snapshot Drizzle dengan:

```bash
npm run sync:mirror
```

Database lokal hasil dump bukan API EMIS/SIMPEG resmi dan bukan sumber real-time.
Dashboard menampilkan label **Database lokal** serta peringatan kualitas data.
Rincian kelas dan gender dari database tetap `null` apabila hasil klasifikasi
tidak sama dengan total rekap. Agregat gender publik dapat diambil dari GIS
ketika jumlah laki-laki dan perempuan sama dengan total siswa.

### GIS Madrasah Kemenag

```env
GIS_MADRASAH_API_URL=https://madrasah.kemenag.go.id/api-gis/api
GIS_MADRASAH_ID=14343
```

Sinkronisasi manual lokal:

```bash
npm run sync:gis
```

Adapter memvalidasi NSM `131118010001` dan NPSN `10816233` sebelum menyimpan
snapshot.

### API Website MAN 1

```env
MAN1_WEBSITE_API_URL=https://man1lamsel.sch.id/api/v1/dashboard/summary
MAN1_WEBSITE_API_KEY=
MAN1_WEBSITE_SYNC_ENABLED=false
```

Aktifkan `MAN1_WEBSITE_SYNC_ENABLED=true` hanya setelah endpoint JSON tersedia.
Kontrak minimal yang diterima:

```json
{
  "success": true,
  "data": {
    "school": {
      "name": "MAN 1 Lampung Selatan",
      "nsm": "131118010001",
      "npsn": "10816233",
      "status": "Negeri",
      "accreditation": "B"
    },
    "period": {
      "school_year": "2025/2026",
      "semester": "Genap",
      "label": "2025/2026 Genap"
    },
    "students": {
      "total": 302,
      "male": 142,
      "female": 160,
      "study_groups": 14,
      "by_grade": { "X": null, "XI": null, "XII": null }
    },
    "employees": {
      "total": 63,
      "teachers": 46,
      "education_staff": 17,
      "pns": 30,
      "pppk": 13,
      "non_asn": 20
    },
    "updated_at": "2026-07-16T10:00:00+07:00"
  }
}
```

## Database dan verifikasi

```bash
npm run db:generate
npm run db:migrate
npm run lint
npm test
npm run build
```

Migration Drizzle berada di `drizzle/`. SQLite digunakan ketika
`TURSO_DATABASE_URL` kosong; Turso/libSQL digunakan ketika environment produksi
tersedia. Jangan commit `.env.local`, token, password, atau key.

### Audit dependensi

Parser `xlsx`, DOC, dan PDF telah dihapus bersama seluruh jalur upload admin.
`npm audit` tidak lagi melaporkan kerentanan high; temuan yang tersisa berada
pada dependensi development/transitif dan tidak boleh diperbaiki memakai
`npm audit fix --force` karena usulan npm menurunkan dependensi inti ke versi
breaking.
