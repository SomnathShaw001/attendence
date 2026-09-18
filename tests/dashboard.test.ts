import { db } from "../lib/db";
import {
  getAdminDashboardData,
  getTeacherDashboardData,
  getStudentDashboardData,
} from "../lib/dashboard-data";

async function runDashboardTests() {
  console.log("==================================================");
  console.log("    SMART ATTENDANCE SYSTEM - DASHBOARD SUITE     ");
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

  // 1. Fetch pre-seeded test accounts
  const adminUser = await db.user.findUnique({ where: { email: "admin@university.edu" } });
  const teacherUser = await db.user.findUnique({ where: { email: "teacher@university.edu" } });
  const studentUser = await db.user.findUnique({ where: { email: "student@university.edu" } });

  assert(!!adminUser, "1. Admin user account loaded from DB");
  assert(!!teacherUser, "2. Teacher user account loaded from DB");
  assert(!!studentUser, "3. Student user account loaded from DB");

  // 2. TEST: Admin Dashboard Data
  const adminData = await getAdminDashboardData();
  assert(adminData.studentCount >= 1, "4. Admin: Returns real student count (>= 1)");
  assert(adminData.teacherCount >= 1, "5. Admin: Returns real teacher count (>= 1)");
  assert(typeof adminData.classCount === "number", "6. Admin: Returns class count as number");
  assert(adminData.subjectCount >= 1, "7. Admin: Returns real subject count (>= 1)");
  assert(adminData.minAttendanceThreshold === 75.0, "8. Admin: Reads institutional threshold (75.0%)");
  assert(adminData.currentTerm?.name === "Fall Semester 2026", "9. Admin: Reads current academic term");

  // 3. TEST: Teacher Dashboard Data (Empty & Populated states)
  if (teacherUser) {
    const teacherData = await getTeacherDashboardData(teacherUser.id);
    assert(!!teacherData.teacher, "10. Teacher: Resolves teacher profile");
    assert(
      teacherData.teacher?.employeeId === "FAC-10024",
      "11. Teacher: Matches employee ID FAC-10024"
    );
    assert(
      Array.isArray(teacherData.assignedClasses),
      "12. Teacher: Returns assigned classes array (empty state handled cleanly)"
    );
    assert(
      Array.isArray(teacherData.recentSessions),
      "13. Teacher: Returns sessions array (empty state handled cleanly)"
    );
  }

  // 4. TEST: Student Dashboard Data (Calculation & Empty states)
  if (studentUser) {
    const studentData = await getStudentDashboardData(studentUser.id);
    assert(!!studentData.student, "14. Student: Resolves student profile");
    assert(studentData.student?.rollNo === "CS2026-042", "15. Student: Matches roll number CS2026-042");
    assert(
      studentData.stats.percentage === null,
      "16. Student: Attendance percentage is null when 0 sessions held (not fake 0% or 100%)"
    );
    assert(
      studentData.stats.isDebarmentRisk === false,
      "17. Student: Not marked as debarment risk when no classes have occurred"
    );

    // 5. TEST: Live Attendance Percentage Calculation & Debarment Alert
    // Let's create a temporary session and records for testing calculations
    const testTerm = await db.academicTerm.findFirst({ where: { isCurrent: true } });
    const testSubject = await db.subject.findFirst();
    const teacherProfile = await db.teacherProfile.findFirst();
    const studentProfile = await db.studentProfile.findFirst();

    if (testTerm && testSubject && teacherProfile && studentProfile) {
      const testClass = await db.class.create({
        data: {
          name: "CS301 Test Cohort",
          section: "T1",
          subjectId: testSubject.id,
          termId: testTerm.id,
        },
      });

      const testSession1 = await db.classSession.create({
        data: {
          classId: testClass.id,
          subjectId: testSubject.id,
          teacherId: teacherProfile.id,
          date: new Date(),
          status: "COMPLETED",
        },
      });

      const testSession2 = await db.classSession.create({
        data: {
          classId: testClass.id,
          subjectId: testSubject.id,
          teacherId: teacherProfile.id,
          date: new Date(),
          status: "COMPLETED",
        },
      });

      // Mark 1 Present, 1 Absent (50% attendance -> Below 75% -> Debarment Warning)
      await db.attendanceRecord.create({
        data: {
          classSessionId: testSession1.id,
          studentId: studentProfile.id,
          status: "PRESENT",
        },
      });

      await db.attendanceRecord.create({
        data: {
          classSessionId: testSession2.id,
          studentId: studentProfile.id,
          status: "ABSENT",
        },
      });

      const updatedStudentData = await getStudentDashboardData(studentUser.id);
      assert(
        updatedStudentData.stats.totalRecords === 2,
        "18. Student Stats: Computes 2 total recorded sessions"
      );
      assert(
        updatedStudentData.stats.attendedCount === 1,
        "19. Student Stats: Computes 1 attended session"
      );
      assert(
        updatedStudentData.stats.percentage === 50.0,
        "20. Student Stats: Computes 50.0% exact attendance"
      );
      assert(
        updatedStudentData.stats.isDebarmentRisk === true,
        "21. Student Stats: Flags debarment risk alert (50% < 75% threshold)"
      );

      // Clean up temporary test session and class records
      await db.attendanceRecord.deleteMany({
        where: { classSessionId: { in: [testSession1.id, testSession2.id] } },
      });
      await db.classSession.deleteMany({
        where: { id: { in: [testSession1.id, testSession2.id] } },
      });
      await db.class.delete({ where: { id: testClass.id } });

      assert(true, "22. Cleaned up temporary test attendance fixtures");
    }
  }

  console.log("==================================================");
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runDashboardTests()
  .catch((err) => {
    console.error("Dashboard tests failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
