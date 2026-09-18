import { db } from "../lib/db";
import {
  getOrCreateClassSession,
  submitAttendance,
  verifyAndLockSession,
  getStudentAttendanceSummary,
} from "../app/attendance/actions";
import bcrypt from "bcryptjs";



async function runTakeAttendanceWorkflowTests() {
  console.log("==========================================================");
  console.log("   SMART ATTENDANCE - TAKE ATTENDANCE WORKFLOW TEST SUITE   ");
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
  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 1. Setup Fixtures: Admin, Teacher, Students, Subject, Term, Class
  const adminUser = await db.user.create({
    data: {
      email: `admin.flow.${timestamp}@test.edu`,
      passwordHash,
      name: "Admin Flow",
      role: "ADMIN",
    },
  });

  const teacherUser = await db.user.create({
    data: {
      email: `teacher.flow.${timestamp}@test.edu`,
      passwordHash,
      name: "Prof. Workflow",
      role: "TEACHER",
    },
  });

  const teacherProfile = await db.teacherProfile.create({
    data: {
      userId: teacherUser.id,
      employeeId: `FAC-${timestamp}`,
      department: "Computer Science",
      designation: "Associate Professor",
    },
  });

  // Create 2 Students
  const s1User = await db.user.create({
    data: {
      email: `s1.${timestamp}@test.edu`,
      passwordHash,
      name: "Student Alpha",
      role: "STUDENT",
    },
  });
  const s1Profile = await db.studentProfile.create({
    data: {
      userId: s1User.id,
      rollNo: `ROLL-A-${timestamp}`,
      batch: "2026",
      department: "Computer Science",
      admissionYear: 2026,
    },
  });

  const s2User = await db.user.create({
    data: {
      email: `s2.${timestamp}@test.edu`,
      passwordHash,
      name: "Student Beta",
      role: "STUDENT",
    },
  });
  const s2Profile = await db.studentProfile.create({
    data: {
      userId: s2User.id,
      rollNo: `ROLL-B-${timestamp}`,
      batch: "2026",
      department: "Computer Science",
      admissionYear: 2026,
    },
  });

  // Subject and Term
  const subject = await db.subject.create({
    data: {
      code: `CS-${timestamp}`,
      name: "Distributed Operating Systems",
      department: "Computer Science",
      credits: 4,
    },
  });

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

  // Class
  const classEntity = await db.class.create({
    data: {
      name: `CS-Cohort-${timestamp}`,
      section: "A",
      subjectId: subject.id,
      termId: term.id,
    },
  });

  // Assign Teacher to Class
  await db.classTeacherAssignment.create({
    data: {
      classId: classEntity.id,
      teacherId: teacherProfile.id,
      role: "PRIMARY",
    },
  });

  // Enroll both students
  await db.classEnrollment.createMany({
    data: [
      { classId: classEntity.id, studentId: s1Profile.id },
      { classId: classEntity.id, studentId: s2Profile.id },
    ],
  });

  console.log("-> Test fixtures initialized successfully.");

  // TEST 1: Unauthorized Student cannot get or create class session
  process.env.TEST_AUTH_USER_ID = s1User.id;
  const studentAttempt = await getOrCreateClassSession({
    classId: classEntity.id,
    date: "2026-09-18",
  });
  assert(
    !studentAttempt.success && Boolean(studentAttempt.error?.includes("Insufficient permissions")),
    "1. Role Gate: Student is prevented from creating or loading attendance sessions"
  );

  // TEST 2: Assigned Teacher loads / initializes attendance session for today
  process.env.TEST_AUTH_USER_ID = teacherUser.id;
  const sessionInitResult = await getOrCreateClassSession({
    classId: classEntity.id,
    date: "2026-09-18",
    startTime: "10:00 AM",
  });

  assert(
    sessionInitResult.success === true &&
      Boolean(sessionInitResult.session?.id) &&
      sessionInitResult.session?.subjectCode === subject.code,
    "2. Session Init: Assigned teacher initializes session with auto-linked subject"
  );

  const sessionId = sessionInitResult.session!.id;

  // TEST 3: Candidate roll call items are populated with enrolled students
  assert(
    sessionInitResult.rollCallItems?.length === 2 &&
      sessionInitResult.rollCallItems.some((r) => r.studentId === s1Profile.id) &&
      sessionInitResult.rollCallItems.some((r) => r.studentId === s2Profile.id),
    "3. Roster Population: All enrolled students are loaded with roll numbers and details"
  );

  // TEST 4: Calling getOrCreateClassSession again retrieves the SAME session (Idempotent session lookup)
  const sessionFetchAgain = await getOrCreateClassSession({
    classId: classEntity.id,
    date: "2026-09-18",
  });
  assert(
    sessionFetchAgain.success && sessionFetchAgain.session?.id === sessionId,
    "4. Session Idempotency: Re-accessing same date retrieves existing session without duplicating"
  );

  // TEST 5: Submit attendance roll call (Student Alpha = PRESENT, Student Beta = ABSENT)
  const submitResult = await submitAttendance({
    sessionId,
    entries: [
      { studentId: s1Profile.id, status: "PRESENT" },
      { studentId: s2Profile.id, status: "ABSENT", remarks: "Unexcused absence" },
    ],
  });

  assert(
    submitResult.success === true && submitResult.count === 2,
    "5. Roll Call Submission: Atomically records attendance for enrolled students"
  );

  // Check records in database
  const recordsInDb = await db.attendanceRecord.findMany({
    where: { classSessionId: sessionId },
  });
  assert(
    recordsInDb.length === 2 &&
      recordsInDb.find((r) => r.studentId === s1Profile.id)?.status === "PRESENT" &&
      recordsInDb.find((r) => r.studentId === s2Profile.id)?.status === "ABSENT",
    "6. Database Verification: Statuses and remarks are correctly persisted"
  );

  // TEST 6: Idempotent Re-submission (Prevent duplicate records on retry or re-submission)
  // Now teacher marks Student Beta as EXCUSED with remarks
  const resubmitResult = await submitAttendance({
    sessionId,
    entries: [
      { studentId: s1Profile.id, status: "PRESENT" },
      { studentId: s2Profile.id, status: "EXCUSED", remarks: "Doctor note received" },
    ],
  });

  assert(
    resubmitResult.success === true,
    "7. Duplicate Prevention: Submitting roll call again updates records without error"
  );

  const recordsAfterResubmit = await db.attendanceRecord.findMany({
    where: { classSessionId: sessionId },
  });
  assert(
    recordsAfterResubmit.length === 2 &&
      recordsAfterResubmit.find((r) => r.studentId === s2Profile.id)?.status === "EXCUSED" &&
      recordsAfterResubmit.find((r) => r.studentId === s2Profile.id)?.remarks === "Doctor note received",
    "8. Record Integrity: Total records remain 2 (no duplicate rows created) and status updated"
  );

  // TEST 7: Integrity Violation: Unenrolled student cannot be recorded for this class session
  const fakeStudentUser = await db.user.create({
    data: {
      email: `fake.student.${timestamp}@test.edu`,
      passwordHash,
      name: "Outsider Student",
      role: "STUDENT",
    },
  });
  const fakeProfile = await db.studentProfile.create({
    data: {
      userId: fakeStudentUser.id,
      rollNo: `ROLL-FAKE-${timestamp}`,
      batch: "2026",
      department: "Physics",
      admissionYear: 2026,
    },
  });

  const unenrolledSubmission = await submitAttendance({
    sessionId,
    entries: [
      { studentId: s1Profile.id, status: "PRESENT" },
      { studentId: fakeProfile.id, status: "PRESENT" },
    ],
  });

  assert(
    !unenrolledSubmission.success &&
      Boolean(unenrolledSubmission.error?.includes("is not enrolled in this class cohort")),
    "9. Boundary Validation: Server rejects attendance entry for unenrolled student"
  );

  // TEST 8: Session Locking and Tamper Prevention
  // Admin verifies and locks the session
  process.env.TEST_AUTH_USER_ID = adminUser.id;
  const lockResult = await verifyAndLockSession(sessionId);
  assert(lockResult.success === true, "10. Session Verification: Admin successfully locks session");

  // Teacher attempts to alter records on the locked session
  process.env.TEST_AUTH_USER_ID = teacherUser.id;
  const lockedAlterAttempt = await submitAttendance({
    sessionId,
    entries: [
      { studentId: s1Profile.id, status: "ABSENT" },
      { studentId: s2Profile.id, status: "ABSENT" },
    ],
  });

  assert(
    !lockedAlterAttempt.success &&
      Boolean(lockedAlterAttempt.error?.includes("verified and locked")),
    "11. Tamper Prevention: Teacher is blocked from altering verified/locked session records"
  );

  // TEST 9: Student Attendance Summary Calculations
  const s1Stats = await getStudentAttendanceSummary(s1Profile.id);
  assert(
    s1Stats.totalSessions >= 1 && s1Stats.presentCount === 1,
    "12. Statistical Aggregation: Correctly aggregates student attendance count"
  );

  // Clean up fixtures
  try {
    await db.auditLog.deleteMany({
      where: { entityId: sessionId },
    });
    await db.attendanceRecord.deleteMany({
      where: { classSessionId: sessionId },
    });
    await db.classSession.delete({
      where: { id: sessionId },
    });
    await db.classEnrollment.deleteMany({
      where: { classId: classEntity.id },
    });
    await db.classTeacherAssignment.deleteMany({
      where: { classId: classEntity.id },
    });
    await db.class.delete({
      where: { id: classEntity.id },
    });
    await db.subject.delete({
      where: { id: subject.id },
    });
    await db.studentProfile.delete({ where: { id: s1Profile.id } });
    await db.studentProfile.delete({ where: { id: s2Profile.id } });
    await db.studentProfile.delete({ where: { id: fakeProfile.id } });
    await db.teacherProfile.delete({ where: { id: teacherProfile.id } });
    await db.user.delete({ where: { id: s1User.id } });
    await db.user.delete({ where: { id: s2User.id } });
    await db.user.delete({ where: { id: fakeStudentUser.id } });
    await db.user.delete({ where: { id: teacherUser.id } });
    await db.user.delete({ where: { id: adminUser.id } });
    console.log("-> Test fixtures cleanly purged.");
  } catch (cleanErr) {
    console.warn("Fixture cleanup note:", cleanErr);
  }

  console.log("----------------------------------------------------------");
  console.log(`WORKFLOW TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log("----------------------------------------------------------");

  if (failed > 0) {
    process.exit(1);
  }
}

runTakeAttendanceWorkflowTests().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
