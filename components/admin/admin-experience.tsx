"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  ArrowLeft,
  BrainCircuit,
  Database,
  FileJson,
  FileUp,
  LayoutDashboard,
  Layers,
  LogIn,
  LogOut,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Trash2,
  Upload,
  UserPlus,
  Video,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import type {
  ActivitySlide,
  AwardCollection,
  AwardItem,
  ContactInfo,
  DataCatalog,
  DashboardData,
  DashboardRow,
  Indicator,
  IndicatorStatus,
  OfficeLocation,
  Publication,
  ReleaseSchedule,
  VideoItem,
} from "@/lib/types";

type AdminExperienceProps = {
  data: DashboardData;
};

type AdminTab =
  | "overview"
  | "indicators"
  | "datasets"
  | "catalog"
  | "geotagging"
  | "content"
  | "contact"
  | "account"
  | "ai";

type AdminStats = {
  indicatorCount: number;
  rowCount: number;
  publicationCount: number;
  datasetCount: number;
  releaseCount: number;
  officeCount: number;
  mediaCount: number;
  latestYear: number | string;
  validationCount: number;
};

const tabs: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
  { id: "indicators", label: "Indikator", icon: Database },
  { id: "datasets", label: "Data Tabel", icon: FileJson },
  { id: "catalog", label: "Dataset & Rilis", icon: FileUp },
  { id: "geotagging", label: "Geotagging", icon: MapPin },
  { id: "content", label: "Konten", icon: Video },
  { id: "ai", label: "AI Training", icon: BrainCircuit },
  { id: "contact", label: "Kontak", icon: MapPin },
  { id: "account", label: "Akun Admin", icon: Settings },
];

const baseCategories = [
  "EMIS",
  "SIMPEG",
];

const lampungRegions = [
  "MAN 1 Bandar Lampung",
];

type ImportResponse = {
  rows: Omit<DashboardRow, "id">[];
  indicator: Omit<Indicator, "id">;
  meta?: {
    fileName?: string;
    records?: number;
  };
  error?: string;
};

export function AdminExperience({ data }: AdminExperienceProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [indicators, setIndicators] = useState<Indicator[]>(data.indicators);
  const [rows, setRows] = useState<DashboardRow[]>(data.rows);
  const [publications, setPublications] = useState<Publication[]>(data.publications);
  const [datasets, setDatasets] = useState<DataCatalog[]>(data.datasets);
  const [releaseSchedules, setReleaseSchedules] = useState<ReleaseSchedule[]>(
    data.releaseSchedules,
  );
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>(
    data.officeLocations,
  );
  const [activities, setActivities] = useState<ActivitySlide[]>(data.activities);
  const [videos, setVideos] = useState<VideoItem[]>(data.videos);
  const [awardCollections, setAwardCollections] = useState<AwardCollection[]>(
    data.awardCollections,
  );
  const [contact, setContact] = useState<ContactInfo>(data.contact);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authName, setAuthName] = useState("Admin MAN 1");
  const [authEmail, setAuthEmail] = useState("admin@man1balam.sch.id");
  const [authPassword, setAuthPassword] = useState("dashboard-man1");
  const [authMessage, setAuthMessage] = useState("");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const [isAccountSaving, setIsAccountSaving] = useState(false);
  const session = authClient.useSession();

  useEffect(() => {
    if (!session.data?.user) {
      return;
    }

    setAccountName(session.data.user.name);
    setAccountEmail(session.data.user.email);
  }, [session.data?.user]);

  const normalizedFilters = useMemo(
    () => buildDashboardFilters(data.filters, indicators, rows),
    [data.filters, indicators, rows],
  );
  const normalizedChartSeries = useMemo(
    () => buildChartSeriesFromRows(rows, normalizedFilters.categories),
    [normalizedFilters.categories, rows],
  );

  const snapshot = useMemo(
    () => ({
      indicators,
      rows,
      chartSeries: normalizedChartSeries,
      publications,
      datasets,
      releaseSchedules,
      officeLocations,
      activities,
      videos,
      executiveSchedules: data.executiveSchedules,
      awardCollections,
      contact,
      filters: normalizedFilters,
    }),
    [
      activities,
      awardCollections,
      contact,
      data.executiveSchedules,
      datasets,
      indicators,
      normalizedChartSeries,
      normalizedFilters,
      officeLocations,
      publications,
      releaseSchedules,
      rows,
      videos,
    ],
  );

  const stats = useMemo(() => {
    const latestYear = rows.length ? Math.max(...rows.map((row) => row.year)) : "-";
    const validationCount = indicators.filter(
      (indicator) => indicator.status === "perlu-validasi",
    ).length;

    return {
      indicatorCount: indicators.length,
      rowCount: rows.length,
      publicationCount: publications.length,
      datasetCount: datasets.length,
      releaseCount: releaseSchedules.length,
      officeCount: officeLocations.length,
      mediaCount: activities.length + videos.length,
      latestYear,
      validationCount,
    };
  }, [
    activities.length,
    datasets.length,
    indicators,
    officeLocations.length,
    publications.length,
    releaseSchedules.length,
    rows,
    videos.length,
  ]);

  function exportJson() {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dashboard-admin-draft.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage("");
    setIsAuthSubmitting(true);

    try {
      const result =
        authMode === "signin"
          ? await authClient.signIn.email({
              email: authEmail,
              password: authPassword,
            })
          : await authClient.signUp.email({
              name: authName,
              email: authEmail,
              password: authPassword,
            });

      if (result.error) {
        setAuthMessage(result.error.message ?? "Autentikasi gagal.");
        return;
      }

      await session.refetch();
      setAuthMessage("Berhasil masuk ke panel admin.");
    } catch {
      setAuthMessage("Autentikasi gagal. Periksa email dan password.");
    } finally {
      setIsAuthSubmitting(false);
    }
  }

  async function saveToApi() {
    setSaveMessage("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/dashboard", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(snapshot),
      });

      if (!response.ok) {
        throw new Error("save_failed");
      }

      setSaveMessage("Perubahan tersimpan melalui API dashboard ke database aktif.");
    } catch {
      setSaveMessage("Gagal menyimpan. Pastikan sesi admin masih aktif.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSignOut() {
    await authClient.signOut();
    await session.refetch();
  }

  async function saveAccountProfile() {
    if (!session.data?.user) {
      return;
    }

    setAccountMessage("");
    setIsAccountSaving(true);

    try {
      if (accountName.trim() && accountName.trim() !== session.data.user.name) {
        await postAuthAction("/api/auth/update-user", {
          name: accountName.trim(),
        });
      }

      if (
        accountEmail.trim() &&
        accountEmail.trim().toLowerCase() !== session.data.user.email.toLowerCase()
      ) {
        await postAuthAction("/api/auth/change-email", {
          newEmail: accountEmail.trim().toLowerCase(),
        });
      }

      await session.refetch();
      setAccountMessage("Profil admin berhasil diperbarui.");
    } catch (error) {
      setAccountMessage(getErrorMessage(error, "Gagal memperbarui profil admin."));
    } finally {
      setIsAccountSaving(false);
    }
  }

  async function saveAccountPassword() {
    setAccountMessage("");

    if (!currentPassword || !newPassword) {
      setAccountMessage("Password lama dan password baru wajib diisi.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setAccountMessage("Konfirmasi password baru belum sama.");
      return;
    }

    setIsAccountSaving(true);

    try {
      await postAuthAction("/api/auth/change-password", {
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await session.refetch();
      setAccountMessage("Password admin berhasil diperbarui.");
    } catch (error) {
      setAccountMessage(getErrorMessage(error, "Gagal memperbarui password admin."));
    } finally {
      setIsAccountSaving(false);
    }
  }

  function addIndicator() {
    const nextId = nextNumericId(indicators);
    setIndicators((current) => [
      ...current,
      {
        id: nextId,
        name: "Indikator Baru",
        description: "Deskripsi singkat indikator.",
        category: "EMIS",
        unit: "persen",
        source: "Sumber Data",
        year: 2025,
        value: 0,
        trend: 0,
        status: "perlu-validasi",
      },
    ]);
  }

  function addRow() {
    const nextId = nextNumericId(rows);
    setRows((current) => [
      ...current,
      {
        id: nextId,
        indicator: "Data Baru",
        category: "EMIS",
        region: "MAN 1 Bandar Lampung",
        period: "Tahunan",
        year: 2026,
        value: 0,
        unit: "persen",
        source: "Sumber Data",
      },
    ]);
  }

  function handleImportedDataset(
    importedRows: Omit<DashboardRow, "id">[],
    importedIndicator: Omit<Indicator, "id">,
  ) {
    if (!importedRows.length) {
      return;
    }

    const category = importedIndicator.category;
    const year = importedIndicator.year;

    setRows((current) => {
      const retained = current.filter(
        (row) => !(row.category === category && row.year === year),
      );
      const startId = nextNumericId(retained);

      return [
        ...retained,
        ...importedRows.map((row, index) => ({
          ...row,
          id: startId + index,
        })),
      ];
    });

    setIndicators((current) => {
      const existing = current.find((indicator) => indicator.category === category);

      if (existing) {
        return current.map((indicator) =>
          indicator.id === existing.id
            ? {
                ...indicator,
                ...importedIndicator,
              }
            : indicator,
        );
      }

      return [
        ...current,
        {
          ...importedIndicator,
          id: nextNumericId(current),
        },
      ];
    });
  }

  function addPublication() {
    const nextId = nextNumericId(publications);
    setPublications((current) => [
      ...current,
      {
        id: nextId,
        title: "Publikasi Baru",
        description: "Ringkasan dokumen publikasi.",
        date: "17 Mei 2026",
        category: "Laporan",
        fileLabel: "PDF",
      },
    ]);
  }

  function addDataset() {
    const nextId = nextNumericId(datasets);
    setDatasets((current) => [
      ...current,
      {
        id: nextId,
        title: "Dataset Baru MAN 1 Bandar Lampung",
        description: "Deskripsi ringkas dataset untuk pengguna publik.",
        category: "Tata Kelola",
        year: 2026,
        producer: "MAN 1 Bandar Lampung",
        frequency: "Tahunan",
        format: "XLSX, PDF",
        sourceUrl: "",
        excelUrl: "",
        pdfUrl: "",
        standardData:
          "Deskripsi standar data: kolom wilayah, indikator, nilai, satuan, dan tahun.",
        metadata:
          "Sumber: MAN 1 Bandar Lampung\nVersi: 1\nFrekuensi: Tahunan\nDapat Diakses Publik: Ya",
      },
    ]);
  }

  function addReleaseSchedule() {
    const nextId = nextNumericId(releaseSchedules);
    setReleaseSchedules((current) => [
      ...current,
      {
        id: nextId,
        title: "Jadwal Rilis Publikasi Baru",
        period: "2026",
        language: "Indonesia",
        scheduledDate: "01-03-2026",
        realizedDate: "-",
        status: "rencana",
        documentUrl: "",
        format: "PDF",
      },
    ]);
  }

  function addOfficeLocation() {
    const nextId = nextNumericId(officeLocations);
    setOfficeLocations((current) => [
      ...current,
      {
        id: nextId,
        name: "Kantor Kementerian Agama",
        type: "kabupaten-kota",
        address: "Alamat kantor",
        phone: "-",
        latitude: -5.39714,
        longitude: 105.26679,
        mapsUrl: "",
      },
    ]);
  }

  function addActivity() {
    const nextId = nextNumericId(activities);
    setActivities((current) => [
      ...current,
      {
        id: nextId,
        title: "Kegiatan Baru",
        caption: "Keterangan singkat kegiatan.",
        imageUrl:
          "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80",
      },
    ]);
  }

  function addAwardCollection() {
    setAwardCollections((current) => [
      ...current,
      {
        id: `koleksi-${current.length + 1}-${Date.now()}`,
        title: "Koleksi Penghargaan Baru",
        description: "Deskripsi singkat koleksi penghargaan.",
        items: [],
      },
    ]);
  }

  function addAwardItem(collectionId: string) {
    setAwardCollections((current) =>
      current.map((collection) => {
        if (collection.id !== collectionId) return collection;

        const nextId = nextNumericId(collection.items);

        return {
          ...collection,
          items: [
            ...collection.items,
            {
              id: nextId,
              title: "Penghargaan Baru",
              description: "Deskripsi singkat penghargaan.",
              year: new Date().getFullYear(),
              imageUrl: "",
              alt: "Foto prestasi MAN 1 Bandar Lampung",
            },
          ],
        };
      }),
    );
  }

  function updateAwardCollection(id: string, patch: Partial<AwardCollection>) {
    setAwardCollections((current) =>
      current.map((collection) =>
        collection.id === id ? { ...collection, ...patch } : collection,
      ),
    );
  }

  function updateAwardItem(
    collectionId: string,
    itemId: number,
    patch: Partial<AwardItem>,
  ) {
    setAwardCollections((current) =>
      current.map((collection) =>
        collection.id === collectionId
          ? {
              ...collection,
              items: collection.items.map((item) =>
                item.id === itemId ? { ...item, ...patch } : item,
              ),
            }
          : collection,
      ),
    );
  }

  function deleteAwardCollection(id: string) {
    setAwardCollections((current) =>
      current.filter((collection) => collection.id !== id),
    );
  }

  function deleteAwardItem(collectionId: string, itemId: number) {
    setAwardCollections((current) =>
      current.map((collection) =>
        collection.id === collectionId
          ? {
              ...collection,
              items: collection.items.filter((item) => item.id !== itemId),
            }
          : collection,
      ),
    );
  }

  if (session.isPending) {
    return (
      <main className="grid min-h-screen place-items-center text-slate-950">
        <div className="glass-panel-strong rounded-lg p-6 text-center">
          <RefreshCw className="mx-auto h-6 w-6 animate-spin text-primary" />
          <p className="mt-3 text-sm font-semibold">Memeriksa sesi admin...</p>
        </div>
      </main>
    );
  }

  if (!session.data) {
    return (
      <AuthScreen
        mode={authMode}
        name={authName}
        email={authEmail}
        password={authPassword}
        message={authMessage}
        isSubmitting={isAuthSubmitting}
        onModeChange={setAuthMode}
        onNameChange={setAuthName}
        onEmailChange={setAuthEmail}
        onPasswordChange={setAuthPassword}
        onSubmit={handleAuthSubmit}
      />
    );
  }

  return (
    <main className="min-h-screen text-slate-950">
      <header className="border-b border-white/60 bg-white/65 shadow-sm backdrop-blur-2xl">
        <div className="container flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge variant="outline" className="mb-2 w-fit">
              Panel Admin
            </Badge>
            <h1 className="text-2xl font-bold md:text-3xl">
              Manajemen Dashboard Digital
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola draft indikator, data tabel, publikasi, media, dan kontak sebelum
              disambungkan ke API produksi.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Dashboard Publik
              </Link>
            </Button>
            <Button onClick={exportJson}>
              <Save className="h-4 w-4" />
              Ekspor Draft
            </Button>
            <Button onClick={saveToApi} disabled={isSaving}>
              {isSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              Simpan ke API
            </Button>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="h-4 w-4" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      <div className="section-shell">
        {saveMessage ? (
          <div className="mb-4 rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-sm font-medium text-emerald-900 shadow-sm backdrop-blur-xl">
            {saveMessage}
          </div>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <aside className="glass-panel-strong h-fit rounded-lg p-3">
            <nav className="grid gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition ${
                      activeTab === tab.id
                        ? "bg-primary/90 text-white shadow-sm"
                        : "text-slate-700 hover:bg-white/60"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
            <div className="mt-4 rounded-md border border-amber-200/80 bg-amber-50/75 p-3 text-xs leading-5 text-amber-900">
              Perubahan diedit di browser, lalu disimpan permanen melalui API dashboard
              ke Turso atau SQLite lokal. Ekspor JSON tetap tersedia untuk backup draft.
            </div>
          </aside>

          <section className="space-y-4">
            {activeTab === "overview" ? (
              <OverviewPanel stats={stats} />
            ) : null}

            {activeTab === "indicators" ? (
              <IndicatorsPanel
                indicators={indicators}
                categories={normalizedFilters.categories}
                onAdd={addIndicator}
                onDelete={(id) =>
                  setIndicators((current) => current.filter((item) => item.id !== id))
                }
                onUpdate={(id, patch) =>
                  setIndicators((current) =>
                    current.map((item) =>
                      item.id === id ? { ...item, ...patch } : item,
                    ),
                  )
                }
              />
            ) : null}

            {activeTab === "datasets" ? (
              <RowsPanel
                rows={rows}
                categories={normalizedFilters.categories}
                regions={normalizedFilters.regions}
                onAdd={addRow}
                onDelete={(id) =>
                  setRows((current) => current.filter((item) => item.id !== id))
                }
                onUpdate={(id, patch) =>
                  setRows((current) =>
                    current.map((item) =>
                      item.id === id ? { ...item, ...patch } : item,
                    ),
                  )
                }
                onImport={handleImportedDataset}
              />
            ) : null}

            {activeTab === "catalog" ? (
              <CatalogPanel
                datasets={datasets}
                releaseSchedules={releaseSchedules}
                onAddDataset={addDataset}
                onAddReleaseSchedule={addReleaseSchedule}
                onDeleteDataset={(id) =>
                  setDatasets((current) => current.filter((item) => item.id !== id))
                }
                onDeleteReleaseSchedule={(id) =>
                  setReleaseSchedules((current) =>
                    current.filter((item) => item.id !== id),
                  )
                }
                onUpdateDataset={(id, patch) =>
                  setDatasets((current) =>
                    current.map((item) =>
                      item.id === id ? { ...item, ...patch } : item,
                    ),
                  )
                }
                onUpdateReleaseSchedule={(id, patch) =>
                  setReleaseSchedules((current) =>
                    current.map((item) =>
                      item.id === id ? { ...item, ...patch } : item,
                    ),
                  )
                }
              />
            ) : null}

            {activeTab === "geotagging" ? (
              <GeotaggingAdminPanel
                offices={officeLocations}
                onAdd={addOfficeLocation}
                onDelete={(id) =>
                  setOfficeLocations((current) =>
                    current.filter((item) => item.id !== id),
                  )
                }
                onUpdate={(id, patch) =>
                  setOfficeLocations((current) =>
                    current.map((item) =>
                      item.id === id ? { ...item, ...patch } : item,
                    ),
                  )
                }
              />
            ) : null}

            {activeTab === "content" ? (
              <ContentPanel
                publications={publications}
                activities={activities}
                videos={videos}
                awardCollections={awardCollections}
                onAddPublication={addPublication}
                onAddActivity={addActivity}
                onAddAwardCollection={addAwardCollection}
                onAddAwardItem={addAwardItem}
                onDeletePublication={(id) =>
                  setPublications((current) =>
                    current.filter((item) => item.id !== id),
                  )
                }
                onDeleteActivity={(id) =>
                  setActivities((current) => current.filter((item) => item.id !== id))
                }
                onDeleteAwardCollection={deleteAwardCollection}
                onDeleteAwardItem={deleteAwardItem}
                onUpdatePublication={(id, patch) =>
                  setPublications((current) =>
                    current.map((item) =>
                      item.id === id ? { ...item, ...patch } : item,
                    ),
                  )
                }
                onUpdateActivity={(id, patch) =>
                  setActivities((current) =>
                    current.map((item) =>
                      item.id === id ? { ...item, ...patch } : item,
                    ),
                  )
                }
                onUpdateVideo={(id, patch) =>
                  setVideos((current) =>
                    current.map((item) =>
                      item.id === id ? { ...item, ...patch } : item,
                    ),
                  )
                }
                onUpdateAwardCollection={updateAwardCollection}
                onUpdateAwardItem={updateAwardItem}
              />
            ) : null}

            {activeTab === "contact" ? (
              <ContactPanel
                contact={contact}
                onUpdate={(patch) => setContact((current) => ({ ...current, ...patch }))}
              />
            ) : null}

            {activeTab === "account" ? (
              <AccountPanel
                name={accountName}
                email={accountEmail}
                currentPassword={currentPassword}
                newPassword={newPassword}
                confirmPassword={confirmPassword}
                message={accountMessage}
                isSaving={isAccountSaving}
                onNameChange={setAccountName}
                onEmailChange={setAccountEmail}
                onCurrentPasswordChange={setCurrentPassword}
                onNewPasswordChange={setNewPassword}
                onConfirmPasswordChange={setConfirmPassword}
                onSaveProfile={saveAccountProfile}
                onSavePassword={saveAccountPassword}
              />
            ) : null}

            {activeTab === "ai" ? <AiTrainingPanel stats={stats} /> : null}
          </section>
        </div>
      </div>
    </main>
  );
}

function AuthScreen({
  mode,
  name,
  email,
  password,
  message,
  isSubmitting,
  onModeChange,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: {
  mode: "signin" | "signup";
  name: string;
  email: string;
  password: string;
  message: string;
  isSubmitting: boolean;
  onModeChange: (mode: "signin" | "signup") => void;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center px-4 text-slate-950">
      <section className="glass-panel-strong w-full max-w-md rounded-lg p-6 shadow-2xl">
        <Badge variant="outline" className="mb-4 w-fit">
          Admin Backend
        </Badge>
        <h1 className="text-2xl font-bold">Masuk Panel Dashboard</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Gunakan akun Better Auth untuk menyimpan perubahan dashboard ke API dan
          database Turso atau SQLite lokal.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg border border-white/70 bg-white/45 p-1 shadow-inner backdrop-blur-xl">
          <button
            type="button"
            onClick={() => onModeChange("signin")}
            className={`h-10 rounded-md text-sm font-semibold transition ${
              mode === "signin"
                ? "bg-primary text-white shadow-sm"
                : "text-slate-700 hover:bg-white/70"
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => onModeChange("signup")}
            className={`h-10 rounded-md text-sm font-semibold transition ${
              mode === "signup"
                ? "bg-primary text-white shadow-sm"
                : "text-slate-700 hover:bg-white/70"
            }`}
          >
            Buat Akun
          </button>
        </div>

        <form className="mt-5 grid gap-4" onSubmit={onSubmit}>
          {mode === "signup" ? (
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              <span>Nama</span>
              <input
                value={name}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onNameChange(event.target.value)
                }
                className="h-11 rounded-md border border-white/70 bg-white/65 px-3 text-sm text-slate-900 shadow-sm outline-none backdrop-blur-xl transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              />
            </label>
          ) : null}

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onEmailChange(event.target.value)
              }
              className="h-11 rounded-md border border-white/70 bg-white/65 px-3 text-sm text-slate-900 shadow-sm outline-none backdrop-blur-xl transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onPasswordChange(event.target.value)
              }
              className="h-11 rounded-md border border-white/70 bg-white/65 px-3 text-sm text-slate-900 shadow-sm outline-none backdrop-blur-xl transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
          </label>

          {message ? (
            <p className="rounded-md border border-amber-200/80 bg-amber-50/85 px-3 py-2 text-xs font-medium text-amber-900">
              {message}
            </p>
          ) : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : mode === "signin" ? (
              <LogIn className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {mode === "signin" ? "Masuk" : "Buat Akun"}
          </Button>
        </form>

        <Button asChild variant="outline" className="mt-3 w-full">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dashboard Publik
          </Link>
        </Button>
      </section>
    </main>
  );
}

function OverviewPanel({
  stats,
}: {
  stats: AdminStats;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetric label="Indikator" value={stats.indicatorCount} helper="kartu strategis" />
        <AdminMetric label="Baris Data" value={stats.rowCount} helper="siap difilter" />
        <AdminMetric label="Dataset" value={stats.datasetCount} helper="katalog satu data" />
        <AdminMetric label="Alamat" value={stats.officeCount} helper="titik geotagging" />
        <AdminMetric
          label="Publikasi"
          value={stats.publicationCount}
          helper="dokumen tampil"
        />
        <AdminMetric label="Jadwal Rilis" value={stats.releaseCount} helper="publikasi data" />
        <AdminMetric label="Media" value={stats.mediaCount} helper="video dan slide" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Status Pengelolaan</CardTitle>
          <CardDescription>
            Ringkasan kesiapan konten berdasarkan draft dashboard saat ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <StatusRow label="Tahun data terbaru" value={String(stats.latestYear)} />
          <StatusRow
            label="Butuh validasi"
            value={`${stats.validationCount} indikator`}
          />
          <StatusRow label="Mode simpan" value="Draft lokal + ekspor JSON" />
          <StatusRow label="Target integrasi" value="API admin atau CMS headless" />
        </CardContent>
      </Card>
    </>
  );
}

function AiTrainingPanel({ stats }: { stats: AdminStats }) {
  const [isTraining, setIsTraining] = useState(false);
  const [message, setMessage] = useState("");
  const [trainedAt, setTrainedAt] = useState("");
  const [summary, setSummary] = useState<Record<string, number> | null>(null);

  async function handleTrain() {
    setIsTraining(true);
    setMessage("");

    try {
      const response = await fetch("/api/assistant/train", {
        method: "POST",
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        trainedAt?: string;
        summary?: Record<string, number>;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Training ulang AI gagal.");
      }

      setTrainedAt(payload.trainedAt ?? new Date().toISOString());
      setSummary(payload.summary ?? null);
      setMessage("AI Kemenag sudah membaca ulang data dashboard terbaru.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Training ulang AI gagal.");
    } finally {
      setIsTraining(false);
    }
  }

  return (
    <div className="grid gap-4">
      {message ? (
        <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-sm font-medium text-emerald-900 shadow-sm backdrop-blur-xl">
          {message}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Training Ulang AI Kemenag</CardTitle>
          <CardDescription>
            Pakai tombol ini setelah admin menambah data, upload dataset, atau
            memperbarui konten agar AI membaca ulang seluruh informasi dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatusRow label="Indikator" value={`${stats.indicatorCount} data`} />
            <StatusRow label="Baris dashboard" value={`${stats.rowCount} data`} />
            <StatusRow label="Dataset" value={`${stats.datasetCount} katalog`} />
            <StatusRow label="Tahun terbaru" value={String(stats.latestYear)} />
          </div>
          <Button onClick={handleTrain} disabled={isTraining} className="h-11">
            {isTraining ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <BrainCircuit className="h-4 w-4" />
            )}
            {isTraining ? "Membaca ulang..." : "Training Ulang AI"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status Pengetahuan AI</CardTitle>
          <CardDescription>
            Ringkasan sumber data yang akan dipakai AI untuk menjawab pertanyaan
            dashboard dan membuat poin penting pimpinan.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <StatusRow
            label="Terakhir training"
            value={trainedAt ? new Date(trainedAt).toLocaleString("id-ID") : "Belum dijalankan"}
          />
          <StatusRow
            label="Dataset detail"
            value={`${summary?.datasetDetails ?? 0} tabel`}
          />
          <StatusRow label="Agenda Madrasah" value={`${summary?.schedules ?? 0} agenda`} />
          <StatusRow label="Berita terbaru" value={`${summary?.news ?? 0} berita`} />
          <StatusRow label="Penghargaan" value={`${summary?.awards ?? 0} foto`} />
          <StatusRow label="Geotagging" value={`${summary?.offices ?? 0} kantor`} />
        </CardContent>
      </Card>
    </div>
  );
}

function IndicatorsPanel({
  indicators,
  categories,
  onAdd,
  onDelete,
  onUpdate,
}: {
  indicators: Indicator[];
  categories: string[];
  onAdd: () => void;
  onDelete: (id: number) => void;
  onUpdate: (id: number, patch: Partial<Indicator>) => void;
}) {
  const categoryOptions = normalizeCategoryOptions(categories);
  const groupedIndicators = groupByCategory(indicators);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Manajemen Indikator Strategis</CardTitle>
          <CardDescription>
            Indikator dikelompokkan per kategori agar lebih mudah dipantau dan
            diperbarui.
          </CardDescription>
        </div>
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Tambah
        </Button>
      </CardHeader>
      <CardContent className="grid gap-5">
        {groupedIndicators.map(([categoryName, items]) => (
          <div
            key={categoryName}
            className="rounded-lg border border-white/70 bg-white/45 p-4 shadow-sm backdrop-blur-xl"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  {categoryName}
                </p>
                <h3 className="text-lg font-bold text-slate-950">
                  {items.length} indikator
                </h3>
              </div>
              <Badge variant="outline">{items[0]?.year ?? "-"}</Badge>
            </div>

            <div className="grid gap-3">
              {items.map((indicator) => (
                <div
                  key={indicator.id}
                  className="grid gap-3 rounded-md border border-white/70 bg-white/55 p-3 lg:grid-cols-[1.2fr_0.78fr_0.42fr_0.36fr_0.46fr_auto]"
                >
                  <InputField
                    label="Nama indikator"
                    value={indicator.name}
                    onChange={(value) => onUpdate(indicator.id, { name: value })}
                  />
                  <Select
                    label="Kategori"
                    value={indicator.category}
                    options={categoryOptions}
                    onChange={(value) => onUpdate(indicator.id, { category: value })}
                  />
                  <InputField
                    label="Nilai"
                    type="number"
                    value={indicator.value}
                    onChange={(value) =>
                      onUpdate(indicator.id, { value: Number(value) })
                    }
                  />
                  <InputField
                    label="Tahun"
                    type="number"
                    value={indicator.year}
                    onChange={(value) =>
                      onUpdate(indicator.id, { year: Number(value) })
                    }
                  />
                  <Select
                    label="Status"
                    value={indicator.status}
                    options={[
                      { label: "Aktif", value: "aktif" },
                      { label: "Perlu Validasi", value: "perlu-validasi" },
                    ]}
                    onChange={(value) =>
                      onUpdate(indicator.id, { status: value as IndicatorStatus })
                    }
                  />
                  <div className="flex items-end justify-end">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onDelete(indicator.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <TextAreaField
                    className="lg:col-span-3"
                    label="Deskripsi"
                    value={indicator.description}
                    onChange={(value) =>
                      onUpdate(indicator.id, { description: value })
                    }
                  />
                  <InputField
                    className="lg:col-span-1"
                    label="Satuan"
                    value={indicator.unit}
                    onChange={(value) => onUpdate(indicator.id, { unit: value })}
                  />
                  <InputField
                    className="lg:col-span-2"
                    label="Sumber"
                    value={indicator.source}
                    onChange={(value) => onUpdate(indicator.id, { source: value })}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RowsPanel({
  rows,
  categories,
  regions,
  onAdd,
  onDelete,
  onUpdate,
  onImport,
}: {
  rows: DashboardRow[];
  categories: string[];
  regions: string[];
  onAdd: () => void;
  onDelete: (id: number) => void;
  onUpdate: (id: number, patch: Partial<DashboardRow>) => void;
  onImport: (
    rows: Omit<DashboardRow, "id">[],
    indicator: Omit<Indicator, "id">,
  ) => void;
}) {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState("EMIS");
  const [uploadYear, setUploadYear] = useState(2026);
  const [uploadUnit, setUploadUnit] = useState("siswa");
  const [uploadIndicator, setUploadIndicator] = useState(
    "Rekap Peserta Didik",
  );
  const [uploadSource, setUploadSource] = useState("Rekap EMIS MAN 1 Bandar Lampung");
  const [uploadMessage, setUploadMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const categoryOptions = normalizeCategoryOptions(categories);
  const groupedRows = groupByCategory(rows);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadMessage("");

    if (!uploadFile) {
      setUploadMessage("Pilih file rekap terlebih dahulu.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.set("file", uploadFile);
      formData.set("category", uploadCategory);
      formData.set("year", String(uploadYear));
      formData.set("unit", uploadUnit);
      formData.set("indicator", uploadIndicator);
      formData.set("source", uploadSource);

      const response = await fetch("/api/dashboard/import", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as ImportResponse;

      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Upload gagal diproses.");
      }

      onImport(payload.rows, payload.indicator);
      setUploadMessage(
        `Berhasil membaca ${payload.meta?.records ?? payload.rows.length} baris dari ${uploadFile.name}. Klik Simpan ke API agar permanen.`,
      );
      setUploadFile(null);
    } catch (error) {
      setUploadMessage(
        error instanceof Error ? error.message : "Upload gagal diproses.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Manajemen Data Tabel</CardTitle>
          <CardDescription>
            Data dikelompokkan per kategori dan bisa diperbarui lewat upload
            DOCX, PDF, Excel, atau CSV.
          </CardDescription>
        </div>
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Tambah
        </Button>
      </CardHeader>
      <CardContent className="grid gap-5">
        <form
          onSubmit={handleUpload}
          className="rounded-lg border border-emerald-200/80 bg-emerald-50/70 p-4 shadow-sm backdrop-blur-xl"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Upload Rekap Data
              </p>
              <h3 className="text-lg font-bold text-slate-950">
                Tambahkan data kategori dari dokumen
              </h3>
            </div>
            <Badge variant="success">
              <FileUp className="mr-1 h-3.5 w-3.5" />
              DOCX/PDF/XLSX/XLS/CSV
            </Badge>
          </div>

          <div className="grid gap-3 xl:grid-cols-[0.8fr_0.52fr_0.36fr_0.36fr]">
            <Select
              label="Kategori tujuan"
              value={uploadCategory}
              options={categoryOptions}
              onChange={(value) => {
                setUploadCategory(value);
                if (value === "EMIS") {
                  setUploadUnit("siswa");
                  setUploadIndicator("Rekap Peserta Didik");
                  setUploadSource("Rekap EMIS MAN 1 Bandar Lampung");
                } else if (value === "SIMPEG") {
                  setUploadUnit("orang");
                  setUploadIndicator("Rekap Pegawai");
                  setUploadSource("Rekap SIMPEG MAN 1 Bandar Lampung");
                }
              }}
            />
            <InputField
              label="Nama indikator"
              value={uploadIndicator}
              onChange={setUploadIndicator}
            />
            <InputField
              label="Tahun Data"
              type="number"
              value={uploadYear}
              onChange={(value) => {
                const parsedYear = Number(value);
                setUploadYear(Number.isFinite(parsedYear) ? parsedYear : 2025);
              }}
            />
            <InputField
              label="Satuan"
              value={uploadUnit}
              onChange={setUploadUnit}
            />
          </div>
          <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_1fr_auto] xl:items-end">
            <InputField
              label="Sumber data"
              value={uploadSource}
              onChange={setUploadSource}
            />
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              File rekap
              <input
                type="file"
                accept=".docx,.doc,.pdf,.xlsx,.xls,.csv"
                onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                className="h-11 rounded-md border border-white/70 bg-white/70 px-3 text-sm shadow-sm backdrop-blur-xl file:mr-3 file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
              />
            </label>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Proses Upload
            </Button>
          </div>
          {uploadMessage ? (
            <p className="mt-3 rounded-md border border-white/70 bg-white/60 px-3 py-2 text-sm font-medium text-slate-700">
              {uploadMessage}
            </p>
          ) : null}
        </form>

        {groupedRows.map(([categoryName, items]) => (
          <div
            key={categoryName}
            className="rounded-lg border border-white/70 bg-white/45 p-4 shadow-sm backdrop-blur-xl"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  {categoryName}
                </p>
                <h3 className="text-lg font-bold text-slate-950">
                  {items.length} baris data
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  <Layers className="mr-1 h-3.5 w-3.5" />
                  {new Set(items.map((row) => row.region)).size} wilayah
                </Badge>
                <Badge variant="outline">
                  {Math.max(...items.map((row) => row.year))}
                </Badge>
              </div>
            </div>

            <div className="grid gap-3">
              {items.map((row) => (
                <div
                  key={row.id}
                  className="grid gap-3 rounded-md border border-white/70 bg-white/55 p-3 xl:grid-cols-[1.05fr_0.54fr_0.62fr_0.34fr_0.34fr_auto]"
                >
                  <InputField
                    label="Indikator"
                    value={row.indicator}
                    onChange={(value) => onUpdate(row.id, { indicator: value })}
                  />
                  <Select
                    label="Kategori"
                    value={row.category}
                    options={categoryOptions}
                    onChange={(value) => onUpdate(row.id, { category: value })}
                  />
                  <Select
                    label="Wilayah"
                    value={row.region}
                    options={regions.map((item) => ({ label: item, value: item }))}
                    onChange={(value) => onUpdate(row.id, { region: value })}
                  />
                  <InputField
                    label="Tahun"
                    type="number"
                    value={row.year}
                    onChange={(value) => onUpdate(row.id, { year: Number(value) })}
                  />
                  <InputField
                    label="Nilai"
                    type="number"
                    value={row.value}
                    onChange={(value) => onUpdate(row.id, { value: Number(value) })}
                  />
                  <div className="flex items-end justify-end">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onDelete(row.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <InputField
                    className="xl:col-span-2"
                    label="Sumber"
                    value={row.source}
                    onChange={(value) => onUpdate(row.id, { source: value })}
                  />
                  <InputField
                    label="Periode"
                    value={row.period}
                    onChange={(value) => onUpdate(row.id, { period: value })}
                  />
                  <InputField
                    label="Satuan"
                    value={row.unit}
                    onChange={(value) => onUpdate(row.id, { unit: value })}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CatalogPanel({
  datasets,
  releaseSchedules,
  onAddDataset,
  onAddReleaseSchedule,
  onDeleteDataset,
  onDeleteReleaseSchedule,
  onUpdateDataset,
  onUpdateReleaseSchedule,
}: {
  datasets: DataCatalog[];
  releaseSchedules: ReleaseSchedule[];
  onAddDataset: () => void;
  onAddReleaseSchedule: () => void;
  onDeleteDataset: (id: number) => void;
  onDeleteReleaseSchedule: (id: number) => void;
  onUpdateDataset: (id: number, patch: Partial<DataCatalog>) => void;
  onUpdateReleaseSchedule: (id: number, patch: Partial<ReleaseSchedule>) => void;
}) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Katalog Dataset</CardTitle>
            <CardDescription>
              Kelola daftar dataset publik, tautan unduh Excel/PDF, Standar Data, dan
              metadata seperti portal Satu Data.
            </CardDescription>
          </div>
          <Button onClick={onAddDataset}>
            <Plus className="h-4 w-4" />
            Tambah Dataset
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4">
          {datasets.map((dataset) => (
            <div
              key={dataset.id}
              className="grid gap-3 rounded-lg border border-white/70 bg-white/45 p-4 shadow-sm backdrop-blur-xl"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    {dataset.category}
                  </p>
                  <h3 className="text-lg font-bold text-slate-950">{dataset.title}</h3>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onDeleteDataset(dataset.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-3 xl:grid-cols-[1.15fr_0.42fr_0.34fr_0.48fr]">
                <InputField
                  label="Judul dataset"
                  value={dataset.title}
                  onChange={(value) => onUpdateDataset(dataset.id, { title: value })}
                />
                <InputField
                  label="Kategori"
                  value={dataset.category}
                  onChange={(value) => onUpdateDataset(dataset.id, { category: value })}
                />
                <InputField
                  label="Tahun Data"
                  type="number"
                  value={dataset.year}
                  onChange={(value) => {
                    const parsedYear = Number(value);
                    onUpdateDataset(dataset.id, {
                      year: Number.isFinite(parsedYear) ? parsedYear : dataset.year,
                    });
                  }}
                />
                <InputField
                  label="Format"
                  value={dataset.format}
                  onChange={(value) => onUpdateDataset(dataset.id, { format: value })}
                />
              </div>

              <div className="grid gap-3 xl:grid-cols-3">
                <InputField
                  label="Produsen data"
                  value={dataset.producer}
                  onChange={(value) => onUpdateDataset(dataset.id, { producer: value })}
                />
                <InputField
                  label="Frekuensi pembaruan"
                  value={dataset.frequency}
                  onChange={(value) => onUpdateDataset(dataset.id, { frequency: value })}
                />
                <InputField
                  label="URL sumber/tautan resmi"
                  value={dataset.sourceUrl}
                  onChange={(value) => onUpdateDataset(dataset.id, { sourceUrl: value })}
                />
              </div>

              <TextAreaField
                label="Deskripsi"
                value={dataset.description}
                onChange={(value) => onUpdateDataset(dataset.id, { description: value })}
              />

              <div className="grid gap-3 xl:grid-cols-2">
                <UrlUploadField
                  label="File Excel/CSV"
                  value={dataset.excelUrl}
                  accept=".xlsx,.xls,.csv"
                  onChange={(value) => onUpdateDataset(dataset.id, { excelUrl: value })}
                />
                <UrlUploadField
                  label="File PDF/Dokumen"
                  value={dataset.pdfUrl}
                  accept=".pdf,.doc,.docx"
                  onChange={(value) => onUpdateDataset(dataset.id, { pdfUrl: value })}
                />
              </div>

              <div className="grid gap-3 xl:grid-cols-2">
                <TextAreaField
                  label="Standar Data"
                  value={dataset.standardData}
                  onChange={(value) =>
                    onUpdateDataset(dataset.id, { standardData: value })
                  }
                />
                <TextAreaField
                  label="Metadata"
                  value={dataset.metadata}
                  onChange={(value) => onUpdateDataset(dataset.id, { metadata: value })}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Jadwal Rilis</CardTitle>
            <CardDescription>
              Atur daftar jadwal dan realisasi publikasi data untuk halaman publik.
            </CardDescription>
          </div>
          <Button onClick={onAddReleaseSchedule}>
            <Plus className="h-4 w-4" />
            Tambah Rilis
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3">
          {releaseSchedules.map((release) => (
            <div
              key={release.id}
              className="grid gap-3 rounded-lg border border-white/70 bg-white/45 p-4 shadow-sm backdrop-blur-xl xl:grid-cols-[1.25fr_0.36fr_0.42fr_0.42fr_0.36fr_auto]"
            >
              <InputField
                label="Judul"
                value={release.title}
                onChange={(value) => onUpdateReleaseSchedule(release.id, { title: value })}
              />
              <InputField
                label="Periode"
                value={release.period}
                onChange={(value) =>
                  onUpdateReleaseSchedule(release.id, { period: value })
                }
              />
              <InputField
                label="Jadwal"
                value={release.scheduledDate}
                onChange={(value) =>
                  onUpdateReleaseSchedule(release.id, { scheduledDate: value })
                }
              />
              <InputField
                label="Realisasi"
                value={release.realizedDate}
                onChange={(value) =>
                  onUpdateReleaseSchedule(release.id, { realizedDate: value })
                }
              />
              <Select
                label="Status"
                value={release.status}
                options={[
                  { label: "Rencana", value: "rencana" },
                  { label: "Rilis", value: "rilis" },
                ]}
                onChange={(value) =>
                  onUpdateReleaseSchedule(release.id, {
                    status: value as ReleaseSchedule["status"],
                  })
                }
              />
              <div className="flex items-end justify-end">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onDeleteReleaseSchedule(release.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <InputField
                label="Bahasa"
                value={release.language}
                onChange={(value) =>
                  onUpdateReleaseSchedule(release.id, { language: value })
                }
              />
              <InputField
                label="Format"
                value={release.format}
                onChange={(value) =>
                  onUpdateReleaseSchedule(release.id, { format: value })
                }
              />
              <UrlUploadField
                className="xl:col-span-4"
                label="Dokumen rilis"
                value={release.documentUrl}
                accept=".pdf,.doc,.docx,.xlsx,.xls,.csv"
                onChange={(value) =>
                  onUpdateReleaseSchedule(release.id, { documentUrl: value })
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function GeotaggingAdminPanel({
  offices,
  onAdd,
  onDelete,
  onUpdate,
}: {
  offices: OfficeLocation[];
  onAdd: () => void;
  onDelete: (id: number) => void;
  onUpdate: (id: number, patch: Partial<OfficeLocation>) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Lokasi MAN 1 Bandar Lampung</CardTitle>
          <CardDescription>
            Kelola alamat, koordinat, dan tautan Google Maps kampus madrasah.
          </CardDescription>
        </div>
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Tambah Alamat
        </Button>
      </CardHeader>
      <CardContent className="grid gap-3">
        {offices.map((office) => (
          <div
            key={office.id}
            className="grid gap-3 rounded-lg border border-white/70 bg-white/45 p-4 shadow-sm backdrop-blur-xl xl:grid-cols-[1fr_0.42fr_0.38fr_0.38fr_auto]"
          >
            <InputField
              label="Nama kantor"
              value={office.name}
              onChange={(value) => onUpdate(office.id, { name: value })}
            />
            <Select
              label="Jenis"
              value={office.type}
              options={[
                { label: "Madrasah", value: "kanwil" },
                { label: "Unit Lain", value: "kabupaten-kota" },
              ]}
              onChange={(value) =>
                onUpdate(office.id, { type: value as OfficeLocation["type"] })
              }
            />
            <InputField
              label="Latitude"
              type="number"
              value={office.latitude}
              onChange={(value) => onUpdate(office.id, { latitude: Number(value) })}
            />
            <InputField
              label="Longitude"
              type="number"
              value={office.longitude}
              onChange={(value) => onUpdate(office.id, { longitude: Number(value) })}
            />
            <div className="flex items-end justify-end">
              <Button variant="outline" size="icon" onClick={() => onDelete(office.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <TextAreaField
              className="xl:col-span-2"
              label="Alamat"
              value={office.address}
              onChange={(value) => onUpdate(office.id, { address: value })}
            />
            <InputField
              label="Telepon"
              value={office.phone}
              onChange={(value) => onUpdate(office.id, { phone: value })}
            />
            <InputField
              className="xl:col-span-2"
              label="URL Google Maps"
              value={office.mapsUrl}
              onChange={(value) => onUpdate(office.id, { mapsUrl: value })}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ContentPanel({
  publications,
  activities,
  videos,
  awardCollections,
  onAddPublication,
  onAddActivity,
  onAddAwardCollection,
  onAddAwardItem,
  onDeletePublication,
  onDeleteActivity,
  onDeleteAwardCollection,
  onDeleteAwardItem,
  onUpdatePublication,
  onUpdateActivity,
  onUpdateVideo,
  onUpdateAwardCollection,
  onUpdateAwardItem,
}: {
  publications: Publication[];
  activities: ActivitySlide[];
  videos: VideoItem[];
  awardCollections: AwardCollection[];
  onAddPublication: () => void;
  onAddActivity: () => void;
  onAddAwardCollection: () => void;
  onAddAwardItem: (collectionId: string) => void;
  onDeletePublication: (id: number) => void;
  onDeleteActivity: (id: number) => void;
  onDeleteAwardCollection: (id: string) => void;
  onDeleteAwardItem: (collectionId: string, itemId: number) => void;
  onUpdatePublication: (id: number, patch: Partial<Publication>) => void;
  onUpdateActivity: (id: number, patch: Partial<ActivitySlide>) => void;
  onUpdateVideo: (id: number, patch: Partial<VideoItem>) => void;
  onUpdateAwardCollection: (id: string, patch: Partial<AwardCollection>) => void;
  onUpdateAwardItem: (
    collectionId: string,
    itemId: number,
    patch: Partial<AwardItem>,
  ) => void;
}) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Prestasi Madrasah</CardTitle>
            <CardDescription>
              Edit koleksi, judul, deskripsi, tahun, dan foto yang tampil pada galeri
              penghargaan halaman publik.
            </CardDescription>
          </div>
          <Button onClick={onAddAwardCollection}>
            <Plus className="h-4 w-4" />
            Tambah Koleksi
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4">
          {awardCollections.map((collection) => (
            <div
              key={collection.id}
              className="grid gap-4 rounded-lg border border-white/70 bg-white/45 p-4 shadow-sm backdrop-blur-xl"
            >
              <div className="grid gap-3 xl:grid-cols-[0.5fr_1fr_auto]">
                <InputField
                  label="ID koleksi"
                  value={collection.id}
                  onChange={(value) =>
                    onUpdateAwardCollection(collection.id, { id: slugifyAdminId(value) })
                  }
                />
                <InputField
                  label="Judul koleksi"
                  value={collection.title}
                  onChange={(value) =>
                    onUpdateAwardCollection(collection.id, { title: value })
                  }
                />
                <div className="flex items-end justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onAddAwardItem(collection.id)}
                  >
                    <Plus className="h-4 w-4" />
                    Foto
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => onDeleteAwardCollection(collection.id)}
                    aria-label={`Hapus ${collection.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <TextAreaField
                label="Deskripsi koleksi"
                value={collection.description}
                onChange={(value) =>
                  onUpdateAwardCollection(collection.id, { description: value })
                }
              />

              <div className="grid gap-3">
                {collection.items.map((item) => (
                  <div
                    key={`${collection.id}-${item.id}`}
                    className="grid gap-3 rounded-lg border border-white/70 bg-white/50 p-3 shadow-sm backdrop-blur-xl xl:grid-cols-[220px_1fr_auto]"
                  >
                    <div
                      className="min-h-40 rounded-md border border-white/70 bg-cover bg-center"
                      style={{
                        backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : undefined,
                      }}
                    />
                    <div className="grid gap-3">
                      <div className="grid gap-3 md:grid-cols-[1fr_0.28fr]">
                        <InputField
                          label="Judul penghargaan"
                          value={item.title}
                          onChange={(value) =>
                            onUpdateAwardItem(collection.id, item.id, { title: value })
                          }
                        />
                        <InputField
                          label="Tahun"
                          type="number"
                          value={item.year}
                          onChange={(value) => {
                            const year = Number(value);
                            onUpdateAwardItem(collection.id, item.id, {
                              year: Number.isFinite(year) ? year : item.year,
                            });
                          }}
                        />
                      </div>
                      <TextAreaField
                        label="Deskripsi"
                        value={item.description}
                        onChange={(value) =>
                          onUpdateAwardItem(collection.id, item.id, {
                            description: value,
                          })
                        }
                      />
                      <div className="grid gap-3 md:grid-cols-2">
                        <UrlUploadField
                          label="Foto penghargaan"
                          value={item.imageUrl}
                          accept=".jpg,.jpeg,.png,.webp,.gif"
                          onChange={(value) =>
                            onUpdateAwardItem(collection.id, item.id, {
                              imageUrl: value,
                            })
                          }
                        />
                        <InputField
                          label="Teks alt gambar"
                          value={item.alt}
                          onChange={(value) =>
                            onUpdateAwardItem(collection.id, item.id, { alt: value })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex items-start justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => onDeleteAwardItem(collection.id, item.id)}
                        aria-label={`Hapus ${item.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {!collection.items.length ? (
                  <div className="rounded-lg border border-dashed border-emerald-200/80 bg-emerald-50/60 p-4 text-sm font-medium text-emerald-900">
                    Belum ada foto pada koleksi ini. Klik tombol Foto untuk menambahkan.
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Publikasi</CardTitle>
            <CardDescription>Kelola kartu dokumen resmi pada dashboard publik.</CardDescription>
          </div>
          <Button onClick={onAddPublication}>
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3">
          {publications.map((publication) => (
            <div
              key={publication.id}
              className="grid gap-3 rounded-lg border border-white/70 bg-white/45 p-4 shadow-sm backdrop-blur-xl lg:grid-cols-[1fr_0.6fr_0.5fr_auto]"
            >
              <InputField
                label="Judul"
                value={publication.title}
                onChange={(value) =>
                  onUpdatePublication(publication.id, { title: value })
                }
              />
              <InputField
                label="Kategori"
                value={publication.category}
                onChange={(value) =>
                  onUpdatePublication(publication.id, { category: value })
                }
              />
              <InputField
                label="Format"
                value={publication.fileLabel}
                onChange={(value) =>
                  onUpdatePublication(publication.id, { fileLabel: value })
                }
              />
              <div className="flex items-end justify-end">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onDeletePublication(publication.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <TextAreaField
                className="lg:col-span-4"
                label="Deskripsi"
                value={publication.description}
                onChange={(value) =>
                  onUpdatePublication(publication.id, { description: value })
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Video Informasi</CardTitle>
          <CardDescription>
            Perbarui URL YouTube atau embed dan narasi video prioritas.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {videos.map((video) => (
            <div
              key={video.id}
              className="grid gap-3 rounded-lg border border-white/70 bg-white/45 p-4 shadow-sm backdrop-blur-xl lg:grid-cols-2"
            >
              <InputField
                label="Judul video"
                value={video.title}
                onChange={(value) => onUpdateVideo(video.id, { title: value })}
              />
              <InputField
                label="URL YouTube / embed"
                value={video.embedUrl}
                onChange={(value) => onUpdateVideo(video.id, { embedUrl: value })}
              />
              <TextAreaField
                className="lg:col-span-2"
                label="Deskripsi"
                value={video.description}
                onChange={(value) =>
                  onUpdateVideo(video.id, { description: value })
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Slideshow Kegiatan</CardTitle>
            <CardDescription>Atur judul, caption, dan URL foto kegiatan.</CardDescription>
          </div>
          <Button onClick={onAddActivity}>
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="grid gap-3 rounded-lg border border-white/70 bg-white/45 p-4 shadow-sm backdrop-blur-xl lg:grid-cols-[0.75fr_1fr_auto]"
            >
              <div
                className="min-h-32 rounded-md border border-white/70 bg-cover bg-center"
                style={{ backgroundImage: `url(${activity.imageUrl})` }}
              />
              <div className="grid gap-3">
                <InputField
                  label="Judul"
                  value={activity.title}
                  onChange={(value) => onUpdateActivity(activity.id, { title: value })}
                />
                <InputField
                  label="URL gambar"
                  value={activity.imageUrl}
                  onChange={(value) =>
                    onUpdateActivity(activity.id, { imageUrl: value })
                  }
                />
                <TextAreaField
                  label="Caption"
                  value={activity.caption}
                  onChange={(value) =>
                    onUpdateActivity(activity.id, { caption: value })
                  }
                />
              </div>
              <div className="flex items-start justify-end">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onDeleteActivity(activity.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ContactPanel({
  contact,
  onUpdate,
}: {
  contact: ContactInfo;
  onUpdate: (patch: Partial<ContactInfo>) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informasi Kontak dan Lokasi</CardTitle>
        <CardDescription>
          Data ini digunakan pada topbar, kontak resmi, peta, dan footer dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {(Object.keys(contact) as (keyof ContactInfo)[]).map((key) => (
          <InputField
            key={key}
            label={contactLabels[key]}
            value={contact[key]}
            onChange={(value) => onUpdate({ [key]: value })}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function AccountPanel({
  name,
  email,
  currentPassword,
  newPassword,
  confirmPassword,
  message,
  isSaving,
  onNameChange,
  onEmailChange,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSaveProfile,
  onSavePassword,
}: {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  message: string;
  isSaving: boolean;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSaveProfile: () => void;
  onSavePassword: () => void;
}) {
  return (
    <div className="grid gap-4">
      {message ? (
        <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-sm font-medium text-emerald-900 shadow-sm backdrop-blur-xl">
          {message}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Profil Admin</CardTitle>
          <CardDescription>
            Ubah nama dan email akun yang digunakan untuk masuk ke panel admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <InputField label="Nama admin" value={name} onChange={onNameChange} />
          <InputField
            label="Email login"
            type="email"
            value={email}
            onChange={onEmailChange}
          />
          <div className="md:col-span-2">
            <Button onClick={onSaveProfile} disabled={isSaving}>
              {isSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Simpan Profil
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password Admin</CardTitle>
          <CardDescription>
            Password baru akan disimpan oleh Better Auth sebagai hash di tabel account.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <InputField
            label="Password lama"
            type="password"
            value={currentPassword}
            onChange={onCurrentPasswordChange}
          />
          <InputField
            label="Password baru"
            type="password"
            value={newPassword}
            onChange={onNewPasswordChange}
          />
          <InputField
            label="Konfirmasi password"
            type="password"
            value={confirmPassword}
            onChange={onConfirmPasswordChange}
          />
          <div className="md:col-span-3">
            <Button onClick={onSavePassword} disabled={isSaving}>
              {isSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Simpan Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-white/70 bg-white/45 px-4 py-3 shadow-sm backdrop-blur-xl">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function UrlUploadField({
  label,
  value,
  onChange,
  accept,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  accept: string;
  className?: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setMessage("");

    if (!file) {
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.set("file", file);

      const response = await fetch("/api/dashboard/files", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Upload file gagal.");
      }

      onChange(payload.url);
      setMessage(`File tersimpan: ${payload.url}`);
      event.target.value = "";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload file gagal.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className={`grid gap-2 text-sm font-medium text-slate-700 ${className ?? ""}`}>
      <span>{label}</span>
      <div className="grid gap-2 md:grid-cols-[1fr_auto]">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="/uploads/datasets/nama-file.pdf"
          className="h-11 rounded-md border border-white/70 bg-white/60 px-3 text-sm text-slate-900 shadow-sm outline-none backdrop-blur-xl transition hover:bg-white/75 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
        />
        <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-white/70 bg-white/70 px-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-white">
          {isUploading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Upload
          <input
            type="file"
            accept={accept}
            disabled={isUploading}
            onChange={handleUpload}
            className="sr-only"
          />
        </label>
      </div>
      {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  className,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "email" | "number" | "password" | "text";
  className?: string;
}) {
  return (
    <label className={`grid gap-2 text-sm font-medium text-slate-700 ${className ?? ""}`}>
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        className="h-11 rounded-md border border-white/70 bg-white/60 px-3 text-sm text-slate-900 shadow-sm outline-none backdrop-blur-xl transition hover:bg-white/75 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={`grid gap-2 text-sm font-medium text-slate-700 ${className ?? ""}`}>
      <span>{label}</span>
      <textarea
        value={value}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
        rows={3}
        className="rounded-md border border-white/70 bg-white/60 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none backdrop-blur-xl transition hover:bg-white/75 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function normalizeCategoryOptions(categories: string[]) {
  return uniqueValues([
    ...baseCategories,
    ...categories.filter((item) => item !== "Semua Kategori"),
  ]).map((item) => ({ label: item, value: item }));
}

function groupByCategory<T extends { category: string }>(items: T[]) {
  const grouped = new Map<string, T[]>();

  for (const item of items) {
    grouped.set(item.category, [...(grouped.get(item.category) ?? []), item]);
  }

  return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function buildDashboardFilters(
  existing: DashboardData["filters"],
  indicators: Indicator[],
  rows: DashboardRow[],
) {
  const years = uniqueValues([
    ...rows.map((row) => String(row.year)),
    ...indicators.map((indicator) => String(indicator.year)),
    ...existing.years.filter((year) => year !== "Semua Tahun"),
  ]).sort((a, b) => Number(b) - Number(a));
  const categories = uniqueValues([
    ...baseCategories,
    ...existing.categories.filter((category) => category !== "Semua Kategori"),
    ...indicators.map((indicator) => indicator.category),
    ...rows.map((row) => row.category),
  ]);
  const regions = uniqueValues([
    ...lampungRegions,
    ...existing.regions.filter((region) => region !== "Semua Wilayah"),
    ...rows.map((row) => row.region),
  ]);

  return {
    years: ["Semua Tahun", ...years],
    categories: ["Semua Kategori", ...categories],
    regions: ["Semua Wilayah", ...regions],
  };
}

function buildChartSeriesFromRows(
  rows: DashboardRow[],
  categories: string[],
): DashboardData["chartSeries"] {
  const dataCategories = categories.filter((category) => category !== "Semua Kategori");
  const years = uniqueValues(rows.map((row) => String(row.year)))
    .map(Number)
    .sort((a, b) => a - b);

  return years.map((year) => {
    const point = { year } as DashboardData["chartSeries"][number];

    for (const category of dataCategories) {
      const categoryRows = rows.filter(
        (row) => row.year === year && row.category === category,
      );
      point[category] = categoryRows.length
        ? Number(
            (
              categoryRows.reduce((sum, row) => sum + row.value, 0) /
              categoryRows.length
            ).toFixed(3),
          )
        : 0;
    }

    return point;
  });
}

function uniqueValues(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

function slugifyAdminId(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || `koleksi-${Date.now()}`
  );
}

const contactLabels: Record<keyof ContactInfo, string> = {
  institution: "Instansi",
  address: "Alamat",
  phone: "Telepon",
  whatsapp: "WhatsApp",
  email: "Email",
  instagram: "Instagram",
  youtube: "YouTube",
  website: "Website",
  mapEmbedUrl: "URL embed peta",
};

async function postAuthAction(path: string, body: Record<string, unknown>) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string; error?: string }
      | null;

    throw new Error(payload?.message ?? payload?.error ?? "auth_request_failed");
  }

  return response.json().catch(() => ({}));
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message !== "auth_request_failed") {
    return error.message;
  }

  return fallback;
}

function nextNumericId(items: { id: number }[]) {
  return items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1;
}
