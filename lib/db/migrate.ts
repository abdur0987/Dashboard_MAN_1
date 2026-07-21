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

    CREATE TABLE IF NOT EXISTS integration_sources (
      code TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      base_url_masked TEXT NOT NULL,
      enabled INTEGER NOT NULL,
      sync_frequency TEXT NOT NULL,
      freshness_threshold_minutes INTEGER NOT NULL,
      last_success_at TEXT,
      last_attempt_at TEXT,
      last_status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_runs (
      id TEXT PRIMARY KEY NOT NULL,
      source_code TEXT NOT NULL,
      trigger_type TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      status TEXT NOT NULL,
      records_received INTEGER NOT NULL DEFAULT 0,
      records_matched INTEGER NOT NULL DEFAULT 0,
      records_rejected INTEGER NOT NULL DEFAULT 0,
      page_count INTEGER NOT NULL DEFAULT 0,
      duration_ms INTEGER,
      error_code TEXT,
      error_summary TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (source_code) REFERENCES integration_sources(code)
    );

    CREATE INDEX IF NOT EXISTS sync_runs_source_started_idx ON sync_runs(source_code, started_at);

    CREATE TABLE IF NOT EXISTS institution_snapshots (
      id TEXT PRIMARY KEY NOT NULL,
      sync_run_id TEXT,
      period TEXT NOT NULL,
      name TEXT NOT NULL,
      nsm TEXT NOT NULL,
      npsn TEXT NOT NULL,
      status TEXT,
      accreditation TEXT,
      registered_status TEXT,
      source_updated_at TEXT,
      captured_at TEXT NOT NULL,
      FOREIGN KEY (sync_run_id) REFERENCES sync_runs(id)
    );

    CREATE INDEX IF NOT EXISTS institution_snapshots_captured_idx ON institution_snapshots(captured_at);

    CREATE TABLE IF NOT EXISTS student_aggregate_snapshots (
      id TEXT PRIMARY KEY NOT NULL,
      sync_run_id TEXT,
      period TEXT NOT NULL,
      school_year TEXT NOT NULL,
      semester TEXT NOT NULL,
      students_total INTEGER,
      grade_10 INTEGER,
      grade_11 INTEGER,
      grade_12 INTEGER,
      male INTEGER,
      female INTEGER,
      study_groups_total INTEGER,
      study_groups_10 INTEGER,
      study_groups_11 INTEGER,
      study_groups_12 INTEGER,
      coverage REAL NOT NULL,
      quality_score REAL NOT NULL,
      warnings_json TEXT NOT NULL,
      captured_at TEXT NOT NULL,
      FOREIGN KEY (sync_run_id) REFERENCES sync_runs(id)
    );

    CREATE INDEX IF NOT EXISTS student_snapshots_captured_idx ON student_aggregate_snapshots(captured_at);

    CREATE TABLE IF NOT EXISTS employee_aggregate_snapshots (
      id TEXT PRIMARY KEY NOT NULL,
      sync_run_id TEXT,
      period TEXT NOT NULL,
      employees_total INTEGER,
      teachers_total INTEGER,
      staff_total INTEGER,
      pns_total INTEGER,
      pppk_total INTEGER,
      non_asn_total INTEGER,
      education_s3 INTEGER,
      education_s2 INTEGER,
      education_s1d4 INTEGER,
      education_diploma INTEGER,
      education_secondary INTEGER,
      education_unknown INTEGER,
      certified_total INTEGER,
      uncertified_total INTEGER,
      certification_unknown INTEGER,
      upstream_total INTEGER,
      records_received INTEGER NOT NULL,
      filtered_total INTEGER,
      page_count INTEGER NOT NULL,
      coverage REAL NOT NULL,
      quality_score REAL NOT NULL,
      warnings_json TEXT NOT NULL,
      captured_at TEXT NOT NULL,
      FOREIGN KEY (sync_run_id) REFERENCES sync_runs(id)
    );

    CREATE INDEX IF NOT EXISTS employee_snapshots_captured_idx ON employee_aggregate_snapshots(captured_at);

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY NOT NULL,
      actor_user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      before_summary TEXT,
      after_summary TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at);

    CREATE TABLE IF NOT EXISTS dashboard_site_settings (
      id INTEGER PRIMARY KEY NOT NULL,
      header_institution_name TEXT NOT NULL,
      header_subtitle TEXT NOT NULL,
      hero_title TEXT NOT NULL,
      hero_highlight TEXT NOT NULL,
      hero_description TEXT NOT NULL,
      footer_title TEXT NOT NULL,
      footer_subtitle TEXT NOT NULL,
      footer_description TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

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
