import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { buildEmisAuthContext } from "@/lib/integrations/emis/auth";
import { normalizeEmisPayload } from "@/lib/integrations/emis/normalizer";
import { normalizeGisMadrasahSnapshot } from "@/lib/integrations/gis/client";
import { matchSchoolEmployee } from "@/lib/integrations/simpeg/filter";
import { normalizeSimpegEmployees } from "@/lib/integrations/simpeg/normalizer";
import { fetchAllSimpegEmployees } from "@/lib/integrations/simpeg/pagination";
import { joinUrl } from "@/lib/integrations/shared";
import { normalizeWebsiteSummary } from "@/lib/integrations/website/client";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { presentationSettingsSchema } from "@/lib/validation/admin";

const originalEnvironment = { ...process.env };
const originalFetch = globalThis.fetch;

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnvironment)) delete process.env[key];
  }
  Object.assign(process.env, originalEnvironment);
  globalThis.fetch = originalFetch;
});

test("joinUrl menggabungkan base URL dan path tanpa slash ganda", () => {
  assert.equal(joinUrl("https://example.test/v1/", "/pegawai"), "https://example.test/v1/pegawai");
});

test("partner login EMIS memakai field dan token path kontrak resmi", async () => {
  process.env.EMIS_AUTH_MODE = "partner-login";
  process.env.EMIS_PUBLIC_KEY = "public-test";
  process.env.EMIS_PRIVATE_KEY = "private-test";
  delete process.env.EMIS_PARTNER_LOGIN_FORMAT;
  delete process.env.EMIS_PARTNER_PUBLIC_FIELD;
  delete process.env.EMIS_PARTNER_PRIVATE_FIELD;
  delete process.env.EMIS_PARTNER_TOKEN_PATH;

  globalThis.fetch = async (_input, init) => {
    assert.equal(init?.headers && (init.headers as Record<string, string>)["Content-Type"], "application/json");
    assert.deepEqual(JSON.parse(String(init?.body)), {
      public_key: "public-test",
      private_key: "private-test",
    });
    return new Response(JSON.stringify({ success: true, results: { token: "partner-token" } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const auth = await buildEmisAuthContext("https://emis.example/v1/");
  assert.equal(auth.method, "partner-login");
  assert.equal(auth.headers.Authorization, "Bearer partner-token");
});

test("normalizer EMIS mempertahankan gender sebagai undefined ketika endpoint tidak menyediakan data", () => {
  process.env.EMIS_NSM = "131118010001";
  process.env.EMIS_FIELD_STUDENTS_TOTAL = "data.total";
  process.env.EMIS_FIELD_GRADE_10 = "data.grade10";
  process.env.EMIS_FIELD_GRADE_11 = "data.grade11";
  process.env.EMIS_FIELD_GRADE_12 = "data.grade12";
  process.env.EMIS_FIELD_STUDY_GROUPS_TOTAL = "data.rombel";
  process.env.EMIS_SYNC_PERIOD = "2025/2026 Genap";
  process.env.EMIS_SYNC_SCHOOL_YEAR = "2025/2026";
  process.env.EMIS_SYNC_SEMESTER = "Genap";

  const result = normalizeEmisPayload(
    { success: true, results: { statistic_num: "131118010001", npsn: "10816233", name: "MAN 1 Lampung Selatan" } },
    { data: { total: 301, grade10: 92, grade11: 121, grade12: 88, rombel: 13 } },
  );

  assert.equal(result.students.total, 301);
  assert.equal(result.students.grade11, 121);
  assert.equal(result.studyGroups.total, 13);
  assert.equal(result.students.male, undefined);
  assert.match(result.warnings.join(" "), /gender belum tersedia/i);
});

test("normalizer EMIS menolak identitas NPSN yang tidak cocok", () => {
  process.env.EMIS_NSM = "131118010001";
  assert.throws(
    () => normalizeEmisPayload({ results: { statistic_num: "131118010001", npsn: "00000000", name: "Bukan MAN 1" } }),
    /NPSN.*tidak cocok/i,
  );
});

test("normalizer GIS memetakan agregat publik MAN 1 Lampung Selatan", () => {
  const result = normalizeGisMadrasahSnapshot({
    id: 14343,
    statistic_num: "131118010001",
    npsn: "10816233",
    name: "MAN 1 LAMPUNG SELATAN",
    status: "Negeri",
    akreditasi: "B",
    academic_year: "2025/2026",
    siswa: 302,
    student_male: 142,
    student_female: 160,
    rombel_count: 14,
    personnel_teacher: 46,
    personnel_education_staff: 17,
    class_total: 14,
    updated_at: "2026-07-12 00:36:07",
  });
  assert.equal(result.students.total, 302);
  assert.equal(result.students.male, 142);
  assert.equal(result.students.female, 160);
  assert.equal(result.students.studyGroups, 14);
  assert.equal(result.employees.total, 63);
  assert.equal(result.employees.teachers, 46);
  assert.equal(result.employees.educationStaff, 17);
});

test("normalizer website menegakkan kontrak agregat tanpa biodata individu", () => {
  const result = normalizeWebsiteSummary({
    success: true,
    data: {
      school: {
        name: "MAN 1 Lampung Selatan",
        nsm: "131118010001",
        npsn: "10816233",
        status: "Negeri",
        accreditation: "B",
      },
      period: {
        school_year: "2025/2026",
        semester: "Genap",
        label: "2025/2026 Genap",
      },
      students: {
        total: 302,
        male: 142,
        female: 160,
        study_groups: 14,
        by_grade: { X: 100, XI: 101, XII: 101 },
      },
      employees: {
        total: 63,
        teachers: 46,
        education_staff: 17,
        pns: 30,
        pppk: 13,
        non_asn: 20,
      },
      updated_at: "2026-07-16T10:00:00+07:00",
    },
  });
  assert.equal(result.students?.total, 302);
  assert.equal(result.employees?.total, 63);
  assert.equal(result.warnings.length, 0);
});

test("filter SIMPEG menjelaskan match NSM, NPSN, dan nama unit", () => {
  process.env.SIMPEG_NSM = "131118010001";
  process.env.SIMPEG_NPSN = "10816233";
  process.env.SIMPEG_UNIT_NAME = "MAN 1 Lampung Selatan";
  assert.equal(matchSchoolEmployee({ NSM: "131118010001" }), "nsm");
  assert.equal(matchSchoolEmployee({ NPSN: "10816233" }), "npsn");
  assert.equal(matchSchoolEmployee({ SATUAN_KERJA: "MAN 1 Lampung Selatan" }), "unit_name");
  assert.equal(matchSchoolEmployee({ SATUAN_KERJA: "Unit lain" }), null);
});

test("normalizer SIMPEG tidak menetapkan total pegawai ketika pagination parsial", () => {
  const result = normalizeSimpegEmployees({
    records: [
      { NPSN: "10816233", STATUS_PEGAWAI: "PNS", PENDIDIKAN: "S2" },
      { NSM: "131118010001", STATUS_PEGAWAI: "PNS", PENDIDIKAN: "S1" },
      { SATUAN_KERJA: "MAN 1 Lampung Selatan", STATUS_PEGAWAI: "PNS", PENDIDIKAN: "S1" },
    ],
    upstreamTotal: 8_384,
    pageCount: 1,
    complete: false,
    warnings: [],
  });
  assert.equal(result.filteredTotal, 3);
  assert.equal(result.employeesTotal, undefined);
  assert.equal(result.certifiedTotal, undefined);
  assert.match(result.warnings.join(" "), /tidak ditetapkan/i);
});

test("pagination SIMPEG berhenti ketika upstream mengulang halaman yang sama", async () => {
  const page = Array.from({ length: 500 }, (_, index) => ({
    NIP: `nip-${index}`,
    NPSN: index < 3 ? "10816233" : "",
    NAMA: `Pegawai ${index}`,
  }));
  globalThis.fetch = async () => new Response(JSON.stringify({ total: 8_384, size: 500, data: page }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  const result = await fetchAllSimpegEmployees("https://simpeg.example/v1", "test-token");
  assert.equal(result.records.length, 500);
  assert.equal(result.pageCount, 2);
  assert.equal(result.complete, false);
  assert.match(result.warnings.join(" "), /halaman yang sama/i);
});

test("rate limiter menolak permintaan di atas batas", () => {
  const key = `test-${crypto.randomUUID()}`;
  assert.equal(checkRateLimit(key, { limit: 2, windowMs: 60_000 }).allowed, true);
  assert.equal(checkRateLimit(key, { limit: 2, windowMs: 60_000 }).allowed, true);
  assert.equal(checkRateLimit(key, { limit: 2, windowMs: 60_000 }).allowed, false);
});

test("pengaturan admin hanya menerima teks tampilan dan kontak", () => {
  const result = presentationSettingsSchema.safeParse({
    contact: {
      institution: "MAN 1 Lampung Selatan",
      address: "Jl. Soekarno Hatta, Kalianda",
      phone: "(0727) 3320495",
      whatsapp: "",
      email: "info@mansalase.sch.id",
      instagram: "https://www.instagram.com/mansatu.lamsel/",
      youtube: "https://www.youtube.com/c/MANSALASE",
      website: "https://mansalase.sch.id",
      mapEmbedUrl: "https://www.google.com/maps?q=-5.6931,105.5824&output=embed",
    },
    siteSettings: {
      headerInstitutionName: "MAN 1 Lampung Selatan",
      headerSubtitle: "Dashboard EMIS & SIMPEG",
      heroTitle: "Dashboard MAN 1",
      heroHighlight: "Lampung Selatan",
      heroDescription: "Data madrasah yang diperbarui otomatis dari sumber resmi.",
      footerTitle: "Dashboard MAN 1 Lampung Selatan",
      footerSubtitle: "EMIS • SIMPEG",
      footerDescription: "Snapshot aman tersimpan pada database madrasah.",
    },
    indicators: [{ value: 999_999 }],
  });
  assert.equal(result.success, true);
  if (result.success) assert.equal("indicators" in result.data, false);
});
