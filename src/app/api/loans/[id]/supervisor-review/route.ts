import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { updateLoan, getLoanById, createAlert, getUserById } from "@/lib/db";

/**
 * PATCH /api/loans/[id]/supervisor-review
 * Supervisor triages a loan: approve (escalate to admin) or reject.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole("supervisor", "admin");
    const { id } = await params;
    const body = await request.json();
    const { approved, notes } = body;

    if (typeof approved !== "boolean") {
      return NextResponse.json({ error: "approved (boolean) is required" }, { status: 400 });
    }

    const loan = await getLoanById(id);
    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    if (loan.status !== "pending_supervisor") {
      return NextResponse.json(
        { error: `Loan is in '${loan.status}' state — cannot review` },
        { status: 409 }
      );
    }

    // Verify the supervisor owns this loan's team
    const vsr = await getUserById(loan.vsrId);
    if (user.role === "supervisor" && vsr?.supervisorId !== user.id) {
      return NextResponse.json({ error: "This loan does not belong to your team" }, { status: 403 });
    }

    const now = new Date().toISOString();

    if (approved) {
      // ESCALATE to Super Admin
      const updated = await updateLoan(id, {
        status: "pending_admin",
        supervisor_id: user.id,
        supervisor_review_date: now,
        supervisor_notes: notes,
      });

      // Alert the Super Admin
      const admins = await getUserById(user.id);
      // Find a super_admin to send the alert to (simple: query users table)
      const { createClient } = await import("@/lib/supabase-server");
      const supabase = await createClient();
      const { data: adminUser } = await supabase
        .from("users")
        .select("id")
        .eq("role", "super_admin")
        .limit(1)
        .single();

      if (adminUser) {
        await createAlert({
          type: "funding_request",
          severity: "warning",
          title: `Escalated: Funding request from ${vsr?.name ?? "VSR"}`,
          message: `Supervisor ${user.name} approved — awaiting admin review`,
          fromUserId: user.id,
          toUserId: adminUser.id,
          supervisorId: user.id,
          relatedEntityType: "loan",
          relatedEntityId: id,
        });
      }

      return NextResponse.json({ loan: updated, action: "escalated" });
    } else {
      // REJECT at Supervisor level
      const updated = await updateLoan(id, {
        status: "rejected",
        supervisor_id: user.id,
        supervisor_review_date: now,
        supervisor_notes: notes,
      });

      // Alert the VSR
      await createAlert({
        type: "funding_request",
        severity: "info",
        title: `Funding request rejected`,
        message: `Your funding application has been reviewed by your supervisor. ${notes ?? ""}`,
        fromUserId: user.id,
        toUserId: loan.vsrId,
        supervisorId: user.id,
        relatedEntityType: "loan",
        relatedEntityId: id,
      });

      return NextResponse.json({ loan: updated, action: "rejected" });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Review failed" },
      { status: 500 }
    );
  }
}
