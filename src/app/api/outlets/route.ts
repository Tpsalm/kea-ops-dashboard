import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { getOutlets } from "@/lib/db";

/**
 * GET /api/outlets
 * - Supervisor: sees outlets under their supervision
 * - Super Admin: sees all outlets
 */
export async function GET(request: Request) {
  try {
    const user = await requireRole("super_admin", "supervisor", "admin");
    const { searchParams } = new URL(request.url);

    const filters: Record<string, string> = {};
    if (searchParams.get("region")) filters.region = searchParams.get("region")!;
    if (searchParams.get("client_id")) filters.clientId = searchParams.get("client_id")!;

    if (user.role === "supervisor") {
      filters.supervisorId = user.id;
    }

    const outlets = await getOutlets(filters);
    return NextResponse.json({ outlets, count: outlets.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}
