import { fetchEmisSnapshot } from "@/lib/integrations/emis/client";
import { fetchGisMadrasahSnapshot } from "@/lib/integrations/gis/client";
import { fetchMirrorSnapshot } from "@/lib/integrations/mirror/client";
import { fetchSimpegSnapshot } from "@/lib/integrations/simpeg/client";
import { sanitizedError } from "@/lib/integrations/shared";
import { fetchWebsiteSummary } from "@/lib/integrations/website/client";
import {
  createSyncRun,
  finishSyncRun,
  getIntegrationReadState,
  insertEmployeeSnapshot,
  insertInstitutionSnapshot,
  insertStudentSnapshot,
} from "@/lib/repositories/integration-repository";

export async function syncEmis(createdBy?: string, triggerType: "manual" | "scheduled" = "manual") {
  const run = await createSyncRun("emis", createdBy, triggerType);
  try {
    const snapshot = await fetchEmisSnapshot();
    const capturedAt = new Date().toISOString();
    await insertInstitutionSnapshot({
      id: crypto.randomUUID(),
      syncRunId: run.id,
      period: snapshot.period,
      name: snapshot.institution.name,
      nsm: snapshot.institution.nsm,
      npsn: snapshot.institution.npsn,
      status: snapshot.institution.status ?? null,
      accreditation: snapshot.institution.accreditation ?? null,
      registeredStatus: null,
      sourceUpdatedAt: null,
      capturedAt,
    });

    const hasStudentAggregate = snapshot.students.total != null || snapshot.studyGroups.total != null;
    if (hasStudentAggregate) {
      await insertStudentSnapshot({
        id: crypto.randomUUID(),
        syncRunId: run.id,
        period: snapshot.period,
        schoolYear: snapshot.schoolYear,
        semester: snapshot.semester,
        studentsTotal: snapshot.students.total ?? null,
        grade10: snapshot.students.grade10 ?? null,
        grade11: snapshot.students.grade11 ?? null,
        grade12: snapshot.students.grade12 ?? null,
        male: snapshot.students.male ?? null,
        female: snapshot.students.female ?? null,
        studyGroupsTotal: snapshot.studyGroups.total ?? null,
        studyGroups10: snapshot.studyGroups.grade10 ?? null,
        studyGroups11: snapshot.studyGroups.grade11 ?? null,
        studyGroups12: snapshot.studyGroups.grade12 ?? null,
        coverage: snapshot.coverage,
        qualityScore: Math.max(0, 100 - snapshot.warnings.length * 10),
        warningsJson: JSON.stringify(snapshot.warnings),
        capturedAt,
      });
    }

    const status = hasStudentAggregate ? "success" as const : "partial" as const;
    await finishSyncRun({
      id: run.id,
      sourceCode: "emis",
      startedAt: run.startedAt,
      status,
      recordsReceived: hasStudentAggregate ? snapshot.students.total ?? 1 : 1,
      recordsMatched: 1,
      pageCount: 1,
      errorCode: hasStudentAggregate ? undefined : "STUDENT_ENDPOINT_NOT_CONFIGURED",
      errorSummary: hasStudentAggregate ? undefined : "Identitas berhasil, tetapi endpoint agregat siswa belum dikonfigurasi.",
    });
    return { runId: run.id, status, coverage: snapshot.coverage, warnings: snapshot.warnings };
  } catch (error) {
    await finishSyncRun({ id: run.id, sourceCode: "emis", startedAt: run.startedAt, status: "failed", errorCode: "EMIS_SYNC_FAILED", errorSummary: sanitizedError(error) });
    throw new SyncServiceError("Sinkronisasi EMIS gagal.", run.id, sanitizedError(error));
  }
}

export async function syncSimpeg(createdBy?: string, triggerType: "manual" | "scheduled" = "manual") {
  const run = await createSyncRun("simpeg", createdBy, triggerType);
  try {
    const snapshot = await fetchSimpegSnapshot();
    const current = await getIntegrationReadState();
    const shouldRetainLastKnownGood = snapshot.filteredTotal === 0 && current.employees?.filteredTotal;
    if (!shouldRetainLastKnownGood) {
      await insertEmployeeSnapshot({
        id: crypto.randomUUID(),
        syncRunId: run.id,
        period: snapshot.period,
        employeesTotal: snapshot.employeesTotal ?? null,
        teachersTotal: null,
        staffTotal: null,
        pnsTotal: snapshot.pnsTotal,
        pppkTotal: snapshot.pppkTotal,
        nonAsnTotal: snapshot.nonAsnTotal ?? null,
        educationS3: snapshot.educationS3,
        educationS2: snapshot.educationS2,
        educationS1d4: snapshot.educationS1d4,
        educationDiploma: snapshot.educationDiploma,
        educationSecondary: 0,
        educationUnknown: snapshot.educationUnknown,
        certifiedTotal: snapshot.certifiedTotal ?? null,
        uncertifiedTotal: snapshot.uncertifiedTotal ?? null,
        certificationUnknown: snapshot.certificationUnknown,
        upstreamTotal: snapshot.upstreamTotal ?? null,
        recordsReceived: snapshot.recordsReceived,
        filteredTotal: snapshot.filteredTotal,
        pageCount: snapshot.pageCount,
        coverage: snapshot.coverage,
        qualityScore: snapshot.qualityScore,
        warningsJson: JSON.stringify(snapshot.warnings),
        capturedAt: new Date().toISOString(),
      });
    }
    const status = snapshot.complete && !shouldRetainLastKnownGood ? "success" as const : "partial" as const;
    await finishSyncRun({
      id: run.id,
      sourceCode: "simpeg",
      startedAt: run.startedAt,
      status,
      recordsReceived: snapshot.recordsReceived,
      recordsMatched: snapshot.filteredTotal,
      recordsRejected: Math.max(0, snapshot.recordsReceived - snapshot.filteredTotal),
      pageCount: snapshot.pageCount,
      errorCode: status === "partial" ? "PARTIAL_COVERAGE" : undefined,
      errorSummary: shouldRetainLastKnownGood ? "Hasil nol tidak mengganti snapshot valid sebelumnya." : snapshot.warnings.join(" "),
    });
    return { runId: run.id, status, coverage: snapshot.coverage, matched: snapshot.filteredTotal, warnings: snapshot.warnings };
  } catch (error) {
    await finishSyncRun({ id: run.id, sourceCode: "simpeg", startedAt: run.startedAt, status: "failed", errorCode: "SIMPEG_SYNC_FAILED", errorSummary: sanitizedError(error) });
    throw new SyncServiceError("Sinkronisasi SIMPEG gagal.", run.id, sanitizedError(error));
  }
}

export async function syncMirror(createdBy?: string, triggerType: "manual" | "scheduled" = "manual") {
  const run = await createSyncRun("mirror", createdBy, triggerType);
  try {
    const snapshot = await fetchMirrorSnapshot();
    const capturedAt = new Date().toISOString();
    const period = process.env.MIRROR_SYNC_PERIOD || "Snapshot database lokal";
    const classifiedByGrade = (snapshot.students.grade_10 ?? 0)
      + (snapshot.students.grade_11 ?? 0)
      + (snapshot.students.grade_12 ?? 0);
    const unclassifiedByGrade = Math.max(
      0,
      (snapshot.students.students_total ?? classifiedByGrade) - classifiedByGrade,
    );
    const studentWarnings = [
      `Rekap madrasah mencatat ${snapshot.students.students_total ?? "tidak tersedia"} siswa, sedangkan periode data terbaru memiliki ${snapshot.students.latest_period_records} record dan ${snapshot.students.clearly_active_records} record berstatus aktif yang dapat diklasifikasikan.`,
      `${classifiedByGrade} siswa aktif berhasil dipetakan ke Kelas X, XI, dan XII; terdapat selisih ${unclassifiedByGrade} siswa terhadap total resmi GIS.`,
      `Data Lampung menghitung ${snapshot.students.male ?? 0} siswa laki-laki dan ${snapshot.students.female ?? 0} siswa perempuan pada record berstatus aktif.`,
      "Dump MySQL diperbarui manual; sinkronkan ulang sumber ini setelah proses import melalui MAMP atau DBeaver selesai.",
    ];
    const employeeWarnings = [
      `Database lokal mengelompokkan ${snapshot.employees.teachers_total} guru/calon guru dan ${snapshot.employees.staff_total} tenaga kependidikan.`,
      "Tidak ada nama, NIP, NIK, alamat, telepon, email, atau gaji yang disalin ke snapshot dashboard.",
    ];

    await insertInstitutionSnapshot({
      id: crypto.randomUUID(),
      syncRunId: run.id,
      period,
      name: snapshot.institution.name,
      nsm: snapshot.institution.nsm,
      npsn: snapshot.institution.npsn,
      status: snapshot.institution.status,
      accreditation: snapshot.institution.accreditation,
      registeredStatus: null,
      sourceUpdatedAt: snapshot.institution.sourceUpdatedAt,
      capturedAt,
    });
    await insertStudentSnapshot({
      id: crypto.randomUUID(),
      syncRunId: run.id,
      period,
      schoolYear: process.env.MIRROR_SYNC_SCHOOL_YEAR || "Belum dipetakan",
      semester: process.env.MIRROR_SYNC_SEMESTER || "Belum dipetakan",
      studentsTotal: snapshot.students.students_total,
      grade10: snapshot.students.grade_10,
      grade11: snapshot.students.grade_11,
      grade12: snapshot.students.grade_12,
      male: snapshot.students.male,
      female: snapshot.students.female,
      studyGroupsTotal: snapshot.students.study_groups_total,
      studyGroups10: null,
      studyGroups11: null,
      studyGroups12: null,
      coverage: 70,
      qualityScore: 72,
      warningsJson: JSON.stringify(studentWarnings),
      capturedAt,
    });
    await insertEmployeeSnapshot({
      id: crypto.randomUUID(),
      syncRunId: run.id,
      period,
      employeesTotal: snapshot.employees.employees_total,
      teachersTotal: snapshot.employees.teachers_total,
      staffTotal: snapshot.employees.staff_total,
      pnsTotal: snapshot.employees.pns_total,
      pppkTotal: snapshot.employees.pppk_total,
      nonAsnTotal: snapshot.employees.non_asn_total,
      educationS3: snapshot.employees.education_s3,
      educationS2: snapshot.employees.education_s2,
      educationS1d4: snapshot.employees.education_s1d4,
      educationDiploma: snapshot.employees.education_diploma,
      educationSecondary: snapshot.employees.education_secondary,
      educationUnknown: snapshot.employees.education_unknown,
      certifiedTotal: snapshot.employees.certified_total,
      uncertifiedTotal: snapshot.employees.uncertified_total,
      certificationUnknown: 0,
      upstreamTotal: snapshot.employees.employees_total,
      recordsReceived: snapshot.employees.records_received,
      filteredTotal: snapshot.employees.filtered_total,
      pageCount: 1,
      coverage: 100,
      qualityScore: 92,
      warningsJson: JSON.stringify(employeeWarnings),
      capturedAt,
    });

    await finishSyncRun({
      id: run.id,
      sourceCode: "mirror",
      startedAt: run.startedAt,
      status: "partial",
      recordsReceived: snapshot.students.historical_records_total + snapshot.employees.records_received,
      recordsMatched: (snapshot.students.students_total ?? 0) + snapshot.employees.filtered_total,
      recordsRejected: Math.max(
        0,
        snapshot.students.latest_period_records - (snapshot.students.students_total ?? 0),
      ),
      pageCount: 1,
      errorCode: "STUDENT_STATUS_MAPPING_REVIEW",
      errorSummary: studentWarnings.join(" "),
    });
    return {
      runId: run.id,
      status: "partial" as const,
      students: snapshot.students.students_total,
      studyGroups: snapshot.students.study_groups_total,
      employees: snapshot.employees.employees_total,
      warnings: [...studentWarnings, ...employeeWarnings],
    };
  } catch (error) {
    await finishSyncRun({
      id: run.id,
      sourceCode: "mirror",
      startedAt: run.startedAt,
      status: "failed",
      errorCode: "MIRROR_SYNC_FAILED",
      errorSummary: sanitizedError(error),
    });
    throw new SyncServiceError("Sinkronisasi database mitra lokal gagal.", run.id, sanitizedError(error));
  }
}

export async function syncGis(createdBy?: string, triggerType: "manual" | "scheduled" = "manual") {
  const run = await createSyncRun("gis", createdBy, triggerType);
  try {
    const snapshot = await fetchGisMadrasahSnapshot();
    const capturedAt = new Date().toISOString();
    const period = snapshot.academicYear
      ? `Tahun Ajaran ${snapshot.academicYear}`
      : "Snapshot GIS Madrasah Kemenag";
    const warnings = [
      "Sumber publik resmi GIS Madrasah Kemenag; hanya agregat yang disimpan.",
      ...snapshot.warnings,
    ];
    await insertInstitutionSnapshot({
      id: crypto.randomUUID(),
      syncRunId: run.id,
      period,
      name: snapshot.institution.name,
      nsm: snapshot.institution.nsm,
      npsn: snapshot.institution.npsn,
      status: snapshot.institution.status,
      accreditation: snapshot.institution.accreditation,
      registeredStatus: null,
      sourceUpdatedAt: snapshot.sourceUpdatedAt,
      capturedAt,
    });
    await insertStudentSnapshot({
      id: crypto.randomUUID(),
      syncRunId: run.id,
      period,
      schoolYear: snapshot.academicYear ?? "Belum dipetakan",
      semester: "Belum dipetakan",
      studentsTotal: snapshot.students.total,
      grade10: null,
      grade11: null,
      grade12: null,
      male: snapshot.students.male,
      female: snapshot.students.female,
      studyGroupsTotal: snapshot.students.studyGroups,
      studyGroups10: null,
      studyGroups11: null,
      studyGroups12: null,
      coverage: 90,
      qualityScore: snapshot.warnings.length ? 85 : 95,
      warningsJson: JSON.stringify(warnings),
      capturedAt,
    });
    await insertEmployeeSnapshot({
      id: crypto.randomUUID(),
      syncRunId: run.id,
      period,
      employeesTotal: snapshot.employees.total,
      teachersTotal: snapshot.employees.teachers,
      staffTotal: snapshot.employees.educationStaff,
      pnsTotal: null,
      pppkTotal: null,
      nonAsnTotal: null,
      educationS3: null,
      educationS2: null,
      educationS1d4: null,
      educationDiploma: null,
      educationSecondary: null,
      educationUnknown: null,
      certifiedTotal: null,
      uncertifiedTotal: null,
      certificationUnknown: null,
      upstreamTotal: snapshot.employees.total,
      recordsReceived: snapshot.employees.total ?? 0,
      filteredTotal: snapshot.employees.total,
      pageCount: 1,
      coverage: 100,
      qualityScore: 95,
      warningsJson: JSON.stringify(warnings),
      capturedAt,
    });
    const complete = snapshot.students.total != null
      && snapshot.students.studyGroups != null
      && snapshot.employees.total != null;
    const status = complete ? "success" as const : "partial" as const;
    await finishSyncRun({
      id: run.id,
      sourceCode: "gis",
      startedAt: run.startedAt,
      status,
      recordsReceived: (snapshot.students.total ?? 0) + (snapshot.employees.total ?? 0),
      recordsMatched: (snapshot.students.total ?? 0) + (snapshot.employees.total ?? 0),
      pageCount: 1,
      errorCode: complete ? undefined : "GIS_AGGREGATE_INCOMPLETE",
      errorSummary: complete ? undefined : warnings.join(" "),
    });
    return {
      runId: run.id,
      status,
      students: snapshot.students.total,
      studyGroups: snapshot.students.studyGroups,
      employees: snapshot.employees.total,
      warnings,
    };
  } catch (error) {
    await finishSyncRun({
      id: run.id,
      sourceCode: "gis",
      startedAt: run.startedAt,
      status: "failed",
      errorCode: "GIS_SYNC_FAILED",
      errorSummary: sanitizedError(error),
    });
    throw new SyncServiceError("Sinkronisasi GIS Madrasah gagal.", run.id, sanitizedError(error));
  }
}

export async function syncWebsite(createdBy?: string, triggerType: "manual" | "scheduled" = "manual") {
  const run = await createSyncRun("website", createdBy, triggerType);
  try {
    const snapshot = await fetchWebsiteSummary();
    const capturedAt = new Date().toISOString();
    await insertInstitutionSnapshot({
      id: crypto.randomUUID(),
      syncRunId: run.id,
      period: snapshot.period,
      name: snapshot.institution.name,
      nsm: snapshot.institution.nsm,
      npsn: snapshot.institution.npsn,
      status: snapshot.institution.status,
      accreditation: snapshot.institution.accreditation,
      registeredStatus: null,
      sourceUpdatedAt: snapshot.sourceUpdatedAt,
      capturedAt,
    });
    if (snapshot.students) {
      await insertStudentSnapshot({
        id: crypto.randomUUID(),
        syncRunId: run.id,
        period: snapshot.period,
        schoolYear: snapshot.schoolYear,
        semester: snapshot.semester,
        studentsTotal: snapshot.students.total,
        grade10: snapshot.students.grade10,
        grade11: snapshot.students.grade11,
        grade12: snapshot.students.grade12,
        male: snapshot.students.male,
        female: snapshot.students.female,
        studyGroupsTotal: snapshot.students.studyGroups,
        studyGroups10: null,
        studyGroups11: null,
        studyGroups12: null,
        coverage: 90,
        qualityScore: snapshot.warnings.length ? 80 : 95,
        warningsJson: JSON.stringify(snapshot.warnings),
        capturedAt,
      });
    }
    if (snapshot.employees) {
      await insertEmployeeSnapshot({
        id: crypto.randomUUID(),
        syncRunId: run.id,
        period: snapshot.period,
        employeesTotal: snapshot.employees.total,
        teachersTotal: snapshot.employees.teachers,
        staffTotal: snapshot.employees.educationStaff,
        pnsTotal: snapshot.employees.pns,
        pppkTotal: snapshot.employees.pppk,
        nonAsnTotal: snapshot.employees.nonAsn,
        educationS3: null,
        educationS2: null,
        educationS1d4: null,
        educationDiploma: null,
        educationSecondary: null,
        educationUnknown: null,
        certifiedTotal: null,
        uncertifiedTotal: null,
        certificationUnknown: null,
        upstreamTotal: snapshot.employees.total,
        recordsReceived: snapshot.employees.total ?? 0,
        filteredTotal: snapshot.employees.total,
        pageCount: 1,
        coverage: 90,
        qualityScore: snapshot.warnings.length ? 80 : 95,
        warningsJson: JSON.stringify(snapshot.warnings),
        capturedAt,
      });
    }
    const aggregateCount = (snapshot.students?.total ?? 0) + (snapshot.employees?.total ?? 0);
    const status = snapshot.students || snapshot.employees ? "success" as const : "partial" as const;
    await finishSyncRun({
      id: run.id,
      sourceCode: "website",
      startedAt: run.startedAt,
      status,
      recordsReceived: aggregateCount || 1,
      recordsMatched: aggregateCount || 1,
      pageCount: 1,
      errorCode: status === "partial" ? "WEBSITE_AGGREGATE_EMPTY" : undefined,
      errorSummary: status === "partial" ? "Identitas tersedia, tetapi agregat dashboard belum diisi." : undefined,
    });
    return {
      runId: run.id,
      status,
      students: snapshot.students?.total ?? null,
      employees: snapshot.employees?.total ?? null,
      warnings: snapshot.warnings,
    };
  } catch (error) {
    await finishSyncRun({
      id: run.id,
      sourceCode: "website",
      startedAt: run.startedAt,
      status: "failed",
      errorCode: "WEBSITE_SYNC_FAILED",
      errorSummary: sanitizedError(error),
    });
    throw new SyncServiceError("Sinkronisasi API website MAN 1 gagal.", run.id, sanitizedError(error));
  }
}

export class SyncServiceError extends Error {
  constructor(message: string, readonly runId: string, readonly summary: string) {
    super(message);
    this.name = "SyncServiceError";
  }
}
