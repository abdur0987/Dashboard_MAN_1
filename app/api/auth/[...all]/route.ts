import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";
import { ensureDatabaseReady } from "@/lib/db/migrate";

export const runtime = "nodejs";

const handlers = toNextJsHandler(auth);

async function withDatabaseReady(request: Request) {
  await ensureDatabaseReady();

  return handlers.GET(request);
}

async function mutateWithDatabaseReady(request: Request) {
  await ensureDatabaseReady();

  return handlers.POST(request);
}

export const GET = withDatabaseReady;
export const POST = mutateWithDatabaseReady;
export const PUT = async (request: Request) => {
  await ensureDatabaseReady();

  return handlers.PUT(request);
};
export const PATCH = async (request: Request) => {
  await ensureDatabaseReady();

  return handlers.PATCH(request);
};
export const DELETE = async (request: Request) => {
  await ensureDatabaseReady();

  return handlers.DELETE(request);
};
