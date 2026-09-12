import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import {
  updateAlert, getAlertById, createAlert, getUserById,
  createWorkflowStep,
} from "@/lib/db";
import { sendSupervisorAlertResolutionEmail } from "@/lib/email-service";

/**
 * PATCH /api/alerts/[id]/resolve
 * Super Admin resolves (closes) an alert.
 * Dispatches instant in-app alert and email notification to the originating Supervisor.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole("super_admin", "admin");
    const { id } = await params;
    let notes = "";
    try {
      const body = await request.json();
      notes = body.notes || "";
    } catch {
      // optional body
    }

    const alert = await getAlertById(id);
    const now = new Date().toISOString();
    const updated = await updateAlert(id, {
      status: "resolved",
      resolved_at: now,
    });

    if (alert && alert.fromUserId) {
      const supervisor = await getUserById(alert.fromUserId);

      // In-app alert to Supervisor
      await createAlert({
        type: "alert_resolution",
        severity: "info",
        title: `Escalation Resolved by Super Admin: ${alert.title}`,
        message: `Your escalated alert has been marked as resolved by the Super Admin Executive. ${notes ? `Notes: ${notes}` : ""}`,
        fromUserId: user.id,
        toUserId: alert.fromUserId,
        relatedEntityType: "alert",
        relatedEntityId: id,
      });

      // Instant email dispatch to Supervisor
      try {
        await sendSupervisorAlertResolutionEmail({
          supervisorEmail: supervisor?.email || "supervisor@kea.com",
          supervisorName: supervisor?.name || "Field Operations Supervisor",
          alertTitle: alert.title,
          alertId: id,
          notes,
        });
      } catch (emailErr) {
        console.error("Failed to dispatch alert resolution email:", emailErr);
      }
    }

    try {
      const { createClient } = await import("@/lib/supabase-server");
      const supabase = await createClient();
      let workflowId: string | null = null;
      if (alert?.relatedEntityType && alert?.relatedEntityId) {
        const { data: existing } = await supabase
          .from("workflows")
          .select("id")
          .eq("related_entity_type", alert.relatedEntityType)
          .eq("related_entity_id", alert.relatedEntityId)
          .limit(1)
          .maybeSingle();
        workflowId = existing?.id ?? null;
      }
      if (!workflowId) {
        const { data: sameAlert } = await supabase
          .from("workflows")
          .select("id")
          .eq("related_entity_type", "alerts")
          .eq("related_entity_id", id)
          .limit(1)
          .maybeSingle();
        workflowId = sameAlert?.id ?? null;
      }
      if (workflowId) {
        await createWorkflowStep({
          workflowId,
          stepType: "admin_action_approve",
          actorId: user.id,
          actorRole: user.role as any,
          title: "Admin Resolved",
          description: notes || "Super Admin closed this escalation.",
          statusFrom: "escalated_to_admin",
          statusTo: "approved",
        });
        await supabase.from("workflows").update({ status: "approved", updated_at: now }).eq("id", workflowId);
      }
    } catch (_e) { /* ignore */ }

    return NextResponse.json({ alert: updated, resolved: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Resolution failed" },
      { status: 500 }
    );
  }
}
