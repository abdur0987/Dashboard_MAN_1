USE datalampung;

DROP VIEW IF EXISTS v_man1_student_summary;
DROP VIEW IF EXISTS v_man1_employee_summary;
DROP VIEW IF EXISTS v_man1_institution_summary;

CREATE SQL SECURITY DEFINER VIEW v_man1_institution_summary AS
SELECT
  statistic_num AS nsm,
  npsn,
  nama AS name,
  status,
  akreditasi AS accreditation,
  total_kelas AS classrooms_total,
  total_guru AS reported_teachers_total,
  total_siswa AS students_total,
  total_rombel AS study_groups_total,
  updated_at AS source_updated_at
FROM madrasah
WHERE statistic_num = '131118010001'
   OR npsn = '10816233'
ORDER BY id DESC
LIMIT 1;

CREATE SQL SECURITY DEFINER VIEW v_man1_student_summary AS
SELECT
  school.statistic_num AS nsm,
  school.npsn,
  school.nama AS school_name,
  school.total_siswa AS students_total,
  school.total_rombel AS study_groups_total,
  SUM(
    CASE
      WHEN students.id_status_siswa = '1'
       AND students.kelas IN ('Kelas 10', '10', 'X')
      THEN 1 ELSE 0
    END
  ) AS grade_10,
  SUM(
    CASE
      WHEN students.id_status_siswa = '1'
       AND students.kelas IN ('Kelas 11', '11', 'XI')
      THEN 1 ELSE 0
    END
  ) AS grade_11,
  SUM(
    CASE
      WHEN students.id_status_siswa = '1'
       AND students.kelas IN ('Kelas 12', '12', 'XII')
      THEN 1 ELSE 0
    END
  ) AS grade_12,
  SUM(
    CASE
      WHEN students.id_status_siswa = '1'
       AND students.jenis_kelamin = 'L'
      THEN 1 ELSE 0
    END
  ) AS male,
  SUM(
    CASE
      WHEN students.id_status_siswa = '1'
       AND students.jenis_kelamin = 'P'
      THEN 1 ELSE 0
    END
  ) AS female,
  latest.source_period_id,
  (
    SELECT COUNT(*)
    FROM siswa_madrasah historical
    WHERE (historical.nsm = school.statistic_num OR historical.npsn = school.npsn)
      AND historical.deleted_at IS NULL
  ) AS historical_records_total,
  COUNT(students.id) AS latest_period_records,
  SUM(students.id_status_siswa = '1') AS clearly_active_records,
  MAX(students.updated_at) AS source_updated_at
FROM (
  SELECT *
  FROM madrasah
  WHERE statistic_num = '131118010001'
     OR npsn = '10816233'
  ORDER BY id DESC
  LIMIT 1
) school
JOIN (
  SELECT MAX(CAST(id_tahun_ajaran AS UNSIGNED)) AS source_period_id
  FROM siswa_madrasah
  WHERE (nsm = '131118010001' OR npsn = '10816233')
    AND deleted_at IS NULL
) latest
LEFT JOIN siswa_madrasah students
  ON (students.nsm = school.statistic_num OR students.npsn = school.npsn)
 AND CAST(students.id_tahun_ajaran AS UNSIGNED) = latest.source_period_id
 AND students.deleted_at IS NULL
GROUP BY
  school.statistic_num,
  school.npsn,
  school.nama,
  school.total_siswa,
  school.total_rombel,
  latest.source_period_id;

CREATE SQL SECURITY DEFINER VIEW v_man1_employee_summary AS
SELECT
  COUNT(*) AS employees_total,
  SUM(posisi = 'Guru') AS teachers_total,
  SUM(posisi = 'Tenaga Kependidikan') AS staff_total,
  SUM(status_kepegawaian = 'PNS') AS pns_total,
  SUM(status_kepegawaian = 'PPPK') AS pppk_total,
  SUM(status_kepegawaian NOT IN ('PNS', 'PPPK')) AS non_asn_total,
  SUM(UPPER(TRIM(COALESCE(pendidikan_terakhir, ''))) = 'S3') AS education_s3,
  SUM(UPPER(TRIM(COALESCE(pendidikan_terakhir, ''))) = 'S2') AS education_s2,
  SUM(UPPER(TRIM(COALESCE(pendidikan_terakhir, ''))) IN ('S1', 'D4', 'S1/D4')) AS education_s1d4,
  SUM(UPPER(TRIM(COALESCE(pendidikan_terakhir, ''))) IN ('D1', 'D2', 'D3', 'DIPLOMA')) AS education_diploma,
  SUM(UPPER(TRIM(COALESCE(pendidikan_terakhir, ''))) IN ('<S1', 'SMA', 'SMK', 'MA', 'SMP', 'MTS')) AS education_secondary,
  SUM(pendidikan_terakhir IS NULL OR TRIM(pendidikan_terakhir) = '') AS education_unknown,
  SUM(status_sertifikasi = 1) AS certified_total,
  SUM(status_sertifikasi = 0) AS uncertified_total,
  COUNT(*) AS records_received,
  COUNT(*) AS filtered_total,
  MAX(updated_at) AS source_updated_at
FROM guru_tenaga_kependidikan
WHERE statistic_num = '131118010001'
  AND deleted_at IS NULL
  AND posisi IN ('Guru', 'Tenaga Kependidikan');

GRANT SELECT ON datalampung.v_man1_institution_summary
TO 'dashboard_reader'@'127.0.0.1';

GRANT SELECT ON datalampung.v_man1_student_summary
TO 'dashboard_reader'@'127.0.0.1';

GRANT SELECT ON datalampung.v_man1_employee_summary
TO 'dashboard_reader'@'127.0.0.1';

FLUSH PRIVILEGES;
