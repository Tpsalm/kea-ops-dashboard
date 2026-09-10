import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { createDocument, getDocuments, createAlert } from "@/lib/db";

/**
 * GET /api/documents
 * - Supervisor: sees their uploaded documents
 * - Super Admin: sees all documents pending review
 */
export async function GET(request: Request) {
  try {
    const user = await requireRole("super_admin", "supervisor", "admin");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;

    const filters: Record<string, string> = {};
    if (status) filters.status = status;
    if (user.role === "supervisor") {
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
 * Supervisor uploads a POD Tracker or Performance Report.
 * Triggers an instant alert to the Super Admin.
 */
export async function POST(request: Request) {
  try {
    const user = await requireRole("super_admin", "supervisor", "admin");
    const body = await request.json();
    const { type, title, fileUrl, fileName, notes } = body;

    if (!type || !title || !fileUrl) {
      return NextResponse.json({ error: "type, title, and fileUrl are required" }, { status: 400 });
    }

    if (!["pod_tracker", "performance_report"].includes(type)) {
      return NextResponse.json({ error: "type must be 'pod_tracker' or 'performance_report'" }, { status: 400 });
    }

    const doc = await createDocument({
      uploaderId: user.id,
      supervisorId: user.id,
      type,
      title,
      fileUrl,
      fileName,
      notes,
    });

    // Alert the Super Admin
    const { createClient } = await import("@/lib/supabase-server");
    const supabase = await createClient();
    const { data: adminUser } = await supabase
      .from("users")
      .select("id")
      .eq("role", "super_admin")
      .limit(1)
      .single();

    if (adminUser) {
      const typeLabel = type === "pod_tracker" ? "POD Tracker" : "Monthly Performance Report";
      await createAlert({
        type: "document_upload",
        severity: "info",
        title: `${typeLabel} uploaded by ${user.name}`,
        message: title,
        fromUserId: user.id,
        toUserId: adminUser.id,
        relatedEntityType: "document",
        relatedEntityId: doc.id,
      });
    }

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
