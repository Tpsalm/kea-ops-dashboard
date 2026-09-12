import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import {
  updateLoan, getLoanById, createAlert, getUserById,
  createWorkflowStep, escalateWorkflow, updateWorkflowStatus, getWorkflowById,
} from "@/lib/db";
import { sendSupervisorEscalationNotificationEmail } from "@/lib/email-service";

/**
 * PATCH /api/loans/[id]/supervisor-review
 * Supervisor triages a loan: approve (escalate to admin via canonical escalateWorkflow helper) or reject.
 * Uses optimistic step_version locking on the Workflow side.
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
    const { createClient } = await import("@/lib/supabase-server");
    const supabase = await createClient();

    // Locate related workflow (loans → workflows)
    const { data: wfRow } = await supabase
      .from("workflows")
      .select("id, step_version")
      .eq("related_entity_type", "loans")
      .eq("related_entity_id", id)
      .limit(1)
      .maybeSingle();

    if (approved) {
      // ESCALATE to Super Admin
      const updated = await updateLoan(id, {
        status: "pending_admin",
        supervisor_id: user.id,
        supervisor_review_date: now,
        supervisor_notes: notes,
      });

      // Find a super_admin to alert
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

      let workflowRef: any = null;
      try {
        if (wfRow) {
          // Insert "Supervisor Endorsed" review step first, then canonical escalate
          await createWorkflowStep({
            workflowId: wfRow.id,
            stepType: "review",
            actorId: user.id,
            actorRole: user.role as any,
            title: "Supervisor Endorsed",
            description: notes ?? "Supervisor approved, escalating to admin.",
            statusFrom: "submitted_by_vsr",
            statusTo: "under_supervisor_review",
          });
          const { workflow, step } = await escalateWorkflow(wfRow.id, user, user.name);
          workflowRef = workflow;

          // ──── Non-blocking Resend: Escalation Confirmation Email ────
          try {
            const originatorProf = vsr;
            sendSupervisorEscalationNotificationEmail({
              supervisorEmail: user.email ?? "supervisor@kea.com",
              supervisorName: user.name,
              workflowId: workflow.id,
              workflowTitle: workflow.title,
              originatorName: originatorProf?.name ?? "VSR",
              originatorRole: "vsr",
            }).catch((emailErr) => {
              console.warn("[loans/supervisor-review escalate] Resend failed (non-blocking):", emailErr);
            });
          } catch (_emailOuter) {}
        }
      } catch (_e) { /* ignore workflow integration errors */ }

      return NextResponse.json({ loan: updated, action: "escalated", workflowId: workflowRef?.id ?? wfRow?.id ?? null });
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

      try {
        if (wfRow) {
          await createWorkflowStep({
            workflowId: wfRow.id,
            stepType: "review",
            actorId: user.id,
            actorRole: user.role as any,
            title: "Supervisor Rejected",
            description: notes ?? "Supervisor rejected request.",
            statusFrom: "submitted_by_vsr",
            statusTo: "rejected",
          });
          try {
            const wfFull = await getWorkflowById(wfRow.id, user);
            await updateWorkflowStatus({
              id: wfRow.id,
              newStatus: "rejected",
              expectedStepVersion: Number(wfFull.stepVersion),
            });
          } catch (_verErr) {
            await supabase.from("workflows").update({ status: "rejected", updated_at: now }).eq("id", wfRow.id);
          }
        }
      } catch (_e) { /* ignore */ }

      return NextResponse.json({ loan: updated, action: "rejected", workflowId: wfRow?.id ?? null });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Review failed" },
      { status: 500 }
    );
  }
}
