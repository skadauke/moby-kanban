import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// API key for programmatic access (e.g., Moby bot)
const API_KEY = process.env.API_KEY;

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";
  const isAuthApi = req.nextUrl.pathname.startsWith("/api/auth");
  const isApiRoute = req.nextUrl.pathname.startsWith("/api/");

  // Allow auth API routes (NextAuth needs these)
  if (isAuthApi) {
    return NextResponse.next();
  }

  // Check for API key authentication on API routes
  if (isApiRoute) {
    const authHeader = req.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "");
    
    // Allow if valid API key provided
    if (API_KEY && apiKey === API_KEY) {
      return NextResponse.next();
    }
    
    // Allow if user is logged in via session
    if (isLoggedIn) {
      return NextResponse.next();
    }
    
    // Reject unauthenticated API requests
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
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
