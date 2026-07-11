import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const indicators = sqliteTable("dashboard_indicators", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  unit: text("unit").notNull(),
  source: text("source").notNull(),
  year: integer("year").notNull(),
  value: real("value").notNull(),
  trend: real("trend").notNull(),
  status: text("status", { enum: ["aktif", "perlu-validasi"] }).notNull(),
});

export const dashboardRows = sqliteTable("dashboard_rows", {
  id: integer("id").primaryKey(),
  indicator: text("indicator").notNull(),
  category: text("category").notNull(),
  region: text("region").notNull(),
  period: text("period").notNull(),
  year: integer("year").notNull(),
  value: real("value").notNull(),
  unit: text("unit").notNull(),
  source: text("source").notNull(),
});

export const chartSeries = sqliteTable("dashboard_chart_series", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  year: integer("year").notNull(),
  category: text("category").notNull(),
  value: real("value").notNull(),
});

export const executiveSchedules = sqliteTable("dashboard_executive_schedules", {
  id: integer("id").primaryKey(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  title: text("title").notNull(),
  unit: text("unit").notNull(),
  location: text("location").notNull(),
  priority: text("priority", { enum: ["utama", "-"] }).notNull(),
  status: text("status", { enum: ["terjadwal", "berjalan", "selesai", "belum"] }).notNull(),
});

export const awardCollections = sqliteTable("dashboard_award_collections", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const awardItems = sqliteTable("dashboard_award_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  collectionId: text("collection_id")
    .notNull()
    .references(() => awardCollections.id, { onDelete: "cascade" }),
  itemId: integer("item_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  year: integer("year").notNull(),
  imageUrl: text("image_url").notNull(),
  alt: text("alt").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const publications = sqliteTable("dashboard_publications", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: text("date").notNull(),
  category: text("category").notNull(),
  fileLabel: text("file_label").notNull(),
});

export const datasets = sqliteTable("dashboard_datasets", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  year: integer("year").notNull(),
  producer: text("producer").notNull(),
  frequency: text("frequency").notNull(),
  format: text("format").notNull(),
  sourceUrl: text("source_url").notNull(),
  excelUrl: text("excel_url").notNull(),
  pdfUrl: text("pdf_url").notNull(),
  standardData: text("standard_data").notNull(),
  metadata: text("metadata").notNull(),
});

export const releaseSchedules = sqliteTable("dashboard_release_schedules", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  period: text("period").notNull(),
  language: text("language").notNull(),
  scheduledDate: text("scheduled_date").notNull(),
  realizedDate: text("realized_date").notNull(),
  status: text("status", { enum: ["rencana", "rilis"] }).notNull(),
  documentUrl: text("document_url").notNull(),
  format: text("format").notNull(),
});

export const officeLocations = sqliteTable("dashboard_office_locations", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["kanwil", "kabupaten-kota"] }).notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  mapsUrl: text("maps_url").notNull(),
});

export const activities = sqliteTable("dashboard_activities", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  caption: text("caption").notNull(),
  imageUrl: text("image_url").notNull(),
});

export const videos = sqliteTable("dashboard_videos", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  embedUrl: text("embed_url").notNull(),
});

export const contactInfo = sqliteTable("dashboard_contact_info", {
  id: integer("id").primaryKey(),
  institution: text("institution").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp").notNull(),
  email: text("email").notNull(),
  instagram: text("instagram").notNull(),
  youtube: text("youtube").notNull(),
  website: text("website").notNull(),
  mapEmbedUrl: text("map_embed_url").notNull(),
});

export const filters = sqliteTable("dashboard_filters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind", { enum: ["year", "category", "region"] }).notNull(),
  value: text("value").notNull(),
  sortOrder: integer("sort_order").notNull(),
});
