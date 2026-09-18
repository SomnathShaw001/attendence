import { db } from "../lib/db";
import { getAttendanceAnalytics } from "../app/reports/actions";
import bcrypt from "bcryptjs";

async function runAttendanceAnalyticsTests() {
  console.log("==========================================================");
  console.log("   SMART ATTENDANCE - ATTENDANCE ANALYTICS TEST SUITE     ");
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

  const timestamp = Date.now().toString().slice(-5);
  const passwordHash = await bcrypt.hash("Pass1234!", 10);

  // Setup fixtures
  // 1. Admin User
  const adminUser = await db.user.create({
    data: {
      email: `admin.analytics.${timestamp}@test.edu`,
      passwordHash,
      name: "Admin Analytics",
      role: "ADMIN",
    },
  });

  // 2. Teacher User & Profile
  const teacherUser = await db.user.create({
    data: {
      email: `teacher.analytics.${timestamp}@test.edu`,
      passwordHash,
      name: "Teacher Analytics",
      role: "TEACHER",
    },
  });

  const teacherProfile = await db.teacherProfile.create({
    data: {
      userId: teacherUser.id,
      employeeId: `T-AN-${timestamp}`,
      department: "Mathematics",
    },
  });

  // 3. Student User & Profile
  const studentUser = await db.user.create({
    data: {
      email: `student.analytics.${timestamp}@test.edu`,
      passwordHash,
      name: "Student Analytics",
      role: "STUDENT",
    },
  });

  const studentProfile = await db.studentProfile.create({
    data: {
      userId: studentUser.id,
      rollNo: `R-AN-${timestamp}`,
      batch: "2026",
      department: "Mathematics",
      admissionYear: 2026,
    },
  });

  // 4. Academic Term
  let term = await db.academicTerm.findFirst({ where: { isCurrent: true } });
  if (!term) {
    term = await db.academicTerm.create({
      data: {
        name: `Term ${timestamp}`,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000 * 90),
        isCurrent: true,
      },
    });
  }

  // 5. Subject
  const testSubject = await db.subject.create({
    data: {
      name: `Calculus ${timestamp}`,
      code: `CALC-${timestamp}`,
      department: "Mathematics",
      credits: 4,
    },
  });

  // 6. Class
  const testClass = await db.class.create({
    data: {
      name: `Math Batch ${timestamp}`,
      section: "A",
      subjectId: testSubject.id,
      termId: term.id,
    },
  });

  // Enroll student
  await db.classEnrollment.create({
    data: {
      classId: testClass.id,
      studentId: studentProfile.id,
    },
  });

  // Teacher Assignment
  await db.classTeacherAssignment.create({
    data: {
      classId: testClass.id,
      teacherId: teacherProfile.id,
      role: "PRIMARY",
    },
  });

  let session1: { id: string } | null = null;
  let session2: { id: string } | null = null;

  try {
    // 7. Test Empty State Handling (0 Sessions recorded yet)
    process.env.TEST_AUTH_USER_ID = adminUser.id;
    const emptyResult = await getAttendanceAnalytics({
      timeframe: "30d",
      classId: testClass.id,
    });

    assert(emptyResult.totalSessionsHeld === 0, "Empty state reports 0 sessions held");
    assert(emptyResult.totalRecordsAudited === 0, "Empty state reports 0 records audited");
    assert(emptyResult.overallPercentage === null, "Empty state overallPercentage is null (not fabricated 0% or 100%)");
    assert(emptyResult.statusDistribution.find((s) => s.status === "PRESENT")?.count === 0, "Empty state distribution present is 0");
    assert(emptyResult.timelineTrends.length === 0, "Empty state timeline trends is empty array");
    assert(emptyResult.debarmentRiskStudents.length === 0, "Empty state debarment risk list is empty");

    // 8. Create real attendance sessions and records
    // Session 1 (Today): Student is PRESENT
    session1 = await db.classSession.create({
      data: {
        classId: testClass.id,
        subjectId: testSubject.id,
        teacherId: teacherProfile.id,
        date: new Date(),
        status: "COMPLETED",
        records: {
          create: [
            {
              studentId: studentProfile.id,
              status: "PRESENT",
              recordedById: teacherUser.id,
            },
          ],
        },
      },
    });

    // Session 2 (Yesterday): Student is ABSENT
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    session2 = await db.classSession.create({
      data: {
        classId: testClass.id,
        subjectId: testSubject.id,
        teacherId: teacherProfile.id,
        date: yesterday,
        status: "COMPLETED",
        records: {
          create: [
            {
              studentId: studentProfile.id,
              status: "ABSENT",
              recordedById: teacherUser.id,
            },
          ],
        },
      },
    });

    // 9. Test Admin Scoped Analytics
    process.env.TEST_AUTH_USER_ID = adminUser.id;
    const adminResult = await getAttendanceAnalytics({
      timeframe: "30d",
      classId: testClass.id,
    });

    assert(adminResult.totalSessionsHeld === 2, "Admin: Calculates exact 2 sessions held");
    assert(adminResult.totalRecordsAudited === 2, "Admin: Calculates exact 2 attendance records audited");
    assert(adminResult.overallPercentage === 50.0, "Admin: Accurately calculates 50.0% overall percentage");
    assert(adminResult.attendedCount === 1, "Admin: Accurately reports 1 Attended");
    assert(adminResult.absentCount === 1, "Admin: Accurately reports 1 Absent");
    assert(adminResult.lateCount === 0, "Admin: Accurately reports 0 Late");

    // Subject-wise & Class-wise verification
    const subjectStat = adminResult.subjectWise.find((s) => s.subjectId === testSubject.id);
    assert(!!subjectStat && subjectStat.percentage === 50.0, "Admin: Subject-wise breakdown matches 50.0%");

    const classStat = adminResult.classWise.find((c) => c.classId === testClass.id);
    assert(!!classStat && classStat.percentage === 50.0, "Admin: Class-wise breakdown matches 50.0%");

    // At-Risk Calculation (50% < 75% threshold)
    assert(adminResult.threshold === 75.0, "System threshold is configured to 75.0%");
    assert(adminResult.debarmentRiskStudents.length === 1, "debarmentRiskStudents contains exactly 1 student");
    assert(adminResult.debarmentRiskStudents[0].studentId === studentProfile.id, "Correct student identified at risk");
    // Recovery calculation: (0.75 * 2 - 1) / 0.25 = 2 consecutive present sessions needed
    assert(adminResult.debarmentRiskStudents[0].sessionsNeededToRecover === 2, "Recovery sessions needed is exact (+2 sessions)");

    // 10. Test Teacher Scoped Analytics
    process.env.TEST_AUTH_USER_ID = teacherUser.id;
    const teacherResult = await getAttendanceAnalytics({
      timeframe: "30d",
    });

    assert(teacherResult.totalSessionsHeld >= 2, "Teacher: Accesses assigned class sessions");
    const teacherClassStat = teacherResult.classWise.find((c) => c.classId === testClass.id);
    assert(!!teacherClassStat, "Teacher: Class-wise breakdown contains assigned class");

    // 11. Test Student Scoped Analytics
    process.env.TEST_AUTH_USER_ID = studentUser.id;
    const studentResult = await getAttendanceAnalytics({
      timeframe: "30d",
    });

    assert(studentResult.totalRecordsAudited === 2, "Student: Scoped strictly to student's personal records");
    assert(studentResult.overallPercentage === 50.0, "Student: Personal overall attendance is 50.0%");
    assert(studentResult.debarmentRiskStudents.length === 1, "Student: Can see their own at-risk status");

    // 12. Test Longitudinal Trend Breakdown
    assert(adminResult.timelineTrends.length === 2, "Longitudinal trends contain 2 distinct daily data points");
    const day1 = adminResult.timelineTrends[0];
    const day2 = adminResult.timelineTrends[1];
    assert(day1.percentage === 0 || day1.percentage === 100, "Daily percentage 1 is exact (0% or 100%)");
    assert(day2.percentage === 0 || day2.percentage === 100, "Daily percentage 2 is exact (0% or 100%)");

  } finally {
    // Teardown Fixtures
    console.log("\nTearing down fixtures...");
    delete process.env.TEST_AUTH_USER_ID;

    if (session1 && session2) {
      await db.attendanceRecord.deleteMany({
        where: { studentId: studentProfile.id },
      });
      await db.classSession.deleteMany({
        where: { classId: testClass.id },
      });
    }

    await db.classTeacherAssignment.deleteMany({
      where: { classId: testClass.id },
    });
    await db.classEnrollment.deleteMany({
      where: { classId: testClass.id },
    });
    await db.class.delete({ where: { id: testClass.id } });
    await db.subject.delete({ where: { id: testSubject.id } });
    await db.studentProfile.delete({ where: { id: studentProfile.id } });
    await db.teacherProfile.delete({ where: { id: teacherProfile.id } });
    await db.user.delete({ where: { id: studentUser.id } });
    await db.user.delete({ where: { id: teacherUser.id } });
    await db.user.delete({ where: { id: adminUser.id } });
  }

  console.log("\n----------------------------------------------------------");
  console.log(`ATTENDANCE ANALYTICS TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("----------------------------------------------------------\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runAttendanceAnalyticsTests().catch((err) => {
  console.error("Test execution failed with error:", err);
  process.exit(1);
});
