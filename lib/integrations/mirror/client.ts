import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";
import { z } from "zod";

import { getMirrorDatabaseConfig } from "@/lib/integrations/mirror/config";

export type MirrorColumn = {
  tableName: string;
  columnName: string;
  dataType: string;
  nullable: boolean;
  keyType: string;
};

let pool: Pool | null = null;

const institutionRowSchema = z.object({
  nsm: z.string(),
  npsn: z.string(),
  name: z.string(),
  status: z.string().nullable(),
  accreditation: z.string().nullable(),
  students_total: z.coerce.number().int().nonnegative().nullable(),
  study_groups_total: z.coerce.number().int().nonnegative().nullable(),
  source_updated_at: z.coerce.date().nullable(),
});

const studentRowSchema = z.object({
  nsm: z.string(),
  npsn: z.string(),
  school_name: z.string(),
  students_total: z.coerce.number().int().nonnegative().nullable(),
  study_groups_total: z.coerce.number().int().nonnegative().nullable(),
  grade_10: z.coerce.number().int().nonnegative().nullable(),
  grade_11: z.coerce.number().int().nonnegative().nullable(),
  grade_12: z.coerce.number().int().nonnegative().nullable(),
  male: z.coerce.number().int().nonnegative().nullable(),
  female: z.coerce.number().int().nonnegative().nullable(),
  source_period_id: z.coerce.string().nullable(),
  historical_records_total: z.coerce.number().int().nonnegative(),
  latest_period_records: z.coerce.number().int().nonnegative(),
  clearly_active_records: z.coerce.number().int().nonnegative(),
  source_updated_at: z.coerce.date().nullable(),
});

const employeeRowSchema = z.object({
  employees_total: z.coerce.number().int().nonnegative(),
  teachers_total: z.coerce.number().int().nonnegative(),
  staff_total: z.coerce.number().int().nonnegative(),
  pns_total: z.coerce.number().int().nonnegative(),
  pppk_total: z.coerce.number().int().nonnegative(),
  non_asn_total: z.coerce.number().int().nonnegative(),
  education_s3: z.coerce.number().int().nonnegative(),
  education_s2: z.coerce.number().int().nonnegative(),
  education_s1d4: z.coerce.number().int().nonnegative(),
  education_diploma: z.coerce.number().int().nonnegative(),
  education_secondary: z.coerce.number().int().nonnegative(),
  education_unknown: z.coerce.number().int().nonnegative(),
  certified_total: z.coerce.number().int().nonnegative(),
  uncertified_total: z.coerce.number().int().nonnegative(),
  records_received: z.coerce.number().int().nonnegative(),
  filtered_total: z.coerce.number().int().nonnegative(),
  source_updated_at: z.coerce.date().nullable(),
});

function createMirrorPool() {
  const config = getMirrorDatabaseConfig();
  return mysql.createPool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl === "disabled" ? undefined : { rejectUnauthorized: config.ssl === "required" },
    waitForConnections: true,
    connectionLimit: 2,
    maxIdle: 1,
    idleTimeout: 30_000,
    connectTimeout: 5_000,
    enableKeepAlive: true,
    multipleStatements: false,
    decimalNumbers: true,
    timezone: "+07:00",
  });
}

function getMirrorPool() {
  pool ??= createMirrorPool();
  return pool;
}

export async function inspectMirrorSchema(): Promise<MirrorColumn[]> {
  const config = getMirrorDatabaseConfig();
  const connection = await getMirrorPool().getConnection();
  try {
    await connection.query("SET TRANSACTION READ ONLY");
    await connection.beginTransaction();
    const [rows] = await connection.execute<(RowDataPacket & {
      TABLE_NAME: string;
      COLUMN_NAME: string;
      DATA_TYPE: string;
      IS_NULLABLE: "YES" | "NO";
      COLUMN_KEY: string;
    })[]>(
      `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
         FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ?
        ORDER BY TABLE_NAME, ORDINAL_POSITION`,
      [config.database],
    );
    await connection.rollback();

    return rows.map((row) => ({
      tableName: row.TABLE_NAME,
      columnName: row.COLUMN_NAME,
      dataType: row.DATA_TYPE,
      nullable: row.IS_NULLABLE === "YES",
      keyType: row.COLUMN_KEY,
    }));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function verifyMirrorReadOnlyAccess() {
  const connection = await getMirrorPool().getConnection();
  try {
    await connection.query("SET TRANSACTION READ ONLY");
    await connection.beginTransaction();
    const [rows] = await connection.execute<(RowDataPacket & {
      databaseName: string;
      accountName: string;
    })[]>("SELECT DATABASE() AS databaseName, CURRENT_USER() AS accountName");
    await connection.rollback();
    return rows[0] ?? null;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function fetchMirrorSnapshot() {
  const connection = await getMirrorPool().getConnection();
  try {
    await connection.query("SET TRANSACTION READ ONLY");
    await connection.beginTransaction();
    const [institutionRows] = await connection.execute<RowDataPacket[]>(
      "SELECT * FROM v_man1_institution_summary LIMIT 1",
    );
    const [studentRows] = await connection.execute<RowDataPacket[]>(
      "SELECT * FROM v_man1_student_summary LIMIT 1",
    );
    const [employeeRows] = await connection.execute<RowDataPacket[]>(
      "SELECT * FROM v_man1_employee_summary LIMIT 1",
    );
    await connection.rollback();

    const institution = institutionRowSchema.parse(institutionRows[0]);
    const students = studentRowSchema.parse(studentRows[0]);
    const employees = employeeRowSchema.parse(employeeRows[0]);
    validateSchoolIdentity(institution.nsm, institution.npsn);
    validateSchoolIdentity(students.nsm, students.npsn);

    return {
      institution: {
        ...institution,
        sourceUpdatedAt: institution.source_updated_at?.toISOString() ?? null,
      },
      students: {
        ...students,
        sourceUpdatedAt: students.source_updated_at?.toISOString() ?? null,
      },
      employees: {
        ...employees,
        sourceUpdatedAt: employees.source_updated_at?.toISOString() ?? null,
      },
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function closeMirrorPool() {
  if (!pool) return;
  await pool.end();
  pool = null;
}

function validateSchoolIdentity(nsm: string, npsn: string) {
  const expectedNsm = process.env.MIRROR_DB_NSM || "131118010001";
  const expectedNpsn = process.env.MIRROR_DB_NPSN || "10816233";
  if (nsm !== expectedNsm || npsn !== expectedNpsn) {
    throw new Error("Identitas madrasah pada database mitra tidak cocok dengan konfigurasi.");
  }
}
