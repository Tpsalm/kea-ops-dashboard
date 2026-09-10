import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { updateLeave, createAlert, getUsers } from "@/lib/db";

/**
 * PATCH /api/leaves/[id]/review
 * Supervisor approves or rejects a leave request.
 * On approval, sets the merchandiser's status to "on_leave".
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole("supervisor", "super_admin", "admin");
    const { id } = await params;
    const body = await request.json();
    const { approved } = body;

    if (typeof approved !== "boolean") {
      return NextResponse.json({ error: "approved (boolean) is required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const updated = await updateLeave(id, {
      status: approved ? "approved" : "rejected",
      approved_by: user.id,
      approved_at: now,
    });

    if (approved) {
      // Set the staff member's status to on_leave
      const { createClient } = await import("@/lib/supabase-server");
      const supabase = await createClient();
      await supabase
        .from("users")
        .update({ status: "on_leave", updated_at: now })
        .eq("id", updated.staffId);
    }

    // Alert the requesting staff member
    await createAlert({
      type: "leave_request",
      severity: approved ? "info" : "warning",
      title: approved ? "Leave request approved" : "Leave request rejected",
      message: approved
        ? `Your leave from ${updated.startDate} to ${updated.endDate} has been approved.`
        : `Your leave request has been reviewed. Please contact your supervisor for details.`,
      fromUserId: user.id,
      toUserId: updated.staffId,
      relatedEntityType: "leave",
      relatedEntityId: id,
    });

    return NextResponse.json({ leave: updated, action: approved ? "approved" : "rejected" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Review failed" },
      { status: 500 }
    );
  }
}
