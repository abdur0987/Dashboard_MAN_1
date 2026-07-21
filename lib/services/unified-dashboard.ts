import type {
  DashboardData,
  DashboardIntegrationState,
  DashboardRow,
  DashboardSourceState,
  DataComparisonRow,
  DataQualityAlert,
  Indicator,
} from "@/lib/types";
import type { getIntegrationReadState } from "@/lib/repositories/integration-repository";

type IntegrationReadState = Awaited<ReturnType<typeof getIntegrationReadState>>;

export function buildUnifiedDashboardData(data: DashboardData, state: IntegrationReadState): DashboardData {
  const students = enrichStudentSnapshot(
    state.students,
    state.sourceSnapshots.mirror.students,
  );
  const employees = state.employees;
  const effectiveState = { ...state, students };
  const indicators = patchIndicators(
    data.indicators,
    students,
    employees,
    state.studentSourceCode,
    state.employeeSourceCode,
  );
  const rows = patchRows(
    data.rows,
    students,
    employees,
    state.studentSourceCode,
    state.employeeSourceCode,
  );
  const integration = buildIntegrationState(effectiveState);

  return {
    ...data,
    indicators,
    rows,
    chartSeries: data.chartSeries.map((point) => ({
      ...point,
      EMIS: students?.studentsTotal ?? numberIndicator(indicators, "Peserta Didik"),
      SIMPEG: employees?.filteredTotal ?? numberIndicator(indicators, "Profil teridentifikasi"),
    })),
    integration,
  };
}

function enrichStudentSnapshot(
  primary: IntegrationReadState["students"],
  mirror: IntegrationReadState["students"],
) {
  if (!primary) return mirror;
  if (!mirror) return primary;
  return {
    ...primary,
    grade10: primary.grade10 ?? mirror.grade10,
    grade11: primary.grade11 ?? mirror.grade11,
    grade12: primary.grade12 ?? mirror.grade12,
    warningsJson: JSON.stringify(uniqueStrings([
      ...parseWarnings(primary.warningsJson),
      ...parseWarnings(mirror.warningsJson),
    ])),
  };
}

function patchIndicators(
  indicators: Indicator[],
  students: IntegrationReadState["students"],
  employees: IntegrationReadState["employees"],
  studentSourceCode: IntegrationReadState["studentSourceCode"],
  employeeSourceCode: IntegrationReadState["employeeSourceCode"],
) {
  const studentSource = snapshotSourceLabel("students", studentSourceCode, students?.period);
  const employeeSource = snapshotSourceLabel("employees", employeeSourceCode, employees?.period);
  const mirrorEmployees = employeeSourceCode === "mirror";
  return indicators.map((indicator) => {
    if (indicator.name === "Peserta Didik" && students?.studentsTotal != null) {
      return {
        ...indicator,
        value: students.studentsTotal,
        description: `Peserta didik terisi pada periode ${students.period}.`,
        source: studentSource,
        status: "aktif" as const,
      };
    }
    if (indicator.name === "Rombongan Belajar" && students?.studyGroupsTotal != null) {
      return {
        ...indicator,
        value: students.studyGroupsTotal,
        description: `Total rombongan belajar pada periode ${students.period}.`,
        source: studentSource,
        status: "aktif" as const,
      };
    }
    if (["Guru dan Tenaga Kependidikan", "Profil teridentifikasi"].includes(indicator.name) && employees?.filteredTotal != null) {
      return {
        ...indicator,
        name: mirrorEmployees ? "Guru dan Tenaga Kependidikan" : "Profil teridentifikasi",
        value: mirrorEmployees ? employees.employeesTotal ?? employees.filteredTotal : employees.filteredTotal,
        description: mirrorEmployees
          ? `${employees.employeesTotal ?? employees.filteredTotal} profil GTK dihitung dari view agregat database lokal berdasarkan NSM.`
          : `${employees.filteredTotal} profil cocok pada ${employees.recordsReceived} record yang berhasil diterima; bukan total GTK madrasah.`,
        source: employeeSource,
        status: mirrorEmployees ? "aktif" as const : "perlu-validasi" as const,
      };
    }
    if (["Aparatur Sipil Negara", "Profil ASN teridentifikasi"].includes(indicator.name) && employees?.filteredTotal != null) {
      return {
        ...indicator,
        name: mirrorEmployees ? "ASN" : "Profil ASN teridentifikasi",
        value: mirrorEmployees
          ? (employees.pnsTotal ?? 0) + (employees.pppkTotal ?? 0)
          : employees.filteredTotal,
        description: mirrorEmployees
          ? "Jumlah PNS dan PPPK pada view agregat database lokal."
          : "Profil ASN yang teridentifikasi pada snapshot parsial; bukan total ASN.",
        source: employeeSource,
        status: mirrorEmployees ? "aktif" as const : "perlu-validasi" as const,
      };
    }
    if (["ASN Tersertifikasi", "Sertifikasi ASN"].includes(indicator.name)) {
      return {
        ...indicator,
        name: "Sertifikasi ASN",
        value: mirrorEmployees ? employees?.certifiedTotal ?? 0 : indicator.value,
        description: mirrorEmployees
          ? "Profil GTK dengan status sertifikasi pada view agregat database lokal."
          : "Data sertifikasi belum tersedia dari endpoint resmi.",
        source: mirrorEmployees ? employeeSource : "SIMPEG • data belum tersedia",
        status: mirrorEmployees ? "aktif" as const : "perlu-validasi" as const,
      };
    }
    return indicator;
  });
}

function patchRows(
  rows: DashboardRow[],
  students: IntegrationReadState["students"],
  employees: IntegrationReadState["employees"],
  studentSourceCode: IntegrationReadState["studentSourceCode"],
  employeeSourceCode: IntegrationReadState["employeeSourceCode"],
) {
  const studentSource = snapshotSourceLabel("students", studentSourceCode, students?.period);
  const employeeSource = snapshotSourceLabel("employees", employeeSourceCode, employees?.period);
  const emisValues = new Map<string, number | null>([
    ["Peserta Didik Kelas X", students?.grade10 ?? null],
    ["Peserta Didik Kelas XI", students?.grade11 ?? null],
    ["Peserta Didik Kelas XII", students?.grade12 ?? null],
    ["Siswa Laki-laki", students?.male ?? null],
    ["Siswa Perempuan", students?.female ?? null],
  ]);
  const simpegValues = new Map<string, number | null>([
    ["PNS", employees?.pnsTotal ?? null],
    ["PPPK", employees?.pppkTotal ?? null],
    ["Non-ASN", employees?.nonAsnTotal ?? null],
    ["Pendidikan S2", employees?.educationS2 ?? null],
    ["Pendidikan S1 / D4", employees?.educationS1d4 ?? null],
    ["Pendidikan Diploma", employees?.educationDiploma ?? null],
  ]);

  const patched = rows.flatMap((row) => {
    if (emisValues.has(row.indicator)) {
      const value = emisValues.get(row.indicator);
      if (value == null) return [];
      return [{ ...row, value, period: students?.period ?? row.period, source: studentSource }];
    }
    if (simpegValues.has(row.indicator)) {
      const value = simpegValues.get(row.indicator);
      if (value == null) return [];
      return [{
        ...row,
        value,
        period: employees?.period ?? row.period,
        source: employeeSource,
      }];
    }
    return [row];
  });

  const studentRows: DashboardRow[] = [
    {
      id: 10_001,
      indicator: "Siswa Laki-laki",
      category: "EMIS",
      region: "MAN 1 Lampung Selatan",
      period: students?.period ?? "Snapshot terbaru",
      year: new Date().getFullYear(),
      value: students?.male ?? 0,
      unit: "siswa",
      source: studentSource,
    },
    {
      id: 10_002,
      indicator: "Siswa Perempuan",
      category: "EMIS",
      region: "MAN 1 Lampung Selatan",
      period: students?.period ?? "Snapshot terbaru",
      year: new Date().getFullYear(),
      value: students?.female ?? 0,
      unit: "siswa",
      source: studentSource,
    },
  ];
  for (const row of studentRows) {
    if (row.value > 0 && !patched.some((item) => item.indicator === row.indicator)) {
      patched.push(row);
    }
  }
  return patched;
}

function buildIntegrationState(state: IntegrationReadState): DashboardIntegrationState {
  const institution = state.institution;
  const students = state.students;
  const employees = state.employees;
  const sourceByCode = new Map(state.sources.map((source) => [source.code, source]));
  const emisWarnings = parseWarnings(students?.warningsJson);
  const simpegWarnings = parseWarnings(employees?.warningsJson);
  const operationalSources: DashboardSourceState[] = [
    operationalSourceState("database", "mirror", state, sourceByCode.get("mirror")),
    operationalSourceState("gis", "gis", state, sourceByCode.get("gis")),
    operationalSourceState("website", "website", state, sourceByCode.get("website")),
  ];
  const comparisons = buildComparisonRows(operationalSources);
  const alerts = buildAlerts(operationalSources, comparisons);
  const gisEmployeeSnapshot = state.sourceSnapshots.gis.employees;
  const mirrorStudentSnapshot = state.sourceSnapshots.mirror.students;
  const usesMirrorGrades = state.studentSourceCode === "gis"
    && state.students != null
    && mirrorStudentSnapshot != null
    && state.students.grade10 != null
    && state.students.grade11 != null
    && state.students.grade12 != null;
  const employeeUsesGisSplit = state.employeeSourceCode === "mirror"
    && gisEmployeeSnapshot?.teachersTotal != null
    && gisEmployeeSnapshot.staffTotal != null;

  return {
    generatedAt: new Date().toISOString(),
    profile: {
      name: institution?.name ?? "MAN 1 Lampung Selatan",
      nsm: institution?.nsm ?? "131118010001",
      npsn: institution?.npsn ?? "10816233",
      status: institution?.status ?? "Negeri",
      accreditation: institution?.accreditation ?? "B",
    },
    sources: operationalSources,
    comparisons,
    alerts,
    recentRuns: state.recentRuns
      .filter((run) => ["emis", "simpeg", "mirror", "gis", "website"].includes(run.sourceCode))
      .map((run) => ({
        id: run.id,
        sourceCode: run.sourceCode as DashboardIntegrationState["recentRuns"][number]["sourceCode"],
        triggerType: run.triggerType,
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
        status: run.status,
        recordsReceived: run.recordsReceived,
        recordsMatched: run.recordsMatched,
        errorSummary: run.errorSummary,
      })),
    emis: students ? {
      sourceCode: state.studentSourceCode === "simpeg" ? null : state.studentSourceCode,
      sourceName: usesMirrorGrades
        ? "GIS Madrasah Kemenag + Data Lampung"
        : sourceName(state.studentSourceCode),
      period: students.period,
      schoolYear: students.schoolYear,
      semester: students.semester,
      students: {
        total: students.studentsTotal,
        grade10: students.grade10,
        grade11: students.grade11,
        grade12: students.grade12,
        male: students.male,
        female: students.female,
      },
      studyGroups: { total: students.studyGroupsTotal },
      warnings: emisWarnings,
    } : null,
    simpeg: employees ? {
      sourceCode: state.employeeSourceCode === "emis" ? null : state.employeeSourceCode,
      sourceName: employeeUsesGisSplit
        ? "Database lokal + GIS Madrasah Kemenag"
        : sourceName(state.employeeSourceCode),
      complete: ["mirror", "gis", "website"].includes(state.employeeSourceCode ?? "")
        && employees.employeesTotal != null,
      period: employees.period,
      identifiedProfiles: employees.filteredTotal,
      employeesTotal: employees.employeesTotal,
      teachersTotal: employeeUsesGisSplit
        ? gisEmployeeSnapshot.teachersTotal
        : employees.teachersTotal,
      staffTotal: employeeUsesGisSplit
        ? gisEmployeeSnapshot.staffTotal
        : employees.staffTotal,
      upstreamTotal: employees.upstreamTotal,
      recordsReceived: employees.recordsReceived,
      pageCount: employees.pageCount,
      coverage: employees.coverage,
      certificationAvailable: employees.certifiedTotal != null,
      warnings: simpegWarnings,
    } : null,
  };
}

function operationalSourceState(
  code: DashboardSourceState["code"],
  internalCode: "mirror" | "gis" | "website",
  state: IntegrationReadState,
  source: IntegrationReadState["sources"][number] | undefined,
): DashboardSourceState {
  const bundle = state.sourceSnapshots[internalCode];
  const lastUpdated = newestDate([
    bundle.institution?.capturedAt,
    bundle.students?.capturedAt,
    bundle.employees?.capturedAt,
  ]);
  const period = bundle.students?.period
    ?? bundle.employees?.period
    ?? bundle.institution?.period
    ?? null;
  const warnings = uniqueStrings([
    ...parseWarnings(bundle.students?.warningsJson),
    ...parseWarnings(bundle.employees?.warningsJson),
  ]);
  const status = !source
    || !source.enabled
    || source.baseUrlMasked === "not-configured"
    || source.lastStatus === "not_configured"
    ? (lastUpdated ? "fallback" : "not_configured")
    : source.lastStatus === "syncing"
      ? "syncing"
      : source.lastStatus === "failed"
        ? "failed"
        : source.lastStatus === "partial"
          ? "fallback"
          : isStale(lastUpdated, source.freshnessThresholdMinutes)
            ? "stale"
            : "fresh";
  return {
    code,
    name: source?.name ?? code.toUpperCase(),
    status,
    enabled: source?.enabled ?? false,
    syncFrequency: source?.syncFrequency ?? "Belum dikonfigurasi",
    lastUpdated,
    sourceUpdatedAt: bundle.institution?.sourceUpdatedAt ?? null,
    period,
    recordCount: bundle.students?.studentsTotal ?? bundle.employees?.employeesTotal ?? null,
    coverage: bundle.students?.coverage ?? bundle.employees?.coverage ?? null,
    warnings,
    metrics: {
      nsm: bundle.institution?.nsm ?? null,
      npsn: bundle.institution?.npsn ?? null,
      accreditation: bundle.institution?.accreditation ?? null,
      studentsTotal: bundle.students?.studentsTotal ?? null,
      male: bundle.students?.male ?? null,
      female: bundle.students?.female ?? null,
      studyGroups: bundle.students?.studyGroupsTotal ?? null,
      employeesTotal: bundle.employees?.employeesTotal ?? null,
      teachersTotal: bundle.employees?.teachersTotal ?? null,
      staffTotal: bundle.employees?.staffTotal ?? null,
    },
  };
}

function buildComparisonRows(sources: DashboardSourceState[]): DataComparisonRow[] {
  const sourceByCode = new Map(sources.map((source) => [source.code, source]));
  const metrics: {
    key: keyof DashboardSourceState["metrics"];
    label: string;
    unit: string;
  }[] = [
    { key: "nsm", label: "NSM", unit: "" },
    { key: "npsn", label: "NPSN", unit: "" },
    { key: "accreditation", label: "Akreditasi", unit: "" },
    { key: "studentsTotal", label: "Total siswa", unit: "siswa" },
    { key: "male", label: "Siswa laki-laki", unit: "siswa" },
    { key: "female", label: "Siswa perempuan", unit: "siswa" },
    { key: "studyGroups", label: "Rombongan belajar", unit: "rombel" },
    { key: "employeesTotal", label: "Total GTK", unit: "orang" },
    { key: "teachersTotal", label: "Guru", unit: "orang" },
    { key: "staffTotal", label: "Tenaga kependidikan", unit: "orang" },
  ];
  return metrics.map((metric) => {
    const values = {
      database: sourceByCode.get("database")?.metrics[metric.key] ?? null,
      gis: sourceByCode.get("gis")?.metrics[metric.key] ?? null,
      website: sourceByCode.get("website")?.metrics[metric.key] ?? null,
    };
    const comparable = Object.values(values)
      .filter((value): value is string | number => value != null)
      .map(normalizedComparisonValue);
    const status = comparable.length < 2
      ? "insufficient"
      : comparable.every((value) => value === comparable[0])
        ? "match"
        : "mismatch";
    return { key: metric.key, label: metric.label, unit: metric.unit, values, status };
  });
}

function buildAlerts(
  sources: DashboardSourceState[],
  comparisons: DataComparisonRow[],
): DataQualityAlert[] {
  const alerts: DataQualityAlert[] = comparisons
    .filter((row) => row.status === "mismatch")
    .map((row) => ({
      id: `mismatch-${row.key}`,
      severity: ["nsm", "npsn"].includes(row.key) ? "critical" as const : "warning" as const,
      title: `${row.label} tidak sama`,
      message: ["teachersTotal", "staffTotal"].includes(row.key)
        ? `${comparisonValues(row)}. Total GTK dapat tetap sama, tetapi klasifikasi guru dan tenaga kependidikan perlu ditinjau admin.`
        : `${comparisonValues(row)}. Periksa periode dan waktu pembaruan masing-masing sumber sebelum memilih angka publik.`,
      metricKey: row.key,
    }));
  for (const source of sources) {
    if (source.status === "failed" || source.status === "stale") {
      alerts.push({
        id: `source-${source.code}-${source.status}`,
        severity: "warning",
        title: `${source.name} ${source.status === "failed" ? "gagal sinkron" : "perlu diperbarui"}`,
        message: `Jadwal sumber: ${source.syncFrequency}. Snapshot terakhir tetap dipertahankan sampai sinkronisasi berikutnya berhasil.`,
      });
    }
  }
  const website = sources.find((source) => source.code === "website");
  if (!website?.enabled || website.status === "not_configured") {
    alerts.push({
      id: "website-not-configured",
      severity: "info",
      title: "API Website MAN 1 belum aktif",
      message: "Wadah integrasi sudah tersedia. Aktifkan setelah endpoint JSON dashboard dan API key disiapkan oleh pengelola man1lamsel.sch.id.",
    });
  }
  return alerts;
}

function comparisonValues(row: DataComparisonRow) {
  const labels = { database: "Database lokal", gis: "GIS Kemenag", website: "Website MAN 1" };
  return (Object.entries(row.values) as [keyof typeof labels, string | number | null][])
    .filter(([, value]) => value != null)
    .map(([code, value]) => `${labels[code]}: ${value}${row.unit ? ` ${row.unit}` : ""}`)
    .join("; ");
}

function normalizedComparisonValue(value: string | number) {
  return typeof value === "string" ? value.trim().toLowerCase() : String(value);
}

function newestDate(values: (string | null | undefined)[]) {
  return values.filter((value): value is string => Boolean(value)).sort().at(-1) ?? null;
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}

function sourceName(sourceCode: IntegrationReadState["studentSourceCode"]) {
  if (sourceCode === "mirror") return "Database lokal";
  if (sourceCode === "gis") return "GIS Madrasah Kemenag";
  if (sourceCode === "website") return "Website MAN 1";
  if (sourceCode === "simpeg") return "SIMPEG";
  return "EMIS";
}

function snapshotSourceLabel(
  domain: "students" | "employees",
  sourceCode: IntegrationReadState["studentSourceCode"],
  period?: string | null,
) {
  const suffix = period ? ` • ${period}` : "";
  if (sourceCode === "mirror") return `Database lokal${suffix}`;
  if (sourceCode === "gis") return `GIS Madrasah Kemenag${suffix}`;
  if (sourceCode === "website") return `Website MAN 1${suffix}`;
  if (domain === "students") return `EMIS snapshot${suffix}`;
  return `SIMPEG snapshot${suffix}`;
}

function isStale(value: string | null, thresholdMinutes: number) {
  if (!value) return true;
  return Date.now() - new Date(value).getTime() > thresholdMinutes * 60_000;
}

function parseWarnings(value?: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function numberIndicator(indicators: Indicator[], name: string) {
  return indicators.find((indicator) => indicator.name === name)?.value ?? 0;
}
