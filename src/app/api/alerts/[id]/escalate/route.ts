import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { updateAlert } from "@/lib/db";

/**
 * PATCH /api/alerts/[id]/escalate
 * Supervisor escalates an alert to the Super Admin.
 * Changes to_user_id to the admin's id and sets status to "escalated".
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole("supervisor", "admin");
    const { id } = await params;
    const body = await request.json();
    const { adminUserId } = body;

    if (!adminUserId) {
      return NextResponse.json({ error: "adminUserId is required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const updated = await updateAlert(id, {
      status: "escalated",
      to_user_id: adminUserId,
      reviewed_at: now,
    });

    return NextResponse.json({ alert: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Escalation failed" },
      { status: 500 }
    );
  }
}
