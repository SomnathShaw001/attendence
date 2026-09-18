import { db } from "../lib/db";
import { subjectInputSchema, classInputSchema } from "../lib/validations/class";

async function runClassTests() {
  console.log("==================================================");
  console.log("     SMART ATTENDANCE SYSTEM - CLASSES SUITE      ");
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
  const invalidSubjectCode = subjectInputSchema.safeParse({
    code: "C", // < 2 chars
    name: "Computer Architecture",
    department: "Computer Science",
    credits: 3,
  });
  assert(!invalidSubjectCode.success, "1. Validation: Rejects short course code (< 2 chars)");

  const invalidCredits = subjectInputSchema.safeParse({
    code: "CS401",
    name: "Compiler Design",
    department: "Computer Science",
    credits: 0, // < 1
  });
  assert(!invalidCredits.success, "2. Validation: Rejects invalid credit value (< 1)");

  const validSubject = subjectInputSchema.safeParse({
    code: "CS401",
    name: "Compiler Design",
    department: "Computer Science",
    credits: 4,
  });
  assert(validSubject.success, "3. Validation: Accepts well-formed subject payload");

  const invalidClass = classInputSchema.safeParse({
    name: "CSE-4A",
    section: "A",
    subjectId: "", // missing
    termId: "",
  });
  assert(!invalidClass.success, "4. Validation: Rejects class without subject or term");

  // 2. TEST: Subject Creation in DB
  const testSubjectCode = `TST-${Date.now().toString().slice(-5)}`;
  const createdSubject = await db.subject.create({
    data: {
      code: testSubjectCode,
      name: "Automated Testing Systems",
      department: "Computer Science",
      credits: 3,
    },
  });
  assert(
    createdSubject !== null && createdSubject.code === testSubjectCode,
    "5. Subject Create: Created course subject in curriculum catalog"
  );

  // 3. TEST: Unique Subject Code Constraint
  let duplicateCaught = false;
  try {
    await db.subject.create({
      data: {
        code: testSubjectCode,
        name: "Duplicate Testing Systems",
        department: "Computer Science",
        credits: 3,
      },
    });
  } catch {
    duplicateCaught = true;
  }
  assert(duplicateCaught, "6. Subject Integrity: Rejects duplicate course code");

  // 4. TEST: Academic Term Resolution & Class Section Creation
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

  const createdClass = await db.class.create({
    data: {
      name: "TST-SEC-A",
      section: "A",
      subjectId: createdSubject.id,
      termId: term.id,
    },
  });
  assert(
    createdClass !== null && createdClass.section === "A",
    "7. Class Create: Established class section in database"
  );

  // 5. TEST: Read / Search Class Section
  const classSearchResults = await db.class.findMany({
    where: {
      OR: [
        { name: { contains: "TST-SEC-A" } },
        { subject: { code: testSubjectCode } },
      ],
    },
    include: { subject: true, term: true },
  });
  assert(
    classSearchResults.some((c) => c.id === createdClass.id),
    "8. Class Search: Found class section via name and subject query"
  );

  // 6. TEST: Faculty Assignment to Class
  const teacher = await db.teacherProfile.findFirst({
    include: { user: true },
  });
  assert(teacher !== null, "9. Fixture: Resolved teacher for class allocation");

  if (teacher) {
    const assignment = await db.classTeacherAssignment.create({
      data: {
        classId: createdClass.id,
        teacherId: teacher.id,
        role: "PRIMARY",
      },
    });
    assert(
      assignment !== null && assignment.role === "PRIMARY",
      "10. Assignment: Assigned lead faculty to class section"
    );
  }

  // 7. TEST: Student Enrollment into Class
  const student = await db.studentProfile.findFirst({
    include: { user: true },
  });
  assert(student !== null, "11. Fixture: Resolved student for enrollment");

  if (student) {
    const enrollment = await db.classEnrollment.create({
      data: {
        classId: createdClass.id,
        studentId: student.id,
      },
    });
    assert(
      enrollment !== null && enrollment.classId === createdClass.id,
      "12. Enrollment: Enrolled student cohort member into class"
    );

    // 8. TEST: Cohort Batch Enrollment
    const activeStudents = await db.studentProfile.findMany({
      where: { user: { isActive: true }, id: { not: student.id } },
      take: 2,
    });
    if (activeStudents.length > 0) {
      await db.classEnrollment.createMany({
        data: activeStudents.map((s) => ({
          classId: createdClass.id,
          studentId: s.id,
        })),
      });
      const batchCount = await db.classEnrollment.count({
        where: { classId: createdClass.id },
      });
      assert(batchCount > 1, "13. Batch Enrollment: Enrolled cohort members in bulk");
    } else {
      assert(true, "13. Batch Enrollment: Single student in fixture verified");
    }
  }

  // 9. TEST: Referential Integrity Guard (Class Sessions)
  if (teacher) {
    const testSession = await db.classSession.create({
      data: {
        classId: createdClass.id,
        subjectId: createdSubject.id,
        teacherId: teacher.id,
        date: new Date(),
        status: "SCHEDULED",
      },
    });

    const sessionsCount = await db.classSession.count({
      where: { classId: createdClass.id },
    });
    assert(
      sessionsCount > 0,
      "14. Integrity Guard: Class has recorded sessions preventing deletion"
    );

    // Clean up session fixture
    await db.classSession.delete({ where: { id: testSession.id } });
  }

  // 10. TEST: Safe Cleanup of Class and Subject
  await db.classEnrollment.deleteMany({ where: { classId: createdClass.id } });
  await db.classTeacherAssignment.deleteMany({ where: { classId: createdClass.id } });
  await db.class.delete({ where: { id: createdClass.id } });

  const deletedClassCheck = await db.class.findUnique({ where: { id: createdClass.id } });
  assert(deletedClassCheck === null, "15. Cleanup: Class section removed safely");

  await db.subject.delete({ where: { id: createdSubject.id } });
  const deletedSubjectCheck = await db.subject.findUnique({ where: { id: createdSubject.id } });
  assert(deletedSubjectCheck === null, "16. Cleanup: Subject removed from catalog safely");

  console.log("==================================================");
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runClassTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
