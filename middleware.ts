import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const PROTECTED_PREFIXES = ["/dashboard"];

/**
 * Middleware Auth.js (без PrismaAdapter — только cookie-сессия и редиректы).
 * Окончательная проверка доступа к данным — в server components / actions через auth().
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = Boolean(req.auth?.user);

  if (pathname === "/my-recipes" || pathname.startsWith("/my-recipes/")) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/my-recipes/:path*", "/login"],
};
