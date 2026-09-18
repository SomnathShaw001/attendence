import { db } from "../lib/db";
import {
  generateStudentReport,
  generateClassReport,
  generateSubjectReport,
  getReportFilterOptions,
} from "../app/reports/actions";
import bcrypt from "bcryptjs";

async function runReportsTests() {
  console.log("==========================================================");
  console.log("   SMART ATTENDANCE - REPORTING SUITE                     ");
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

  // 1. Create Fixtures: Admin, Teachers, Students
  const adminUser = await db.user.create({
    data: {
      email: `admin.rep.${timestamp}@test.edu`,
      passwordHash,
      name: "Admin Reports",
      role: "ADMIN",
    },
  });

  const teacher1User = await db.user.create({
    data: {
      email: `t1.rep.${timestamp}@test.edu`,
      passwordHash,
      name: "Teacher Assigned",
      role: "TEACHER",
    },
  });
  const teacher1Profile = await db.teacherProfile.create({
    data: {
      userId: teacher1User.id,
      employeeId: `T1-REP-${timestamp}`,
      department: "Computer Science",
    },
  });

  const teacher2User = await db.user.create({
    data: {
      email: `t2.rep.${timestamp}@test.edu`,
      passwordHash,
      name: "Teacher Unassigned",
      role: "TEACHER",
    },
  });
  const teacher2Profile = await db.teacherProfile.create({
    data: {
      userId: teacher2User.id,
      employeeId: `T2-REP-${timestamp}`,
      department: "Physics",
    },
  });

  const student1User = await db.user.create({
    data: {
      email: `s1.rep.${timestamp}@test.edu`,
      passwordHash,
      name: "Student Alpha",
      role: "STUDENT",
    },
  });
  const student1Profile = await db.studentProfile.create({
    data: {
      userId: student1User.id,
      rollNo: `S1-REP-${timestamp}`,
      batch: "2026",
      department: "Computer Science",
      admissionYear: 2026,
    },
  });

  const student2User = await db.user.create({
    data: {
      email: `s2.rep.${timestamp}@test.edu`,
      passwordHash,
      name: "Student Beta",
      role: "STUDENT",
    },
  });
  const student2Profile = await db.studentProfile.create({
    data: {
      userId: student2User.id,
      rollNo: `S2-REP-${timestamp}`,
      batch: "2026",
      department: "Computer Science",
      admissionYear: 2026,
    },
  });

  // Academic Term, Subject, Class
  let term = await db.academicTerm.findFirst({ where: { isCurrent: true } });
  if (!term) {
    term = await db.academicTerm.create({
      data: {
        name: `Term Rep ${timestamp}`,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000 * 90),
        isCurrent: true,
      },
    });
  }

  const subject = await db.subject.create({
    data: {
      name: `Algorithms ${timestamp}`,
      code: `CS-ALG-${timestamp}`,
      department: "Computer Science",
      credits: 4,
    },
  });

  const classSection = await db.class.create({
    data: {
      name: `CS-Alg-A-${timestamp}`,
      section: "A",
      subjectId: subject.id,
      termId: term.id,
    },
  });

  // Enroll both students into the class
  await db.classEnrollment.create({
    data: { classId: classSection.id, studentId: student1Profile.id },
  });
  await db.classEnrollment.create({
    data: { classId: classSection.id, studentId: student2Profile.id },
  });

  // Assign Teacher 1 to this class
  await db.classTeacherAssignment.create({
    data: { classId: classSection.id, teacherId: teacher1Profile.id, role: "PRIMARY" },
  });

  // Create 3 Sessions with known records:
  // Session 1: 2026-09-10 (Alpha: PRESENT, Beta: ABSENT)
  await db.classSession.create({
    data: {
      classId: classSection.id,
      subjectId: subject.id,
      teacherId: teacher1Profile.id,
      date: new Date("2026-09-10T10:00:00Z"),
      status: "COMPLETED",
      records: {
        create: [
          { studentId: student1Profile.id, status: "PRESENT", recordedById: teacher1User.id },
          { studentId: student2Profile.id, status: "ABSENT", recordedById: teacher1User.id },
        ],
      },
    },
  });

  // Session 2: 2026-09-12 (Alpha: PRESENT, Beta: PRESENT)
  await db.classSession.create({
    data: {
      classId: classSection.id,
      subjectId: subject.id,
      teacherId: teacher1Profile.id,
      date: new Date("2026-09-12T10:00:00Z"),
      status: "COMPLETED",
      records: {
        create: [
          { studentId: student1Profile.id, status: "PRESENT", recordedById: teacher1User.id },
          { studentId: student2Profile.id, status: "PRESENT", recordedById: teacher1User.id },
        ],
      },
    },
  });

  // Session 3: 2026-09-15 (Alpha: ABSENT, Beta: LATE)
  await db.classSession.create({
    data: {
      classId: classSection.id,
      subjectId: subject.id,
      teacherId: teacher1Profile.id,
      date: new Date("2026-09-15T10:00:00Z"),
      status: "COMPLETED",
      records: {
        create: [
          { studentId: student1Profile.id, status: "ABSENT", recordedById: teacher1User.id },
          { studentId: student2Profile.id, status: "LATE", remarks: "Traffic delay", recordedById: teacher1User.id },
        ],
      },
    },
  });

  try {
    // -------------------------------------------------------------
    // TEST 1: Student Attendance Report Authorization & Scoping
    // -------------------------------------------------------------
    // Student 1 querying self
    process.env.TEST_AUTH_USER_ID = student1User.id;
    const s1Report = await generateStudentReport({});
    assert(s1Report.student.id === student1Profile.id, "1. Student Report: Student queries self successfully");
    assert(s1Report.summary.totalSessions === 3, "2. Student Report: Total sessions match database (3 sessions)");
    assert(s1Report.summary.attendedSessions === 2, "3. Student Report: Attended sessions count matches (2 present)");
    assert(s1Report.summary.absentSessions === 1, "4. Student Report: Absent count matches (1 absent)");
    // 2 attended / 3 total = 66.7%
    assert(s1Report.summary.overallPercentage === 66.7, "5. Student Report: Accurate attendance percentage (66.7%)");
    assert(s1Report.summary.isBelowThreshold === true, "6. Student Report: Accurately flags below 75% threshold");

    // Student attempting to query another student's ID is forced to their own record
    const s1TamperReport = await generateStudentReport({ studentId: student2Profile.id });
    assert(s1TamperReport.student.id === student1Profile.id, "7. Student Privacy: Student parameter tampering ignored; returns self");

    // Teacher 1 (assigned) querying Student 1
    process.env.TEST_AUTH_USER_ID = teacher1User.id;
    const t1StudentReport = await generateStudentReport({ studentId: student1Profile.id });
    assert(t1StudentReport.student.id === student1Profile.id, "8. Teacher Access: Assigned teacher can view student report");

    // Teacher 2 (unassigned) querying Student 1 -> Throws Unauthorized
    process.env.TEST_AUTH_USER_ID = teacher2User.id;
    let unassignedBlocked = false;
    try {
      await generateStudentReport({ studentId: student1Profile.id });
    } catch {
      unassignedBlocked = true;
    }
    assert(unassignedBlocked, "9. Role Boundary: Unassigned teacher blocked from viewing student report");

    // Admin querying Student 2
    process.env.TEST_AUTH_USER_ID = adminUser.id;
    const adminS2Report = await generateStudentReport({ studentId: student2Profile.id });
    assert(adminS2Report.student.id === student2Profile.id, "10. Admin Access: Admin can view any student report");
    // Beta: 1 absent, 1 present, 1 late = 2 attended out of 3 = 66.7%
    assert(adminS2Report.summary.attendedSessions === 2, "11. Student 2 Report: Attended includes late session (2 attended)");
    assert(adminS2Report.summary.lateSessions === 1, "12. Student 2 Report: Late count exact (1 late)");

    // -------------------------------------------------------------
    // TEST 2: Date-Range Filtering on Student Report
    // -------------------------------------------------------------
    // Filter between 2026-09-11 and 2026-09-16 (excludes session 1 from 2026-09-10)
    process.env.TEST_AUTH_USER_ID = student1User.id;
    const dateRangeReport = await generateStudentReport({
      startDate: "2026-09-11",
      endDate: "2026-09-16",
    });
    assert(dateRangeReport.summary.totalSessions === 2, "13. Date-Range: Excluded session outside date window (2 total)");
    assert(dateRangeReport.summary.attendedSessions === 1, "14. Date-Range: Accurate attended count in date window (1 present)");
    assert(dateRangeReport.summary.overallPercentage === 50.0, "15. Date-Range: Accurate recalculation of percentage (50.0%)");

    // -------------------------------------------------------------
    // TEST 3: Class Attendance Report
    // -------------------------------------------------------------
    // Student blocked from generating class report
    process.env.TEST_AUTH_USER_ID = student1User.id;
    let studentClassBlocked = false;
    try {
      await generateClassReport({ classId: classSection.id });
    } catch {
      studentClassBlocked = true;
    }
    assert(studentClassBlocked, "16. Class Report: Student blocked from accessing class reports");

    // Unassigned teacher blocked from generating class report
    process.env.TEST_AUTH_USER_ID = teacher2User.id;
    let teacher2ClassBlocked = false;
    try {
      await generateClassReport({ classId: classSection.id });
    } catch {
      teacher2ClassBlocked = true;
    }
    assert(teacher2ClassBlocked, "17. Class Report: Unassigned teacher blocked from class report");

    // Assigned teacher generating class report
    process.env.TEST_AUTH_USER_ID = teacher1User.id;
    const classReport = await generateClassReport({ classId: classSection.id });
    assert(classReport.classInfo.id === classSection.id, "18. Class Report: Assigned teacher generates class report");
    assert(classReport.summary.totalSessions === 3, "19. Class Report: Reports exact 3 sessions");
    assert(classReport.summary.enrolledStudentsCount === 2, "20. Class Report: Roster contains 2 enrolled students");
    assert(classReport.students.length === 2, "21. Class Report: Student list length matches enrollment");
    // Class aggregate: 4 attended out of 6 records = 66.7%
    assert(classReport.summary.overallPercentage === 66.7, "22. Class Report: Accurate class overall percentage (66.7%)");
    assert(classReport.summary.studentsBelowThresholdCount === 2, "23. Class Report: Flags both students below 75% threshold");

    // -------------------------------------------------------------
    // TEST 4: Subject Attendance Report
    // -------------------------------------------------------------
    process.env.TEST_AUTH_USER_ID = teacher1User.id;
    const subjectReport = await generateSubjectReport({ subjectId: subject.id });
    assert(subjectReport.subjectInfo.id === subject.id, "24. Subject Report: Generated for assigned subject");
    assert(subjectReport.summary.totalClasses === 1, "25. Subject Report: Identifies 1 class offering this subject");
    assert(subjectReport.summary.totalSessions === 3, "26. Subject Report: Reports 3 lectures conducted");
    assert(subjectReport.summary.overallPercentage === 66.7, "27. Subject Report: Accurate subject-wide percentage (66.7%)");
    assert(subjectReport.classesBreakdown[0].percentage === 66.7, "28. Subject Report: Class section breakdown accurate");

    // -------------------------------------------------------------
    // TEST 5: Filter Options Role Scoping
    // -------------------------------------------------------------
    // Student only sees self in student filter
    process.env.TEST_AUTH_USER_ID = student1User.id;
    const studentFilterOpts = await getReportFilterOptions();
    assert(studentFilterOpts.students.length === 1, "29. Filter Scoping: Student filter only includes self");
    assert(studentFilterOpts.students[0].id === student1Profile.id, "30. Filter Scoping: Student ID matches session");

    // Teacher 1 only sees students enrolled in assigned classes
    process.env.TEST_AUTH_USER_ID = teacher1User.id;
    const teacherFilterOpts = await getReportFilterOptions();
    assert(teacherFilterOpts.classes.some((c) => c.id === classSection.id), "31. Filter Scoping: Teacher sees assigned class");
    assert(teacherFilterOpts.students.length === 2, "32. Filter Scoping: Teacher sees enrolled students");

  } finally {
    // Teardown Fixtures
    console.log("\nTearing down fixtures...");
    delete process.env.TEST_AUTH_USER_ID;

    await db.attendanceRecord.deleteMany({
      where: {
        studentId: { in: [student1Profile.id, student2Profile.id] },
      },
    });

    await db.classSession.deleteMany({
      where: { classId: classSection.id },
    });

    await db.classTeacherAssignment.deleteMany({
      where: { classId: classSection.id },
    });

    await db.classEnrollment.deleteMany({
      where: { classId: classSection.id },
    });

    await db.class.delete({ where: { id: classSection.id } });
    await db.subject.delete({ where: { id: subject.id } });
    await db.studentProfile.deleteMany({
      where: { id: { in: [student1Profile.id, student2Profile.id] } },
    });
    await db.teacherProfile.deleteMany({
      where: { id: { in: [teacher1Profile.id, teacher2Profile.id] } },
    });
    await db.user.deleteMany({
      where: {
        id: { in: [student1User.id, student2User.id, teacher1User.id, teacher2User.id, adminUser.id] },
      },
    });
  }

  console.log("\n----------------------------------------------------------");
  console.log(`REPORTING TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("----------------------------------------------------------\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runReportsTests().catch((err) => {
  console.error("Test execution failed with error:", err);
  process.exit(1);
});
