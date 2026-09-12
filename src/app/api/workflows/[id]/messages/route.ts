import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import {
  WorkflowError,
  getWorkflowById,
  getWorkflowMessages,
  createWorkflowMessage,
  createWorkflowStep,
} from "@/lib/db";

const WF_ROLES = ["super_admin", "admin", "supervisor", "vsr", "merchandiser", "tsr"] as const;
const WRITE_ROLES = ["super_admin", "admin", "supervisor", "vsr", "merchandiser"] as const;

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(...WF_ROLES);
    const { id } = await params;
    await getWorkflowById(id, user);
    const messages = await getWorkflowMessages(id);
    return NextResponse.json({ messages, count: messages.length });
  } catch (e) {
    return errResponse(e);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(...WRITE_ROLES);
    const { id } = await params;
    const workflow = await getWorkflowById(id, user);
    const body = await request.json().catch(() => ({}));

    const directionRaw =
      typeof body.direction === "string" ? body.direction.toLowerCase() : null;
    if (!["upstream", "downstream"].includes(directionRaw ?? "")) {
      return NextResponse.json(
        { error: "direction must be 'upstream' or 'downstream'", code: "INVALID_BODY" },
        { status: 422 },
      );
    }
    const direction = directionRaw as "upstream" | "downstream";

    const bodyText = typeof body.body === "string" && body.body.trim() ? body.body.trim() : null;
    if (!bodyText) {
      return NextResponse.json(
        { error: "Field 'body' is required", code: "INVALID_BODY" },
        { status: 422 },
      );
    }

    const attachmentUrl =
      typeof body.attachmentUrl === "string" ? body.attachmentUrl : null;

    let targetUserId: string | null = null;
    if (user.role === "vsr" || user.role === "merchandiser") {
      if (direction !== "upstream") {
        return NextResponse.json(
          { error: "Field role can only send messages upstream to supervisor", code: "FORBIDDEN_ROLE" },
          { status: 403 },
        );
      }
      targetUserId = workflow.assignedSupervisorId;
    } else if (user.role === "supervisor") {
      if (direction === "upstream") {
        targetUserId = workflow.assignedAdminId;
        if (!targetUserId) {
          return NextResponse.json(
            { error: "Escalate workflow before sending upstream message", code: "INVALID_BODY" },
            { status: 422 },
          );
        }
      } else {
        targetUserId = workflow.originatorId;
      }
    } else if (user.role === "super_admin" || user.role === "admin") {
      if (direction !== "downstream") {
        return NextResponse.json(
          { error: "Admin can only send messages downstream", code: "FORBIDDEN_ROLE" },
          { status: 403 },
        );
      }
      targetUserId = workflow.assignedSupervisorId;
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Could not determine message recipient", code: "INVALID_BODY" },
        { status: 422 },
      );
    }

    const message = await createWorkflowMessage({
      workflowId: id,
      senderId: user.id,
      targetUserId,
      direction: direction as any,
      body: bodyText,
      attachmentUrl,
    });

    await createWorkflowStep({
      workflowId: id,
      stepType: "message",
      actorId: user.id,
      actorRole: user.role as any,
      title: `Message sent ${direction === "upstream" ? "↑" : "↓"}`,
      description: bodyText.length > 140 ? bodyText.slice(0, 140) + "…" : bodyText,
    }).catch(() => null);

    return NextResponse.json({ message }, { status: 201 });
  } catch (e) {
    return errResponse(e);
  }
}
