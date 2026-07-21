import assert from "node:assert/strict";
import test from "node:test";

import { getMirrorDatabaseConfig } from "@/lib/integrations/mirror/config";

test("database mirror mengizinkan password kosong hanya pada loopback lokal", () => {
  const previous = snapshotEnvironment();
  try {
    process.env.NODE_ENV = "development";
    process.env.MIRROR_DB_HOST = "127.0.0.1";
    process.env.MIRROR_DB_PORT = "3306";
    process.env.MIRROR_DB_DATABASE = "datalampung_local";
    process.env.MIRROR_DB_USERNAME = "dashboard_reader";
    process.env.MIRROR_DB_PASSWORD = "";
    assert.equal(getMirrorDatabaseConfig().host, "127.0.0.1");

    process.env.MIRROR_DB_HOST = "192.168.0.116";
    assert.throws(
      () => getMirrorDatabaseConfig(),
      /Password database mitra hanya boleh kosong/,
    );
  } finally {
    restoreEnvironment(previous);
  }
});

function snapshotEnvironment() {
  return {
    NODE_ENV: process.env.NODE_ENV,
    MIRROR_DB_HOST: process.env.MIRROR_DB_HOST,
    MIRROR_DB_PORT: process.env.MIRROR_DB_PORT,
    MIRROR_DB_DATABASE: process.env.MIRROR_DB_DATABASE,
    MIRROR_DB_USERNAME: process.env.MIRROR_DB_USERNAME,
    MIRROR_DB_PASSWORD: process.env.MIRROR_DB_PASSWORD,
  };
}

function restoreEnvironment(values: ReturnType<typeof snapshotEnvironment>) {
  for (const [key, value] of Object.entries(values)) {
    if (value == null) delete process.env[key];
    else process.env[key] = value;
  }
}
