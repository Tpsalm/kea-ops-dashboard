import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { updateLoan, getLoanById, createAlert } from "@/lib/db";

/**
 * PATCH /api/loans/[id]/admin-review
 * Super Admin makes the final decision: approve (disburse) or reject.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole("super_admin", "admin");
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

    if (loan.status !== "pending_admin") {
      return NextResponse.json(
        { error: `Loan is in '${loan.status}' state — cannot review` },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    if (approved) {
      // APPROVE → disburse
      const amount = parseFloat(loan.amount);
      const updated = await updateLoan(id, {
        status: "approved",
        admin_id: user.id,
        admin_review_date: now,
        admin_notes: notes,
        disbursement_date: now,
        repayment_status: "none",
        outstanding_balance: amount,
      });

      // Update VSR's loan_debt
      const { createClient } = await import("@/lib/supabase-server");
      const supabase = await createClient();
      const { error: rpcError } = await supabase.rpc("increment_loan_debt", {
        p_user_id: loan.vsrId,
        p_amount: amount,
      });
      if (rpcError) {
        // Fallback: direct update if RPC doesn't exist
        await supabase
          .from("users")
          .update({ loan_debt: amount, updated_at: now })
          .eq("id", loan.vsrId);
      }

      // Alert the VSR
      await createAlert({
        type: "funding_request",
        severity: "info",
        title: `Funding approved!`,
        message: `Your funding application of ₦${amount.toLocaleString()} has been approved and disbursed.`,
        fromUserId: user.id,
        toUserId: loan.vsrId,
        relatedEntityType: "loan",
        relatedEntityId: id,
      });

      return NextResponse.json({ loan: updated, action: "approved" });
    } else {
      // REJECT
      const updated = await updateLoan(id, {
        status: "rejected",
        admin_id: user.id,
        admin_review_date: now,
        admin_notes: notes,
      });

      // Alert the VSR
      await createAlert({
        type: "funding_request",
        severity: "info",
        title: `Funding request rejected`,
        message: `Your funding application has been reviewed by the administrator. ${notes ?? ""}`,
        fromUserId: user.id,
        toUserId: loan.vsrId,
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
