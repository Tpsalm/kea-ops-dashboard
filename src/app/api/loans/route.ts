import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { createLoan, getLoans, createAlert, getUserById } from "@/lib/db";

/**
 * GET /api/loans
 * - VSR: sees own loans
 * - Supervisor: sees loans from their supervised VSRs (pending_supervisor)
 * - Super Admin: sees all pending_admin + approved + rejected loans
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
      // Supervisor sees loans from their team that are pending their review
      filters.supervisorId = user.id;
    }
    // Super Admin sees all (no extra filter)

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
 * VALIDATION GATE: blocks if loan_debt > 0.
 */
export async function POST(request: Request) {
  try {
    const user = await requireRole("vsr");
    const body = await request.json();
    const { amount, purpose } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
    }

    // ──── DEBT VALIDATION GATE ────
    const vsrProfile = await getUserById(user.id);
    if (!vsrProfile) {
      return NextResponse.json({ error: "VSR profile not found" }, { status: 404 });
    }

    const currentDebt = parseFloat(vsrProfile.loanDebt ?? "0");
    if (currentDebt > 0) {
      return NextResponse.json(
        {
          error: "Ineligible due to active loan debt",
          currentDebt,
          detail: `You have an outstanding balance of ₦${currentDebt.toLocaleString()}. Please settle your existing loan before applying for new funding.`,
        },
        { status: 403 }
      );
    }

    // ──── CREATE LOAN ────
    const loan = await createLoan({ vsrId: user.id, amount, purpose });

    // ──── CREATE ALERT for Supervisor ────
    if (vsrProfile.supervisorId) {
      await createAlert({
        type: "funding_request",
        severity: "warning",
        title: `Funding request from ${user.name}`,
        message: `₦${Number(amount).toLocaleString()} requested — awaiting supervisor review`,
        fromUserId: user.id,
        toUserId: vsrProfile.supervisorId,
        supervisorId: vsrProfile.supervisorId,
        relatedEntityType: "loan",
        relatedEntityId: loan.id,
      });
    }

    return NextResponse.json({ loan }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to submit application" },
      { status: 500 }
    );
  }
}
