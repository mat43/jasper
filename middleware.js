import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    () => NextResponse.next(),
    {
        callbacks: {
            authorized({ token, req }) {
                const { pathname } = req.nextUrl;
                if (!token && pathname !== "/login") return false;
                if (token && pathname === "/login") {
                    const url = req.nextUrl.clone();
                    url.pathname = "/dashboard";
                    return NextResponse.redirect(url);
                }
                return true;
            },
        },
        pages: { signIn: "/login" },
    }
);

export const config = {
    matcher: ["/", "/dashboard/:path*", "/login"],
};
