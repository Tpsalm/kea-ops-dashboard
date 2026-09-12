import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { createLoan, getLoans, createAlert, getUserById, createWorkflow } from "@/lib/db";

/**
 * GET /api/loans
 * - VSR: sees own loans
 * - Supervisor: sees loans from their supervised VSRs
 * - Super Admin: sees all loans
 */
export async function GET(request: Request) {
  try {
    const user = await requireRole("super_admin", "supervisor", "vsr", "admin");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;

    let filters: Record<string, string> = {};
    if (status) filters.status = status;

    if (user.role === "vsr") {
      filters.vsrId = user.id;
    } else if (user.role === "supervisor") {
      filters.supervisorId = user.id;
    }

    const loans = await getLoans(filters);
    return NextResponse.json({ loans, count: loans.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}

/**
 * POST /api/loans
 * VSR applies for funding.
 * STRICT VALIDATION GATE: blocks if loan_debt > 0.
 */
export async function POST(request: Request) {
  try {
    const user = await requireRole("vsr");
    const body = await request.json();
    const { amount, purpose } = body;

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
    }
    if (!purpose || !purpose.trim()) {
      return NextResponse.json({ error: "Business purpose is required" }, { status: 400 });
    }

    // ──── STRICT DEBT VALIDATION GATE ────
    const vsrProfile = await getUserById(user.id);
    if (!vsrProfile) {
      return NextResponse.json({ error: "VSR profile not found" }, { status: 404 });
    }

    const currentDebt = parseFloat(String(vsrProfile.loanDebt ?? "0"));
    if (currentDebt > 0) {
      return NextResponse.json(
        {
          error: "Ineligible due to active loan debt.",
          currentDebt,
          detail: `You have an active loan debt balance of ₦${currentDebt.toLocaleString('en-NG', { minimumFractionDigits: 2 })}. Ineligible due to active loan debt.`,
        },
        { status: 403 }
      );
    }

    // ──── CREATE LOAN (pending_supervisor) ────
    const loan = await createLoan({
      vsrId: user.id,
      amount: Number(amount),
      purpose: purpose.trim(),
      supervisorId: vsrProfile.supervisorId ?? undefined,
      clientId: vsrProfile.clientId ?? undefined,
    });

    // ──── CREATE ALERT for Assigned Supervisor (Zero-bypass rule) ────
    if (vsrProfile.supervisorId) {
      await createAlert({
        type: "funding_request",
        severity: "warning",
        title: `Funding Request: ${user.name}`,
        message: `₦${Number(amount).toLocaleString()} requested for "${purpose.trim()}" — awaiting supervisor review`,
        fromUserId: user.id,
        toUserId: vsrProfile.supervisorId,
        supervisorId: vsrProfile.supervisorId,
        clientId: vsrProfile.clientId ?? undefined,
        relatedEntityType: "loans",
        relatedEntityId: loan.id,
        status: "pending_supervisor",
      });
    }

    let workflowId: string | null = null;
    try {
      if (vsrProfile.supervisorId) {
        const { workflow } = await createWorkflow({
          originatorId: user.id,
          originatorRole: "vsr",
          assignedSupervisorId: vsrProfile.supervisorId,
          assignedAdminId: null,
          clientId: vsrProfile.clientId ?? null,
          status: "submitted_by_vsr",
          title: `Funding Request: ₦${Number(amount).toLocaleString()}`,
          summary: purpose.trim(),
          priority: 3,
          documentIds: [],
          relatedEntityType: "loans",
          relatedEntityId: loan.id,
          actorNameForStep: user.name,
        });
        workflowId = workflow.id;
      }
    } catch (_wfErr) {
      // Do not fail loan creation because workflow create failed.
    }

    return NextResponse.json({ loan, workflowId, message: "Application submitted and routed to assigned Supervisor." }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to submit application" },
      { status: 500 }
    );
  }
}
