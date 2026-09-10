import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { createLeave, getLeaves, getUsers, createAlert, updateLeave } from "@/lib/db";

/**
 * GET /api/leaves
 * - Staff: sees own leaves
 * - Supervisor: sees leaves from their team + pending requests
 * - Super Admin: sees all escalated/pending leaves
 */
export async function GET(request: Request) {
  try {
    const user = await requireRole("super_admin", "supervisor", "merchandiser", "vsr", "admin");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;

    let filters: Record<string, string> = {};
    if (status) filters.status = status;

    if (user.role === "supervisor") {
      // Get IDs of supervised staff
      const team = await getUsers({ supervisorId: user.id });
      const teamIds = team.map((m) => m.id);
      // For now, return all pending leaves the supervisor might need to review
      // plus their own team's leaves
      filters.staffId = teamIds.length > 0 ? teamIds[0] : "__none__";
    } else if (user.role === "merchandiser" || user.role === "vsr") {
      filters.staffId = user.id;
    }

    const leaves = await getLeaves(filters);
    return NextResponse.json({ leaves, count: leaves.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}

/**
 * POST /api/leaves
 * Any staff member can request leave.
 * Creates a leave request and alerts the supervisor.
 */
export async function POST(request: Request) {
  try {
    const user = await requireRole("super_admin", "supervisor", "merchandiser", "vsr", "admin");
    const body = await request.json();
    const { startDate, endDate, reason } = body;

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 });
    }

    const leave = await createLeave({
      staffId: user.id,
      startDate,
      endDate,
      reason,
    });

    // Alert the supervisor
    const profile = await (await import("@/lib/db")).getUserById(user.id);
    if (profile?.supervisorId) {
      await createAlert({
        type: "leave_request",
        severity: "info",
        title: `Leave request from ${user.name}`,
        message: `${startDate} to ${endDate}${reason ? ` — ${reason}` : ""}`,
        fromUserId: user.id,
        toUserId: profile.supervisorId,
        supervisorId: profile.supervisorId,
        relatedEntityType: "leave",
        relatedEntityId: leave.id,
      });
    }

    return NextResponse.json({ leave }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to submit leave" },
      { status: 500 }
    );
  }
}
