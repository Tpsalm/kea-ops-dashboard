import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { updateLoan, getLoanById, createAlert, getUserById } from "@/lib/db";
import { sendSupervisorLoanDecisionEmail } from "@/lib/email-service";

/**
 * PATCH /api/loans/[id]/admin-review
 * Super Admin makes the final decision: approve (disburse) or reject.
 * Dispatches instant in-app alerts and email notifications to the assigned Supervisor.
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
    const amount = parseFloat(loan.amount);

    // Look up VSR and Supervisor profiles for notifications
    const vsr = await getUserById(loan.vsrId);
    const supervisorId = loan.supervisorId || vsr?.supervisorId;
    const supervisor = supervisorId ? await getUserById(supervisorId) : null;

    if (approved) {
      // APPROVE → disburse
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

      // 1. Alert the VSR (In-app)
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

      // 2. Alert the Supervisor (In-app dashboard notification)
      if (supervisorId) {
        await createAlert({
          type: "funding_request",
          severity: "info",
          title: `Super Admin Approved Funding for ${vsr?.name || "VSR"}`,
          message: `Application of ₦${amount.toLocaleString()} was approved and disbursed. VSR debt ledger is now active.`,
          fromUserId: user.id,
          toUserId: supervisorId,
          relatedEntityType: "loan",
          relatedEntityId: id,
        });
      }

      // 3. Dispatch Instant Email to the Supervisor
      try {
        await sendSupervisorLoanDecisionEmail({
          supervisorEmail: supervisor?.email || "supervisor@kea.com",
          supervisorName: supervisor?.name || "Field Operations Supervisor",
          vsrName: vsr?.name || "Van Sales Representative",
          vsrId: loan.vsrId,
          amount,
          approved: true,
          notes,
          loanId: id,
        });
      } catch (emailErr) {
        console.error("Failed to send supervisor email:", emailErr);
      }

      return NextResponse.json({
        loan: updated,
        action: "approved",
        notifiedSupervisor: supervisor?.email || "supervisor@kea.com",
      });
    } else {
      // REJECT
      const updated = await updateLoan(id, {
        status: "rejected",
        admin_id: user.id,
        admin_review_date: now,
        admin_notes: notes,
      });

      // 1. Alert the VSR (In-app)
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

      // 2. Alert the Supervisor (In-app dashboard notification)
      if (supervisorId) {
        await createAlert({
          type: "funding_request",
          severity: "warning",
          title: `Super Admin Declined Funding for ${vsr?.name || "VSR"}`,
          message: `Application of ₦${amount.toLocaleString()} was rejected by Super Admin Executive. Notes: ${notes || "Declined."}`,
          fromUserId: user.id,
          toUserId: supervisorId,
          relatedEntityType: "loan",
          relatedEntityId: id,
        });
      }

      // 3. Dispatch Instant Email to the Supervisor
      try {
        await sendSupervisorLoanDecisionEmail({
          supervisorEmail: supervisor?.email || "supervisor@kea.com",
          supervisorName: supervisor?.name || "Field Operations Supervisor",
          vsrName: vsr?.name || "Van Sales Representative",
          vsrId: loan.vsrId,
          amount,
          approved: false,
          notes,
          loanId: id,
        });
      } catch (emailErr) {
        console.error("Failed to send supervisor email:", emailErr);
      }

      return NextResponse.json({
        loan: updated,
        action: "rejected",
        notifiedSupervisor: supervisor?.email || "supervisor@kea.com",
      });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Review failed" },
      { status: 500 }
    );
  }
}
