import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { getAdminKPIs, getSupervisorKPIs } from "@/lib/db";

/**
 * GET /api/kpis
 * Returns role-appropriate KPIs.
 * - ?scope=admin  → Super Admin global KPIs
 * - ?scope=supervisor → Supervisor-scoped KPIs
 */
export async function GET(request: Request) {
  try {
    const user = await requireRole("super_admin", "supervisor", "admin");
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") ?? (user.role === "supervisor" ? "supervisor" : "admin");

    if (scope === "supervisor") {
      const kpis = await getSupervisorKPIs(user.id);
      return NextResponse.json({ scope: "supervisor", ...kpis });
    }

    // Admin scope (super_admin or admin)
    const kpis = await getAdminKPIs();
    return NextResponse.json({ scope: "admin", ...kpis });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}
