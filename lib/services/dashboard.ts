import { asc } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { ensureDatabaseReady } from "@/lib/db/migrate";
import { getIntegrationReadState } from "@/lib/repositories/integration-repository";
import { buildUnifiedDashboardData } from "@/lib/services/unified-dashboard";
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
  siteSettings as siteSettingsTable,
  videos as videosTable,
} from "@/lib/db/schema";
import type { ChartPoint, ContactInfo, DashboardData, DashboardRow, SiteSettings } from "@/lib/types";

export const seedDashboardData: DashboardData = {
  indicators: [
    { id: 1, name: "Peserta Didik", description: "Total peserta didik terisi pada periode 2025/2026 Genap.", category: "EMIS", unit: "siswa", source: "EMIS snapshot • 2025/2026 Genap", year: 2026, value: 301, trend: 0, status: "aktif" },
    { id: 2, name: "Rombongan Belajar", description: "Total rombongan belajar pada periode 2025/2026 Genap.", category: "EMIS", unit: "rombel", source: "EMIS snapshot • 2025/2026 Genap", year: 2026, value: 13, trend: 0, status: "aktif" },
    { id: 3, name: "Profil teridentifikasi", description: "Tiga profil ditemukan pada snapshot 500 record pertama; bukan total GTK.", category: "SIMPEG", unit: "profil", source: "SIMPEG • snapshot parsial", year: 2026, value: 3, trend: 0, status: "perlu-validasi" },
    { id: 4, name: "Profil ASN teridentifikasi", description: "Profil ASN teridentifikasi pada snapshot parsial; bukan total ASN.", category: "SIMPEG", unit: "profil", source: "SIMPEG • snapshot parsial", year: 2026, value: 3, trend: 0, status: "perlu-validasi" },
    { id: 5, name: "Sertifikasi ASN", description: "Data sertifikasi belum tersedia dari endpoint resmi.", category: "SIMPEG", unit: "status", source: "SIMPEG • data belum tersedia", year: 2026, value: 0, trend: 0, status: "perlu-validasi" },
    { id: 6, name: "Akreditasi Madrasah", description: "Status akreditasi MAN 1 Lampung Selatan.", category: "EMIS", unit: "nilai", source: "Referensi resmi MAN 1 Lampung Selatan", year: 2026, value: 2, trend: 0, status: "aktif" },
  ],
  rows: [
    { id: 1, indicator: "Peserta Didik Kelas X", category: "EMIS", region: "MAN 1 Lampung Selatan", period: "2025/2026 Genap", year: 2026, value: 92, unit: "siswa", source: "EMIS snapshot • 2025/2026 Genap" },
    { id: 2, indicator: "Peserta Didik Kelas XI", category: "EMIS", region: "MAN 1 Lampung Selatan", period: "2025/2026 Genap", year: 2026, value: 121, unit: "siswa", source: "EMIS snapshot • 2025/2026 Genap" },
    { id: 3, indicator: "Peserta Didik Kelas XII", category: "EMIS", region: "MAN 1 Lampung Selatan", period: "2025/2026 Genap", year: 2026, value: 88, unit: "siswa", source: "EMIS snapshot • 2025/2026 Genap" },
    { id: 6, indicator: "PNS", category: "SIMPEG", region: "MAN 1 Lampung Selatan", period: "Snapshot 500 record pertama", year: 2026, value: 3, unit: "profil", source: "SIMPEG • snapshot parsial" },
    { id: 7, indicator: "PPPK", category: "SIMPEG", region: "MAN 1 Lampung Selatan", period: "Tahunan", year: 2026, value: 0, unit: "orang", source: "SIMPEG API / snapshot awal" },
    { id: 8, indicator: "Non-ASN", category: "SIMPEG", region: "MAN 1 Lampung Selatan", period: "Tahunan", year: 2026, value: 0, unit: "orang", source: "Belum tersedia pada endpoint SIMPEG" },
    { id: 9, indicator: "Pendidikan S2", category: "SIMPEG", region: "MAN 1 Lampung Selatan", period: "Tahunan", year: 2026, value: 1, unit: "orang", source: "SIMPEG API / snapshot awal" },
    { id: 10, indicator: "Pendidikan S1 / D4", category: "SIMPEG", region: "MAN 1 Lampung Selatan", period: "Tahunan", year: 2026, value: 2, unit: "orang", source: "SIMPEG API / snapshot awal" },
    { id: 11, indicator: "Pendidikan Diploma", category: "SIMPEG", region: "MAN 1 Lampung Selatan", period: "Tahunan", year: 2026, value: 0, unit: "orang", source: "SIMPEG API / snapshot awal" },
  ],
  chartSeries: [
    { year: 2026, EMIS: 301, SIMPEG: 3 },
  ],
  publications: [
    { id: 1, title: "Profil MAN 1 Lampung Selatan", description: "Identitas dan informasi satuan pendidikan di Wayurang, Kalianda.", date: "14 Juli 2026", category: "Profil Madrasah", fileLabel: "WEB" },
    { id: 2, title: "Ringkasan EMIS dan SIMPEG", description: "Ringkasan awal untuk validasi integrasi API Kementerian Agama.", date: "14 Juli 2026", category: "Data Internal", fileLabel: "API" },
  ],
  datasets: [
    { id: 1, title: "Rekap EMIS MAN 1 Lampung Selatan", description: "Profil sekolah, peserta didik, tingkat, gender, dan rombongan belajar.", category: "EMIS", year: 2026, producer: "MAN 1 Lampung Selatan", frequency: "Semester", format: "API / XLSX", sourceUrl: "", excelUrl: "", pdfUrl: "", standardData: "Tingkat, jenis kelamin, jumlah peserta didik, rombongan belajar, periode.", metadata: "Status: integrasi bertahap; Target: EMIS; NSM: 131118010001" },
    { id: 2, title: "Statistik SIMPEG MAN 1 Lampung Selatan", description: "Profil pegawai, status ASN, dan pendidikan terakhir tanpa data pribadi sensitif.", category: "SIMPEG", year: 2026, producer: "MAN 1 Lampung Selatan", frequency: "Bulanan", format: "API / XLSX", sourceUrl: "", excelUrl: "", pdfUrl: "", standardData: "Nama, jabatan, status pegawai, pendidikan, periode.", metadata: "Status: API aktif; Data sensitif tidak diteruskan ke frontend" },
  ],
  datasetDetails: [],
  releaseSchedules: [
    { id: 1, title: "Pemutakhiran Rekap EMIS", period: "Semester Ganjil 2026/2027", language: "Indonesia", scheduledDate: "15-08-2026", realizedDate: "-", status: "rencana", documentUrl: "", format: "API" },
    { id: 2, title: "Pemutakhiran Statistik SIMPEG", period: "Agustus 2026", language: "Indonesia", scheduledDate: "01-09-2026", realizedDate: "-", status: "rencana", documentUrl: "", format: "API" },
  ],
  officeLocations: [
    { id: 1, name: "MAN 1 Lampung Selatan", type: "kanwil", address: "Jl. Soekarno Hatta, Jati, Wayurang, Kalianda, Lampung Selatan", phone: "(0727) 3320495", latitude: -5.6931, longitude: 105.5824, mapsUrl: "https://maps.google.com/?q=-5.6931,105.5824" },
  ],
  activities: [
    { id: 1, title: "Dr. H. Yayuk Dwi Wahyuni, S.Pd.I., M.Ag.", caption: "Kepala MAN 1 Lampung Selatan", imageUrl: "/brand/man1/kepala-yayuk-dwi-wahyuni.jpeg" },
    { id: 2, title: "Drs. Edi Sehadi", caption: "Guru Ahli Muda • PNS", imageUrl: "/brand/man1/logo.png" },
    { id: 3, title: "M Biqman, S.Pd., M.M.", caption: "Guru Ahli Madya • PNS", imageUrl: "/brand/man1/logo.png" },
    { id: 4, title: "Iyum Aningrum, S.Ag.", caption: "Guru Ahli Madya • PNS", imageUrl: "/brand/man1/logo.png" },
  ],
  videos: [],
  latestNews: [],
  executiveSchedules: [
    { id: 1, date: "15 Juli 2026", time: "08.00 WIB", title: "Validasi struktur data EMIS", unit: "Tim Data Madrasah", location: "Ruang Rapat MAN 1", priority: "utama", status: "terjadwal" },
    { id: 2, date: "17 Juli 2026", time: "09.00 WIB", title: "Pemetaan data ASN SIMPEG", unit: "Tata Usaha", location: "Ruang Tata Usaha", priority: "-", status: "terjadwal" },
  ],
  awardCollections: [
    { id: "prestasi-madrasah", title: "Kegiatan Madrasah", description: "Sorotan kegiatan MAN 1 Lampung Selatan.", items: [
      { id: 1, title: "OSN tingkat kabupaten", description: "Peserta didik mengikuti OSN tingkat kabupaten secara daring.", year: 2026, imageUrl: "/brand/man1/siswa-osn.jpeg", alt: "Peserta OSN MAN 1 Lampung Selatan" },
      { id: 2, title: "Rakor kegiatan belajar", description: "Penguatan program ekoteologi dan kebersamaan dalam rapat koordinasi KBM.", year: 2026, imageUrl: "/brand/man1/rapat-kbm.jpeg", alt: "Rakor KBM MAN 1 Lampung Selatan" },
    ] },
  ],
  contact: {
    institution: "MAN 1 Lampung Selatan",
    address: "Jl. Soekarno Hatta, Jati, Wayurang, Kalianda, Lampung Selatan",
    phone: "(0727) 3320495",
    whatsapp: "-",
    email: "info@mansalase.sch.id",
    instagram: "https://www.instagram.com/mansatu.lamsel/",
    youtube: "https://www.youtube.com/c/MANSALASE",
    website: "https://mansalase.sch.id",
    mapEmbedUrl: "https://www.google.com/maps?q=-5.6931,105.5824&z=16&output=embed",
  },
  siteSettings: {
    headerInstitutionName: "MAN 1 Lampung Selatan",
    headerSubtitle: "Dashboard EMIS & SIMPEG",
    heroTitle: "Dashboard MAN 1",
    heroHighlight: "Lampung Selatan",
    heroDescription: "Rekap profil sekolah dan siswa dari EMIS, dipadukan dengan profil dan statistik ASN dari SIMPEG untuk mendukung keputusan MAN 1 Lampung Selatan.",
    footerTitle: "Dashboard MAN 1 Lampung Selatan",
    footerSubtitle: "EMIS • SIMPEG • Satu Data Madrasah",
    footerDescription: "Data dashboard diperbarui otomatis dari EMIS dan SIMPEG, kemudian disimpan sebagai snapshot aman pada database madrasah.",
  },
  filters: { years: ["2026"], categories: ["EMIS", "SIMPEG"], regions: ["MAN 1 Lampung Selatan"] },
};

let seedPromise: Promise<void> | null = null;

export function clearDashboardDataCache() {
  seedPromise = null;
}

export async function getDashboardData(options: { integrate?: boolean } = {}): Promise<DashboardData> {
  void options;
  await ensureDashboardSeeded();

  const [indicators, rows, chartRows, publications, datasets, releaseSchedules, officeLocations, activities, videos, schedules, collections, items, contactRows, settingsRows, filterRows] = await Promise.all([
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
    db.select().from(siteSettingsTable).limit(1),
    db.select().from(filtersTable).orderBy(asc(filtersTable.sortOrder)),
  ]);

  const chartSeries = toChartPoints(chartRows, rows);
  const filters = {
    years: filterRows.filter((item) => item.kind === "year").map((item) => item.value),
    categories: filterRows.filter((item) => item.kind === "category").map((item) => item.value),
    regions: filterRows.filter((item) => item.kind === "region").map((item) => item.value),
  };

  const dashboardData: DashboardData = {
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
    siteSettings: settingsRows[0] ? {
      headerInstitutionName: settingsRows[0].headerInstitutionName,
      headerSubtitle: settingsRows[0].headerSubtitle,
      heroTitle: settingsRows[0].heroTitle,
      heroHighlight: settingsRows[0].heroHighlight,
      heroDescription: settingsRows[0].heroDescription,
      footerTitle: settingsRows[0].footerTitle,
      footerSubtitle: settingsRows[0].footerSubtitle,
      footerDescription: settingsRows[0].footerDescription,
    } : seedDashboardData.siteSettings,
    filters: {
      years: filters.years.length ? filters.years : seedDashboardData.filters.years,
      categories: filters.categories.length ? filters.categories : seedDashboardData.filters.categories,
      regions: filters.regions.length ? filters.regions : seedDashboardData.filters.regions,
    },
  };

  return buildUnifiedDashboardData(dashboardData, await getIntegrationReadState());
}

export async function replaceDashboardData(data: DashboardData) {
  await ensureDatabaseReady();
  await clearDashboardTables();
  await insertDashboardData(data);
  clearDashboardDataCache();
}

export async function updateDashboardPresentation(input: {
  contact: ContactInfo;
  siteSettings: SiteSettings;
}) {
  await ensureDatabaseReady();
  const now = new Date().toISOString();
  await db.insert(contactInfoTable).values({ id: 1, ...input.contact }).onConflictDoUpdate({
    target: contactInfoTable.id,
    set: input.contact,
  });
  await db.insert(siteSettingsTable).values({ id: 1, ...input.siteSettings, updatedAt: now }).onConflictDoUpdate({
    target: siteSettingsTable.id,
    set: { ...input.siteSettings, updatedAt: now },
  });
}

async function ensureDashboardSeeded() {
  await ensureDatabaseReady();
  if (!seedPromise) {
    seedPromise = (async () => {
      const existing = await db.select().from(indicatorsTable).limit(1);
      const currentContact = await db.select().from(contactInfoTable).limit(1);
      const currentSettings = await db.select().from(siteSettingsTable).limit(1);
      if (currentContact[0]?.institution === "MAN 1 Bandar Lampung") {
        await clearDashboardTables();
        await insertDashboardData(seedDashboardData);
        return;
      }
      if (!existing.length) await insertDashboardData(seedDashboardData);
      if (!currentSettings.length) {
        await db.insert(siteSettingsTable).values({
          id: 1,
          ...seedDashboardData.siteSettings,
          updatedAt: new Date().toISOString(),
        });
      }
    })();
  }
  await seedPromise;
}

async function clearDashboardTables() {
  await db.delete(filtersTable);
  await db.delete(siteSettingsTable);
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
  await db.insert(siteSettingsTable).values({ id: 1, ...data.siteSettings, updatedAt: new Date().toISOString() });
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
