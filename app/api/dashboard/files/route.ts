import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedExtensions = new Set([
  "pdf",
  "doc",
  "docx",
  "xlsx",
  "xls",
  "csv",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
]);

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (!allowedExtensions.has(extension)) {
    return NextResponse.json(
      { error: "Format file belum didukung." },
      { status: 415 },
    );
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "datasets");
  const safeName = file.name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  const fileName = `${Date.now()}-${safeName || "dataset"}.${extension}`;
  const destination = path.join(uploadDir, fileName);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(destination, Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({
    url: `/uploads/datasets/${fileName}`,
    fileName,
  });
}
