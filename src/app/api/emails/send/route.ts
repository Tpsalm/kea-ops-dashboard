import { NextResponse } from "next/server";
import {
  resend,
  FROM_NAME,
  FROM_ADDRESS,
  SANDBOX_FROM_ADDRESS,
  SANDBOX_TO_ADDRESS,
  isSandboxMode,
  isResendConfigured,
} from "@/lib/resend-client";
import {
  renderWelcomeEmail,
  renderNotificationEmail,
  type WelcomeEmailProps,
  type NotificationEmailProps,
} from "@/lib/email-templates";
import {
  recentDispatchedEmails,
  type DispatchedEmailRecord,
} from "@/lib/email-service";

export const dynamic = "force-dynamic";

type TemplateType = "welcome" | "notification" | "custom";

interface SendEmailRequestBody {
  template: TemplateType;
  to?: string;
  from?: string;
  subject?: string;
  props?: Record<string, any>;
  html?: string;
  text?: string;
  category?: string;
  recipientName?: string;
}

interface SendEmailSuccessResponse {
  success: true;
  messageId: string;
  from: string;
  to: string;
  subject: string;
  dispatchedAt: string;
  sandbox: boolean;
  record: DispatchedEmailRecord;
}

interface SendEmailErrorResponse {
  success: false;
  error: string;
  code:
    | "INVALID_BODY"
    | "MISSING_TEMPLATE"
    | "RESEND_NOT_CONFIGURED"
    | "TEMPLATE_PROPS_INVALID"
    | "RESEND_API_ERROR"
    | "INTERNAL_ERROR";
  details?: unknown;
  sandbox: boolean;
}

function resolveRecipients(bodyTo?: string) {
  const sandbox = isSandboxMode();

  const from = sandbox
    ? `${FROM_NAME} <${SANDBOX_FROM_ADDRESS}>`
    : `${FROM_NAME} <${FROM_ADDRESS}>`;

  const to = sandbox ? SANDBOX_TO_ADDRESS : bodyTo || SANDBOX_TO_ADDRESS;

  return { from, to, sandbox };
}

export async function POST(request: Request) {
  let body: SendEmailRequestBody;

  try {
    body = (await request.json()) as SendEmailRequestBody;
  } catch {
    return NextResponse.json<SendEmailErrorResponse>(
      {
        success: false,
        error: "Invalid JSON body",
        code: "INVALID_BODY",
        sandbox: isSandboxMode(),
      },
      { status: 400 }
    );
  }

  const { template, subject, category, recipientName } = body;

  if (!template) {
    return NextResponse.json<SendEmailErrorResponse>(
      {
        success: false,
        error: "Missing required field: template",
        code: "MISSING_TEMPLATE",
        sandbox: isSandboxMode(),
      },
      { status: 400 }
    );
  }

  if (!isResendConfigured()) {
    return NextResponse.json<SendEmailErrorResponse>(
      {
        success: false,
        error:
          "Resend API key is not configured. Set RESEND_API_KEY in .env.local or Vercel Project Settings.",
        code: "RESEND_NOT_CONFIGURED",
        sandbox: isSandboxMode(),
      },
      { status: 500 }
    );
  }

  const { from, to, sandbox } = resolveRecipients(body.to);

  let html: string;
  let text: string;
  let resolvedSubject: string;
  let recordCategory = category || "general";
  let resolvedRecipientName = recipientName || to;

  try {
    switch (template) {
      case "welcome": {
        const props = (body.props || {}) as Partial<WelcomeEmailProps>;
        resolvedRecipientName = props.recipientName || resolvedRecipientName;
        const rendered = renderWelcomeEmail({
          recipientName: resolvedRecipientName,
          role: props.role,
          loginUrl: props.loginUrl,
        });
        html = rendered.html;
        text = rendered.text;
        resolvedSubject = subject || `Welcome to KEA Operations, ${resolvedRecipientName}!`;
        recordCategory = "general";
        break;
      }

      case "notification": {
        const props = (body.props || {}) as Partial<NotificationEmailProps>;
        if (!props.notificationTitle || !props.notificationMessage) {
          return NextResponse.json<SendEmailErrorResponse>(
            {
              success: false,
              error:
                "Notification template requires props.notificationTitle and props.notificationMessage",
              code: "TEMPLATE_PROPS_INVALID",
              sandbox,
            },
            { status: 400 }
          );
        }
        resolvedRecipientName = props.recipientName || resolvedRecipientName;
        const rendered = renderNotificationEmail({
          recipientName: resolvedRecipientName,
          notificationTitle: props.notificationTitle,
          notificationMessage: props.notificationMessage,
          actionLabel: props.actionLabel,
          actionUrl: props.actionUrl,
          severity: props.severity || "info",
        });
        html = rendered.html;
        text = rendered.text;
        resolvedSubject = subject || `[KEA Ops] ${props.notificationTitle}`;
        recordCategory = "general";
        break;
      }

      case "custom": {
        if (!body.html || !body.text) {
          return NextResponse.json<SendEmailErrorResponse>(
            {
              success: false,
              error: "Custom template requires html and text fields",
              code: "TEMPLATE_PROPS_INVALID",
              sandbox,
            },
            { status: 400 }
          );
        }
        html = body.html;
        text = body.text;
        resolvedSubject = subject || "Message from KEA Operations";
        break;
      }

      default:
        return NextResponse.json<SendEmailErrorResponse>(
          {
            success: false,
            error: `Unknown template type: ${String(template)}. Use 'welcome', 'notification', or 'custom'.`,
            code: "MISSING_TEMPLATE",
            sandbox,
          },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error("[api/emails/send] Template render error:", err);
    return NextResponse.json<SendEmailErrorResponse>(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to render email template",
        code: "TEMPLATE_PROPS_INVALID",
        details: err,
        sandbox,
      },
      { status: 500 }
    );
  }

  const timestamp = new Date().toISOString();
  let messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  try {
    const sendResult = await resend!.emails.send({
      from,
      to: [to],
      subject: resolvedSubject,
      html,
      text,
    });

    if (sendResult?.error) {
      throw sendResult.error;
    }

    if (sendResult?.data?.id) {
      messageId = sendResult.data.id;
    }

    console.log(
      `[api/emails/send] ✓ Email dispatched via Resend | id=${messageId} | to=${to} | template=${template} | sandbox=${sandbox}`
    );
  } catch (err) {
    console.error("[api/emails/send] Resend API call failed:", err);

    const errorBody =
      err && typeof err === "object" && "name" in err && "message" in err
        ? { name: (err as Error).name, message: (err as Error).message, stack: (err as Error).stack }
        : err;

    return NextResponse.json<SendEmailErrorResponse>(
      {
        success: false,
        error:
          err instanceof Error
            ? `Resend API error: ${err.message}`
            : "Unknown error while calling Resend API",
        code: "RESEND_API_ERROR",
        details: errorBody,
        sandbox,
      },
      { status: 502 }
    );
  }

  const record: DispatchedEmailRecord = {
    id: messageId,
    to,
    recipientName: resolvedRecipientName,
    subject: resolvedSubject,
    summary: text.slice(0, 140) + (text.length > 140 ? "..." : ""),
    category: recordCategory,
    timestamp,
    status: "sent",
    htmlContent: html,
  };

  recentDispatchedEmails.unshift(record);
  if (recentDispatchedEmails.length > 50) recentDispatchedEmails.pop();

  return NextResponse.json<SendEmailSuccessResponse>(
    {
      success: true,
      messageId,
      from,
      to,
      subject: resolvedSubject,
      dispatchedAt: timestamp,
      sandbox,
      record,
    },
    { status: 200 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      endpoint: "/api/emails/send",
      method: "POST",
      sandbox: isSandboxMode(),
      configured: isResendConfigured(),
      templates: ["welcome", "notification", "custom"],
      description:
        "Dispatch transactional emails via Resend. Use template='welcome' or 'notification' for structured emails, or 'custom' to provide raw html/text.",
      requestBody: {
        template: "'welcome' | 'notification' | 'custom'",
        to: "string (required in production, overridden in sandbox)",
        subject: "string (optional)",
        recipientName: "string (optional)",
        category: "string (optional)",
        props: "object (template-specific, see templates in src/lib/email-templates.ts)",
        html: "string (required for template='custom')",
        text: "string (required for template='custom')",
      },
      example_welcome: {
        template: "welcome",
        props: {
          recipientName: "Jane Doe",
          role: "Supervisor",
        },
      },
      example_notification: {
        template: "notification",
        props: {
          recipientName: "John VSR",
          notificationTitle: "New Task Assigned",
          notificationMessage: "A new field audit has been assigned to your route.",
          severity: "info",
          actionLabel: "View Task",
          actionUrl: "https://kea-field-operations.vercel.app/dashboard",
        },
      },
    },
    { status: 200 }
  );
}
