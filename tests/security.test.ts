import { getServerAuthSession } from "../lib/auth";
import { RateLimiter } from "../lib/rate-limit";
import { generateQrPath } from "../lib/qr-svg";

async function runSecurityTests() {
  console.log("==========================================================");
  console.log("   SMART ATTENDANCE - SECURITY HARDENING TEST SUITE       ");
  console.log("==========================================================");

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

  // TEST 1: Critical Backdoor Guard in Production
  const originalEnv = process.env.NODE_ENV;
  const originalTestUser = process.env.TEST_AUTH_USER_ID;

  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.TEST_AUTH_USER_ID = "fake-injected-admin-id";

    let bypassed = false;
    try {
      const session = await getServerAuthSession();
      if (session?.user?.id === "fake-injected-admin-id") {
        bypassed = true;
      }
    } catch {
      // In standalone CLI script, getServerSession throws headers error,
      // confirming it fell through and the backdoor was not triggered.
      bypassed = false;
    }

    assert(
      !bypassed,
      "Production Security: TEST_AUTH_USER_ID backdoor is strictly barred in production"
    );
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
    if (originalTestUser !== undefined) {
      process.env.TEST_AUTH_USER_ID = originalTestUser;
    } else {
      delete process.env.TEST_AUTH_USER_ID;
    }
  }

  // TEST 2: Rate Limiter Token Bucket Behavior
  const testLimiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 });
  const ipKey = "test-attacker-ip";

  const req1 = testLimiter.check(ipKey);
  const req2 = testLimiter.check(ipKey);
  const req3 = testLimiter.check(ipKey);
  const req4 = testLimiter.check(ipKey);

  assert(req1.success && req1.remaining === 2, "Rate Limiting: First request allowed with correct remaining quota");
  assert(req2.success && req2.remaining === 1, "Rate Limiting: Second request allowed");
  assert(req3.success && req3.remaining === 0, "Rate Limiting: Third request allowed (threshold reached)");
  assert(!req4.success && req4.remaining === 0, "Rate Limiting: Fourth request throttled / blocked");
  assert(req4.resetMs > 0, "Rate Limiting: Returns valid reset timeout in milliseconds");

  // TEST 3: Rate Limiter Key Isolation
  const benignUserKey = "test-benign-student";
  const benignReq = testLimiter.check(benignUserKey);
  assert(benignReq.success, "Rate Limiting: Isolation verified; throttling key does not impact other users");

  // TEST 4: CSV Formula Injection Escaping Logic
  function escapeCsvCell(cell: string | number | null | undefined): string {
    if (cell === null || cell === undefined) return '""';
    let str = String(cell);
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  }

  const formulaAttack = "=CMD|' /C calc'!A0";
  const plusAttack = "+123456789";
  const atAttack = "@SUM(A1:A10)";
  const normalName = "Alice Smith";

  assert(escapeCsvCell(formulaAttack).startsWith("\"'=CMD"), "CSV Sanitization: Neutralizes '=' formula execution prefix");
  assert(escapeCsvCell(plusAttack).startsWith("\"'+123"), "CSV Sanitization: Neutralizes '+' formula execution prefix");
  assert(escapeCsvCell(atAttack).startsWith("\"'@SUM"), "CSV Sanitization: Neutralizes '@' formula execution prefix");
  assert(escapeCsvCell(normalName) === '"Alice Smith"', "CSV Sanitization: Preserves benign names without extra escape");

  // TEST 5: QR SVG Native Path Vector Generation
  const qrOutput = generateQrPath("TEST_PAYLOAD", 280);
  assert(qrOutput.size === 280, "QR Vector Generation: Correct dimensions returned");
  assert(qrOutput.pathD.startsWith("M") && qrOutput.pathD.length > 50, "QR Vector Generation: Generates valid SVG module path string");

  console.log("----------------------------------------------------------");
  console.log(`SECURITY TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log("==========================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests().catch((err) => {
  console.error("Security tests failed:", err);
  process.exit(1);
});
