import { NextResponse } from "next/server";
import { getCurrentUser, requireRole } from "@/lib/auth-helpers";
import { getUsers, createUser } from "@/lib/db";

/**
 * GET /api/users
 * Lists users filtered by role/region/client/supervisor.
 * - Super Admin: sees all
 * - Supervisor: sees their supervised Merchandisers + VSRs
 */
export async function GET(request: Request) {
  try {
    const user = await requireRole("super_admin", "supervisor", "admin");
    const { searchParams } = new URL(request.url);

    const filters: Record<string, string> = {};
    if (searchParams.get("role")) filters.role = searchParams.get("role")!;
    if (searchParams.get("region")) filters.region = searchParams.get("region")!;
    if (searchParams.get("client_id")) filters.clientId = searchParams.get("client_id")!;
    if (searchParams.get("status")) filters.status = searchParams.get("status")!;

    // Supervisors can only see their own team
    if (user.role === "supervisor") {
      filters.supervisorId = user.id;
    }

    const users = await getUsers(filters);
    return NextResponse.json({ users, count: users.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: err instanceof Error && err.message.startsWith("Access denied") ? 403 : 401 }
    );
  }
}

/**
 * POST /api/users
 * Creates a new user (Merchandiser or VSR).
 * Only Supervisors and Super Admins can create users.
 */
export async function POST(request: Request) {
  try {
    const currentUser = await requireRole("super_admin", "supervisor", "admin");
    const body = await request.json();

    const { email, name, role, phone, region, state, lga, territory, supervisorId, tsrId, clientId } = body;

    if (!email || !name || !role) {
      return NextResponse.json({ error: "email, name, and role are required" }, { status: 400 });
    }

    if (!["merchandiser", "vsr", "supervisor"].includes(role)) {
      return NextResponse.json({ error: "Can only create merchandiser, vsr, or supervisor" }, { status: 400 });
    }

    // Supervisors can only create merchandisers and VSRs
    if (currentUser.role === "supervisor" && !["merchandiser", "vsr"].includes(role)) {
      return NextResponse.json({ error: "Supervisors can only create merchandisers and VSRs" }, { status: 403 });
    }

    const newUser = await createUser({
      email,
      name,
      role,
      phone,
      region: region ?? currentUser.region,
      state,
      lga,
      territory,
      supervisorId: supervisorId ?? (currentUser.role === "supervisor" ? currentUser.id : undefined),
      tsrId,
      clientId: clientId ?? currentUser.clientId,
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create user" },
      { status: 500 }
    );
  }
}
