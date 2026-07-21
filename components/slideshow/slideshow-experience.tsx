"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Database, Maximize2, Minimize2, Pause, Play, School, Users, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { DashboardData } from "@/lib/types";

const slides = [
  { id: "overview", label: "Ringkasan", duration: 10000 },
  { id: "emis", label: "EMIS", duration: 11000 },
  { id: "simpeg", label: "SIMPEG", duration: 11000 },
  { id: "profiles", label: "Profil Publik", duration: 13000 },
] as const;

export function SlideShowExperience({ data: initialData, onClose }: { data: DashboardData; onClose?: () => void }) {
  const [data, setData] = useState(initialData);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clock, setClock] = useState<Date | null>(null);
  const stageRef = useRef<HTMLElement>(null);
  const activeSlide = slides[activeIndex];

  const next = useCallback(() => setActiveIndex((index) => (index + 1) % slides.length), []);
  const previous = useCallback(() => setActiveIndex((index) => (index - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    setClock(new Date());
    const clockTimer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(next, activeSlide.duration);
    return () => window.clearTimeout(timer);
  }, [activeSlide.duration, activeIndex, next, playing]);

  useEffect(() => {
    const refresh = async () => {
      const response = await fetch(`/api/dashboard?ts=${Date.now()}`, { cache: "no-store" });
      if (response.ok) setData((await response.json()) as DashboardData);
    };
    const timer = window.setInterval(refresh, 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFullscreen);
    return () => document.removeEventListener("fullscreenchange", handleFullscreen);
  }, []);

  const totals = useMemo(() => ({
    students: valueOf(data, "Peserta Didik"),
    studyGroups: valueOf(data, "Rombongan Belajar"),
    identifiedProfiles: data.integration?.simpeg?.complete
      ? data.integration.simpeg.employeesTotal ?? 0
      : valueOf(data, "Profil teridentifikasi") || valueOf(data, "Guru dan Tenaga Kependidikan"),
    simpegReceived: data.integration?.simpeg?.recordsReceived ?? 0,
    simpegUpstream: data.integration?.simpeg?.upstreamTotal ?? 0,
    teachers: data.integration?.simpeg?.teachersTotal ?? 0,
    staff: data.integration?.simpeg?.staffTotal ?? 0,
    employeeComplete: data.integration?.simpeg?.complete ?? false,
  }), [data]);

  const gradeRows = data.rows.filter((row) => row.indicator.startsWith("Peserta Didik Kelas")).map((row) => ({ label: row.indicator.replace("Peserta Didik ", ""), value: row.value }));
  const employmentRows = data.rows.filter((row) => ["PNS", "PPPK", "Non-ASN"].includes(row.indicator)).map((row) => ({ label: row.indicator, value: row.value }));

  async function toggleFullscreen() {
    if (!document.fullscreenElement) await stageRef.current?.requestFullscreen();
    else await document.exitFullscreen();
  }

  function close() {
    if (onClose) onClose();
    else window.location.assign("/");
  }

  return (
    <main ref={stageRef} className="relative min-h-screen overflow-hidden bg-[#031f19] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(16,185,129,.25),transparent_34%),radial-gradient(circle_at_88%_5%,rgba(245,158,11,.2),transparent_28%),linear-gradient(145deg,#052e25,#020d0b)]" />
      <div className="absolute -left-32 top-1/3 h-96 w-96 rounded-full border border-white/10" />
      <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />

      <div className="relative grid min-h-screen grid-rows-[auto_1fr_auto] p-4 md:p-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-2xl">
          <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white/90"><Image src="/brand/man1/logo.png" alt="" width={42} height={42} className="h-10 w-10 object-contain" /></span><div><strong className="block text-sm">Dashboard MAN 1 Lampung Selatan</strong><small className="text-[.62rem] font-bold uppercase tracking-[.16em] text-emerald-200/70">Live Presentation • Snapshot Agregat</small></div></div>
          <div className="hidden items-center gap-2 lg:flex">{slides.map((slide, index) => <button key={slide.id} type="button" onClick={() => setActiveIndex(index)} className={`rounded-full border px-4 py-2 text-xs font-bold transition ${activeIndex === index ? "border-amber-300 bg-amber-300 text-emerald-950" : "border-white/15 bg-white/5 text-white/55 hover:bg-white/10"}`}>{slide.label}</button>)}</div>
          <div className="flex items-center gap-2"><span className="hidden text-right sm:block"><strong className="block text-sm tabular-nums">{clock?.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) ?? "--.--"}</strong><small className="text-[.6rem] uppercase tracking-wider text-white/45">WIB • Data tersinkron</small></span><ControlButton label="Tutup" onClick={close}><X className="h-4 w-4" /></ControlButton></div>
        </header>

        <section className="grid min-h-0 place-items-center py-5 md:py-8">
          {activeSlide.id === "overview" ? <OverviewSlide totals={totals} /> : null}
          {activeSlide.id === "emis" ? <DataSlide eyebrow={`01 • ${data.integration?.emis?.sourceName ?? "EMIS"}`} title="Profil sekolah dan peserta didik" description={`Rekap peserta didik dan rombongan belajar periode ${data.integration?.emis?.period ?? "terbaru"}.`} total={totals.students} totalLabel="peserta didik" icon={<School className="h-7 w-7" />} data={gradeRows} color="#34d399" source={`${data.integration?.emis?.sourceName ?? "EMIS"} • ${data.integration?.emis?.period ?? "-"}`} /> : null}
          {activeSlide.id === "simpeg" ? <DataSlide eyebrow={`02 • ${data.integration?.simpeg?.sourceName ?? "SIMPEG"}`} title={totals.employeeComplete ? "Guru dan tenaga kependidikan" : "Profil teridentifikasi"} description={totals.employeeComplete ? `${totals.teachers} guru dan ${totals.staff} tenaga kependidikan; total dan status pegawai dari database lokal, klasifikasi publik dari GIS Kemenag.` : `Temuan pada ${totals.simpegReceived.toLocaleString("id-ID")} dari ${totals.simpegUpstream.toLocaleString("id-ID")} record upstream; bukan total pegawai.`} total={totals.identifiedProfiles} totalLabel={totals.employeeComplete ? "GTK" : "profil pada snapshot parsial"} icon={<Users className="h-7 w-7" />} data={employmentRows} color="#fbbf24" source={data.integration?.simpeg?.sourceName ?? "SIMPEG"} /> : null}
          {activeSlide.id === "profiles" ? <ProfilesSlide data={data} /> : null}
        </section>

        <footer className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-3 backdrop-blur-2xl">
          <div className="flex items-center gap-2"><ControlButton label="Sebelumnya" onClick={previous}><ArrowLeft className="h-4 w-4" /></ControlButton><ControlButton label={playing ? "Jeda" : "Putar"} onClick={() => setPlaying((value) => !value)}>{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</ControlButton><ControlButton label="Berikutnya" onClick={next}><ArrowRight className="h-4 w-4" /></ControlButton></div>
          <div className="min-w-0 flex-1 px-3"><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><span key={`${activeIndex}-${playing}`} className={`block h-full rounded-full bg-gradient-to-r from-emerald-300 to-amber-300 ${playing ? "animate-[progress_var(--slide-duration)_linear_forwards]" : ""}`} style={{ "--slide-duration": `${activeSlide.duration}ms` } as React.CSSProperties} /></div><p className="mt-1 text-center text-[.6rem] uppercase tracking-[.15em] text-white/40">{activeIndex + 1} / {slides.length} • {activeSlide.label}</p></div>
          <ControlButton label="Layar penuh" onClick={toggleFullscreen}>{isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</ControlButton>
        </footer>
      </div>
    </main>
  );
}

function OverviewSlide({ totals }: { totals: { students: number; studyGroups: number; identifiedProfiles: number; simpegReceived: number; simpegUpstream: number; teachers: number; staff: number; employeeComplete: boolean } }) {
  return <div className="grid w-full max-w-7xl gap-5 lg:grid-cols-[1.05fr_.95fr] lg:items-center"><div><p className="text-xs font-black uppercase tracking-[.22em] text-amber-300">Satu Data Madrasah • Snapshot Terverifikasi</p><h1 className="mt-5 text-5xl font-black leading-[.98] tracking-[-.055em] md:text-7xl">Data yang jelas.<br /><span className="text-emerald-300">Cakupan yang jujur.</span></h1><p className="mt-6 max-w-2xl text-base leading-7 text-emerald-50/65">Dashboard MAN 1 Lampung Selatan menampilkan agregat aman beserta periode, sumber, dan keterbatasannya.</p><div className="mt-8 flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl"><Database className="h-5 w-5 text-amber-300" /><span className="text-sm text-emerald-100/75">Dashboard publik, admin, dan slideshow membaca snapshot lokal yang sama.</span></div></div><div className="grid gap-4 sm:grid-cols-2"><HeroStat label="Peserta Didik" value={totals.students} suffix="siswa" /><HeroStat label="Rombongan Belajar" value={totals.studyGroups} suffix="rombel" /><HeroStat label={totals.employeeComplete ? "GTK" : "Profil teridentifikasi"} value={totals.identifiedProfiles} suffix={totals.employeeComplete ? "agregat lokal" : "bukan total GTK"} /><HeroStat label={totals.employeeComplete ? "Guru / Tendik" : "Record SIMPEG"} value={totals.employeeComplete ? totals.teachers : totals.simpegReceived} suffix={totals.employeeComplete ? `${totals.staff} tenaga kependidikan` : `dari ${totals.simpegUpstream.toLocaleString("id-ID")} upstream`} /></div></div>;
}

function DataSlide({ eyebrow, title, description, total, totalLabel, icon, data, color, source }: { eyebrow: string; title: string; description: string; total: number; totalLabel: string; icon: React.ReactNode; data: { label: string; value: number }[]; color: string; source: string }) {
  const hasData = data.some((item) => item.value > 0);
  return <div className="grid w-full max-w-7xl gap-5 lg:grid-cols-[.7fr_1.3fr] lg:items-stretch"><div className="rounded-2xl border border-white/15 bg-white/10 p-7 backdrop-blur-2xl"><span className="grid h-14 w-14 place-items-center rounded-xl bg-white/10 text-amber-300">{icon}</span><p className="mt-8 text-xs font-black uppercase tracking-[.2em] text-emerald-300">{eyebrow}</p><h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">{title}</h1><p className="mt-4 text-sm leading-7 text-emerald-50/60">{description}</p><div className="mt-8 border-t border-white/15 pt-6"><strong className="text-6xl font-black tracking-tighter">{total.toLocaleString("id-ID")}</strong><span className="ml-3 text-sm text-emerald-100/55">{totalLabel}</span></div><p className="mt-8 text-[.65rem] uppercase tracking-[.15em] text-white/35">Sumber • {source}</p></div><div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-2xl">{hasData ? <div className="h-[min(58vh,520px)]"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 30, right: 30, bottom: 10, left: 0 }}><CartesianGrid stroke="rgba(255,255,255,.1)" strokeDasharray="5 7" vertical={false} /><XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,.65)", fontSize: 12 }} axisLine={{ stroke: "rgba(255,255,255,.2)" }} /><YAxis tick={{ fill: "rgba(255,255,255,.5)", fontSize: 11 }} axisLine={false} /><Tooltip contentStyle={{ background: "#052e25", border: "1px solid rgba(255,255,255,.2)", borderRadius: 12 }} /><Bar dataKey="value" fill={color} radius={[12, 12, 2, 2]} /></BarChart></ResponsiveContainer></div> : <div className="grid h-[min(58vh,520px)] min-h-72 place-items-center text-center"><div><Database className="mx-auto h-10 w-10 text-emerald-300" /><p className="mt-4 font-bold">Rincian data belum tersedia</p><p className="mt-2 max-w-md text-sm leading-6 text-emerald-50/55">Menunggu pemetaan field sumber resmi agar slideshow tidak menampilkan angka contoh.</p></div></div>}</div></div>;
}

function ProfilesSlide({ data }: { data: DashboardData }) {
  return <div className="w-full max-w-7xl"><div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">Profil Publik</p><h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Penggerak MAN 1 Lampung Selatan</h1></div><p className="max-w-md text-sm leading-6 text-emerald-50/55">Profil berasal dari konten resmi yang dikelola admin, bukan daftar pegawai mentah.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{data.activities.slice(0, 4).map((person) => <article key={person.id} className="overflow-hidden rounded-2xl border border-white/15 bg-white/10 backdrop-blur-2xl"><div className={`relative aspect-[4/5] ${person.imageUrl.endsWith("/logo.png") ? "bg-white/90" : ""}`}><Image src={person.imageUrl} alt={person.title} fill className={person.imageUrl.endsWith("/logo.png") ? "object-contain p-8" : "object-cover object-left"} /><div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#031f19] to-transparent" /></div><div className="p-5"><p className="text-[.62rem] font-black uppercase tracking-[.15em] text-amber-300">{person.caption}</p><h2 className="mt-2 text-lg font-extrabold leading-snug">{person.title}</h2></div></article>)}</div></div>;
}

function HeroStat({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return <div className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-2xl"><p className="text-[.65rem] font-black uppercase tracking-[.16em] text-emerald-200/60">{label}</p><strong className="mt-5 block text-5xl font-black tracking-tighter">{value.toLocaleString("id-ID")}</strong><span className="mt-1 block text-xs text-amber-300">{suffix}</span></div>;
}

function ControlButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} aria-label={label} className="grid h-10 w-10 place-items-center rounded-lg border border-white/15 bg-white/10 text-white transition hover:bg-white/20">{children}</button>;
}

function valueOf(data: DashboardData, name: string) {
  return data.indicators.find((item) => item.name === name)?.value ?? 0;
}
