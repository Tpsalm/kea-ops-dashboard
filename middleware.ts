import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "./src/lib/supabase-middleware";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  // 1. Try real Supabase Auth session
  const supabase = updateSession(request, response);
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Valid Supabase session — let them through
    return response;
  }

  // 2. Backward-compat: allow demo cookie for legacy login flow
  if (request.cookies.get("kea_auth")?.value === "1") {
    return response;
  }

  // 3. No valid session — redirect to login
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  );
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/portal/:path*",
    "/vsr-operations/:path*",
    "/merchandiser/:path*",
    "/tsr/:path*",
    "/supervisor/:path*",
    "/funding-deployment/:path*",
  ],
};
