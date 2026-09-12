import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import {
  createDocument, getDocuments, createAlert, getUserById,
  WorkflowError, resolveHierarchy, createWorkflow,
} from "@/lib/db";

/**
 * GET /api/documents
 * - Supervisor: sees their uploaded documents
 * - Super Admin: sees all documents
 */
/**
 * GET /api/documents
 * - Supervisor: sees their uploaded documents and all incoming submissions from their merchandisers & VSRs
 * - Super Admin: sees all documents
 * - Merchandiser / VSR: sees their own uploaded submissions
 */
export async function GET(request: Request) {
  try {
    const user = await requireRole("super_admin", "supervisor", "admin", "merchandiser", "vsr");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const type = searchParams.get("type") ?? undefined;

    const filters: Record<string, string> = {};
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (user.role === "supervisor") {
      filters.supervisorId = user.id;
    } else if (user.role === "merchandiser" || user.role === "vsr") {
      filters.uploaderId = user.id;
    }

    const docs = await getDocuments(filters);
    return NextResponse.json({ documents: docs, count: docs.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}

/**
 * POST /api/documents
 * - Supervisor uploads a POD Tracker Template or Monthly VSR Performance Report -> alerts Super Admin.
 * - Merchandiser uploads completed POD Tracker -> alerts Supervisor instantly.
 * - VSR uploads Weekly or Monthly Field Sales & Reconciliation Report -> alerts Supervisor instantly.
 */
export async function POST(request: Request) {
  try {
    const user = await requireRole("super_admin", "supervisor", "admin", "merchandiser", "vsr");
    const body = await request.json();
    const { type, title, fileUrl, fileName, notes, targetUserId, supervisorId, metadata } = body;

    if (!type || !title || !fileUrl) {
      return NextResponse.json({ error: "type, title, and fileUrl are required" }, { status: 400 });
    }

    const validTypes = [
      "pod_tracker",
      "merchandiser_pod",
      "vsr_weekly_report",
      "vsr_monthly_report",
      "performance_report",
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: `Invalid document type. Must be one of: ${validTypes.join(", ")}` }, { status: 400 });
    }

    const uploaderProfile = await getUserById(user.id);
    let effectiveSupervisorId = supervisorId || uploaderProfile?.supervisorId || (user.role === "supervisor" ? user.id : undefined);

    if (!effectiveSupervisorId && (user.role === "merchandiser" || user.role === "vsr")) {
      const hier = await resolveHierarchy(user.id);
      effectiveSupervisorId = hier.supervisorId ?? undefined;
    }

    if (user.role === "merchandiser" && !effectiveSupervisorId) {
      return NextResponse.json(
        {
          error: "Merchandiser has no assigned supervisor. Ask your TSR to set supervisor_id on your profile.",
          code: "HIERARCHY_MISSING_SUPERVISOR",
        },
        { status: 422 },
      );
    }

    const doc = await createDocument({
      uploaderId: user.id,
      supervisorId: effectiveSupervisorId,
      targetUserId: targetUserId ?? undefined,
      clientId: uploaderProfile?.clientId ?? undefined,
      type,
      title,
      fileUrl,
      fileName,
      notes: notes || (metadata ? JSON.stringify(metadata) : undefined),
    });

    let workflowId: string | null = null;
    try {
      if (effectiveSupervisorId && (user.role === "merchandiser" || user.role === "vsr" || user.role === "supervisor")) {
        const wfStatus: any =
          user.role === "merchandiser" ? "submitted_by_merchandiser" :
          user.role === "vsr" ? "submitted_by_vsr" : "under_supervisor_review";
        const { workflow } = await createWorkflow({
          originatorId: user.id,
          originatorRole: user.role as any,
          assignedSupervisorId: effectiveSupervisorId,
          assignedAdminId: null,
          clientId: uploaderProfile?.clientId ?? null,
          status: wfStatus,
          title: `Document: ${title}`,
          summary: notes ?? `Uploaded ${type} document`,
          priority: 2,
          documentIds: [doc.id],
          relatedEntityType: "documents",
          relatedEntityId: doc.id,
          actorNameForStep: user.name,
        });
        workflowId = workflow.id;
      }
    } catch (_wfErr) {
      // Workflow creation should not fail the document upload; continue silently.
    }

    const { createClient } = await import("@/lib/supabase-server");
    const supabase = await createClient();

    // Determine Alert Recipient and Content based on Uploader Role
    if (user.role === "merchandiser" || user.role === "vsr") {
      // Find the Supervisor to receive this instant alert
      let targetSupervisorId = effectiveSupervisorId;
      if (!targetSupervisorId) {
        const { data: supUser } = await supabase
          .from("users")
          .select("id")
          .eq("role", "supervisor")
          .limit(1)
          .single();
        targetSupervisorId = supUser?.id;
      }

      if (targetSupervisorId) {
        let typeLabel = "Document";
        if (type === "merchandiser_pod") typeLabel = "Merchandiser POD Tracker";
        else if (type === "vsr_weekly_report") typeLabel = "VSR Weekly Field Sales Report";
        else if (type === "vsr_monthly_report") typeLabel = "VSR Monthly Performance & Reconciliation Report";

        await createAlert({
          type: type === "merchandiser_pod" ? "pod_submission" : "field_report_submission",
          severity: "info",
          title: `[Submission Received] ${typeLabel}: ${title}`,
          message: `${user.name} (${user.role.toUpperCase()}) submitted ${typeLabel}. File: ${fileName || "Attached"}. Notes: ${notes || "None"}`,
          fromUserId: user.id,
          toUserId: targetSupervisorId,
          supervisorId: targetSupervisorId,
          clientId: uploaderProfile?.clientId ?? undefined,
          relatedEntityType: "documents",
          relatedEntityId: doc.id,
          status: "pending_supervisor",
        });
      }
    } else if (user.role === "supervisor") {
      // Alert the Super Admin for Supervisor Vault uploads
      const { data: adminUser } = await supabase
        .from("users")
        .select("id")
        .eq("role", "super_admin")
        .limit(1)
        .single();

      if (adminUser) {
        const typeLabel = type === "pod_tracker" ? "POD Tracker Template" : "Monthly Performance Report";
        await createAlert({
          type: "document_upload",
          severity: "info",
          title: `${typeLabel} Uploaded: ${title}`,
          message: `Supervisor ${user.name} uploaded ${typeLabel} for executive review. Notes: ${notes || "None"}`,
          fromUserId: user.id,
          toUserId: adminUser.id,
          supervisorId: user.id,
          clientId: uploaderProfile?.clientId ?? undefined,
          relatedEntityType: "documents",
          relatedEntityId: doc.id,
          status: "pending_admin",
        });
      }
    }

    return NextResponse.json({
      document: doc,
      workflowId,
      message: user.role === "supervisor"
        ? "Document uploaded and Super Admin alerted."
        : "Submission sent and Supervisor alerted instantly.",
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
