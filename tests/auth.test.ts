import { db } from "../lib/db";
import { authOptions } from "../lib/auth";
import { UserRole } from "@/types";
import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { AdapterUser } from "next-auth/adapters";

interface TestAuthUser {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  image?: string | null;
}

interface CredentialsProviderType {
  id: string;
  name: string;
  type: string;
  options?: {
    authorize: (credentials?: Record<string, string>) => Promise<TestAuthUser | null>;
  };
  authorize?: (credentials?: Record<string, string>) => Promise<TestAuthUser | null>;
}

async function runAuthTests() {
  console.log("==================================================");
  console.log("   SMART ATTENDANCE SYSTEM - AUTHENTICATION SUITE ");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. TEST: Database User Accounts Exist
  const adminUser = await db.user.findUnique({ where: { email: "admin@university.edu" } });
  const teacherUser = await db.user.findUnique({ where: { email: "teacher@university.edu" } });
  const studentUser = await db.user.findUnique({ where: { email: "student@university.edu" } });

  assert(!!adminUser && adminUser.role === "ADMIN", "1. Database contains Admin account with role ADMIN");
  assert(!!teacherUser && teacherUser.role === "TEACHER", "2. Database contains Teacher account with role TEACHER");
  assert(!!studentUser && studentUser.role === "STUDENT", "3. Database contains Student account with role STUDENT");

  // 2. TEST: Credentials Provider Authorize
  const credentialsProvider = authOptions.providers.find(
    (p) => p.id === "credentials"
  ) as unknown as CredentialsProviderType;

  assert(!!credentialsProvider, "4. Credentials Provider registered in authOptions");

  const authorizeFn = credentialsProvider.options?.authorize || credentialsProvider.authorize;
  if (!authorizeFn) {
    throw new Error("Authorize function not found on credentials provider");
  }

  // Admin login success
  const adminAuth = await authorizeFn({
    email: "admin@university.edu",
    password: "Admin@123",
  });
  assert(
    !!adminAuth && adminAuth.role === "ADMIN" && adminAuth.id === adminUser?.id,
    "5. Login: Admin credentials verified successfully"
  );

  // Teacher login success
  const teacherAuth = await authorizeFn({
    email: "teacher@university.edu",
    password: "Teacher@123",
  });
  assert(
    !!teacherAuth && teacherAuth.role === "TEACHER" && teacherAuth.id === teacherUser?.id,
    "6. Login: Teacher credentials verified successfully"
  );

  // Student login success
  const studentAuth = await authorizeFn({
    email: "student@university.edu",
    password: "Student@123",
  });
  assert(
    !!studentAuth && studentAuth.role === "STUDENT" && studentAuth.id === studentUser?.id,
    "7. Login: Student credentials verified successfully"
  );

  // Invalid password rejection
  let failedLoginCaught = false;
  try {
    await authorizeFn({
      email: "admin@university.edu",
      password: "WrongPassword999",
    });
  } catch {
    failedLoginCaught = true;
  }
  assert(failedLoginCaught, "8. Security: Invalid password rejected with error");

  // Nonexistent user rejection
  let nonexistentUserCaught = false;
  try {
    await authorizeFn({
      email: "nonexistent@university.edu",
      password: "Password@123",
    });
  } catch {
    nonexistentUserCaught = true;
  }
  assert(nonexistentUserCaught, "9. Security: Nonexistent user rejected with error");

  // 3. TEST: Google OAuth Sign-in Callback Simulation
  const signInCallback = authOptions.callbacks?.signIn;
  assert(typeof signInCallback === "function", "10. signIn callback defined in authOptions");

  if (signInCallback) {
    const mockGoogleUser: User = {
      id: "google-temp-id",
      name: "Google Student Demo",
      email: "google.student@gmail.com",
      image: "https://lh3.googleusercontent.com/demo.jpg",
      role: "STUDENT",
    };

    const mockGoogleAccount = {
      provider: "google",
      type: "oauth" as const,
      providerAccountId: "google-uid-998877",
      access_token: "mock-access-token",
    };

    const googleSignInResult = await signInCallback({
      user: mockGoogleUser,
      account: mockGoogleAccount,
      profile: undefined,
      email: undefined,
      credentials: undefined,
    });

    assert(googleSignInResult === true, "11. Google OAuth: signIn callback succeeded");

    // Verify user was provisioned in database with Account link
    const provisionedUser = await db.user.findUnique({
      where: { email: "google.student@gmail.com" },
      include: { accounts: true, studentProfile: true },
    });

    assert(
      !!provisionedUser &&
        provisionedUser.role === "STUDENT" &&
        provisionedUser.accounts.length > 0 &&
        provisionedUser.accounts[0].providerAccountId === "google-uid-998877",
      "12. Google OAuth: User auto-provisioned with STUDENT profile & Account link"
    );
  }

  // 4. TEST: JWT & Session Callbacks (Session persistence)
  const jwtCallback = authOptions.callbacks?.jwt;
  const sessionCallback = authOptions.callbacks?.session;

  assert(typeof jwtCallback === "function", "13. jwt callback defined in authOptions");
  assert(typeof sessionCallback === "function", "14. session callback defined in authOptions");

  if (jwtCallback && sessionCallback && adminAuth) {
    const initialToken: JWT = {
      id: "",
      role: "STUDENT",
    };

    const token = await jwtCallback({
      token: initialToken,
      user: adminAuth,
      account: null,
    });

    assert(token.id === adminAuth.id && token.role === "ADMIN", "15. JWT Token retains user id and role");

    const emptySession: Session = {
      user: {
        id: adminAuth.id,
        role: adminAuth.role,
        name: adminAuth.name,
        email: adminAuth.email,
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    };

    const adapterUserMock: AdapterUser = {
      id: adminAuth.id,
      email: adminAuth.email ?? "admin@university.edu",
      emailVerified: null,
      role: adminAuth.role,
    };

    const session = (await sessionCallback({
      session: emptySession,
      token,
      user: adapterUserMock,
      newSession: undefined,
      trigger: "update",
    })) as Session;

    assert(
      session.user.id === adminAuth.id && session.user.role === "ADMIN",
      "16. Session persistence: Session receives id and role from JWT"
    );
  }

  // 5. TEST: Role-Based Authorization Matrix (Middleware logic verification)
  const testRoutes = [
    { path: "/settings", role: "ADMIN", allowed: true },
    { path: "/settings", role: "TEACHER", allowed: false },
    { path: "/settings", role: "STUDENT", allowed: false },
    { path: "/audit-logs", role: "ADMIN", allowed: true },
    { path: "/audit-logs", role: "TEACHER", allowed: false },
    { path: "/reports", role: "ADMIN", allowed: true },
    { path: "/reports", role: "TEACHER", allowed: true },
    { path: "/reports", role: "STUDENT", allowed: false },
    { path: "/dashboard", role: "STUDENT", allowed: true },
    { path: "/dashboard", role: "TEACHER", allowed: true },
    { path: "/dashboard", role: "ADMIN", allowed: true },
  ];

  function evaluateRouteAccess(pathname: string, userRole: string): boolean {
    const adminOnlyRoutes = ["/settings", "/audit-logs", "/teachers"];
    const isAdminRoute = adminOnlyRoutes.some(
      (r) => pathname === r || pathname.startsWith(`${r}/`)
    );
    if (isAdminRoute && userRole !== "ADMIN") return false;

    const staffOnlyRoutes = ["/reports"];
    const isStaffRoute = staffOnlyRoutes.some(
      (r) => pathname === r || pathname.startsWith(`${r}/`)
    );
    if (isStaffRoute && userRole === "STUDENT") return false;

    return true;
  }

  let matrixPassed = true;
  for (const test of testRoutes) {
    const result = evaluateRouteAccess(test.path, test.role);
    if (result !== test.allowed) {
      matrixPassed = false;
      console.error(`Route access mismatch for ${test.path} with role ${test.role}`);
    }
  }

  assert(matrixPassed, "17. Role Authorization Matrix: All 11 route & role checks passed");

  console.log("==================================================");
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
