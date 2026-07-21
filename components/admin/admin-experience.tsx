"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock3,
  Globe2,
  LayoutDashboard,
  LockKeyhole,
  LogIn,
  LogOut,
  RefreshCw,
  Save,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";
import type { ContactInfo, DashboardData, DashboardIntegrationState, SiteSettings } from "@/lib/types";

type AdminTab = "overview" | "integrations" | "appearance" | "account";
type SyncCode = "mirror" | "gis" | "website";

const tabs: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
  { id: "integrations", label: "Status Sinkronisasi", icon: RefreshCw },
  { id: "appearance", label: "Header & Footer", icon: Building2 },
  { id: "account", label: "Akun Admin", icon: UserRound },
];

export function AdminExperience({ data }: { data: DashboardData }) {
  const session = authClient.useSession();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [contact, setContact] = useState<ContactInfo>(data.contact);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(data.siteSettings);
  const [presentationMessage, setPresentationMessage] = useState("");
  const [isPresentationSaving, setIsPresentationSaving] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const [isAccountSaving, setIsAccountSaving] = useState(false);
  const [syncingSource, setSyncingSource] = useState<SyncCode | null>(null);
  const [syncMessage, setSyncMessage] = useState("");

  useEffect(() => {
    if (session.data?.user) setAccountName(session.data.user.name);
  }, [session.data?.user]);

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage("");
    setIsAuthSubmitting(true);
    try {
      const result = await authClient.signIn.email({ email: authEmail, password: authPassword });
      if (result.error) throw new Error(result.error.message ?? "Autentikasi gagal.");
      await session.refetch();
    } catch (error) {
      setAuthMessage(errorMessage(error, "Email atau password tidak valid."));
    } finally {
      setIsAuthSubmitting(false);
    }
  }

  async function handleSignOut() {
    await authClient.signOut();
    await session.refetch();
  }

  async function savePresentation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPresentationMessage("");
    setIsPresentationSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, siteSettings }),
      });
      const result = await response.json() as { contact?: ContactInfo; siteSettings?: SiteSettings; error?: string };
      if (!response.ok || !result.contact || !result.siteSettings) {
        throw new Error(result.error ?? "Pengaturan gagal disimpan.");
      }
      setContact(result.contact);
      setSiteSettings(result.siteSettings);
      setPresentationMessage("Header, footer, dan lokasi kantor berhasil disimpan.");
    } catch (error) {
      setPresentationMessage(errorMessage(error, "Pengaturan gagal disimpan."));
    } finally {
      setIsPresentationSaving(false);
    }
  }

  async function saveAccountName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accountName.trim()) return;
    setIsAccountSaving(true);
    setAccountMessage("");
    try {
      const result = await authClient.updateUser({ name: accountName.trim() });
      if (result.error) throw new Error(result.error.message ?? "Nama gagal diperbarui.");
      await session.refetch();
      setAccountMessage("Nama admin berhasil diperbarui.");
    } catch (error) {
      setAccountMessage(errorMessage(error, "Nama admin gagal diperbarui."));
    } finally {
      setIsAccountSaving(false);
    }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAccountMessage("");
    if (newPassword.length < 8) {
      setAccountMessage("Password baru minimal 8 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setAccountMessage("Konfirmasi password baru belum sama.");
      return;
    }
    setIsAccountSaving(true);
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) throw new Error(result.error.message ?? "Password gagal diperbarui.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setAccountMessage("Password berhasil diperbarui dan sesi lain telah dikeluarkan.");
    } catch (error) {
      setAccountMessage(errorMessage(error, "Password gagal diperbarui."));
    } finally {
      setIsAccountSaving(false);
    }
  }

  async function syncSource(code: SyncCode) {
    setSyncingSource(code);
    setSyncMessage("");
    try {
      const response = await fetch(`/api/admin/sync/${code}`, { method: "POST" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Sinkronisasi gagal.");
      setSyncMessage(`Sinkronisasi ${code === "mirror" ? "database lokal" : code.toUpperCase()} selesai.`);
      window.location.reload();
    } catch (error) {
      setSyncMessage(errorMessage(error, "Sinkronisasi gagal."));
    } finally {
      setSyncingSource(null);
    }
  }

  if (session.isPending) {
    return <LoadingScreen />;
  }

  if (!session.data) {
    return (
      <AuthScreen
        email={authEmail}
        password={authPassword}
        message={authMessage}
        isSubmitting={isAuthSubmitting}
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
            <Badge variant="outline" className="mb-2 w-fit">Panel Admin</Badge>
            <h1 className="text-2xl font-bold md:text-3xl">Pengaturan Dashboard Madrasah</h1>
            <p className="mt-1 text-sm text-muted-foreground">Kendalikan database lokal, GIS Madrasah Kemenag, dan API Website MAN 1 dari satu tempat.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline"><Link href="/"><ArrowLeft className="h-4 w-4" />Dashboard Publik</Link></Button>
            <Button onClick={handleSignOut} variant="outline"><LogOut className="h-4 w-4" />Keluar</Button>
          </div>
        </div>
      </header>

      <div className="section-shell grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="glass-panel-strong h-fit rounded-lg p-3">
          <nav className="grid gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition ${activeTab === tab.id ? "bg-primary/90 text-white shadow-sm" : "text-slate-700 hover:bg-white/60"}`}>
                  <Icon className="h-4 w-4" />{tab.label}
                </button>
              );
            })}
          </nav>
          <div className="mt-4 rounded-md border border-emerald-200/80 bg-emerald-50/75 p-3 text-xs leading-5 text-emerald-900">
            Dump database tetap diimpor melalui MAMP/DBeaver. Panel hanya membaca tiga view agregat agar biodata siswa dan pegawai tidak masuk ke aplikasi dashboard.
          </div>
        </aside>

        <section className="space-y-4">
          {activeTab === "overview" ? <OverviewPanel state={data.integration} /> : null}
          {activeTab === "integrations" ? <IntegrationsPanel state={data.integration} syncingSource={syncingSource} message={syncMessage} onSync={syncSource} /> : null}
          {activeTab === "appearance" ? <AppearancePanel contact={contact} siteSettings={siteSettings} message={presentationMessage} isSaving={isPresentationSaving} onContactChange={setContact} onSiteSettingsChange={setSiteSettings} onSubmit={savePresentation} /> : null}
          {activeTab === "account" ? <AccountPanel name={accountName} email={session.data.user.email} currentPassword={currentPassword} newPassword={newPassword} confirmPassword={confirmPassword} message={accountMessage} isSaving={isAccountSaving} onNameChange={setAccountName} onCurrentPasswordChange={setCurrentPassword} onNewPasswordChange={setNewPassword} onConfirmPasswordChange={setConfirmPassword} onSaveName={saveAccountName} onSavePassword={savePassword} /> : null}
        </section>
      </div>
    </main>
  );
}

function OverviewPanel({ state }: { state?: DashboardIntegrationState }) {
  const mismatchCount = state?.comparisons.filter((item) => item.status === "mismatch").length ?? 0;
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Peserta Didik" value={state?.emis?.students.total ?? "-"} helper={state?.emis?.sourceName ?? "Belum tersedia"} />
        <Metric label="Rombongan Belajar" value={state?.emis?.studyGroups.total ?? "-"} helper={state?.emis?.period ?? "Belum tersedia"} />
        <Metric label="GTK" value={state?.simpeg?.complete ? state.simpeg.employeesTotal ?? "-" : state?.simpeg?.identifiedProfiles ?? "-"} helper={state?.simpeg?.sourceName ?? "Belum tersedia"} />
        <Metric label="Selisih Data" value={mismatchCount} helper={mismatchCount ? "Perlu ditinjau admin" : "Sumber yang tersedia cocok"} />
      </div>
      <Card>
        <CardHeader><CardTitle>Alur kendali tiga sumber</CardTitle><CardDescription>Snapshot dibandingkan sebelum dipakai sebagai data publik.</CardDescription></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <FlowStep number="01" title="Ambil agregat" text="Database lokal manual, GIS harian, dan website setiap enam jam." />
          <FlowStep number="02" title="Bandingkan" text="NSM, NPSN, siswa, rombel, GTK, guru, dan tenaga kependidikan dicocokkan." />
          <FlowStep number="03" title="Beri peringatan" text="Selisih tampil di panel admin; snapshot valid sebelumnya tetap aman." />
        </CardContent>
      </Card>
      <Card><CardContent className="flex gap-3 p-5 text-sm leading-6 text-slate-600"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><p>File dump mentah tidak diunggah melalui browser karena mengandung data pribadi. Setelah dump diperbarui di MySQL lokal, admin cukup menekan “Baca ulang database lokal”.</p></CardContent></Card>
    </div>
  );
}

function IntegrationsPanel({ state, syncingSource, message, onSync }: {
  state?: DashboardIntegrationState;
  syncingSource: SyncCode | null;
  message: string;
  onSync: (code: SyncCode) => void;
}) {
  const sources = [
    { sourceCode: "database" as const, syncCode: "mirror" as const, action: "Baca ulang database lokal" },
    { sourceCode: "gis" as const, syncCode: "gis" as const, action: "Sinkronkan GIS sekarang" },
    { sourceCode: "website" as const, syncCode: "website" as const, action: "Uji & sinkronkan website" },
  ];
  return (
    <div className="grid gap-4">
      {message ? <Notice message={message} /> : null}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><CardTitle>Peringatan kualitas data</CardTitle><CardDescription>Selisih tidak langsung mengubah dashboard; admin dapat melihat sumber yang berbeda.</CardDescription></div>
            <Badge variant={state?.alerts.some((alert) => alert.severity !== "info") ? "warning" : "success"}>
              {state?.alerts.length ?? 0} pemberitahuan
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          {state?.alerts.length ? state.alerts.map((alert) => (
            <div key={alert.id} className={`flex gap-3 rounded-lg border p-4 text-sm leading-6 ${alert.severity === "critical" ? "border-red-200 bg-red-50 text-red-950" : alert.severity === "warning" ? "border-amber-200 bg-amber-50 text-amber-950" : "border-blue-200 bg-blue-50 text-blue-950"}`}>
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div><strong>{alert.title}</strong><p>{alert.message}</p></div>
            </div>
          )) : (
            <div className="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><CheckCircle2 className="h-5 w-5" />Tidak ada selisih pada sumber yang dapat dibandingkan.</div>
          )}
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        {sources.map(({ sourceCode, syncCode, action }) => {
          const source = state?.sources.find((item) => item.code === sourceCode);
          return (
            <Card key={sourceCode}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3"><Badge variant={source?.status === "fresh" ? "success" : source?.status === "failed" || source?.status === "stale" ? "warning" : "outline"} className="w-fit">{sourceStatus(source?.status)}</Badge>{sourceCode === "website" ? <Globe2 className="h-5 w-5 text-slate-400" /> : <RefreshCw className="h-5 w-5 text-slate-400" />}</div>
                <CardTitle>{source?.name ?? sourceCode.toUpperCase()}</CardTitle>
                <CardDescription>{source?.period ?? "Menunggu snapshot"}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-3"><Metric label="Siswa" value={source?.metrics.studentsTotal ?? "-"} helper={`${source?.metrics.studyGroups ?? "-"} rombel`} /><Metric label="GTK" value={source?.metrics.employeesTotal ?? "-"} helper={`${source?.metrics.teachersTotal ?? "-"} guru`} /></div>
                <div className="rounded-md border border-white/70 bg-white/45 p-3 text-xs leading-5 text-slate-600">
                  <p className="flex items-center gap-2 font-semibold text-slate-800"><Clock3 className="h-3.5 w-3.5" />{source?.syncFrequency ?? "Belum dikonfigurasi"}</p>
                  <p className="mt-1">Snapshot: {formatAdminTime(source?.lastUpdated)}</p>
                  {source?.sourceUpdatedAt ? <p>Data sumber: {formatAdminTime(source.sourceUpdatedAt)}</p> : null}
                </div>
                {source?.warnings.length ? <ul className="grid gap-2 text-sm leading-6 text-amber-900">{source.warnings.map((warning) => <li key={warning}>• {warning}</li>)}</ul> : null}
                <Button type="button" variant="outline" disabled={syncingSource != null || !source?.enabled} onClick={() => onSync(syncCode)}>
                  <RefreshCw className={`h-4 w-4 ${syncingSource === syncCode ? "animate-spin" : ""}`} />
                  {source?.enabled ? action : "Menunggu konfigurasi API"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card>
        <CardHeader><CardTitle>Perbandingan antar-sumber</CardTitle><CardDescription>Baris kuning menunjukkan angka atau identitas yang tidak sama.</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Indikator</TableHead><TableHead>Database lokal</TableHead><TableHead>GIS Kemenag</TableHead><TableHead>Website MAN 1</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {(state?.comparisons ?? []).map((row) => (
                <TableRow key={row.key} className={row.status === "mismatch" ? "bg-amber-50/70" : ""}>
                  <TableCell className="font-semibold">{row.label}</TableCell>
                  <TableCell>{comparisonValue(row.values.database, row.unit)}</TableCell>
                  <TableCell>{comparisonValue(row.values.gis, row.unit)}</TableCell>
                  <TableCell>{comparisonValue(row.values.website, row.unit)}</TableCell>
                  <TableCell><Badge variant={row.status === "match" ? "success" : row.status === "mismatch" ? "warning" : "outline"}>{row.status === "match" ? "Cocok" : row.status === "mismatch" ? "Berbeda" : "Belum cukup data"}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Riwayat sinkronisasi terbaru</CardTitle><CardDescription>Menunjukkan sumber, pemicu, hasil, dan jumlah agregat yang diproses.</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Waktu</TableHead><TableHead>Sumber</TableHead><TableHead>Pemicu</TableHead><TableHead>Hasil</TableHead><TableHead>Diproses</TableHead></TableRow></TableHeader>
            <TableBody>
              {(state?.recentRuns ?? []).slice(0, 10).map((run) => (
                <TableRow key={run.id}>
                  <TableCell>{formatAdminTime(run.startedAt)}</TableCell>
                  <TableCell className="font-semibold">{runSourceLabel(run.sourceCode)}</TableCell>
                  <TableCell>{run.triggerType === "scheduled" ? "Otomatis" : run.triggerType === "manual" ? "Manual" : "Referensi"}</TableCell>
                  <TableCell><Badge variant={run.status === "success" ? "success" : run.status === "failed" ? "warning" : "outline"}>{run.status}</Badge></TableCell>
                  <TableCell>{run.recordsMatched.toLocaleString("id-ID")} / {run.recordsReceived.toLocaleString("id-ID")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card><CardContent className="p-5 text-sm leading-6 text-slate-600">Rekomendasi jadwal: GIS setiap 24 jam, Website MAN 1 setiap 6 jam setelah endpoint aktif, dan database lokal hanya setelah dump baru diimpor. Jika sumber gagal, snapshot valid sebelumnya tetap dipakai dan tidak ditimpa angka nol.</CardContent></Card>
    </div>
  );
}

function AppearancePanel({ contact, siteSettings, message, isSaving, onContactChange, onSiteSettingsChange, onSubmit }: { contact: ContactInfo; siteSettings: SiteSettings; message: string; isSaving: boolean; onContactChange: (value: ContactInfo) => void; onSiteSettingsChange: (value: SiteSettings) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      {message ? <Notice message={message} /> : null}
      <Card>
        <CardHeader><CardTitle>Tulisan header dan halaman utama</CardTitle><CardDescription>Ubah identitas visual tanpa mengubah data angka hasil sinkronisasi.</CardDescription></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Input label="Nama pada header" value={siteSettings.headerInstitutionName} onChange={(value) => onSiteSettingsChange({ ...siteSettings, headerInstitutionName: value })} />
          <Input label="Subjudul header" value={siteSettings.headerSubtitle} onChange={(value) => onSiteSettingsChange({ ...siteSettings, headerSubtitle: value })} />
          <Input label="Judul utama" value={siteSettings.heroTitle} onChange={(value) => onSiteSettingsChange({ ...siteSettings, heroTitle: value })} />
          <Input label="Teks sorotan" value={siteSettings.heroHighlight} onChange={(value) => onSiteSettingsChange({ ...siteSettings, heroHighlight: value })} />
          <TextArea label="Deskripsi halaman utama" value={siteSettings.heroDescription} onChange={(value) => onSiteSettingsChange({ ...siteSettings, heroDescription: value })} className="md:col-span-2" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Footer dan lokasi kantor</CardTitle><CardDescription>Informasi ini tampil pada bagian kontak dan footer dashboard publik.</CardDescription></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Input label="Judul footer" value={siteSettings.footerTitle} onChange={(value) => onSiteSettingsChange({ ...siteSettings, footerTitle: value })} />
          <Input label="Subjudul footer" value={siteSettings.footerSubtitle} onChange={(value) => onSiteSettingsChange({ ...siteSettings, footerSubtitle: value })} />
          <TextArea label="Keterangan footer" value={siteSettings.footerDescription} onChange={(value) => onSiteSettingsChange({ ...siteSettings, footerDescription: value })} className="md:col-span-2" />
          <Input label="Nama kantor" value={contact.institution} onChange={(value) => onContactChange({ ...contact, institution: value })} />
          <Input label="Telepon" value={contact.phone} onChange={(value) => onContactChange({ ...contact, phone: value })} />
          <TextArea label="Alamat kantor" value={contact.address} onChange={(value) => onContactChange({ ...contact, address: value })} className="md:col-span-2" />
          <Input label="Email" type="email" value={contact.email} onChange={(value) => onContactChange({ ...contact, email: value })} />
          <Input label="Website" type="url" value={contact.website} onChange={(value) => onContactChange({ ...contact, website: value })} />
          <Input label="WhatsApp" value={contact.whatsapp} onChange={(value) => onContactChange({ ...contact, whatsapp: value })} />
          <Input label="Instagram URL" type="url" value={contact.instagram} onChange={(value) => onContactChange({ ...contact, instagram: value })} />
          <Input label="YouTube URL" type="url" value={contact.youtube} onChange={(value) => onContactChange({ ...contact, youtube: value })} />
          <Input label="Google Maps embed URL" type="url" value={contact.mapEmbedUrl} onChange={(value) => onContactChange({ ...contact, mapEmbedUrl: value })} />
        </CardContent>
      </Card>
      <Button type="submit" disabled={isSaving} className="w-fit">{isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Simpan pengaturan</Button>
    </form>
  );
}

function AccountPanel({ name, email, currentPassword, newPassword, confirmPassword, message, isSaving, onNameChange, onCurrentPasswordChange, onNewPasswordChange, onConfirmPasswordChange, onSaveName, onSavePassword }: { name: string; email: string; currentPassword: string; newPassword: string; confirmPassword: string; message: string; isSaving: boolean; onNameChange: (value: string) => void; onCurrentPasswordChange: (value: string) => void; onNewPasswordChange: (value: string) => void; onConfirmPasswordChange: (value: string) => void; onSaveName: (event: FormEvent<HTMLFormElement>) => void; onSavePassword: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="grid gap-4">
      {message ? <Notice message={message} /> : null}
      <Card>
        <CardHeader><CardTitle>Profil admin</CardTitle><CardDescription>Email mengikuti allowlist server dan tidak dapat diubah dari dashboard.</CardDescription></CardHeader>
        <CardContent><form className="grid gap-4 md:grid-cols-2" onSubmit={onSaveName}><Input label="Nama pengguna" value={name} onChange={onNameChange} /><Input label="Email admin" type="email" value={email} readOnly /><Button type="submit" disabled={isSaving} className="w-fit md:col-span-2"><Save className="h-4 w-4" />Simpan nama</Button></form></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Ganti password</CardTitle><CardDescription>Password minimal 8 karakter. Sesi admin lain akan dikeluarkan setelah perubahan.</CardDescription></CardHeader>
        <CardContent><form className="grid gap-4 md:grid-cols-3" onSubmit={onSavePassword}><Input label="Password saat ini" type="password" value={currentPassword} onChange={onCurrentPasswordChange} /><Input label="Password baru" type="password" value={newPassword} onChange={onNewPasswordChange} /><Input label="Konfirmasi password" type="password" value={confirmPassword} onChange={onConfirmPasswordChange} /><Button type="submit" disabled={isSaving} className="w-fit md:col-span-3"><LockKeyhole className="h-4 w-4" />Ganti password</Button></form></CardContent>
      </Card>
    </div>
  );
}

function AuthScreen({ email, password, message, isSubmitting, onEmailChange, onPasswordChange, onSubmit }: { email: string; password: string; message: string; isSubmitting: boolean; onEmailChange: (value: string) => void; onPasswordChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 text-slate-950">
      <section className="glass-panel-strong w-full max-w-md rounded-lg p-6 shadow-2xl">
        <Badge variant="outline" className="mb-4 w-fit">Admin Dashboard</Badge>
        <h1 className="text-2xl font-bold">Masuk Panel Admin</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Gunakan akun administrator yang sudah terdaftar. Pendaftaran publik dinonaktifkan.</p>
        <form className="mt-5 grid gap-4" onSubmit={onSubmit}>
          <Input label="Email" type="email" value={email} onChange={onEmailChange} />
          <Input label="Password" type="password" value={password} onChange={onPasswordChange} />
          {message ? <Notice message={message} /> : null}
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}Masuk</Button>
        </form>
        <Button asChild variant="outline" className="mt-3 w-full"><Link href="/"><ArrowLeft className="h-4 w-4" />Dashboard Publik</Link></Button>
      </section>
    </main>
  );
}

function LoadingScreen() {
  return <main className="grid min-h-screen place-items-center"><div className="glass-panel-strong rounded-lg p-6 text-center"><RefreshCw className="mx-auto h-6 w-6 animate-spin text-primary" /><p className="mt-3 text-sm font-semibold">Memeriksa sesi admin...</p></div></main>;
}

function Metric({ label, value, helper }: { label: string; value: string | number; helper: string }) {
  return <Card><CardContent className="p-5"><p className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">{label}</p><p className="mt-2 text-3xl font-black">{typeof value === "number" ? value.toLocaleString("id-ID") : value}</p><p className="mt-1 text-xs text-slate-500">{helper}</p></CardContent></Card>;
}

function FlowStep({ number, title, text }: { number: string; title: string; text: string }) {
  return <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-4"><span className="text-xs font-black text-emerald-700">{number}</span><strong className="mt-3 block text-sm">{title}</strong><p className="mt-1 text-xs leading-5 text-slate-600">{text}</p></div>;
}

function Input({ label, value, onChange, type = "text", readOnly = false }: { label: string; value: string; onChange?: (value: string) => void; type?: string; readOnly?: boolean }) {
  return <label className="grid gap-2 text-sm font-medium text-slate-700"><span>{label}</span><input type={type} value={value} readOnly={readOnly} onChange={(event) => onChange?.(event.target.value)} className={`h-11 rounded-md border border-white/70 px-3 text-sm shadow-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 ${readOnly ? "bg-slate-100 text-slate-500" : "bg-white/70 text-slate-900"}`} /></label>;
}

function TextArea({ label, value, onChange, className = "" }: { label: string; value: string; onChange: (value: string) => void; className?: string }) {
  return <label className={`grid gap-2 text-sm font-medium text-slate-700 ${className}`}><span>{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="rounded-md border border-white/70 bg-white/70 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20" /></label>;
}

function Notice({ message }: { message: string }) {
  return <p className="rounded-md border border-emerald-200/80 bg-emerald-50/85 px-3 py-2 text-sm font-medium text-emerald-900">{message}</p>;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function sourceStatus(status?: string) {
  if (status === "fresh") return "Aktif & mutakhir";
  if (status === "stale") return "Perlu diperbarui";
  if (status === "fallback") return "Snapshot parsial";
  if (status === "syncing") return "Sedang sinkron";
  if (status === "failed") return "Gagal";
  return "Belum dikonfigurasi";
}

function formatAdminTime(value?: string | null) {
  if (!value) return "Belum pernah";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function comparisonValue(value: string | number | null, unit: string) {
  if (value == null) return "—";
  const formatted = typeof value === "number" ? value.toLocaleString("id-ID") : value;
  return unit ? `${formatted} ${unit}` : formatted;
}

function runSourceLabel(code: DashboardIntegrationState["recentRuns"][number]["sourceCode"]) {
  if (code === "mirror") return "Database lokal";
  if (code === "gis") return "GIS Kemenag";
  if (code === "website") return "Website MAN 1";
  return code.toUpperCase();
}
