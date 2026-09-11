/**
 * KEA Operations Transactional Email Service
 * Handles instant email notifications dispatched to Supervisors and VSRs
 * upon Super Admin executive decisions (Approvals, Rejections, Escalation resolutions).
 *
 * Uses the official Resend SDK (installed via `npm install resend`).
 * In SANDBOX mode (RESEND_FROM_EMAIL not set, or set to onboarding@resend.dev),
 * the `from` address is hardcoded to `onboarding@resend.dev` and all emails are
 * redirected to the validated sandbox Gmail address (RESEND_SANDBOX_TO_EMAIL).
 */

import {
  resend,
  FROM_NAME,
  FROM_ADDRESS,
  SANDBOX_FROM_ADDRESS,
  SANDBOX_TO_ADDRESS,
  isSandboxMode,
  isResendConfigured,
} from "@/lib/resend-client";

export interface EmailPayload {
  to: string;
  recipientName: string;
  subject: string;
  html: string;
  text: string;
  category: "loan_approval" | "loan_rejection" | "alert_resolution" | "general";
  metadata?: Record<string, any>;
}

export interface DispatchedEmailRecord {
  id: string;
  to: string;
  recipientName: string;
  subject: string;
  summary: string;
  category: string;
  timestamp: string;
  status: "delivered" | "sent";
  htmlContent: string;
}

// In-memory audit log for real-time dashboard inspection
export const recentDispatchedEmails: DispatchedEmailRecord[] = [];

/**
 * Send an email notification (dispatches via official Resend SDK if RESEND_API_KEY is present,
 * with fallback to instant in-memory audit trail).
 *
 * SANDBOX COMPLIANCE: When running in sandbox mode (FROM_ADDRESS === onboarding@resend.dev),
 * the `from` is hardcoded to onboarding@resend.dev and the `to` is overridden to
 * SANDBOX_TO_ADDRESS so that Resend sandbox validation always passes.
 */
export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId: string }> {
  let messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const timestamp = new Date().toISOString();
  let status: "delivered" | "sent" = "delivered";
  const sandbox = isSandboxMode();

  const fromEmail = sandbox ? SANDBOX_FROM_ADDRESS : FROM_ADDRESS;
  const from = `${FROM_NAME} <${fromEmail}>`;
  const to = sandbox ? SANDBOX_TO_ADDRESS : payload.to;

  if (isResendConfigured() && resend) {
    try {
      const res = await resend.emails.send({
        from,
        to: [to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });

      if (res?.error) {
        throw res.error;
      }

      if (res?.data?.id) {
        messageId = res.data.id;
        status = "delivered";
        console.log(
          `[KEA Resend SDK] ✓ Email delivered to ${to} (payload originally for ${payload.to}) via Resend. ID: ${messageId} | sandbox=${sandbox}`
        );
      } else {
        console.warn(`[KEA Resend SDK] Warning: Resend returned no message id in data.`);
      }
    } catch (apiErr) {
      status = "sent";
      console.error(
        `[KEA Resend SDK] Dispatch error (sandbox=${sandbox}, from=${from}, to=${to}):`,
        apiErr
      );
    }
  } else {
    console.warn(
      "[KEA Email Service] RESEND_API_KEY not set. Emails will be logged in memory only — no real dispatch occurs."
    );
    status = "sent";
  }

  const record: DispatchedEmailRecord = {
    id: messageId,
    to,
    recipientName: payload.recipientName,
    subject: payload.subject,
    summary: payload.text.slice(0, 140) + (payload.text.length > 140 ? "..." : ""),
    category: payload.category,
    timestamp,
    status,
    htmlContent: payload.html,
  };

  recentDispatchedEmails.unshift(record);
  if (recentDispatchedEmails.length > 50) recentDispatchedEmails.pop();

  console.log(
    `[KEA Email Service] ✉️ INSTANT EMAIL LOGGED to ${to} (${payload.subject}) | sandbox=${sandbox} | status=${status}`
  );

  return { success: true, messageId };
}

/**
 * Send Instant Supervisor Notification for Super Admin Loan/Funding Decision
 */
export async function sendSupervisorLoanDecisionEmail(params: {
  supervisorEmail: string;
  supervisorName: string;
  vsrName: string;
  vsrId: string;
  amount: number;
  approved: boolean;
  notes?: string;
  loanId: string;
}) {
  const { supervisorEmail, supervisorName, vsrName, amount, approved, notes, loanId } = params;
  const decisionText = approved ? "APPROVED & DISBURSED" : "REJECTED";
  const badgeColor = approved ? "#16a34a" : "#dc2626";
  const subject = `[KEA OPERATIONS] Super Admin Decision: Funding Application for ${vsrName} - ${decisionText}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background: #0b1730; color: #ffffff; padding: 24px; text-align: left; }
          .logo { font-weight: 900; font-size: 20px; letter-spacing: 0.05em; color: #14b8a6; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 6px; font-weight: 700; font-size: 13px; color: #ffffff; background-color: ${badgeColor}; margin-top: 10px; }
          .content { padding: 24px; font-size: 14px; line-height: 1.6; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; }
          .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #edf2f7; }
          .row:last-child { border-bottom: none; }
          .label { color: #64748b; font-weight: 600; font-size: 13px; }
          .val { font-weight: 700; color: #0f172a; font-size: 13px; }
          .footer { background: #f1f5f9; padding: 16px 24px; font-size: 12px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">KEA TALENT & FIELD OPERATIONS</div>
            <h2 style="margin: 8px 0 0; font-size: 18px;">Executive Decision Notification</h2>
            <div class="badge">${decisionText}</div>
          </div>
          <div class="content">
            <p>Dear <strong>${supervisorName}</strong>,</p>
            <p>This is an automated operational notification regarding the funding application you endorsed for <strong>${vsrName}</strong>.</p>
            
            <div class="card">
              <div class="row"><span class="label">VSR Representative:</span><span class="val">${vsrName}</span></div>
              <div class="row"><span class="label">Application Amount:</span><span class="val">₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span></div>
              <div class="row"><span class="label">Decision Status:</span><span class="val" style="color: ${badgeColor};">${decisionText}</span></div>
              <div class="row"><span class="label">Reference ID:</span><span class="val">${loanId}</span></div>
              ${notes ? `<div class="row"><span class="label">Executive Review Notes:</span><span class="val">${notes}</span></div>` : ""}
            </div>

            ${approved 
              ? `<p style="color: #16a34a; font-weight: 600;">✓ Capital has been approved and credited. The VSR's debt ledger is now active, and the debt validation gate has been engaged.</p>`
              : `<p style="color: #dc2626; font-weight: 600;">✗ Application was declined by the Super Admin Executive. Please contact your field team if re-application is warranted.</p>`
            }

            <p style="margin-top: 20px;">You can view full details in your <strong>Supervisor Operations Console</strong> under the Alert Triage & Document Vault sections.</p>
          </div>
          <div class="footer">
            KEA Group Operations Surveillance System · Automated Dispatch
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `KEA OPERATIONS NOTIFICATION\nSuper Admin Decision: Funding Application for ${vsrName} is ${decisionText}.\nAmount: ₦${amount.toLocaleString()}\nSupervisor: ${supervisorName}\nNotes: ${notes || "None"}\nReference: ${loanId}`;

  return sendEmail({
    to: supervisorEmail || "supervisor@kea.com",
    recipientName: supervisorName,
    subject,
    html,
    text,
    category: approved ? "loan_approval" : "loan_rejection",
    metadata: { loanId, vsrName, amount, approved }
  });
}

/**
 * Send Instant Supervisor Notification for Super Admin Alert Resolution
 */
export async function sendSupervisorAlertResolutionEmail(params: {
  supervisorEmail: string;
  supervisorName: string;
  alertTitle: string;
  alertId: string;
  notes?: string;
}) {
  const { supervisorEmail, supervisorName, alertTitle, alertId, notes } = params;
  const subject = `[KEA OPERATIONS] Escalation Resolved by Super Admin: ${alertTitle}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: sans-serif; padding: 20px; background: #f8fafc;">
        <div style="max-width: 580px; margin: 0 auto; background: #fff; border-radius: 10px; border: 1px solid #e2e8f0; padding: 24px;">
          <h2 style="color: #0b1730; margin-top: 0;">Escalation Resolved</h2>
          <p>Dear <strong>${supervisorName}</strong>,</p>
          <p>The operational escalation you routed to the Super Admin has been acknowledged and marked as <strong>RESOLVED</strong>.</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px; border-radius: 8px; margin: 16px 0;">
            <strong>Alert:</strong> ${alertTitle}<br />
            <strong>Status:</strong> Resolved by Super Admin Executive<br />
            ${notes ? `<strong>Notes:</strong> ${notes}` : ""}
          </div>
          <p>Thank you for ensuring real-time operational vigilance.</p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: supervisorEmail || "supervisor@kea.com",
    recipientName: supervisorName,
    subject,
    html,
    text: `Escalation Resolved: ${alertTitle}. Resolved by Super Admin Executive.`,
    category: "alert_resolution",
    metadata: { alertId, alertTitle }
  });
}
