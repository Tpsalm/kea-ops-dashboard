import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { WorkflowError, escalateWorkflow, getUserById } from "@/lib/db";
import { sendSupervisorEscalationNotificationEmail } from "@/lib/email-service";

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
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole("supervisor");
    const { id } = await params;
    const { workflow, step } = await escalateWorkflow(id, user, user.name);

    // ──── Non-blocking Resend: Supervisor Escalation Confirmation Email ────
    try {
      const originatorProf = await getUserById(workflow.originatorId).catch(() => null);
      sendSupervisorEscalationNotificationEmail({
        supervisorEmail: user.email ?? "supervisor@kea.com",
        supervisorName: user.name,
        workflowId: workflow.id,
        workflowTitle: workflow.title,
        originatorName: originatorProf?.name ?? "Field Staff",
        originatorRole: workflow.originatorRole,
      }).catch((emailErr) => {
        console.warn("[workflow/escalate] Resend dispatch failed (non-blocking):", emailErr);
      });
    } catch (_emailOuter) {
      // Never fail the API response because of email issues.
    }

    return NextResponse.json({ workflow, step });
  } catch (e) {
    return errResponse(e);
  }
}
