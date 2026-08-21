import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  // Dashboard runs from client-side data, so a database is not required.
  // If DATABASE_URL is configured, we verify connectivity; otherwise we
  // simply report the app itself is healthy.
  if (!db) {
    return Response.json({ ok: true, db: "not configured" });
  }
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, db: "connected" });
  } catch {
    return Response.json({ ok: false, db: "unreachable" }, { status: 500 });
  }
}
