import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "./api/auth/[...nextauth]/route";

export default async function HomePage() {
    // on every request, check if there’s a session
    const session = await getServerSession(authOptions);

    if (!session) {
        // not signed in, send to /signin
        redirect("/login");
    } else {
        // signed in, go to /dashboard
        redirect("/dashboard");
    }
}
