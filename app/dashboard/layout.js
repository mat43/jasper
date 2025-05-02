import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const metadata = {
    title: 'Jasper - Dashboard',
    description: 'Lets do some cool stuff',
}

export default async function DashboardLayout({ children }) {
    // run on the server every request
    const session = await getServerSession(authOptions);
    if (!session) {
        // no session so send them to /login immediately
        redirect("/login");
    }
    // if session exists, render the normal UI
    return <>{children}</>;
}
