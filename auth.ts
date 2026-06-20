// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import db from "@/lib/db";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        // 1. Check if user exists in Supabase
        const user = await db.user.findUnique({
          where: { email }
        });

        if (!user || !user.passwordHash) return null;

        // 2. Validate password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) return null;

        // 3. Return user data to store in JWT
        return {
          id: user.id,
          name: user.username,
          email: user.email,
          image: user.image
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // Typing parameters as "any" prevents TypeScript from failing on custom properties like username
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.username = user.name; // In authorize() above, we mapped user.username to name
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login", // Redirect unauthorized traffic here
  }
});