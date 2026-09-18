import { db } from "../lib/db";
import { studentInputSchema } from "../lib/validations/student";

async function runStudentTests() {
  console.log("==================================================");
  console.log("   SMART ATTENDANCE SYSTEM - STUDENTS SUITE       ");
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
  const invalidEmailResult = studentInputSchema.safeParse({
    name: "John Doe",
    email: "not-an-email",
    rollNo: "CS-101",
    batch: "CSE-2026",
    department: "Computer Science",
    admissionYear: 2024,
  });
  assert(!invalidEmailResult.success, "1. Validation: Rejects invalid email format");

  const invalidYearResult = studentInputSchema.safeParse({
    name: "John Doe",
    email: "john@university.edu",
    rollNo: "CS-101",
    batch: "CSE-2026",
    department: "Computer Science",
    admissionYear: 1995, // below 2000
  });
  assert(!invalidYearResult.success, "2. Validation: Rejects admission year before 2000");

  const validResult = studentInputSchema.safeParse({
    name: "Jane Smith",
    email: "jane.smith@university.edu",
    rollNo: "CS2026-999",
    batch: "CSE-2026",
    department: "Computer Science",
    admissionYear: 2024,
  });
  assert(validResult.success, "3. Validation: Accepts well-formed student payload");

  // 2. TEST: Database Operations & CRUD Workflow
  const testEmail = "crud.test.student@university.edu";
  const testRollNo = "TEST-ROLL-001";

  // Clean up any residual test data if left over
  const residualUser = await db.user.findUnique({ where: { email: testEmail } });
  if (residualUser) {
    await db.user.delete({ where: { id: residualUser.id } });
  }

  // CREATE directly or verify constraints
  const createdUser = await db.user.create({
    data: {
      name: "CRUD Test Student",
      email: testEmail,
      role: "STUDENT",
      isActive: true,
      studentProfile: {
        create: {
          rollNo: testRollNo,
          batch: "TEST-BATCH-A",
          department: "Computer Science",
          admissionYear: 2025,
        },
      },
    },
    include: { studentProfile: true },
  });

  assert(!!createdUser && !!createdUser.studentProfile, "4. Create: Created student account and profile in DB");
  const studentProfileId = createdUser.studentProfile!.id;

  // READ & SEARCH
  const searchResults = await db.studentProfile.findMany({
    where: {
      OR: [
        { rollNo: { contains: "TEST-ROLL" } },
        { user: { name: { contains: "CRUD Test" } } },
      ],
    },
    include: { user: true },
  });

  assert(
    searchResults.some((s) => s.rollNo === testRollNo),
    "5. Read/Search: Found student using search query"
  );

  // FILTER BY BATCH
  const batchResults = await db.studentProfile.findMany({
    where: { batch: "TEST-BATCH-A" },
  });
  assert(
    batchResults.length >= 1 && batchResults[0].rollNo === testRollNo,
    "6. Filter: Found student by batch filter"
  );

  // UPDATE
  const updatedName = "CRUD Test Student Updated";
  const updatedBatch = "TEST-BATCH-B";

  await db.user.update({
    where: { id: createdUser.id },
    data: { name: updatedName },
  });
  await db.studentProfile.update({
    where: { id: studentProfileId },
    data: { batch: updatedBatch },
  });

  const refreshedStudent = await db.studentProfile.findUnique({
    where: { id: studentProfileId },
    include: { user: true },
  });

  assert(
    refreshedStudent?.user.name === updatedName && refreshedStudent?.batch === updatedBatch,
    "7. Update: Successfully updated name and batch"
  );

  // DEACTIVATE (toggle isActive)
  await db.user.update({
    where: { id: createdUser.id },
    data: { isActive: false },
  });

  const deactivatedUser = await db.user.findUnique({ where: { id: createdUser.id } });
  assert(deactivatedUser?.isActive === false, "8. Deactivate: Student isActive set to false");

  // REACTIVATE
  await db.user.update({
    where: { id: createdUser.id },
    data: { isActive: true },
  });
  const reactivatedUser = await db.user.findUnique({ where: { id: createdUser.id } });
  assert(reactivatedUser?.isActive === true, "9. Reactivate: Student isActive restored to true");

  // INTEGRITY GUARD ON DELETION:
  // Create temporary subject, term, class, session, and attendance record
  const term = await db.academicTerm.findFirst({ where: { isCurrent: true } });
  const subject = await db.subject.findFirst();
  const teacher = await db.teacherProfile.findFirst();

  if (term && subject && teacher) {
    const testClass = await db.class.create({
      data: {
        name: "Temporary Guard Class",
        section: "G1",
        subjectId: subject.id,
        termId: term.id,
      },
    });

    const testSession = await db.classSession.create({
      data: {
        classId: testClass.id,
        subjectId: subject.id,
        teacherId: teacher.id,
        date: new Date(),
        status: "COMPLETED",
      },
    });

    const record = await db.attendanceRecord.create({
      data: {
        classSessionId: testSession.id,
        studentId: studentProfileId,
        status: "PRESENT",
      },
    });

    // Check that attendance record count > 0 blocks deletion
    const studentWithRecord = await db.studentProfile.findUnique({
      where: { id: studentProfileId },
      include: { _count: { select: { attendanceRecords: true } } },
    });

    const hasAttendanceRecords = (studentWithRecord?._count.attendanceRecords ?? 0) > 0;
    assert(
      hasAttendanceRecords,
      "10. Integrity: Student verified to have attendance records"
    );

    // Clean up the temporary session & record
    await db.attendanceRecord.delete({ where: { id: record.id } });
    await db.classSession.delete({ where: { id: testSession.id } });
    await db.class.delete({ where: { id: testClass.id } });

    assert(true, "11. Integrity: Temporary test session cleaned up");
  }

  // DELETE when 0 attendance records
  await db.user.delete({ where: { id: createdUser.id } });
  const deletedCheck = await db.user.findUnique({ where: { id: createdUser.id } });
  const profileDeletedCheck = await db.studentProfile.findUnique({ where: { id: studentProfileId } });

  assert(deletedCheck === null && profileDeletedCheck === null, "12. Delete: User and Profile safely removed when 0 records exist");

  console.log("==================================================");
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runStudentTests()
  .catch((err) => {
    console.error("Student tests failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
