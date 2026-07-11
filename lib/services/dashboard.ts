import { asc } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { ensureDatabaseReady } from "@/lib/db/migrate";
import {
  activities as activitiesTable,
  awardCollections as awardCollectionsTable,
  awardItems as awardItemsTable,
  chartSeries as chartSeriesTable,
  contactInfo as contactInfoTable,
  dashboardRows as dashboardRowsTable,
  datasets as datasetsTable,
  executiveSchedules as executiveSchedulesTable,
  filters as filtersTable,
  indicators as indicatorsTable,
  officeLocations as officeLocationsTable,
  publications as publicationsTable,
  releaseSchedules as releaseSchedulesTable,
  videos as videosTable,
} from "@/lib/db/schema";
import type { ChartPoint, DashboardData, DashboardRow } from "@/lib/types";

export const seedDashboardData: DashboardData = {
  indicators: [
    { id: 1, name: "Peserta Didik", description: "Total peserta didik aktif yang ditampilkan pada ringkasan EMIS.", category: "EMIS", unit: "siswa", source: "EMIS / profil resmi madrasah", year: 2026, value: 1525, trend: 0, status: "aktif" },
    { id: 2, name: "Rombongan Belajar", description: "Rombongan belajar kelas X, XI, dan XII.", category: "EMIS", unit: "rombel", source: "Data contoh integrasi EMIS", year: 2026, value: 43, trend: 0, status: "perlu-validasi" },
    { id: 3, name: "Guru dan Tenaga Kependidikan", description: "Jumlah GTK pada profil madrasah.", category: "SIMPEG", unit: "orang", source: "SIMPEG / profil resmi madrasah", year: 2026, value: 114, trend: 0, status: "aktif" },
    { id: 4, name: "Aparatur Sipil Negara", description: "PNS dan PPPK yang dipetakan melalui SIMPEG.", category: "SIMPEG", unit: "orang", source: "Data contoh integrasi SIMPEG", year: 2026, value: 82, trend: 0, status: "perlu-validasi" },
    { id: 5, name: "ASN Tersertifikasi", description: "ASN yang telah memiliki sertifikasi profesi sesuai data awal.", category: "SIMPEG", unit: "orang", source: "Data contoh integrasi SIMPEG", year: 2026, value: 76, trend: 0, status: "perlu-validasi" },
    { id: 6, name: "Akreditasi Madrasah", description: "Status akreditasi MAN 1 Bandar Lampung.", category: "EMIS", unit: "nilai", source: "Profil resmi MAN 1 Bandar Lampung", year: 2026, value: 4, trend: 0, status: "aktif" },
  ],
  rows: [
    { id: 1, indicator: "Peserta Didik Kelas X", category: "EMIS", region: "MAN 1 Bandar Lampung", period: "Tahunan", year: 2026, value: 512, unit: "siswa", source: "Data contoh integrasi EMIS" },
    { id: 2, indicator: "Peserta Didik Kelas XI", category: "EMIS", region: "MAN 1 Bandar Lampung", period: "Tahunan", year: 2026, value: 506, unit: "siswa", source: "Data contoh integrasi EMIS" },
    { id: 3, indicator: "Peserta Didik Kelas XII", category: "EMIS", region: "MAN 1 Bandar Lampung", period: "Tahunan", year: 2026, value: 507, unit: "siswa", source: "Data contoh integrasi EMIS" },
    { id: 4, indicator: "Siswa Laki-laki", category: "EMIS", region: "MAN 1 Bandar Lampung", period: "Tahunan", year: 2026, value: 684, unit: "siswa", source: "Data contoh integrasi EMIS" },
    { id: 5, indicator: "Siswa Perempuan", category: "EMIS", region: "MAN 1 Bandar Lampung", period: "Tahunan", year: 2026, value: 841, unit: "siswa", source: "Data contoh integrasi EMIS" },
    { id: 6, indicator: "PNS", category: "SIMPEG", region: "MAN 1 Bandar Lampung", period: "Tahunan", year: 2026, value: 65, unit: "orang", source: "Data contoh integrasi SIMPEG" },
    { id: 7, indicator: "PPPK", category: "SIMPEG", region: "MAN 1 Bandar Lampung", period: "Tahunan", year: 2026, value: 17, unit: "orang", source: "Data contoh integrasi SIMPEG" },
    { id: 8, indicator: "Non-ASN", category: "SIMPEG", region: "MAN 1 Bandar Lampung", period: "Tahunan", year: 2026, value: 32, unit: "orang", source: "Data contoh integrasi SIMPEG" },
    { id: 9, indicator: "Pendidikan S2", category: "SIMPEG", region: "MAN 1 Bandar Lampung", period: "Tahunan", year: 2026, value: 28, unit: "orang", source: "Data contoh integrasi SIMPEG" },
    { id: 10, indicator: "Pendidikan S1 / D4", category: "SIMPEG", region: "MAN 1 Bandar Lampung", period: "Tahunan", year: 2026, value: 79, unit: "orang", source: "Data contoh integrasi SIMPEG" },
    { id: 11, indicator: "Pendidikan Diploma", category: "SIMPEG", region: "MAN 1 Bandar Lampung", period: "Tahunan", year: 2026, value: 7, unit: "orang", source: "Data contoh integrasi SIMPEG" },
  ],
  chartSeries: [
    { year: 2026, EMIS: 1525, SIMPEG: 114 },
  ],
  publications: [
    { id: 1, title: "Profil MAN 1 Bandar Lampung", description: "Identitas, sejarah singkat, dan informasi satuan pendidikan.", date: "11 Juli 2026", category: "Profil Madrasah", fileLabel: "WEB" },
    { id: 2, title: "Ringkasan EMIS dan SIMPEG", description: "Dokumen rancangan data awal untuk proses validasi dan integrasi API.", date: "11 Juli 2026", category: "Data Internal", fileLabel: "DRAFT" },
  ],
  datasets: [
    { id: 1, title: "Rekap EMIS MAN 1 Bandar Lampung", description: "Profil sekolah, peserta didik, tingkat, gender, dan rombongan belajar.", category: "EMIS", year: 2026, producer: "MAN 1 Bandar Lampung", frequency: "Semester", format: "API / XLSX", sourceUrl: "", excelUrl: "", pdfUrl: "", standardData: "Tingkat, jenis kelamin, jumlah peserta didik, rombongan belajar, periode.", metadata: "Status: data contoh; Target: EMIS; Satuan kerja: MAN 1 Bandar Lampung" },
    { id: 2, title: "Statistik SIMPEG MAN 1 Bandar Lampung", description: "Profil pegawai, status ASN, sertifikasi, dan pendidikan terakhir.", category: "SIMPEG", year: 2026, producer: "MAN 1 Bandar Lampung", frequency: "Bulanan", format: "API / XLSX", sourceUrl: "", excelUrl: "", pdfUrl: "", standardData: "Status pegawai, pendidikan, sertifikasi, jabatan, periode.", metadata: "Status: data contoh; Target: SIMPEG; Satuan kerja: MAN 1 Bandar Lampung" },
  ],
  datasetDetails: [],
  releaseSchedules: [
    { id: 1, title: "Pemutakhiran Rekap EMIS", period: "Semester Ganjil 2026/2027", language: "Indonesia", scheduledDate: "15-08-2026", realizedDate: "-", status: "rencana", documentUrl: "", format: "API" },
    { id: 2, title: "Pemutakhiran Statistik SIMPEG", period: "Agustus 2026", language: "Indonesia", scheduledDate: "01-09-2026", realizedDate: "-", status: "rencana", documentUrl: "", format: "API" },
  ],
  officeLocations: [
    { id: 1, name: "MAN 1 Bandar Lampung", type: "kanwil", address: "Jl. Letkol H. Endro Suratmin, Harapan Jaya, Sukarame, Bandar Lampung 35131", phone: "0721-706448", latitude: -5.374730882691959, longitude: 105.30271053314209, mapsUrl: "https://maps.google.com/?q=-5.374730882691959,105.30271053314209" },
  ],
  activities: [
    { id: 1, title: "Lukman Hakim, S.Pd., M.M.", caption: "Kepala MAN 1 Bandar Lampung", imageUrl: "/brand/man1/lukman-hakim.jpg" },
    { id: 2, title: "Qonita Nurhayati As'ad, S.H.", caption: "Plt. Kepala Tata Usaha", imageUrl: "/brand/man1/qonita-nurhayati.jpg" },
    { id: 3, title: "Drs. Tri Sutanto", caption: "Waka Sarana dan Prasarana", imageUrl: "/brand/man1/tri-sutanto.jpg" },
    { id: 4, title: "Dra. Yuniarti", caption: "Waka Hubungan Masyarakat", imageUrl: "/brand/man1/yuniarti.jpg" },
  ],
  videos: [],
  latestNews: [],
  executiveSchedules: [
    { id: 1, date: "15 Juli 2026", time: "08.00 WIB", title: "Validasi struktur data EMIS", unit: "Tim Data Madrasah", location: "Ruang Rapat MAN 1", priority: "utama", status: "terjadwal" },
    { id: 2, date: "17 Juli 2026", time: "09.00 WIB", title: "Pemetaan data ASN SIMPEG", unit: "Tata Usaha", location: "Ruang Tata Usaha", priority: "-", status: "terjadwal" },
  ],
  awardCollections: [
    { id: "prestasi-madrasah", title: "Prestasi Madrasah", description: "Sorotan capaian MAN 1 Bandar Lampung.", items: [
      { id: 1, title: "Siswa diterima di perguruan tinggi", description: "Sorotan capaian peserta didik MAN 1 Bandar Lampung pada 2025.", year: 2025, imageUrl: "/brand/man1/siswa-prestasi.jpeg", alt: "Peserta didik MAN 1 Bandar Lampung" },
      { id: 2, title: "Zona Integritas", description: "Komitmen layanan madrasah yang bersih dan melayani.", year: 2026, imageUrl: "/brand/man1/zona-integritas.jpeg", alt: "Zona Integritas MAN 1 Bandar Lampung" },
    ] },
  ],
  contact: {
    institution: "MAN 1 Bandar Lampung",
    address: "Jl. Letkol H. Endro Suratmin, Harapan Jaya, Sukarame, Bandar Lampung 35131",
    phone: "0721-706448",
    whatsapp: "-",
    email: "admin.mandela@gmail.com",
    instagram: "https://www.instagram.com/man1balam_official/",
    youtube: "",
    website: "https://man1balam.sch.id",
    mapEmbedUrl: "https://www.google.com/maps?q=-5.374730882691959,105.30271053314209&z=16&output=embed",
  },
  filters: { years: ["2026"], categories: ["EMIS", "SIMPEG"], regions: ["MAN 1 Bandar Lampung"] },
};

let seedPromise: Promise<void> | null = null;

export function clearDashboardDataCache() {
  seedPromise = null;
}

export async function getDashboardData(): Promise<DashboardData> {
  await ensureDashboardSeeded();

  const [indicators, rows, chartRows, publications, datasets, releaseSchedules, officeLocations, activities, videos, schedules, collections, items, contactRows, filterRows] = await Promise.all([
    db.select().from(indicatorsTable).orderBy(asc(indicatorsTable.id)),
    db.select().from(dashboardRowsTable).orderBy(asc(dashboardRowsTable.id)),
    db.select().from(chartSeriesTable).orderBy(asc(chartSeriesTable.year)),
    db.select().from(publicationsTable).orderBy(asc(publicationsTable.id)),
    db.select().from(datasetsTable).orderBy(asc(datasetsTable.id)),
    db.select().from(releaseSchedulesTable).orderBy(asc(releaseSchedulesTable.id)),
    db.select().from(officeLocationsTable).orderBy(asc(officeLocationsTable.id)),
    db.select().from(activitiesTable).orderBy(asc(activitiesTable.id)),
    db.select().from(videosTable).orderBy(asc(videosTable.id)),
    db.select().from(executiveSchedulesTable).orderBy(asc(executiveSchedulesTable.id)),
    db.select().from(awardCollectionsTable).orderBy(asc(awardCollectionsTable.sortOrder)),
    db.select().from(awardItemsTable).orderBy(asc(awardItemsTable.sortOrder)),
    db.select().from(contactInfoTable).limit(1),
    db.select().from(filtersTable).orderBy(asc(filtersTable.sortOrder)),
  ]);

  const chartSeries = toChartPoints(chartRows, rows);
  const filters = {
    years: filterRows.filter((item) => item.kind === "year").map((item) => item.value),
    categories: filterRows.filter((item) => item.kind === "category").map((item) => item.value),
    regions: filterRows.filter((item) => item.kind === "region").map((item) => item.value),
  };

  return {
    indicators,
    rows,
    chartSeries,
    publications,
    datasets,
    datasetDetails: [],
    releaseSchedules,
    officeLocations,
    activities,
    videos,
    latestNews: [],
    executiveSchedules: schedules,
    awardCollections: collections.map((collection) => ({
      id: collection.id,
      title: collection.title,
      description: collection.description,
      items: items.filter((item) => item.collectionId === collection.id).map((item) => ({ id: item.itemId, title: item.title, description: item.description, year: item.year, imageUrl: item.imageUrl, alt: item.alt })),
    })),
    contact: contactRows[0] ? {
      institution: contactRows[0].institution,
      address: contactRows[0].address,
      phone: contactRows[0].phone,
      whatsapp: contactRows[0].whatsapp,
      email: contactRows[0].email,
      instagram: contactRows[0].instagram,
      youtube: contactRows[0].youtube,
      website: contactRows[0].website,
      mapEmbedUrl: contactRows[0].mapEmbedUrl,
    } : seedDashboardData.contact,
    filters: {
      years: filters.years.length ? filters.years : seedDashboardData.filters.years,
      categories: filters.categories.length ? filters.categories : seedDashboardData.filters.categories,
      regions: filters.regions.length ? filters.regions : seedDashboardData.filters.regions,
    },
  };
}

export async function replaceDashboardData(data: DashboardData) {
  await ensureDatabaseReady();
  await clearDashboardTables();
  await insertDashboardData(data);
  clearDashboardDataCache();
}

async function ensureDashboardSeeded() {
  await ensureDatabaseReady();
  if (!seedPromise) {
    seedPromise = (async () => {
      const existing = await db.select().from(indicatorsTable).limit(1);
      if (!existing.length) await insertDashboardData(seedDashboardData);
    })();
  }
  await seedPromise;
}

async function clearDashboardTables() {
  await db.delete(filtersTable);
  await db.delete(contactInfoTable);
  await db.delete(videosTable);
  await db.delete(activitiesTable);
  await db.delete(officeLocationsTable);
  await db.delete(releaseSchedulesTable);
  await db.delete(datasetsTable);
  await db.delete(publicationsTable);
  await db.delete(awardItemsTable);
  await db.delete(awardCollectionsTable);
  await db.delete(executiveSchedulesTable);
  await db.delete(chartSeriesTable);
  await db.delete(dashboardRowsTable);
  await db.delete(indicatorsTable);
}

async function insertDashboardData(data: DashboardData) {
  if (data.indicators.length) await db.insert(indicatorsTable).values(data.indicators);
  if (data.rows.length) await db.insert(dashboardRowsTable).values(data.rows);

  const chartValues = data.chartSeries.flatMap((point) => Object.entries(point)
    .filter(([key, value]) => key !== "year" && typeof value === "number")
    .map(([category, value]) => ({ year: point.year, category, value: Number(value) })));
  if (chartValues.length) await db.insert(chartSeriesTable).values(chartValues);
  if (data.executiveSchedules.length) await db.insert(executiveSchedulesTable).values(data.executiveSchedules);
  if (data.publications.length) await db.insert(publicationsTable).values(data.publications);
  if (data.datasets.length) await db.insert(datasetsTable).values(data.datasets);
  if (data.releaseSchedules.length) await db.insert(releaseSchedulesTable).values(data.releaseSchedules);
  if (data.officeLocations.length) await db.insert(officeLocationsTable).values(data.officeLocations);
  if (data.activities.length) await db.insert(activitiesTable).values(data.activities);
  if (data.videos.length) await db.insert(videosTable).values(data.videos);

  for (const [collectionIndex, collection] of data.awardCollections.entries()) {
    await db.insert(awardCollectionsTable).values({ id: collection.id, title: collection.title, description: collection.description, sortOrder: collectionIndex });
    if (collection.items.length) await db.insert(awardItemsTable).values(collection.items.map((item, itemIndex) => ({ collectionId: collection.id, itemId: item.id, title: item.title, description: item.description, year: item.year, imageUrl: item.imageUrl, alt: item.alt, sortOrder: itemIndex })));
  }

  await db.insert(contactInfoTable).values({ id: 1, ...data.contact });
  const filterValues = [
    ...data.filters.years.map((value, index) => ({ kind: "year" as const, value, sortOrder: index })),
    ...data.filters.categories.map((value, index) => ({ kind: "category" as const, value, sortOrder: index })),
    ...data.filters.regions.map((value, index) => ({ kind: "region" as const, value, sortOrder: index })),
  ];
  if (filterValues.length) await db.insert(filtersTable).values(filterValues);
}

function toChartPoints(source: { year: number; category: string; value: number }[], rows: DashboardRow[]): ChartPoint[] {
  if (!source.length) {
    const categories = Array.from(new Set(rows.map((row) => row.category)));
    const years = Array.from(new Set(rows.map((row) => row.year))).sort();
    return years.map((year) => ({ year, ...Object.fromEntries(categories.map((category) => [category, rows.filter((row) => row.year === year && row.category === category).reduce((sum, row) => sum + row.value, 0)])) }));
  }
  const points = new Map<number, ChartPoint>();
  for (const item of source) points.set(item.year, { ...(points.get(item.year) ?? { year: item.year }), [item.category]: item.value });
  return Array.from(points.values()).sort((a, b) => a.year - b.year);
}
