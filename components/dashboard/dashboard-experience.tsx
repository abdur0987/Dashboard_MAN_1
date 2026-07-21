"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpenCheck,
  Building2,
  Database,
  IdCard,
  MapPin,
  Menu,
  MonitorPlay,
  RefreshCw,
  School,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DashboardData, DashboardRow, DashboardSourceState } from "@/lib/types";

type Module = "EMIS" | "SIMPEG";

const navItems = [
  { label: "Beranda", href: "#beranda" },
  { label: "Data Utama", href: "#data-utama" },
  { label: "Profil Publik", href: "#profil-asn" },
  { label: "Integrasi", href: "#integrasi" },
  { label: "Slideshow", href: "/slideshow" },
  { label: "Admin", href: "/admin" },
];

export function DashboardExperience({ data: initialData }: { data: DashboardData }) {
  const [data, setData] = useState(initialData);
  const [activeModule, setActiveModule] = useState<Module>("EMIS");
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const refresh = async () => {
      try {
        const response = await fetch(`/api/dashboard?ts=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) return;
        setData((await response.json()) as DashboardData);
        setLastUpdated(new Date());
      } finally {
        setRefreshing(false);
      }
    };
    const timer = window.setInterval(refresh, 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const moduleRows = useMemo(
    () => data.rows.filter((row) => row.category === activeModule),
    [activeModule, data.rows],
  );

  const students = indicatorValue(data, "Peserta Didik");
  const studyGroups = indicatorValue(data, "Rombongan Belajar");
  const identifiedProfiles = indicatorValue(data, "Profil teridentifikasi") || indicatorValue(data, "Guru dan Tenaga Kependidikan");
  const simpeg = data.integration?.simpeg;
  const emis = data.integration?.emis;
  const employeeTotal = simpeg?.complete ? simpeg.employeesTotal ?? identifiedProfiles : identifiedProfiles;
  const studentSourceName = emis?.sourceName ?? "EMIS";
  const employeeSourceName = simpeg?.sourceName ?? "SIMPEG";
  const gradeRows = rowsByPrefix(data.rows, "Peserta Didik Kelas");
  const hasGradeData = gradeRows.some((row) => row.value > 0);
  const hasGenderData = emis?.students.male != null && emis.students.female != null;
  const mappedGradeTotal = gradeRows.reduce((total, row) => total + row.value, 0);
  const unmappedGradeTotal = Math.max(0, students - mappedGradeTotal);
  const localSource = data.integration?.sources.find((source) => source.code === "database");
  const maleDifference = Math.max(
    0,
    (emis?.students.male ?? 0) - (localSource?.metrics.male ?? 0),
  );
  const femaleDifference = Math.max(
    0,
    (emis?.students.female ?? 0) - (localSource?.metrics.female ?? 0),
  );
  const employmentRows = data.rows.filter((row) => ["PNS", "PPPK", "Non-ASN"].includes(row.indicator));
  const educationRows = data.rows.filter((row) => row.indicator.startsWith("Pendidikan"));

  async function refreshNow() {
    setRefreshing(true);
    const response = await fetch(`/api/dashboard?ts=${Date.now()}`, { cache: "no-store" });
    if (response.ok) {
      setData((await response.json()) as DashboardData);
      setLastUpdated(new Date());
    }
    setRefreshing(false);
  }

  return (
    <main className="min-h-screen text-slate-950">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/55 shadow-sm backdrop-blur-2xl">
        <div className="container flex h-20 items-center justify-between gap-5">
          <Link href="#beranda" className="flex min-w-0 items-center gap-3">
            <span className="kanwil-brand-mark h-12 w-12 rounded-xl">
              <Image src="/brand/man1/logo.png" alt="Logo MAN 1 Lampung Selatan" width={48} height={48} className="h-10 w-10 object-contain" priority />
              <span />
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-sm font-extrabold text-emerald-950 md:text-base">{data.siteSettings.headerInstitutionName}</strong>
              <small className="block truncate text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-emerald-800/65">{data.siteSettings.headerSubtitle}</small>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => <Link key={item.label} href={item.href} className="text-sm font-semibold text-slate-600 transition hover:text-emerald-800">{item.label}</Link>)}
          </nav>

          <div className="flex items-center gap-2">
            <button type="button" onClick={refreshNow} className="hidden items-center gap-2 rounded-full border border-white/80 bg-white/55 px-3 py-2 text-xs font-semibold text-emerald-900 shadow-sm backdrop-blur-xl sm:flex" aria-label="Perbarui data">
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              {lastUpdated ? "Tersinkron" : "Database aktif"}
            </button>
            <button type="button" onClick={() => setMenuOpen((value) => !value)} className="grid h-10 w-10 place-items-center rounded-lg border border-white/80 bg-white/60 shadow-sm backdrop-blur-xl lg:hidden" aria-label="Buka navigasi">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menuOpen ? <nav className="container grid gap-2 border-t border-white/60 py-4 lg:hidden">{navItems.map((item) => <Link key={item.label} href={item.href} onClick={() => setMenuOpen(false)} className="mobile-nav-link">{item.label}</Link>)}</nav> : null}
      </header>

      <section id="beranda" className="relative overflow-hidden border-b border-white/60">
        <div className="absolute inset-0">
          <Image src="/brand/man1/kampus.jpeg" alt="Kampus MAN 1 Lampung Selatan" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(2,44,34,.98)_0%,rgba(3,66,49,.93)_46%,rgba(2,32,27,.45)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(250,204,21,.22),transparent_32%)]" />
        </div>
        <div className="container relative grid min-h-[680px] items-center gap-10 py-20 lg:grid-cols-[1.12fr_.88fr]">
          <div className="max-w-3xl text-white">
            <Badge className="mb-6 border-white/25 bg-white/12 text-emerald-50 backdrop-blur-xl">Satu Data Madrasah • {studentSourceName} • {emis?.period ?? "belum tersedia"}</Badge>
            <h1 className="max-w-3xl text-[2.85rem] font-black leading-[1.08] tracking-[-0.035em] sm:text-6xl sm:leading-[1.04] md:text-7xl">
              <span className="block">{data.siteSettings.heroTitle}</span>
              {" "}
              <span className="mt-2 block text-amber-300 sm:mt-3">{data.siteSettings.heroHighlight}</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-emerald-50/78 md:text-lg">{data.siteSettings.heroDescription}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" className="glass-button-shine bg-amber-400 text-emerald-950 hover:bg-amber-300"><Link href="#data-utama">Lihat data utama <ArrowUpRight className="h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white backdrop-blur-xl hover:bg-white/20"><Link href="/slideshow"><MonitorPlay className="h-4 w-4" /> Mode slideshow</Link></Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-xs text-emerald-100/70">
              <span>NPSN <b className="ml-2 text-white">10816233</b></span>
              <span>NSM <b className="ml-2 text-white">131118010001</b></span>
              <span>Akreditasi <b className="ml-2 text-white">B</b></span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <CoreModuleCard icon={School} label={`01 • ${studentSourceName}`} title="Sekolah & Siswa" value={students} unit="peserta didik" description={`Rekap peserta didik dan rombongan belajar periode ${emis?.period ?? "terbaru"}.`} onClick={() => setActiveModule("EMIS")} />
            <CoreModuleCard icon={IdCard} label={`02 • ${employeeSourceName}`} title={simpeg?.complete ? "Guru & Tenaga Kependidikan" : "Profil teridentifikasi"} value={employeeTotal} unit={simpeg?.complete ? "GTK" : "profil pada snapshot"} description={simpeg?.complete ? "Agregat GTK berdasarkan NSM tanpa menyalin identitas pribadi." : "Temuan pada snapshot parsial, bukan total GTK atau ASN madrasah."} onClick={() => setActiveModule("SIMPEG")} />
            <div className="glass-panel col-span-full flex items-center gap-4 rounded-xl p-4 text-emerald-950">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-900 text-amber-300"><Database className="h-5 w-5" /></div>
              <div><p className="text-xs font-bold uppercase tracking-[.14em] text-emerald-800">Sumber aplikasi</p><p className="mt-1 text-sm text-slate-700">Snapshot lokal Turso/SQLite • sinkronisasi upstream hanya dari panel admin</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell">
        <SectionHeading eyebrow="Ringkasan Madrasah" title="Potret data terverifikasi" description="Angka selalu disertai periode, sumber, dan keterbatasan kualitas datanya." />
        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Users} label="Peserta didik" value={students} suffix="siswa" tone="emerald" />
          <MetricCard icon={BookOpenCheck} label="Rombel" value={studyGroups} suffix="kelas" tone="cyan" />
          <MetricCard icon={IdCard} label={simpeg?.complete ? "GTK" : "Profil teridentifikasi"} value={employeeTotal} suffix={simpeg?.complete ? "guru dan tenaga kependidikan" : "bukan total GTK"} tone="blue" />
          <MetricCard icon={Database} label={simpeg?.complete ? "Guru" : "Cakupan SIMPEG"} value={simpeg?.complete ? simpeg.teachersTotal ?? 0 : simpeg?.coverage ?? 0} suffix={simpeg?.complete ? `${simpeg.staffTotal ?? 0} tenaga kependidikan` : "% record upstream"} tone="gold" />
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-200/80 bg-amber-50/70 p-4 text-sm leading-6 text-amber-950 backdrop-blur-xl">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
          <p><b>Status data:</b> {studentSourceName} mencatat {students.toLocaleString("id-ID")} siswa dan {studyGroups.toLocaleString("id-ID")} rombel pada {emis?.period ?? "snapshot terbaru"}. {hasGenderData ? `Komposisi gender tersedia: ${emis?.students.male ?? 0} laki-laki dan ${emis?.students.female ?? 0} perempuan.` : "Agregat gender belum tersedia."} {hasGradeData ? `Data Lampung berhasil memetakan ${mappedGradeTotal} siswa ke tingkat X, XI, dan XII; ${unmappedGradeTotal} siswa belum terpetakan.` : "Rincian tingkat belum tersedia."} {simpeg?.complete ? `${employeeSourceName} mencatat ${employeeTotal.toLocaleString("id-ID")} GTK, terdiri dari ${simpeg.teachersTotal ?? 0} guru dan ${simpeg.staffTotal ?? 0} tenaga kependidikan.` : `SIMPEG menemukan ${identifiedProfiles} profil pada ${simpeg?.recordsReceived.toLocaleString("id-ID") ?? "-"} dari ${simpeg?.upstreamTotal?.toLocaleString("id-ID") ?? "-"} record upstream; angka tersebut bukan total pegawai.`}</p>
        </div>
        {data.integration ? <SourceStatusGrid sources={data.integration.sources} /> : null}
      </section>

      <section id="data-utama" className="liquid-band border-y border-white/70">
        <div className="section-shell">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionHeading eyebrow="Dua Domain Data" title="Peserta didik dan GTK" description="Sumber setiap snapshot dapat berasal dari API resmi atau database mitra lokal yang sudah diagregasi." />
            <div className="glass-panel flex rounded-xl p-1.5">
              {(["EMIS", "SIMPEG"] as Module[]).map((module) => <button key={module} type="button" onClick={() => setActiveModule(module)} className={`min-w-32 rounded-lg px-5 py-3 text-sm font-bold transition ${activeModule === module ? "bg-emerald-800 text-white shadow-lg" : "text-slate-600 hover:bg-white/55"}`}><span className="mr-2 text-[.65rem] opacity-60">{module === "EMIS" ? "01" : "02"}</span>{module}</button>)}
            </div>
          </div>

          {activeModule === "EMIS" ? (
            <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
              <Card className="glass-panel overflow-hidden border-white/80">
                <CardHeader><Badge variant="success" className="w-fit">{studentSourceName} • Peserta Didik</Badge><CardTitle>Rekap siswa per tingkat</CardTitle></CardHeader>
                <CardContent>{hasGradeData ? <div className="grid gap-4"><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={gradeRows} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}><CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#cbd5e1" /><XAxis dataKey="shortLabel" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip cursor={{ fill: "rgba(16,185,129,.08)" }} /><Bar dataKey="value" name="Siswa" fill="#047857" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>{unmappedGradeTotal > 0 ? <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-sm leading-6 text-amber-950"><strong>Mengapa ada selisih {unmappedGradeTotal} siswa?</strong><p className="mt-1">GIS mencatat {emis?.students.male ?? 0} laki-laki dan {emis?.students.female ?? 0} perempuan. Data Lampung yang berstatus aktif mencatat {localSource?.metrics.male ?? 0} laki-laki dan {localSource?.metrics.female ?? 0} perempuan. Selisihnya {maleDifference} laki-laki dan {femaleDifference} perempuan. Karena GIS publik tidak menyediakan daftar individu, dua siswa tersebut belum dapat ditentukan kelasnya secara pasti.</p></div> : null}</div> : <DataPending label="Rincian tingkat ditahan sampai klasifikasi status siswa konsisten dengan total rekap." />}</CardContent>
              </Card>
              <Card className="glass-panel overflow-hidden border-white/80">
                <CardHeader><Badge variant="outline" className="w-fit">Periode Snapshot</Badge><CardTitle>{emis?.period ?? "Data belum tersedia"}</CardTitle></CardHeader>
                <CardContent className="grid gap-3 text-sm leading-6 text-slate-600"><p>Sumber aktif: {studentSourceName}. Total resmi yang dipakai adalah {students.toLocaleString("id-ID")} siswa dan {studyGroups.toLocaleString("id-ID")} rombel.</p><p>{hasGenderData ? `GIS menyediakan agregat ${emis?.students.male ?? 0} siswa laki-laki dan ${emis?.students.female ?? 0} siswa perempuan.` : "Agregat gender belum tersedia."}</p>{hasGradeData ? <p>Data Lampung memetakan Kelas X {emis?.students.grade10 ?? 0}, Kelas XI {emis?.students.grade11 ?? 0}, dan Kelas XII {emis?.students.grade12 ?? 0}. Total terpetakan {mappedGradeTotal}; selisih {unmappedGradeTotal} berasal dari perbedaan cakupan status aktif antara Data Lampung dan total publik GIS.</p> : <p>Rincian tingkat belum tersedia.</p>}</CardContent>
              </Card>
              <SchoolProfileCard />
              <IntegrationCard module="EMIS" endpoint="/api/integrations/emis" bullets={["Profil satuan pendidikan", "Rekap siswa, tingkat, dan rombel", "Fallback database saat API belum aktif"]} />
            </div>
          ) : (
            <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
              <Card className="glass-panel overflow-hidden border-white/80">
                <CardHeader><Badge className="w-fit bg-amber-100 text-amber-900 hover:bg-amber-100">{employeeSourceName} • {simpeg?.complete ? "GTK" : "Snapshot Parsial"}</Badge><CardTitle>{simpeg?.complete ? "Komposisi status GTK" : "Komposisi profil teridentifikasi"}</CardTitle></CardHeader>
                <CardContent><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={employmentRows} layout="vertical" margin={{ left: 15, right: 24 }}><CartesianGrid strokeDasharray="4 6" horizontal={false} stroke="#cbd5e1" /><XAxis type="number" tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="indicator" width={74} tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="value" name="Pegawai" fill="#d97706" radius={[0, 8, 8, 0]} /></BarChart></ResponsiveContainer></div></CardContent>
              </Card>
              <Card className="glass-panel overflow-hidden border-white/80">
                <CardHeader><Badge variant="outline" className="w-fit">Kualifikasi Snapshot</Badge><CardTitle>Pendidikan GTK</CardTitle></CardHeader>
                <CardContent className="grid gap-4">{educationRows.map((row) => <ProgressStat key={row.id} label={row.indicator.replace("Pendidikan ", "")} value={row.value} total={employeeTotal} />)}</CardContent>
              </Card>
              <Card className="glass-panel overflow-hidden border-white/80">
                <CardContent className="grid gap-4 p-6 sm:grid-cols-3"><MiniStat label={simpeg?.complete ? "Total GTK" : "Profil teridentifikasi"} value={employeeTotal} /><MiniStat label={simpeg?.complete ? "Guru / calon guru" : "Record diterima"} value={simpeg?.complete ? simpeg.teachersTotal ?? 0 : simpeg?.recordsReceived ?? 0} /><MiniStat label={simpeg?.complete ? "Tenaga kependidikan" : "Total upstream"} value={simpeg?.complete ? simpeg.staffTotal ?? 0 : simpeg?.upstreamTotal ?? 0} /></CardContent>
              </Card>
              <IntegrationCard module="SIMPEG" endpoint="/api/integrations/simpeg" bullets={["Profil ASN tanpa data sensitif", "Status PNS dan PPPK", "Kualifikasi pendidikan"]} />
            </div>
          )}

          <Card className="glass-panel mt-5 overflow-hidden border-white/80">
            <CardHeader className="flex-row items-center justify-between gap-4"><div><Badge variant="outline" className="mb-2">Tabel sumber</Badge><CardTitle>{activeModule} • Data ringkas</CardTitle></div><span className="text-xs text-slate-500">{moduleRows.length} baris</span></CardHeader>
            <CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Indikator</TableHead><TableHead>Periode</TableHead><TableHead className="text-right">Nilai</TableHead><TableHead>Sumber</TableHead></TableRow></TableHeader><TableBody>{moduleRows.map((row) => <TableRow key={row.id}><TableCell className="font-semibold">{row.indicator}</TableCell><TableCell>{row.period}</TableCell><TableCell className="text-right font-bold">{row.value.toLocaleString("id-ID")} {row.unit}</TableCell><TableCell className="text-xs text-slate-500">{row.source}</TableCell></TableRow>)}</TableBody></Table></CardContent>
          </Card>
        </div>
      </section>

      <section id="profil-asn" className="section-shell">
        <SectionHeading eyebrow="Profil Publik" title="Penggerak madrasah" description="Profil yang ditampilkan berasal dari konten resmi yang dikelola admin, bukan dari tabel mentah pegawai." />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{data.activities.slice(0, 4).map((person, index) => <article key={person.id} className={`glass-panel group overflow-hidden rounded-xl ${index === 0 ? "sm:col-span-2 lg:col-span-1" : ""}`}><div className={`relative aspect-[4/5] overflow-hidden ${person.imageUrl.endsWith("/logo.png") ? "bg-white/70" : ""}`}><Image src={person.imageUrl} alt={person.title} fill className={person.imageUrl.endsWith("/logo.png") ? "object-contain p-8 transition duration-500 group-hover:scale-[1.03]" : "object-cover object-left transition duration-500 group-hover:scale-[1.03]"} /><div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-emerald-950/85 to-transparent" /><Badge className="absolute right-3 top-3 border-white/30 bg-white/80 text-emerald-900 backdrop-blur-xl">Konten Resmi</Badge></div><div className="p-5"><p className="text-[.65rem] font-bold uppercase tracking-[.16em] text-emerald-700">{person.caption}</p><h3 className="mt-2 text-lg font-extrabold leading-snug">{person.title}</h3></div></article>)}</div>
      </section>

      <section id="integrasi" className="border-y border-white/20 bg-emerald-950 text-white">
        <div className="container grid gap-10 py-16 lg:grid-cols-[.75fr_1.25fr] lg:items-center">
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-amber-300">Arsitektur Backend</p><h2 className="mt-4 text-4xl font-black tracking-tight">Siap dari data contoh<br />ke sumber resmi.</h2><p className="mt-5 max-w-lg text-sm leading-7 text-emerald-100/65">Drizzle menyimpan konten pada Turso/libSQL untuk produksi dan SQLite untuk pengembangan lokal. Better Auth melindungi perubahan data di panel admin.</p></div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center"><FlowStep number="01" title="API & database mitra" text="Sumber data server-side" /><span className="hidden text-amber-300 md:block">→</span><FlowStep number="02" title="View agregat" text="Validasi & minimisasi data" /><span className="hidden text-amber-300 md:block">→</span><FlowStep number="03" title="SQLite / Turso" text="Snapshot dashboard" /></div>
        </div>
      </section>

      <section className="section-shell grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
        <Card className="glass-panel border-white/80"><CardHeader><Badge variant="outline" className="w-fit">Kontak Madrasah</Badge><CardTitle>{data.contact.institution}</CardTitle></CardHeader><CardContent className="grid gap-4 text-sm text-slate-600"><p className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-emerald-700" />{data.contact.address}</p><p className="flex gap-3"><Building2 className="h-5 w-5 shrink-0 text-emerald-700" />Telepon {data.contact.phone}</p><a href={data.contact.website} target="_blank" rel="noreferrer" className="font-bold text-emerald-800">Kunjungi website resmi <ArrowUpRight className="ml-1 inline h-4 w-4" /></a></CardContent></Card>
        <div className="glass-panel overflow-hidden rounded-xl border-white/80 p-2"><iframe title="Lokasi MAN 1 Lampung Selatan" src={data.contact.mapEmbedUrl} className="h-[320px] w-full rounded-lg border-0" loading="lazy" /></div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950 text-white"><div className="container grid gap-6 py-9 md:grid-cols-[1fr_1.2fr] md:items-center"><div className="flex items-center gap-3"><Image src="/brand/man1/logo.png" alt="" width={44} height={44} className="h-11 w-11 object-contain" /><div><p className="font-bold">{data.siteSettings.footerTitle}</p><p className="text-xs text-slate-400">{data.siteSettings.footerSubtitle}</p></div></div><div className="grid gap-2 text-xs leading-5 text-slate-400 md:text-right"><p>{data.siteSettings.footerDescription}</p><p className="font-semibold text-slate-300">{data.contact.address} • {data.contact.phone}</p></div></div></footer>
    </main>
  );
}

function CoreModuleCard({ icon: Icon, label, title, value, unit, description, onClick }: { icon: typeof School; label: string; title: string; value: number; unit: string; description: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="glass-panel group rounded-xl p-5 text-left transition hover:-translate-y-1"><div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-900 text-amber-300"><Icon className="h-5 w-5" /></span><span className="text-[.62rem] font-black tracking-[.16em] text-emerald-800">{label}</span></div><h2 className="mt-6 text-xl font-extrabold text-emerald-950">{title}</h2><p className="mt-2 text-3xl font-black tracking-tight text-emerald-900">{value.toLocaleString("id-ID")} <small className="text-xs font-semibold text-slate-500">{unit}</small></p><p className="mt-3 text-xs leading-5 text-slate-600">{description}</p></button>;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="max-w-3xl"><p className="eyebrow">{eyebrow}</p><h2 className="mt-3 text-3xl font-black tracking-tight text-emerald-950 md:text-4xl">{title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{description}</p></div>;
}

function MetricCard({ icon: Icon, label, value, suffix, tone }: { icon: typeof Users; label: string; value: number; suffix: string; tone: string }) {
  const tones: Record<string, string> = { emerald: "bg-emerald-100 text-emerald-800", cyan: "bg-cyan-100 text-cyan-800", blue: "bg-blue-100 text-blue-800", gold: "bg-amber-100 text-amber-800", violet: "bg-violet-100 text-violet-800" };
  return <Card className="glass-panel border-white/80"><CardContent className="p-5"><div className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}><Icon className="h-5 w-5" /></div><p className="mt-5 text-[.66rem] font-bold uppercase tracking-[.14em] text-slate-500">{label}</p><p className="mt-1 text-3xl font-black tracking-tight">{value.toLocaleString("id-ID")}</p><p className="text-xs text-slate-500">{suffix}</p></CardContent></Card>;
}

function SchoolProfileCard() {
  const items = [["NPSN", "10816233"], ["NSM", "131118010001"], ["Status", "Negeri"], ["Akreditasi", "B"]];
  return <Card className="glass-panel overflow-hidden border-white/80"><CardHeader className="flex-row items-center gap-4"><span className="kanwil-brand-mark h-16 w-16 rounded-xl"><Image src="/brand/man1/logo.png" alt="" width={60} height={60} className="h-14 w-14 object-contain" /><span /></span><div><Badge variant="outline" className="mb-2">Profil Sekolah</Badge><CardTitle>MAN 1 Lampung Selatan</CardTitle><p className="mt-1 text-xs text-slate-500">Wayurang • Kalianda</p></div></CardHeader><CardContent className="grid grid-cols-2 gap-3">{items.map(([label, value]) => <MiniStat key={label} label={label} value={value} />)}</CardContent></Card>;
}

function IntegrationCard({ module, endpoint, bullets }: { module: Module; endpoint: string; bullets: string[] }) {
  return <Card className="liquid-panel-dark overflow-hidden"><CardContent className="p-6"><Badge className="border-white/20 bg-white/10 text-amber-200">Jalur Integrasi {module}</Badge><h3 className="mt-4 text-xl font-extrabold">Adapter API server-side aktif</h3><p className="mt-2 text-xs leading-5 text-emerald-100/65">Alamat upstream dan kredensial disimpan pada environment server, bukan pada browser.</p><div className="mt-4 flex items-center gap-3 rounded-lg border border-white/15 bg-white/10 p-3"><span className="rounded bg-amber-300 px-2 py-1 text-[.6rem] font-black text-emerald-950">GET</span><code className="text-xs text-emerald-50">{endpoint}</code><span className="ml-auto text-[.65rem] font-bold text-emerald-300">READY</span></div><ul className="mt-4 grid gap-2 text-xs text-emerald-50/75">{bullets.map((bullet) => <li key={bullet} className="flex gap-2"><span className="text-amber-300">✓</span>{bullet}</li>)}</ul></CardContent></Card>;
}

function DataPending({ label }: { label: string }) {
  return <div className="grid min-h-[220px] place-items-center rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 p-6 text-center"><div><Database className="mx-auto h-8 w-8 text-emerald-700" /><p className="mt-3 text-sm font-semibold text-emerald-950">Data belum ditampilkan</p><p className="mt-1 max-w-sm text-xs leading-5 text-slate-600">{label}</p></div></div>;
}

function ProgressStat({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = Math.round(value / Math.max(total, 1) * 100);
  return <div><div className="flex justify-between text-sm"><span className="font-semibold">{label}</span><strong>{value}</strong></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-emerald-100"><span className="block h-full rounded-full bg-gradient-to-r from-emerald-700 to-amber-400" style={{ width: `${percentage}%` }} /></div><p className="mt-1 text-right text-[.65rem] text-slate-500">{percentage}% dari profil teridentifikasi</p></div>;
}

function SourceStatusGrid({ sources }: { sources: DashboardSourceState[] }) {
  return <div className="mt-4 grid gap-3 md:grid-cols-3">{sources.map((source) => <Card key={source.code} className="glass-panel border-white/80"><CardContent className="flex items-start justify-between gap-4 p-4"><div><p className="text-xs font-black uppercase tracking-[.14em] text-slate-500">{source.name}</p><p className="mt-2 text-sm font-semibold text-slate-900">{source.period ?? "Read model lokal"}</p><p className="mt-1 text-xs text-slate-500">{source.lastUpdated ? formatSourceTime(source.lastUpdated) : "Belum pernah diperbarui"}</p></div><Badge variant={source.status === "fresh" ? "success" : "outline"}>{sourceStatusLabel(source.status)}</Badge></CardContent></Card>)}</div>;
}

function sourceStatusLabel(status: DashboardSourceState["status"]) {
  return ({ fresh: "Fresh", stale: "Stale", fallback: "Fallback", syncing: "Syncing", failed: "Failed", not_configured: "Belum dikonfigurasi" })[status];
}

function formatSourceTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(date);
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return <div className="liquid-chart-stat"><span>{label}</span><strong>{typeof value === "number" ? value.toLocaleString("id-ID") : value}</strong></div>;
}

function FlowStep({ number, title, text }: { number: string; title: string; text: string }) {
  return <div className="rounded-xl border border-white/20 bg-white/10 p-5 backdrop-blur-xl"><span className="text-[.65rem] font-black tracking-[.18em] text-amber-300">{number}</span><strong className="mt-5 block text-sm">{title}</strong><small className="mt-1 block text-xs text-emerald-100/55">{text}</small></div>;
}

function indicatorValue(data: DashboardData, name: string) {
  return data.indicators.find((item) => item.name === name)?.value ?? 0;
}

function rowsByPrefix(rows: DashboardRow[], prefix: string) {
  return rows.filter((row) => row.indicator.startsWith(prefix)).map((row) => ({ ...row, shortLabel: row.indicator.replace("Peserta Didik ", "") }));
}
