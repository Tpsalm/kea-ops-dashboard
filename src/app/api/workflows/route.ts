import { NextResponse } from "next/server";
import { requireRole, getCurrentUser } from "@/lib/auth-helpers";
import {
  WorkflowError,
  createWorkflow,
  getWorkflows,
  resolveHierarchy,
  getUserById,
} from "@/lib/db";

const WF_ROLES = ["super_admin", "admin", "supervisor", "vsr", "merchandiser", "tsr"] as const;

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

export async function GET(request: Request) {
  try {
    const user = await requireRole(...WF_ROLES);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const clientId = searchParams.get("clientId") ?? undefined;
    const relatedEntityType = searchParams.get("relatedEntityType") ?? undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
    const rows = await getWorkflows(user, { status, clientId, relatedEntityType, limit });
    return NextResponse.json({ workflows: rows, count: rows.length });
  } catch (e) {
    return errResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("super_admin", "admin", "supervisor", "vsr", "merchandiser");
    const body = await request.json().catch(() => ({}));

    const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : null;
    if (!title) {
      return NextResponse.json(
        { error: "Field 'title' is required", code: "INVALID_BODY" },
        { status: 422 },
      );
    }

    const originatorOverrideId =
      (user.role === "super_admin" || user.role === "admin") &&
      typeof body.originatorOverrideId === "string"
        ? body.originatorOverrideId
        : null;

    let originatorId = user.id;
    let originatorRole = user.role;
    let originatorName = user.name;
    if (originatorOverrideId) {
      const oUser = await getUserById(originatorOverrideId);
      if (!oUser) {
        return NextResponse.json(
          { error: "Originator override user not found", code: "INVALID_BODY" },
          { status: 422 },
        );
      }
      originatorId = oUser.id;
      originatorRole = oUser.role as any;
      originatorName = oUser.name;
    }

    let assignedSupervisorId: string | undefined =
      typeof body.assignedSupervisorId === "string" ? body.assignedSupervisorId : undefined;

    if (originatorRole === "vsr" || originatorRole === "merchandiser") {
      if (!assignedSupervisorId) {
        const hier = await resolveHierarchy(originatorId);
        assignedSupervisorId = hier.supervisorId ?? undefined;
      }
      if (!assignedSupervisorId) {
        return NextResponse.json(
          {
            error: `${originatorRole.toUpperCase()} has no assigned supervisor. Ask your TSR to set one.`,
            code: "HIERARCHY_MISSING_SUPERVISOR",
          },
          { status: 422 },
        );
      }
    } else if (originatorRole === "supervisor") {
      assignedSupervisorId = assignedSupervisorId ?? originatorId;
    }

    if (!assignedSupervisorId && originatorRole !== "super_admin" && originatorRole !== "admin") {
      return NextResponse.json(
        { error: "assignedSupervisorId is required for this role", code: "INVALID_BODY" },
        { status: 422 },
      );
    }

    // Tier 2: Supervisor-initiated workflows route directly up to the executive
    // tier (Super Admin). Auto-assign the governance admin and land in
    // `under_admin_review` so the Super Admin inbox lights up immediately.
    let assignedAdminId: string | null = null;
    let defaultStatus: any = "draft";
    if (originatorRole === "vsr") defaultStatus = "submitted_by_vsr";
    else if (originatorRole === "merchandiser") defaultStatus = "submitted_by_merchandiser";
    else if (originatorRole === "supervisor") {
      defaultStatus = "under_admin_review";
      const hier = await resolveHierarchy(originatorId);
      assignedAdminId = hier.adminId ?? null;
      if (!assignedAdminId) {
        return NextResponse.json(
          {
            error: "No super_admin available for executive routing. Seed a super_admin user first.",
            code: "HIERARCHY_MISSING_ADMIN",
          },
          { status: 422 },
        );
      }
    }

    const status = typeof body.status === "string" ? body.status : defaultStatus;
    const priority = Number.isFinite(Number(body.priority)) ? Number(body.priority) : 1;
    const documentIds = Array.isArray(body.documentIds) ? body.documentIds : [];
    const summary = typeof body.summary === "string" ? body.summary : null;
    const relatedEntityType = typeof body.relatedEntityType === "string" ? body.relatedEntityType : null;
    const relatedEntityId = typeof body.relatedEntityId === "string" ? body.relatedEntityId : null;
    const clientId = typeof body.clientId === "string" ? body.clientId : user.clientId;

    const { workflow, initialSteps } = await createWorkflow({
      originatorId,
      originatorRole: originatorRole as any,
      assignedSupervisorId: assignedSupervisorId as string,
      assignedAdminId,
      clientId: clientId ?? null,
      status,
      title,
      summary,
      priority,
      documentIds,
      relatedEntityType,
      relatedEntityId,
      actorNameForStep: originatorName,
    });

    return NextResponse.json(
      { workflow, steps: initialSteps },
      { status: 201 },
    );
  } catch (e) {
    return errResponse(e);
  }
}
