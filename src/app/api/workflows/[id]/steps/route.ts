import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { WorkflowError, getWorkflowById, getWorkflowSteps } from "@/lib/db";

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(...WF_ROLES);
    const { id } = await params;
    await getWorkflowById(id, user);
    const steps = await getWorkflowSteps(id);
    return NextResponse.json({ steps, count: steps.length });
  } catch (e) {
    return errResponse(e);
  }
}
