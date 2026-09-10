import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { createLeave, getLeaves, getUsers, createAlert, getUserById } from "@/lib/db";

/**
 * GET /api/leaves
 * - Staff: sees own leaves
 * - Supervisor: sees leaves for their merchandisers/staff
 * - Super Admin: sees all leaves
 */
export async function GET(request: Request) {
  try {
    const user = await requireRole("super_admin", "supervisor", "merchandiser", "vsr", "admin");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const staffId = searchParams.get("staffId") ?? undefined;

    let filters: Record<string, string> = {};
    if (status) filters.status = status;
    if (staffId) filters.staffId = staffId;

    if (user.role === "supervisor" && !staffId) {
      filters.supervisorId = user.id;
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
 * Supervisor schedules leave for a merchandiser OR staff requests leave.
 */
export async function POST(request: Request) {
  try {
    const user = await requireRole("super_admin", "supervisor", "merchandiser", "vsr", "admin");
    const body = await request.json();
    const { staffId, startDate, endDate, reason, status } = body;

    const targetStaffId = staffId || user.id;
    if (!startDate || !endDate) {
      return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 });
    }

    const targetStaff = await getUserById(targetStaffId);
    if (!targetStaff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    const supervisorId = user.role === "supervisor" ? user.id : targetStaff.supervisorId ?? undefined;

    const leave = await createLeave({
      staffId: targetStaffId,
      supervisorId,
      clientId: targetStaff.clientId ?? undefined,
      startDate,
      endDate,
      reason: reason || "Scheduled Leave",
      status: status || (user.role === "supervisor" || user.role === "super_admin" ? "approved" : "pending"),
    });

    // If supervisor scheduled for merchandiser, create alert for merchandiser
    if (user.role === "supervisor" && targetStaffId !== user.id) {
      await createAlert({
        type: "leave_request",
        severity: "info",
        title: `Leave Scheduled: ${startDate} to ${endDate}`,
        message: `Your supervisor ${user.name} scheduled leave for you: "${reason || "Annual leave"}"`,
        fromUserId: user.id,
        toUserId: targetStaffId,
        supervisorId: user.id,
        clientId: targetStaff.clientId ?? undefined,
        relatedEntityType: "leaves",
        relatedEntityId: leave.id,
        status: "resolved",
      });
    } else if (targetStaff.supervisorId) {
      // Staff requested leave, alert supervisor
      await createAlert({
        type: "leave_request",
        severity: "info",
        title: `Leave Request: ${targetStaff.name}`,
        message: `${startDate} to ${endDate} — ${reason || "No reason specified"}`,
        fromUserId: user.id,
        toUserId: targetStaff.supervisorId,
        supervisorId: targetStaff.supervisorId,
        clientId: targetStaff.clientId ?? undefined,
        relatedEntityType: "leaves",
        relatedEntityId: leave.id,
        status: "pending_supervisor",
      });
    }

    return NextResponse.json({ leave, message: "Leave successfully scheduled" }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to submit leave" },
      { status: 500 }
    );
  }
}
