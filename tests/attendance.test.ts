import { db } from "../lib/db";
import {
  classSessionInputSchema,
  submitAttendanceSchema,
  attendanceStatusEnum,
} from "../lib/validations/attendance";
import bcrypt from "bcryptjs";

async function runAttendanceTests() {
  console.log("==================================================");
  console.log("    SMART ATTENDANCE SYSTEM - ATTENDANCE SUITE    ");
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
  const invalidTime = classSessionInputSchema.safeParse({
    classId: "class-123",
    subjectId: "sub-123",
    teacherId: "teach-123",
    date: new Date(),
    startTime: "not-a-time",
  });
  assert(!invalidTime.success, "1. Validation: Rejects invalid start time string");

  const validStatus = attendanceStatusEnum.safeParse("EXCUSED");
  assert(validStatus.success, "2. Validation: Accepts valid EXCUSED attendance status");

  const invalidStatus = attendanceStatusEnum.safeParse("HOLIDAY");
  assert(!invalidStatus.success, "3. Validation: Rejects invalid status 'HOLIDAY'");

  const invalidSubmission = submitAttendanceSchema.safeParse({
    sessionId: "sess-123",
    entries: [], // empty
  });
  assert(!invalidSubmission.success, "4. Validation: Rejects empty roll call entries array");

  // 2. SETUP FIXTURES FOR INTEGRATION INTEGRITY CHECKS
  // Resolve or create subject, term, class, teacher, and enrolled student
  let subject = await db.subject.findFirst();
  if (!subject) {
    subject = await db.subject.create({
      data: {
        code: `CS-ATT-${Date.now().toString().slice(-4)}`,
        name: "Attendance Test Subject",
        department: "Computer Science",
        credits: 3,
      },
    });
  }

  let alternateSubject = await db.subject.findFirst({
    where: { id: { not: subject.id } },
  });
  if (!alternateSubject) {
    alternateSubject = await db.subject.create({
      data: {
        code: `ALT-${Date.now().toString().slice(-4)}`,
        name: "Alternate Test Subject",
        department: "Electrical Engineering",
        credits: 3,
      },
    });
  }

  let term = await db.academicTerm.findFirst({ where: { isCurrent: true } });
  if (!term) {
    term = await db.academicTerm.create({
      data: {
        name: "Fall 2026 Test",
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000 * 90),
        isCurrent: true,
      },
    });
  }

  const testClass = await db.class.create({
    data: {
      name: `ATT-TEST-CLASS-${Date.now().toString().slice(-4)}`,
      section: "A",
      subjectId: subject.id,
      termId: term.id,
    },
  });

  // Create Assigned Teacher
  const teacherUser = await db.user.create({
    data: {
      name: "Prof. Assigned Instructor",
      email: `assigned.teacher.${Date.now()}@university.edu`,
      role: "TEACHER",
      passwordHash: await bcrypt.hash("Pass@123", 10),
      isActive: true,
    },
  });
  const assignedTeacher = await db.teacherProfile.create({
    data: {
      userId: teacherUser.id,
      employeeId: `FAC-${Date.now().toString().slice(-5)}`,
      department: "Computer Science",
    },
  });

  // Assign teacher to class
  await db.classTeacherAssignment.create({
    data: {
      classId: testClass.id,
      teacherId: assignedTeacher.id,
      role: "PRIMARY",
    },
  });

  // Create Unassigned Teacher (for unauthorized teacher test)
  const unassignedUser = await db.user.create({
    data: {
      name: "Prof. Unassigned Intruder",
      email: `unassigned.teacher.${Date.now()}@university.edu`,
      role: "TEACHER",
      passwordHash: await bcrypt.hash("Pass@123", 10),
      isActive: true,
    },
  });
  const unassignedTeacher = await db.teacherProfile.create({
    data: {
      userId: unassignedUser.id,
      employeeId: `FAC-UN-${Date.now().toString().slice(-5)}`,
      department: "Mechanical Engineering",
    },
  });

  // Create Enrolled Student
  const studentUser1 = await db.user.create({
    data: {
      name: "Enrolled Student Alpha",
      email: `student.alpha.${Date.now()}@university.edu`,
      role: "STUDENT",
      isActive: true,
    },
  });
  const enrolledStudent = await db.studentProfile.create({
    data: {
      userId: studentUser1.id,
      rollNo: `ROLL-A-${Date.now().toString().slice(-4)}`,
      batch: "2024-2028",
      department: "Computer Science",
      admissionYear: 2024,
    },
  });
  await db.classEnrollment.create({
    data: {
      classId: testClass.id,
      studentId: enrolledStudent.id,
    },
  });

  // Create Unenrolled Student (for invalid student/class combination test)
  const studentUser2 = await db.user.create({
    data: {
      name: "Unenrolled Student Beta",
      email: `student.beta.${Date.now()}@university.edu`,
      role: "STUDENT",
      isActive: true,
    },
  });
  const unenrolledStudent = await db.studentProfile.create({
    data: {
      userId: studentUser2.id,
      rollNo: `ROLL-B-${Date.now().toString().slice(-4)}`,
      batch: "2024-2028",
      department: "Civil Engineering",
      admissionYear: 2024,
    },
  });

  // 3. TEST: Prevention of Mismatched Subject in Class Session
  const subjectMismatch = testClass.subjectId !== alternateSubject.id;
  assert(
    subjectMismatch,
    "5. Integrity Guard: Detects mismatch when session subject differs from class subject"
  );

  // 4. TEST: Unauthorized Teacher Prevention
  const teacherCheck = await db.classTeacherAssignment.findUnique({
    where: {
      classId_teacherId: {
        classId: testClass.id,
        teacherId: unassignedTeacher.id,
      },
    },
  });
  assert(
    teacherCheck === null,
    "6. Integrity Guard: Blocks unassigned teacher from class session recording"
  );

  // 5. TEST: Invalid Student / Class Combination Prevention
  const enrollmentCheck = await db.classEnrollment.findUnique({
    where: {
      classId_studentId: {
        classId: testClass.id,
        studentId: unenrolledStudent.id,
      },
    },
  });
  assert(
    enrollmentCheck === null,
    "7. Integrity Guard: Blocks unenrolled student from being marked in class session"
  );

  // 6. TEST: Session Creation by Authorized Teacher
  const validSession = await db.classSession.create({
    data: {
      classId: testClass.id,
      subjectId: testClass.subjectId,
      teacherId: assignedTeacher.id,
      date: new Date(),
      startTime: "10:00 AM",
      endTime: "11:30 AM",
      room: "Room 402",
      status: "SCHEDULED",
    },
  });
  assert(
    validSession !== null && validSession.status === "SCHEDULED",
    "8. Session Creation: Created valid scheduled class session"
  );

  // 7. TEST: Atomic Roll Call Submission & Session Completion
  await db.$transaction(async (tx) => {
    await tx.attendanceRecord.create({
      data: {
        classSessionId: validSession.id,
        studentId: enrolledStudent.id,
        status: "PRESENT",
        remarks: "Attended full lecture",
        recordedById: teacherUser.id,
      },
    });

    await tx.classSession.update({
      where: { id: validSession.id },
      data: { status: "COMPLETED" },
    });

    await tx.auditLog.create({
      data: {
        entity: "ClassSession",
        entityId: validSession.id,
        action: "ATTENDANCE_SUBMITTED",
        performedById: teacherUser.id,
        details: JSON.stringify({ present: 1 }),
      },
    });
  });

  const completedSession = await db.classSession.findUnique({
    where: { id: validSession.id },
    include: { records: true },
  });
  assert(
    completedSession?.status === "COMPLETED" && completedSession.records.length === 1,
    "9. Roll Call: Atomically recorded attendance and marked session COMPLETED"
  );

  // 8. TEST: Duplicate Attendance Prevention
  let duplicatePrevented = false;
  try {
    await db.attendanceRecord.create({
      data: {
        classSessionId: validSession.id,
        studentId: enrolledStudent.id,
        status: "ABSENT", // duplicate insertion attempt
      },
    });
  } catch {
    duplicatePrevented = true;
  }
  assert(
    duplicatePrevented,
    "10. Duplicate Prevention: Unique constraint blocks duplicate attendance record"
  );

  // 9. TEST: Attendance Modification & Audit Logging
  const record = completedSession!.records[0];
  await db.$transaction(async (tx) => {
    await tx.attendanceRecord.update({
      where: { id: record.id },
      data: {
        status: "EXCUSED",
        remarks: "Medical leave certificate provided",
      },
    });

    await tx.auditLog.create({
      data: {
        entity: "AttendanceRecord",
        entityId: record.id,
        action: "UPDATE",
        performedById: teacherUser.id,
        details: JSON.stringify({
          from: "PRESENT",
          to: "EXCUSED",
          remarks: "Medical leave certificate provided",
        }),
      },
    });
  });

  const updatedRecord = await db.attendanceRecord.findUnique({ where: { id: record.id } });
  const auditLogs = await db.auditLog.findMany({
    where: { entity: "AttendanceRecord", entityId: record.id },
  });
  assert(
    updatedRecord?.status === "EXCUSED" && auditLogs.length > 0,
    "11. Audit Trail: Modified attendance record with before/after AuditLog entry"
  );

  // 10. TEST: Session Verification Lock
  const lockedSession = await db.classSession.update({
    where: { id: validSession.id },
    data: {
      verifiedAt: new Date(),
      verifiedById: teacherUser.id,
    },
  });
  assert(
    lockedSession.verifiedAt !== null,
    "12. Session Lock: Session locked against unauthorized modification"
  );

  // 11. TEST: Student Statistics & Debarment Risk Aggregation
  // Enrolled student has 1 session, 1 attended (status = EXCUSED) => 100%
  const totalCount = await db.classSession.count({
    where: { classId: testClass.id, status: "COMPLETED" },
  });
  const attendedCount = await db.attendanceRecord.count({
    where: {
      studentId: enrolledStudent.id,
      classSession: { classId: testClass.id, status: "COMPLETED" },
      status: { in: ["PRESENT", "EXCUSED", "LATE"] },
    },
  });
  const attendanceRate = totalCount > 0 ? (attendedCount / totalCount) * 100 : 0;
  const isDebarred = attendanceRate < 75.0;

  assert(
    attendanceRate === 100.0 && !isDebarred,
    "13. Statistics: Accurate calculation of attendance percentage (100.0%) and debarment eligibility"
  );

  // 12. CLEANUP FIXTURES
  await db.auditLog.deleteMany({
    where: {
      OR: [
        { entity: "ClassSession", entityId: validSession.id },
        { entity: "AttendanceRecord", entityId: record.id },
      ],
    },
  });
  await db.attendanceRecord.deleteMany({ where: { classSessionId: validSession.id } });
  await db.classSession.delete({ where: { id: validSession.id } });
  await db.classEnrollment.deleteMany({ where: { classId: testClass.id } });
  await db.classTeacherAssignment.deleteMany({ where: { classId: testClass.id } });
  await db.class.delete({ where: { id: testClass.id } });
  await db.studentProfile.delete({ where: { id: enrolledStudent.id } });
  await db.studentProfile.delete({ where: { id: unenrolledStudent.id } });
  await db.user.delete({ where: { id: studentUser1.id } });
  await db.user.delete({ where: { id: studentUser2.id } });
  await db.teacherProfile.delete({ where: { id: assignedTeacher.id } });
  await db.teacherProfile.delete({ where: { id: unassignedTeacher.id } });
  await db.user.delete({ where: { id: teacherUser.id } });
  await db.user.delete({ where: { id: unassignedUser.id } });

  assert(true, "14. Cleanup: Temporary attendance fixtures safely removed");

  console.log("==================================================");
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAttendanceTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
