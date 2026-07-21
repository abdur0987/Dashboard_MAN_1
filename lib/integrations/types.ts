export type IntegrationSourceCode =
  | "emis"
  | "simpeg"
  | "mirror"
  | "gis"
  | "website";

export type OperationalSourceCode = "database" | "gis" | "website";

export type SyncTriggerType = "manual" | "scheduled" | "verified-reference";
