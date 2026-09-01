import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (request.cookies.get("kea_auth")?.value === "1") return NextResponse.next();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
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
