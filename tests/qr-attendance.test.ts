import { db } from "../lib/db";
import {
  startQrSession,
  getActiveQrToken,
  stopQrSession,
  submitQrAttendance,
} from "../app/attendance/qr/actions";
import { verifyQrPayload, generateQrPayload } from "../lib/qr-crypto";
import bcrypt from "bcryptjs";

async function runQrAttendanceTests() {
  console.log("==========================================================");
  console.log("   SMART ATTENDANCE - DYNAMIC QR ATTENDANCE TEST SUITE    ");
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

  // 1. Fixtures: Admin, Assigned Teacher, Unassigned Teacher, Enrolled Student, Unenrolled Student
  const adminUser = await db.user.create({
    data: {
      email: `admin.qr.${timestamp}@test.edu`,
      passwordHash,
      name: "Admin QR",
      role: "ADMIN",
    },
  });

  const teacher1User = await db.user.create({
    data: {
      email: `t1.qr.${timestamp}@test.edu`,
      passwordHash,
      name: "Prof. Assigned",
      role: "TEACHER",
    },
  });
  const teacher1Profile = await db.teacherProfile.create({
    data: {
      userId: teacher1User.id,
      employeeId: `T1-QR-${timestamp}`,
      department: "Computer Science",
    },
  });

  const teacher2User = await db.user.create({
    data: {
      email: `t2.qr.${timestamp}@test.edu`,
      passwordHash,
      name: "Prof. Unassigned",
      role: "TEACHER",
    },
  });
  const teacher2Profile = await db.teacherProfile.create({
    data: {
      userId: teacher2User.id,
      employeeId: `T2-QR-${timestamp}`,
      department: "Physics",
    },
  });

  const studentEnrolledUser = await db.user.create({
    data: {
      email: `s1.qr.${timestamp}@test.edu`,
      passwordHash,
      name: "Enrolled Student",
      role: "STUDENT",
    },
  });
  const studentEnrolledProfile = await db.studentProfile.create({
    data: {
      userId: studentEnrolledUser.id,
      rollNo: `S1-QR-${timestamp}`,
      batch: "2026",
      department: "Computer Science",
      admissionYear: 2026,
    },
  });

  const studentUnenrolledUser = await db.user.create({
    data: {
      email: `s2.qr.${timestamp}@test.edu`,
      passwordHash,
      name: "Unenrolled Student",
      role: "STUDENT",
    },
  });
  const studentUnenrolledProfile = await db.studentProfile.create({
    data: {
      userId: studentUnenrolledUser.id,
      rollNo: `S2-QR-${timestamp}`,
      batch: "2026",
      department: "Mechanical",
      admissionYear: 2026,
    },
  });

  // Academic Term, Subject, Class
  let term = await db.academicTerm.findFirst({ where: { isCurrent: true } });
  if (!term) {
    term = await db.academicTerm.create({
      data: {
        name: `Term QR ${timestamp}`,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000 * 90),
        isCurrent: true,
      },
    });
  }

  const subject = await db.subject.create({
    data: {
      name: `Mobile Security ${timestamp}`,
      code: `SEC-${timestamp}`,
      department: "Computer Science",
      credits: 3,
    },
  });

  const classSection = await db.class.create({
    data: {
      name: `SEC-4A-${timestamp}`,
      section: "A",
      subjectId: subject.id,
      termId: term.id,
    },
  });

  // Enroll only student 1
  await db.classEnrollment.create({
    data: { classId: classSection.id, studentId: studentEnrolledProfile.id },
  });

  // Assign Teacher 1
  await db.classTeacherAssignment.create({
    data: { classId: classSection.id, teacherId: teacher1Profile.id, role: "PRIMARY" },
  });

  // Create scheduled session
  const classSession = await db.classSession.create({
    data: {
      classId: classSection.id,
      subjectId: subject.id,
      teacherId: teacher1Profile.id,
      date: new Date(),
      status: "SCHEDULED",
    },
  });

  try {
    // -------------------------------------------------------------
    // TEST 1: Role Scoping on QR Session Start
    // -------------------------------------------------------------
    // Student blocked from starting QR session
    process.env.TEST_AUTH_USER_ID = studentEnrolledUser.id;
    let studentBlocked = false;
    try {
      await startQrSession(classSession.id);
    } catch {
      studentBlocked = true;
    }
    assert(studentBlocked, "1. Role Gate: Student cannot start QR attendance session");

    // Unassigned teacher blocked from starting QR session
    process.env.TEST_AUTH_USER_ID = teacher2User.id;
    let unassignedBlocked = false;
    try {
      await startQrSession(classSession.id);
    } catch {
      unassignedBlocked = true;
    }
    assert(unassignedBlocked, "2. Role Gate: Unassigned teacher cannot start QR attendance session");

    // Assigned teacher starts QR session
    process.env.TEST_AUTH_USER_ID = teacher1User.id;
    const initialSession = await startQrSession(classSession.id);
    assert(initialSession.classSessionId === classSession.id, "3. Session Start: Assigned teacher starts QR roll call");
    assert(initialSession.seq === 1, "4. Session Start: Initial token sequence number is 1");
    assert(typeof initialSession.tokenString === "string", "5. Session Start: Generated initial signed token string");

    // -------------------------------------------------------------
    // TEST 2: Cryptographic Signature Integrity
    // -------------------------------------------------------------
    const dbSession = await db.classSession.findUnique({
      where: { id: classSession.id },
      select: { qrSecret: true, isQrActive: true },
    });
    assert(dbSession?.isQrActive === true, "6. Database State: isQrActive flagged true");
    assert(!!dbSession?.qrSecret, "7. Database State: Generated secure session secret seed");

    const validVerification = verifyQrPayload(initialSession.tokenString, dbSession!.qrSecret!);
    assert(validVerification.isValid === true, "8. Signature: Genuine token passes HMAC-SHA256 verification");

    // Tampered payload verification
    const tamperedPayload = JSON.parse(initialSession.tokenString);
    tamperedPayload.seq = 999; // Modified sequence
    const tamperedVerification = verifyQrPayload(JSON.stringify(tamperedPayload), dbSession!.qrSecret!);
    assert(tamperedVerification.isValid === false, "9. Tamper Defense: Modified payload fails signature validation");

    // -------------------------------------------------------------
    // TEST 3: Rotation & Fresh Token Generation
    // -------------------------------------------------------------
    const nextTokenRes = await getActiveQrToken(classSession.id, initialSession.seq);
    assert(nextTokenRes.seq === 2, "10. Token Rotation: Generates next sequential token (seq 2)");
    assert(nextTokenRes.tokenString !== initialSession.tokenString, "11. Token Rotation: Token string differs from seq 1");

    // -------------------------------------------------------------
    // TEST 4: Student QR Check-in & Enrollment Guard
    // -------------------------------------------------------------
    // Unenrolled student scanning valid QR
    process.env.TEST_AUTH_USER_ID = studentUnenrolledUser.id;
    const unenrolledScan = await submitQrAttendance(initialSession.tokenString);
    assert(unenrolledScan.success === false, "12. Enrollment Guard: Unenrolled student check-in is rejected");

    // Enrolled student scanning valid QR
    process.env.TEST_AUTH_USER_ID = studentEnrolledUser.id;
    const enrolledScan = await submitQrAttendance(initialSession.tokenString);
    assert(enrolledScan.success === true, "13. Student Check-in: Enrolled student attendance recorded successfully");

    // Verify database record
    const recordedAttendance = await db.attendanceRecord.findUnique({
      where: {
        classSessionId_studentId: {
          classSessionId: classSession.id,
          studentId: studentEnrolledProfile.id,
        },
      },
    });
    assert(recordedAttendance?.status === "PRESENT", "14. Database Verify: Student marked PRESENT");
    assert(recordedAttendance?.remarks?.includes("Dynamic QR Check-in") === true, "15. Audit Trace: Remarks note QR check-in");

    // Verify check-in log (nonce consumed)
    const checkinLog = await db.qrCheckinLog.findFirst({
      where: {
        classSessionId: classSession.id,
        studentId: studentEnrolledProfile.id,
      },
    });
    assert(checkinLog !== null, "16. Replay Log: Nonce recorded in QrCheckinLog");

    // -------------------------------------------------------------
    // TEST 5: Replay Attack Prevention
    // -------------------------------------------------------------
    // Submitting the exact same scanned QR string with consumed nonce
    const replayAttempt = await submitQrAttendance(initialSession.tokenString);
    assert(replayAttempt.success === false, "17. Replay Defense: Consumed token nonce rejected on second submission");
    assert(replayAttempt.message.toLowerCase().includes("replay"), "18. Replay Defense: Message explicitly notes replay detection");

    // -------------------------------------------------------------
    // TEST 6: Expiration Guard
    // -------------------------------------------------------------
    // Create an expired payload (TTL -30s)
    const expiredPayload = generateQrPayload(classSession.id, dbSession!.qrSecret!, 5, -30);
    const expiredScan = await submitQrAttendance(expiredPayload.rawString);
    assert(expiredScan.success === false, "19. Expiration Guard: Expired token rejected by server");
    assert(expiredScan.message.toLowerCase().includes("expired"), "20. Expiration Guard: Message informs student of expiration");

    // -------------------------------------------------------------
    // TEST 7: Stop QR Session
    // -------------------------------------------------------------
    process.env.TEST_AUTH_USER_ID = teacher1User.id;
    const stopRes = await stopQrSession(classSession.id);
    assert(stopRes.success === true, "21. Session Close: Teacher stops live QR roll call");

    const closedSession = await db.classSession.findUnique({
      where: { id: classSession.id },
      select: { isQrActive: true },
    });
    assert(closedSession?.isQrActive === false, "22. Session Close: isQrActive set to false in database");

    // Scanning after session is stopped
    const freshToken = generateQrPayload(classSession.id, dbSession!.qrSecret!, 10, 15);
    process.env.TEST_AUTH_USER_ID = studentEnrolledUser.id;
    const closedScan = await submitQrAttendance(freshToken.rawString);
    assert(closedScan.success === false, "23. Session Close: Check-in rejected when QR stream is inactive");

  } finally {
    // Teardown Fixtures
    console.log("\nTearing down fixtures...");
    delete process.env.TEST_AUTH_USER_ID;

    await db.qrCheckinLog.deleteMany({
      where: { classSessionId: classSession.id },
    });
    await db.attendanceRecord.deleteMany({
      where: { classSessionId: classSession.id },
    });
    await db.classSession.delete({ where: { id: classSession.id } });
    await db.classTeacherAssignment.deleteMany({ where: { classId: classSection.id } });
    await db.classEnrollment.deleteMany({ where: { classId: classSection.id } });
    await db.class.delete({ where: { id: classSection.id } });
    await db.subject.delete({ where: { id: subject.id } });
    await db.studentProfile.deleteMany({
      where: { id: { in: [studentEnrolledProfile.id, studentUnenrolledProfile.id] } },
    });
    await db.teacherProfile.deleteMany({
      where: { id: { in: [teacher1Profile.id, teacher2Profile.id] } },
    });
    await db.user.deleteMany({
      where: {
        id: {
          in: [
            studentEnrolledUser.id,
            studentUnenrolledUser.id,
            teacher1User.id,
            teacher2User.id,
            adminUser.id,
          ],
        },
      },
    });
  }

  console.log("\n----------------------------------------------------------");
  console.log(`QR ATTENDANCE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("----------------------------------------------------------\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runQrAttendanceTests().catch((err) => {
  console.error("Test execution failed with error:", err);
  process.exit(1);
});
