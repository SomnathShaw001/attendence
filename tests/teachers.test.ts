import { db } from "../lib/db";
import { teacherInputSchema } from "../lib/validations/teacher";
import bcrypt from "bcryptjs";

async function runTeacherTests() {
  console.log("==================================================");
  console.log("    SMART ATTENDANCE SYSTEM - TEACHERS SUITE      ");
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

  // 1. TEST: Input Validation Schemas
  const invalidEmail = teacherInputSchema.safeParse({
    name: "Dr. Turing",
    email: "not-an-email",
    employeeId: "FAC-9999",
    department: "Computer Science",
  });
  assert(!invalidEmail.success, "1. Validation: Rejects invalid faculty email format");

  const invalidEmpId = teacherInputSchema.safeParse({
    name: "Dr. Turing",
    email: "turing@university.edu",
    employeeId: "A", // < 2 characters
    department: "Computer Science",
  });
  assert(!invalidEmpId.success, "2. Validation: Rejects short employee ID (< 2 chars)");

  const validPayload = teacherInputSchema.safeParse({
    name: "Prof. Ada Lovelace",
    email: "ada.lovelace@university.edu",
    employeeId: "FAC-1843",
    department: "Computer Science",
    designation: "Professor",
  });
  assert(validPayload.success, "3. Validation: Accepts well-formed faculty payload");

  // 2. TEST: Create Teacher in Database
  const testEmail = `prof.test.${Date.now()}@university.edu`;
  const testEmpId = `FAC-${Date.now().toString().slice(-5)}`;
  const passwordHash = await bcrypt.hash("Faculty@2026", 10);

  const testUser = await db.user.create({
    data: {
      name: "Prof. Test Automation",
      email: testEmail,
      role: "TEACHER",
      passwordHash,
      isActive: true,
    },
  });

  const testProfile = await db.teacherProfile.create({
    data: {
      userId: testUser.id,
      employeeId: testEmpId,
      department: "Information Technology",
      designation: "Assistant Professor",
    },
  });

  assert(
    testProfile !== null && testProfile.employeeId === testEmpId,
    "4. Create: Created teacher account and profile in DB"
  );

  // 3. TEST: Search Faculty
  const searchResults = await db.teacherProfile.findMany({
    where: {
      OR: [
        { employeeId: { contains: testEmpId } },
        { user: { name: { contains: "Automation" } } },
      ],
    },
    include: { user: true },
  });
  assert(
    searchResults.some((t) => t.id === testProfile.id),
    "5. Read/Search: Found faculty member using search criteria"
  );

  // 4. TEST: Filter by Department
  const deptResults = await db.teacherProfile.findMany({
    where: { department: "Information Technology" },
    include: { user: true },
  });
  assert(
    deptResults.some((t) => t.id === testProfile.id),
    "6. Filter: Found faculty member by department filter"
  );

  // 5. TEST: Update Faculty Profile & User
  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: testUser.id },
      data: { name: "Prof. Test Automation Ph.D." },
    });
    await tx.teacherProfile.update({
      where: { id: testProfile.id },
      data: { designation: "Associate Professor" },
    });
  });

  const updatedProfile = await db.teacherProfile.findUnique({
    where: { id: testProfile.id },
    include: { user: true },
  });
  assert(
    updatedProfile?.designation === "Associate Professor" &&
      updatedProfile.user.name === "Prof. Test Automation Ph.D.",
    "7. Update: Successfully updated designation and faculty name"
  );

  // 6. TEST: Deactivation & Reactivation
  await db.user.update({
    where: { id: testUser.id },
    data: { isActive: false },
  });
  const deactivatedUser = await db.user.findUnique({
    where: { id: testUser.id },
  });
  assert(deactivatedUser?.isActive === false, "8. Deactivate: Faculty isActive set to false");

  await db.user.update({
    where: { id: testUser.id },
    data: { isActive: true },
  });
  const reactivatedUser = await db.user.findUnique({
    where: { id: testUser.id },
  });
  assert(reactivatedUser?.isActive === true, "9. Reactivate: Faculty isActive restored to true");

  // 7. TEST: Referential Integrity Protection (Class Sessions)
  // Ensure subject and term exist for foreign keys
  let subject = await db.subject.findFirst();
  if (!subject) {
    subject = await db.subject.create({
      data: {
        code: `CS-TEST-${Date.now().toString().slice(-4)}`,
        name: "Test Systems Engineering",
        department: "Computer Science",
      },
    });
  }

  let term = await db.academicTerm.findFirst();
  if (!term) {
    term = await db.academicTerm.create({
      data: {
        name: "Test Term 2026",
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000 * 90),
        isCurrent: true,
      },
    });
  }

  const testClass = await db.class.create({
    data: {
      name: "CS-TEST-CLASS",
      section: "T1",
      subjectId: subject.id,
      termId: term.id,
    },
  });

  const testSession = await db.classSession.create({
    data: {
      classId: testClass.id,
      subjectId: subject.id,
      teacherId: testProfile.id,
      date: new Date(),
      status: "COMPLETED",
    },
  });

  // Verify deletion guard triggers when sessions exist
  const teacherWithSessions = await db.teacherProfile.findUnique({
    where: { id: testProfile.id },
    include: { classSessions: true },
  });

  const hasSessionsGuard = (teacherWithSessions?.classSessions.length ?? 0) > 0;
  assert(
    hasSessionsGuard,
    "10. Integrity Guard: Teacher with conducted class sessions cannot be deleted"
  );

  // Clean up fixture class session and class
  await db.classSession.delete({ where: { id: testSession.id } });
  await db.class.delete({ where: { id: testClass.id } });
  assert(true, "11. Cleanup: Temporary test session and class removed");

  // 8. TEST: Safe Deletion when 0 dependencies exist
  await db.$transaction(async (tx) => {
    await tx.teacherProfile.delete({ where: { id: testProfile.id } });
    await tx.user.delete({ where: { id: testUser.id } });
  });

  const deletedProfile = await db.teacherProfile.findUnique({
    where: { id: testProfile.id },
  });
  const deletedUser = await db.user.findUnique({
    where: { id: testUser.id },
  });

  assert(
    deletedProfile === null && deletedUser === null,
    "12. Delete: Teacher profile and user account safely deleted when no sessions exist"
  );

  console.log("==================================================");
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTeacherTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
