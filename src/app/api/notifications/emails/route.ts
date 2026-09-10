import { NextResponse } from "next/server";
import { recentDispatchedEmails } from "@/lib/email-service";

/**
 * GET /api/notifications/emails
 * Returns the audit trail of instant emails dispatched by the system
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get("to");

  let list = recentDispatchedEmails;
  if (to) {
    list = list.filter((e) => e.to.toLowerCase().includes(to.toLowerCase()));
  }

  return NextResponse.json({
    emails: list,
    total: list.length,
  });
}
