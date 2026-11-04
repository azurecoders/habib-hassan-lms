import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { UserRole } from "@/types/auth";

const AUTH_COOKIE = "habib_lms_token";

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET || "habib-hassan-lms-super-secure-production-ready-jwt-secret-key-32chars";
  return new TextEncoder().encode(secret);
};

// Route prefix to permitted roles mapping
const ROLE_ROUTES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/admin/saas", roles: ["SUPER_ADMIN"] },
  { prefix: "/admin/school", roles: ["INSTITUTION_ADMIN"] },
  { prefix: "/teacher", roles: ["TEACHER"] },
  { prefix: "/parent", roles: ["PARENT"] },
  { prefix: "/student", roles: ["STUDENT"] },
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow static files, api auth, and public routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/api/seed" // Dev helper
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;

  let userPayload: {
    userId: string;
    role: UserRole;
    schoolId?: string | null;
  } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getJwtSecretKey());
      userPayload = payload as unknown as {
        userId: string;
        role: UserRole;
        schoolId?: string | null;
      };
    } catch {
      // Token is invalid/expired
      userPayload = null;
    }
  }

  // 2. Redirect logged-in users away from /login
  if (pathname === "/login") {
    if (userPayload) {
      const roleHomeMap: Record<UserRole, string> = {
        SUPER_ADMIN: "/admin/saas",
        INSTITUTION_ADMIN: "/admin/school",
        TEACHER: "/teacher",
        PARENT: "/parent",
        STUDENT: "/student",
      };
      return NextResponse.redirect(new URL(roleHomeMap[userPayload.role] || "/", request.url));
    }
    return NextResponse.next();
  }

  // 3. Check protected routes
  const matchedRule = ROLE_ROUTES.find((r) => pathname.startsWith(r.prefix));

  if (matchedRule) {
    if (!userPayload) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role check
    if (!matchedRule.roles.includes(userPayload.role)) {
      const roleHomeMap: Record<UserRole, string> = {
        SUPER_ADMIN: "/admin/saas",
        INSTITUTION_ADMIN: "/admin/school",
        TEACHER: "/teacher",
        PARENT: "/parent",
        STUDENT: "/student",
      };
      return NextResponse.redirect(new URL(roleHomeMap[userPayload.role] || "/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/teacher/:path*",
    "/parent/:path*",
    "/student/:path*",
    "/login",
  ],
};
