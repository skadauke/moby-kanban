import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";
  const isAuthApi = req.nextUrl.pathname.startsWith("/api/auth");
  const isPublicApi = req.nextUrl.pathname === "/api/tasks" && req.method === "GET";

  // Allow auth API routes
  if (isAuthApi) {
    return NextResponse.next();
  }

  // Allow public read access to tasks API (for Moby to read)
  if (isPublicApi) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login (except login page)
  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Redirect authenticated users away from login page
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
