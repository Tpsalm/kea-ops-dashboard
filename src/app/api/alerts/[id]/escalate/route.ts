import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import {
  updateAlert, escalateWorkflow, createWorkflow, getUserById,
} from "@/lib/db";
import { sendSupervisorEscalationNotificationEmail } from "@/lib/email-service";

/**
 * PATCH /api/alerts/[id]/escalate
 * Supervisor escalates an alert to the Super Admin.
 * Changes to_user_id to the admin's id and sets status to "escalated".
 * Attaches or escalates the related Workflow row, then dispatches a
 * non-blocking escalation confirmation email to the supervisor.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole("supervisor", "admin");
    const { id } = await params;
    const body = await request.json();
    const { adminUserId } = body;

    if (!adminUserId) {
      return NextResponse.json({ error: "adminUserId is required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const updated = await updateAlert(id, {
      status: "escalated",
      to_user_id: adminUserId,
      reviewed_at: now,
    });

    try {
      const { createClient } = await import("@/lib/supabase-server");
      const supabase = await createClient();
      const { data: alert } = await supabase
        .from("alerts")
        .select("from_user_id, title, related_entity_type, related_entity_id, client_id, supervisor_id, message")
        .eq("id", id)
        .single();
      if (alert) {
        let workflowId: string | null = null;
        let workflowRef: any = null;
        if (alert.related_entity_type && alert.related_entity_id) {
          const { data: existing } = await supabase
            .from("workflows")
            .select("id")
            .eq("related_entity_type", alert.related_entity_type)
            .eq("related_entity_id", alert.related_entity_id)
            .limit(1)
            .maybeSingle();
          workflowId = existing?.id ?? null;
        }
        const orig = alert.from_user_id ? await getUserById(alert.from_user_id).catch(() => null) : null;
        if (workflowId && user.role === "supervisor") {
          const { workflow } = await escalateWorkflow(workflowId, user, user.name).catch(() => ({ workflow: null, step: null })) as any;
          workflowRef = workflow;
        } else if (!workflowId && alert.from_user_id) {
          const supId = alert.supervisor_id ?? orig?.supervisorId ?? user.id;
          const sb2 = await createClient();
          const { data: admin } = await sb2
            .from("users")
            .select("id, name")
            .eq("role", "super_admin")
            .limit(1)
            .maybeSingle();
          const { workflow } = await createWorkflow({
            originatorId: alert.from_user_id,
            originatorRole: (orig?.role ?? "vsr") as any,
            assignedSupervisorId: supId,
            assignedAdminId: admin?.id ?? null,
            clientId: alert.client_id ?? null,
            status: "escalated_to_admin",
            title: `Escalated Alert: ${alert.title}`,
            summary: alert.message ?? null,
            priority: 3,
            documentIds: [],
            relatedEntityType: "alerts",
            relatedEntityId: id,
            actorNameForStep: orig?.name ?? "Field Staff",
          }).catch(() => ({ workflow: null, initialSteps: [] })) as any;
          workflowRef = workflow;
        }

        // ──── Non-blocking Resend: Escalation Confirmation Email ────
        try {
          if (workflowRef && user.role === "supervisor") {
            sendSupervisorEscalationNotificationEmail({
              supervisorEmail: user.email ?? "supervisor@kea.com",
              supervisorName: user.name,
              workflowId: workflowRef.id,
              workflowTitle: workflowRef.title,
              originatorName: orig?.name ?? "Field Staff",
              originatorRole: orig?.role ?? "vsr",
            }).catch((emailErr) => {
              console.warn("[alerts/escalate] Resend failed (non-blocking):", emailErr);
            });
          }
        } catch (_emailOuter) {}
      }
    } catch (_e) { /* ignore */ }

    return NextResponse.json({ alert: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Escalation failed" },
      { status: 500 }
    );
  }
}
