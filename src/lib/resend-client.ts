import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.warn(
    "[Resend] WARNING: RESEND_API_KEY environment variable is not set. " +
    "Email delivery via Resend SDK will be skipped. " +
    "Add RESEND_API_KEY to .env.local for local development " +
    "or to Vercel Project Settings for production."
  );
}

export const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export const SANDBOX_FROM_ADDRESS = "onboarding@resend.dev";

export const SANDBOX_TO_ADDRESS =
  process.env.RESEND_SANDBOX_TO_EMAIL ||
  "YOUR_GMAIL_HERE@gmail.com";

export const FROM_NAME =
  process.env.RESEND_FROM_NAME || "KEA Operations";

export const FROM_ADDRESS =
  process.env.RESEND_FROM_EMAIL || SANDBOX_FROM_ADDRESS;

export function isSandboxMode(): boolean {
  return FROM_ADDRESS === SANDBOX_FROM_ADDRESS;
}

export function isResendConfigured(): boolean {
  return !!RESEND_API_KEY;
}
