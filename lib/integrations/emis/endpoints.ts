export function emisEndpoints() {
  return {
    partnerLogin: process.env.EMIS_ENDPOINT_PARTNER_LOGIN ?? "accounts/partners-login",
    institutionByNsm: process.env.EMIS_ENDPOINT_INSTITUTION ?? "institutions/list-by-nsm",
    studentSummary: process.env.EMIS_ENDPOINT_STUDENT_SUMMARY ?? "",
    studentByGrade: process.env.EMIS_ENDPOINT_STUDENT_BY_GRADE ?? "",
    studentByGender: process.env.EMIS_ENDPOINT_STUDENT_BY_GENDER ?? "",
    studyGroups: process.env.EMIS_ENDPOINT_STUDY_GROUPS ?? "",
  };
}
