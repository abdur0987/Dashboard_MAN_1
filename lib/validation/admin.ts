import { z } from "zod";

const optionalUrl = z.union([
  z.literal(""),
  z.string().trim().url().max(1_000),
]);

export const presentationSettingsSchema = z.object({
  contact: z.object({
    institution: z.string().trim().min(2).max(160),
    address: z.string().trim().min(5).max(500),
    phone: z.string().trim().max(80),
    whatsapp: z.string().trim().max(80),
    email: z.union([z.literal(""), z.string().trim().email().max(160)]),
    instagram: optionalUrl,
    youtube: optionalUrl,
    website: optionalUrl,
    mapEmbedUrl: z.string().trim().url().max(1_000),
  }),
  siteSettings: z.object({
    headerInstitutionName: z.string().trim().min(2).max(120),
    headerSubtitle: z.string().trim().min(2).max(120),
    heroTitle: z.string().trim().min(2).max(120),
    heroHighlight: z.string().trim().min(2).max(120),
    heroDescription: z.string().trim().min(10).max(600),
    footerTitle: z.string().trim().min(2).max(160),
    footerSubtitle: z.string().trim().min(2).max(160),
    footerDescription: z.string().trim().min(10).max(600),
  }),
});
