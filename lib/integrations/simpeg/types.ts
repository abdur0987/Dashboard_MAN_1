export type SimpegEmployee = {
  NIP?: string;
  ID?: string | number;
  NAMA?: string;
  NAMA_LENGKAP?: string;
  PENDIDIKAN?: string;
  TAMPIL_JABATAN?: string;
  LEVEL_JABATAN?: string;
  SATUAN_KERJA?: string;
  KODE_SATKER?: string;
  STATUS_PEGAWAI?: string;
  SERTIFIKASI?: string | number | boolean;
  NSM?: string;
  NPSN?: string;
};

export type SimpegPage = { total?: number; size?: number; data?: SimpegEmployee[] };
