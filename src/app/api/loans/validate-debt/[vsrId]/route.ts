import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { getLoans, getUserById } from "@/lib/db";

/**
 * GET /api/loans/validate-debt/[vsrId]
 * Checks if a VSR has active loan debt.
 * Used by the client-side DebtValidationGate before allowing a new application.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ vsrId: string }> }
) {
  try {
    const user = await requireRole("vsr");
    const { vsrId } = await params;

    if (user.id !== vsrId && user.role !== "super_admin") {
      return NextResponse.json({ error: "Cannot check another user's debt" }, { status: 403 });
    }

    const vsr = await getUserById(vsrId);
    if (!vsr) {
      return NextResponse.json({ error: "VSR not found" }, { status: 404 });
    }

    const debt = parseFloat(vsr.loanDebt ?? "0");
    const activeLoans = await getLoans({ vsrId, status: "pending_supervisor" });
    const pendingCount = activeLoans.length;

    return NextResponse.json({
      vsrId,
      currentDebt: debt,
      isEligible: debt === 0,
      pendingApplications: pendingCount,
      detail: debt > 0
        ? `Ineligible due to active loan debt (₦${debt.toLocaleString()} outstanding)`
        : "Eligible — no active loan debt",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Validation failed" },
      { status: 500 }
    );
  }
}
