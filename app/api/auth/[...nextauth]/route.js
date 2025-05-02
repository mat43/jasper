// Import nextAuth
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";

// Pull users (TODO make this from database)
const users = [
  { id: "1", username: "mathew", password: "password", name: "Mathew S" },
];

// Options for authenication
export const authOptions = {
  providers: [
    // We are only going to have credentials
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "username" },
        password: { label: "Password", type: "password" },
      },
      // Function to verify login requests
      async authorize(credentials) {
        const user = users.find(u => u.username === credentials.username);
        if (user && credentials.password === user.password) {
          // Return everything except for password
          const { password, ...safe } = user;
          return safe;
        }
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
