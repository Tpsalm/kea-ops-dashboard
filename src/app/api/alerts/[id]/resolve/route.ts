import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { updateAlert } from "@/lib/db";

/**
 * PATCH /api/alerts/[id]/resolve
 * Super Admin resolves (closes) an alert.
 */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole("super_admin", "admin");
    const { id } = await params;

    const now = new Date().toISOString();
    const updated = await updateAlert(id, {
      status: "resolved",
      resolved_at: now,
    });

    return NextResponse.json({ alert: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Resolution failed" },
      { status: 500 }
    );
  }
}
