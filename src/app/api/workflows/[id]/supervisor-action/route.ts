import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import {
  WorkflowError,
  supervisorActionWorkflow,
  createWorkflowMessage,
} from "@/lib/db";

/**
 * POST /api/workflows/[id]/supervisor-action
 * Supervisor-only review transition (Tier 1 response loop).
 *
 * Body:
 *   action:      "review" | "request_changes"
 *   notes:       optional review note (written to the tracker step)
 *   messageBody: optional downstream message to send back to the originator
 *
 * - "review":          submitted_by_vsr/merchandiser → under_supervisor_review
 * - "request_changes": keeps under_supervisor_review, records a change request
 */
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
    const user = await requireRole("supervisor");
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const action =
      body.action === "request_changes" ? "request_changes" : "review";
    const notes = typeof body.notes === "string" ? body.notes : null;
    const messageBody =
      typeof body.messageBody === "string" && body.messageBody.trim()
        ? body.messageBody.trim()
        : null;

    const { workflow, step } = await supervisorActionWorkflow({
      id,
      supervisorUser: user,
      action,
      notes,
      supervisorName: user.name,
    });

    // Optional dynamic downstream response routed back to the originator only.
    let message = null;
    if (messageBody) {
      message = await createWorkflowMessage({
        workflowId: id,
        senderId: user.id,
        targetUserId: workflow.originatorId,
        direction: "downstream",
        body: messageBody,
      }).catch(() => null);
    }

    return NextResponse.json({ workflow, step, message });
  } catch (e) {
    return errResponse(e);
  }
}
