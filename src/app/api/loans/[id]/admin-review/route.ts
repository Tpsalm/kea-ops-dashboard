import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import {
  updateLoan, getLoanById, createAlert, getUserById,
  adminActionWorkflow,
} from "@/lib/db";
import { sendSupervisorLoanDecisionEmail, sendSupervisorWorkflowDecisionEmail } from "@/lib/email-service";

/**
 * PATCH /api/loans/[id]/admin-review
 * Super Admin makes the final decision: approve (disburse) or reject.
 * Dispatches instant in-app alerts, legacy loan-decision email, AND
 * canonical Workflow Decision Email after adminActionWorkflow success.
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

    const { createClient } = await import("@/lib/supabase-server");
    const supabase = await createClient();

    // Locate related workflow (loans → workflows)
    const { data: wfRow } = await supabase
      .from("workflows")
      .select("id")
      .eq("related_entity_type", "loans")
      .eq("related_entity_id", id)
      .limit(1)
      .maybeSingle();

    const decision: "approve" | "reject" = approved ? "approve" : "reject";

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
      const { error: rpcError } = await supabase.rpc("increment_loan_debt", {
        p_user_id: loan.vsrId,
        p_amount: amount,
      });
      if (rpcError) {
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

      // 3A. Dispatch legacy Loan Decision Email to Supervisor (kept for backward compat)
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
      } catch (_emailErr) { /* non-blocking */ }

      // 3B. Canonical adminActionWorkflow + Workflow Decision Email
      let workflowRef: any = null;
      try {
        if (wfRow) {
          const { workflow } = await adminActionWorkflow({
            id: wfRow.id,
            adminUser: user,
            decision,
            notes,
            adminName: user.name,
          });
          workflowRef = workflow;

          try {
            sendSupervisorWorkflowDecisionEmail({
              supervisorEmail: supervisor?.email ?? "supervisor@kea.com",
              supervisorName: supervisor?.name ?? "Field Operations Supervisor",
              workflowId: workflow.id,
              workflowTitle: workflow.title,
              originatorName: vsr?.name ?? "VSR",
              originatorRole: "vsr",
              decision,
              notes: notes ?? undefined,
            }).catch((emailErr) => {
              console.warn("[loans/admin-review approve workflow] Resend failed (non-blocking):", emailErr);
            });
          } catch (_wfEmailOuter) {}
        }
      } catch (_wfErr) { /* workflow integration is non-blocking */ }

      return NextResponse.json({
        loan: updated,
        action: "approved",
        workflowId: workflowRef?.id ?? wfRow?.id ?? null,
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

      // 3A. Dispatch legacy Loan Decision Email to Supervisor (backward compat)
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
      } catch (_emailErr) { /* non-blocking */ }

      // 3B. Canonical adminActionWorkflow + Workflow Decision Email
      let workflowRef: any = null;
      try {
        if (wfRow) {
          const { workflow } = await adminActionWorkflow({
            id: wfRow.id,
            adminUser: user,
            decision,
            notes,
            adminName: user.name,
          });
          workflowRef = workflow;

          try {
            sendSupervisorWorkflowDecisionEmail({
              supervisorEmail: supervisor?.email ?? "supervisor@kea.com",
              supervisorName: supervisor?.name ?? "Field Operations Supervisor",
              workflowId: workflow.id,
              workflowTitle: workflow.title,
              originatorName: vsr?.name ?? "VSR",
              originatorRole: "vsr",
              decision,
              notes: notes ?? undefined,
            }).catch((emailErr) => {
              console.warn("[loans/admin-review reject workflow] Resend failed (non-blocking):", emailErr);
            });
          } catch (_wfEmailOuter) {}
        }
      } catch (_wfErr) { /* workflow integration is non-blocking */ }

      return NextResponse.json({
        loan: updated,
        action: "rejected",
        workflowId: workflowRef?.id ?? wfRow?.id ?? null,
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
