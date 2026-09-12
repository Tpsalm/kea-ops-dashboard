import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import {
  WorkflowError,
  adminActionWorkflow,
  createWorkflowMessage,
  getUserById,
} from "@/lib/db";
import { sendSupervisorWorkflowDecisionEmail } from "@/lib/email-service";

function errResponse(e: unknown) {
  if (e instanceof WorkflowError) {
    return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
  }
  const msg = e instanceof Error ? e.message : "Unknown error";
  if (msg.includes("Not authenticated")) {
    return NextResponse.json({ error: msg, code: "UNAUTHORIZED" }, { status: 401 });
  }
  if (msg.includes("Access denied")) {
    return NextResponse.json({ error: msg, code: "FORBIDDEN_ROLE" }, { status: 403 });
  }
  return NextResponse.json({ error: msg, code: "DB_ERROR" }, { status: 500 });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole("super_admin", "admin");
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const decision =
      typeof body.decision === "string" && ["approve", "reject"].includes(body.decision)
        ? (body.decision as "approve" | "reject")
        : null;
    if (!decision) {
      return NextResponse.json(
        { error: "Field 'decision' must be 'approve' or 'reject'", code: "INVALID_BODY" },
        { status: 422 },
      );
    }
    const notes = typeof body.notes === "string" ? body.notes : null;
    const messageBody =
      typeof body.messageBody === "string" && body.messageBody.trim()
        ? body.messageBody.trim()
        : null;

    const { workflow, step } = await adminActionWorkflow({
      id,
      adminUser: user,
      decision,
      notes,
      adminName: user.name,
    });

    let message = null;
    if (messageBody && workflow.assignedSupervisorId) {
      message = await createWorkflowMessage({
        workflowId: id,
        senderId: user.id,
        targetUserId: workflow.assignedSupervisorId,
        direction: "downstream",
        body: messageBody,
      }).catch(() => null);
    }

    // ──── Non-blocking Resend: Supervisor Workflow Decision Email ────
    try {
      if (workflow.assignedSupervisorId) {
        const [supervisorProf, originatorProf] = await Promise.all([
          getUserById(workflow.assignedSupervisorId),
          getUserById(workflow.originatorId).catch(() => null),
        ]);
        sendSupervisorWorkflowDecisionEmail({
          supervisorEmail: supervisorProf?.email ?? "supervisor@kea.com",
          supervisorName: supervisorProf?.name ?? "Field Operations Supervisor",
          workflowId: workflow.id,
          workflowTitle: workflow.title,
          originatorName: originatorProf?.name ?? "Field Staff",
          originatorRole: workflow.originatorRole,
          decision,
          notes: notes ?? undefined,
        }).catch((emailErr) => {
          console.warn("[workflow/admin-action] Resend dispatch failed (non-blocking):", emailErr);
        });
      }
    } catch (_emailOuter) {
      // Never fail the API response because of email issues.
    }

    return NextResponse.json({ workflow, step, message });
  } catch (e) {
    return errResponse(e);
  }
}
