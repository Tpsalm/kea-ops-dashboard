export interface BaseEmailProps {
  title: string;
  subtitle?: string;
  accentColor?: string;
}

export interface WelcomeEmailProps {
  recipientName: string;
  role?: string;
  loginUrl?: string;
}

export interface NotificationEmailProps {
  recipientName: string;
  notificationTitle: string;
  notificationMessage: string;
  actionLabel?: string;
  actionUrl?: string;
  severity?: "info" | "success" | "warning" | "danger";
}

export interface RenderedEmail {
  html: string;
  text: string;
}

const DEFAULT_ACCENT = "#0b1730";
const DEFAULT_TEAL = "#14b8a6";

function severityStyles(severity: NotificationEmailProps["severity"] = "info") {
  switch (severity) {
    case "success":
      return { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534", label: "SUCCESS" };
    case "warning":
      return { bg: "#fffbeb", border: "#fde68a", text: "#92400e", label: "WARNING" };
    case "danger":
      return { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", label: "ALERT" };
    default:
      return { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af", label: "NOTICE" };
  }
}

export function renderBaseLayout(
  { title, subtitle, accentColor = DEFAULT_ACCENT }: BaseEmailProps,
  bodyInner: string
): RenderedEmail {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background-color: #f1f5f9;
      color: #0f172a;
      padding: 24px 12px;
      line-height: 1.6;
    }
    .email-wrapper { max-width: 600px; margin: 0 auto; }
    .email-container {
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06);
    }
    .email-header {
      background: linear-gradient(135deg, ${accentColor} 0%, #1e293b 100%);
      padding: 28px 32px;
      color: #ffffff;
    }
    .brand-mark {
      display: inline-block;
      font-weight: 900;
      font-size: 14px;
      letter-spacing: 0.08em;
      color: ${DEFAULT_TEAL};
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .email-title { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
    .email-subtitle { font-size: 14px; color: #cbd5e1; opacity: 0.9; }
    .email-body { padding: 32px; }
    .email-footer {
      background: #f8fafc;
      padding: 20px 32px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
      text-align: center;
    }
    .footer-link { color: ${DEFAULT_TEAL}; text-decoration: none; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <div class="brand-mark">KEA Talent &amp; Field Operations</div>
        <h1 class="email-title">${title}</h1>
        ${subtitle ? `<p class="email-subtitle">${subtitle}</p>` : ""}
      </div>
      <div class="email-body">
        ${bodyInner}
      </div>
      <div class="email-footer">
        <p>KEA Group Operations Surveillance System &middot; Automated Dispatch</p>
        <p style="margin-top:6px;">
          Questions? Contact <a href="mailto:support@kea.com" class="footer-link">support@kea.com</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const text =
    `KEA TALENT & FIELD OPERATIONS\n` +
    `${title.toUpperCase()}\n` +
    (subtitle ? `${subtitle}\n` : "") +
    `\n---\n\n` +
    bodyInner.replace(/<[^>]*>/g, "").trim() +
    `\n\n---\nKEA Group Operations Surveillance System · Automated Dispatch`;

  return { html, text };
}

export function renderWelcomeEmail(props: WelcomeEmailProps): RenderedEmail {
  const {
    recipientName,
    role = "Field Team Member",
    loginUrl = "https://kea-field-operations.vercel.app/login",
  } = props;

  const bodyInner = `
    <p style="font-size:15px; color:#334155; margin-bottom:20px;">
      Dear <strong style="color:#0f172a;">${recipientName}</strong>,
    </p>
    <p style="font-size:15px; color:#334155; margin-bottom:24px;">
      Welcome aboard! Your KEA Operations account has been successfully created
      with the role of <strong>${role}</strong>. You now have access to the
      Field Operations Dashboard where you can manage tasks, view alerts, and
      collaborate with your team in real time.
    </p>

    <div style="background:#f0fdfa; border:1px solid #99f6e4; border-radius:10px; padding:18px 20px; margin-bottom:24px;">
      <div style="font-size:12px; color:#0f766e; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:8px;">
        Next Step
      </div>
      <p style="font-size:14px; color:#134e4a; margin:0;">
        Sign in using the credentials provided by your supervisor to begin your onboarding.
      </p>
    </div>

    <div style="text-align:center; margin:28px 0;">
      <a href="${loginUrl}" style="
        display:inline-block;
        background:linear-gradient(135deg, ${DEFAULT_ACCENT} 0%, #1e293b 100%);
        color:#ffffff;
        text-decoration:none;
        padding:13px 34px;
        border-radius:10px;
        font-weight:700;
        font-size:15px;
        box-shadow:0 4px 12px rgba(11,23,48,0.25);
      ">
        Sign In to Dashboard →
      </a>
    </div>

    <p style="font-size:13px; color:#64748b; margin-top:24px;">
      If you did not request this account, please ignore this email
      or notify your supervisor immediately.
    </p>
  `;

  return renderBaseLayout(
    {
      title: "Welcome to KEA Operations",
      subtitle: `Your ${role} access is now active`,
    },
    bodyInner
  );
}

export function renderNotificationEmail(props: NotificationEmailProps): RenderedEmail {
  const {
    recipientName,
    notificationTitle,
    notificationMessage,
    actionLabel,
    actionUrl,
    severity = "info",
  } = props;

  const sev = severityStyles(severity);

  const bodyInner = `
    <p style="font-size:15px; color:#334155; margin-bottom:20px;">
      Hi <strong style="color:#0f172a;">${recipientName}</strong>,
    </p>

    <div style="background:${sev.bg}; border:1px solid ${sev.border}; border-left:4px solid ${sev.border}; border-radius:10px; padding:18px 20px; margin-bottom:24px;">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
        <span style="
          display:inline-block;
          padding:3px 10px;
          border-radius:6px;
          background:${sev.border};
          color:${sev.text};
          font-size:11px;
          font-weight:800;
          letter-spacing:0.05em;
          text-transform:uppercase;
        ">
          ${sev.label}
        </span>
      </div>
      <h3 style="font-size:16px; font-weight:700; color:${sev.text}; margin-bottom:8px;">
        ${notificationTitle}
      </h3>
      <p style="font-size:14px; color:#334155; margin:0; line-height:1.6;">
        ${notificationMessage}
      </p>
    </div>

    ${
      actionLabel && actionUrl
        ? `<div style="text-align:center; margin:28px 0;">
      <a href="${actionUrl}" style="
        display:inline-block;
        background:${DEFAULT_TEAL};
        color:#ffffff;
        text-decoration:none;
        padding:12px 30px;
        border-radius:10px;
        font-weight:700;
        font-size:14px;
        box-shadow:0 4px 12px rgba(20,184,166,0.25);
      ">
        ${actionLabel} →
      </a>
    </div>`
        : ""
    }

    <p style="font-size:13px; color:#64748b; margin-top:20px; padding-top:16px; border-top:1px solid #e2e8f0;">
      This is an automated notification from the KEA Operations system.
      Please do not reply directly to this email.
    </p>
  `;

  return renderBaseLayout(
    {
      title: notificationTitle,
      subtitle: "Operational Notification",
    },
    bodyInner
  );
}
