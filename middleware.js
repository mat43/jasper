import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  (req) => {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    // "Nutrition only" users may see the main dashboard (everything else greyed
    // out) and the nutrition calculator, but nothing else under /dashboard.
    if (token?.nutritionOnly) {
      const allowed =
        pathname === "/dashboard" || pathname.startsWith("/dashboard/health");
      if (!allowed) {
        return NextResponse.redirect(new URL("/dashboard/health", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        // if there is no token, block access to /dashboard/*
        const { pathname } = req.nextUrl;
        if (!token && pathname.startsWith("/dashboard")) return false;
        // otherwise allow through
        return true;
      },
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
