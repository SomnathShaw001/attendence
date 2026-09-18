import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { UserRole } from "@/types";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Institutional Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password.");
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();
        const user = await db.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid credentials or account not found.");
        }

        if (!user.isActive) {
          throw new Error("Your account has been deactivated. Contact an administrator.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Invalid password.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        const normalizedEmail = user.email.toLowerCase().trim();

        // Check if user already exists
        let existingUser = await db.user.findUnique({
          where: { email: normalizedEmail },
          include: { accounts: true },
        });

        if (!existingUser) {
          // Auto-provision new user with default STUDENT role
          existingUser = await db.user.create({
            data: {
              email: normalizedEmail,
              name: user.name || "Google User",
              image: user.image,
              role: "STUDENT",
              studentProfile: {
                create: {
                  rollNo: `GOOGLE-${Date.now().toString().slice(-6)}`,
                  batch: "General-2026",
                  department: "General",
                  admissionYear: new Date().getFullYear(),
                },
              },
            },
            include: { accounts: true },
          });
        }

        // Link Account if not yet linked
        const hasAccount = existingUser.accounts.some(
          (acc) => acc.provider === "google" && acc.providerAccountId === account.providerAccountId
        );

        if (!hasAccount) {
          await db.account.create({
            data: {
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state,
            },
          });
        }

        user.id = existingUser.id;
        user.role = existingUser.role as UserRole;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as UserRole;
      } else if (token.email && !token.role) {
        // Fetch role from DB if missing in token
        const dbUser = await db.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role as UserRole;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || (token.sub as string);
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "smart-attendance-production-fallback-secret-2026-very-secure-key-32chars",
};

export async function getServerAuthSession() {
  // SECURITY GUARD: Test auth override is strictly barred in production environments.
  if (process.env.NODE_ENV !== "production" && process.env.TEST_AUTH_USER_ID) {
    const user = await db.user.findUnique({
      where: { id: process.env.TEST_AUTH_USER_ID },
    });
    if (user) {
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
        },
      };
    }
  }
  return await getServerSession(authOptions);
}
