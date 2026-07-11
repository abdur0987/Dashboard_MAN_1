import { executeSql } from "@/lib/db/client";

let migrated = false;
let migrationPromise: Promise<void> | null = null;

export async function ensureDatabaseReady() {
  if (migrated) {
    return;
  }

  if (!migrationPromise) {
    migrationPromise = executeSql(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      emailVerified INTEGER NOT NULL,
      image TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY NOT NULL,
      expiresAt INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      userId TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS session_userId_idx ON session(userId);

    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY NOT NULL,
      accountId TEXT NOT NULL,
      providerId TEXT NOT NULL,
      userId TEXT NOT NULL,
      accessToken TEXT,
      refreshToken TEXT,
      idToken TEXT,
      accessTokenExpiresAt INTEGER,
      refreshTokenExpiresAt INTEGER,
      scope TEXT,
      password TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS account_userId_idx ON account(userId);

    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY NOT NULL,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification(identifier);

    CREATE TABLE IF NOT EXISTS dashboard_indicators (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      source TEXT NOT NULL,
      year INTEGER NOT NULL,
      value REAL NOT NULL,
      trend REAL NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dashboard_rows (
      id INTEGER PRIMARY KEY NOT NULL,
      indicator TEXT NOT NULL,
      category TEXT NOT NULL,
      region TEXT NOT NULL,
      period TEXT NOT NULL,
      year INTEGER NOT NULL,
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      source TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dashboard_chart_series (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      year INTEGER NOT NULL,
      category TEXT NOT NULL,
      value REAL NOT NULL
    );

    CREATE INDEX IF NOT EXISTS dashboard_chart_series_year_idx
      ON dashboard_chart_series(year);

    CREATE TABLE IF NOT EXISTS dashboard_executive_schedules (
      id INTEGER PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      title TEXT NOT NULL,
      unit TEXT NOT NULL,
      location TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dashboard_award_collections (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dashboard_award_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      collection_id TEXT NOT NULL,
      item_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      year INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      alt TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      FOREIGN KEY (collection_id) REFERENCES dashboard_award_collections(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS dashboard_award_items_collection_idx
      ON dashboard_award_items(collection_id);

    CREATE TABLE IF NOT EXISTS dashboard_publications (
      id INTEGER PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      file_label TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dashboard_datasets (
      id INTEGER PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      year INTEGER NOT NULL,
      producer TEXT NOT NULL,
      frequency TEXT NOT NULL,
      format TEXT NOT NULL,
      source_url TEXT NOT NULL,
      excel_url TEXT NOT NULL,
      pdf_url TEXT NOT NULL,
      standard_data TEXT NOT NULL,
      metadata TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dashboard_release_schedules (
      id INTEGER PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      period TEXT NOT NULL,
      language TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      realized_date TEXT NOT NULL,
      status TEXT NOT NULL,
      document_url TEXT NOT NULL,
      format TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dashboard_office_locations (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      maps_url TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dashboard_activities (
      id INTEGER PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      caption TEXT NOT NULL,
      image_url TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dashboard_videos (
      id INTEGER PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      embed_url TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dashboard_contact_info (
      id INTEGER PRIMARY KEY NOT NULL,
      institution TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      email TEXT NOT NULL,
      instagram TEXT NOT NULL,
      youtube TEXT NOT NULL,
      website TEXT NOT NULL,
      map_embed_url TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dashboard_filters (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      kind TEXT NOT NULL,
      value TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS dashboard_filters_kind_idx ON dashboard_filters(kind);
  `).then(() => {
      migrated = true;
    });
  }

  await migrationPromise;
}
