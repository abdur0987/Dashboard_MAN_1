export type IndicatorStatus = "aktif" | "perlu-validasi";

export type Indicator = {
  id: number;
  name: string;
  description: string;
  category: string;
  unit: string;
  source: string;
  year: number;
  value: number;
  trend: number;
  status: IndicatorStatus;
};

export type DashboardRow = {
  id: number;
  indicator: string;
  category: string;
  region: string;
  period: string;
  year: number;
  value: number;
  unit: string;
  source: string;
};

export type ChartPoint = {
  year: number;
} & Record<string, number>;

export type Publication = {
  id: number;
  title: string;
  description: string;
  date: string;
  category: string;
  fileLabel: string;
};

export type DataCatalog = {
  id: number;
  title: string;
  description: string;
  category: string;
  year: number;
  producer: string;
  frequency: string;
  format: string;
  sourceUrl: string;
  excelUrl: string;
  pdfUrl: string;
  standardData: string;
  metadata: string;
};

export type DatasetDetail = {
  id: string;
  datasetId: number;
  tableNumber: string;
  title: string;
  module: string;
  category: string;
  year: number;
  producer: string;
  description: string;
  headers: string[];
  rows: (string | number)[][];
  chartData: {
    label: string;
    value: number;
  }[];
  standardData: string;
  metadata: string;
};

export type ReleaseSchedule = {
  id: number;
  title: string;
  period: string;
  language: string;
  scheduledDate: string;
  realizedDate: string;
  status: "rencana" | "rilis";
  documentUrl: string;
  format: string;
};

export type OfficeLocation = {
  id: number;
  name: string;
  type: "kanwil" | "kabupaten-kota";
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  mapsUrl: string;
};

export type ActivitySlide = {
  id: number;
  title: string;
  caption: string;
  imageUrl: string;
};

export type VideoItem = {
  id: number;
  title: string;
  description: string;
  embedUrl: string;
};

export type NewsItem = {
  id: number;
  title: string;
  category: string;
  date: string;
  imageUrl: string;
  url: string;
};

export type ExecutiveSchedule = {
  id: number;
  date: string;
  time: string;
  title: string;
  unit: string;
  location: string;
  priority: "utama" | "-";
  status: "terjadwal" | "berjalan" | "selesai" | "belum";
};

export type AwardItem = {
  id: number;
  title: string;
  description: string;
  year: number;
  imageUrl: string;
  alt: string;
};

export type AwardCollection = {
  id: string;
  title: string;
  description: string;
  items: AwardItem[];
};

export type ContactInfo = {
  institution: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  youtube: string;
  website: string;
  mapEmbedUrl: string;
};

export type DashboardData = {
  indicators: Indicator[];
  rows: DashboardRow[];
  chartSeries: ChartPoint[];
  publications: Publication[];
  datasets: DataCatalog[];
  datasetDetails: DatasetDetail[];
  releaseSchedules: ReleaseSchedule[];
  officeLocations: OfficeLocation[];
  activities: ActivitySlide[];
  videos: VideoItem[];
  latestNews: NewsItem[];
  executiveSchedules: ExecutiveSchedule[];
  awardCollections: AwardCollection[];
  contact: ContactInfo;
  filters: {
    years: string[];
    categories: string[];
    regions: string[];
  };
};
