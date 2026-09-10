import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getAlerts } from "@/lib/db";

/**
 * GET /api/alerts
 * Returns alerts for the current user based on their role:
 * - Super Admin: alerts where toUserId = their id (escalated from supervisors)
 * - Supervisor: alerts where toUserId = their id (from field staff)
 * - VSR/Merchandiser: alerts where toUserId = their id (responses from supervisors)
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const type = searchParams.get("type") ?? undefined;

    const filters: Record<string, string> = {
      toUserId: user.id,
    };
    if (status) filters.status = status;
    if (type) filters.type = type;

    const alerts = await getAlerts(filters);
    return NextResponse.json({
      alerts,
      count: alerts.length,
      unread: alerts.filter((a) => a.status === "pending").length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}
