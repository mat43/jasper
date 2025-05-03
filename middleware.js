import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  () => NextResponse.next(),
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
