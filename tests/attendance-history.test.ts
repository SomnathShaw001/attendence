import { db } from "../lib/db";
import {
  getAttendanceHistory,
  getAttendanceFilterOptions,
  getAttendanceRecordAuditHistory,
  updateAttendanceRecord,
  verifyAndLockSession,
} from "../app/attendance/actions";
import bcrypt from "bcryptjs";

async function runAttendanceHistoryTests() {
  console.log("==========================================================");
  console.log("   SMART ATTENDANCE - ATTENDANCE HISTORY TEST SUITE       ");
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

  // 1. Setup Fixtures
  // Admin User
  const adminUser = await db.user.create({
    data: {
      email: `admin.hist.${timestamp}@test.edu`,
      passwordHash,
      name: "Admin History",
      role: "ADMIN",
    },
  });

  // Teacher 1 (Assigned to Class 1)
  const teacher1User = await db.user.create({
    data: {
      email: `t1.hist.${timestamp}@test.edu`,
      passwordHash,
      name: "Prof. History Alpha",
      role: "TEACHER",
    },
  });
  const teacher1Profile = await db.teacherProfile.create({
    data: {
      userId: teacher1User.id,
      employeeId: `FAC1-${timestamp}`,
      department: "Computer Science",
    },
  });

  // Teacher 2 (Assigned to Class 2)
  const teacher2User = await db.user.create({
    data: {
      email: `t2.hist.${timestamp}@test.edu`,
      passwordHash,
      name: "Prof. History Beta",
      role: "TEACHER",
    },
  });
  const teacher2Profile = await db.teacherProfile.create({
    data: {
      userId: teacher2User.id,
      employeeId: `FAC2-${timestamp}`,
      department: "Mathematics",
    },
  });

  // Student 1 (Alpha)
  const student1User = await db.user.create({
    data: {
      email: `s1.hist.${timestamp}@test.edu`,
      passwordHash,
      name: "Student Alpha",
      role: "STUDENT",
    },
  });
  const student1Profile = await db.studentProfile.create({
    data: {
      userId: student1User.id,
      rollNo: `ROLL-A-${timestamp}`,
      batch: "2026",
      department: "Computer Science",
      admissionYear: 2026,
    },
  });

  // Student 2 (Beta)
  const student2User = await db.user.create({
    data: {
      email: `s2.hist.${timestamp}@test.edu`,
      passwordHash,
      name: "Student Beta",
      role: "STUDENT",
    },
  });
  const student2Profile = await db.studentProfile.create({
    data: {
      userId: student2User.id,
      rollNo: `ROLL-B-${timestamp}`,
      batch: "2026",
      department: "Mathematics",
      admissionYear: 2026,
    },
  });

  // Subjects
  const subject1 = await db.subject.create({
    data: {
      code: `CS-${timestamp}`,
      name: "Software Architecture",
      department: "Computer Science",
      credits: 4,
    },
  });
  const subject2 = await db.subject.create({
    data: {
      code: `MATH-${timestamp}`,
      name: "Linear Algebra",
      department: "Mathematics",
      credits: 3,
    },
  });

  // Academic Term
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

  // Class 1 (CS with Teacher 1, Student 1 enrolled)
  const class1 = await db.class.create({
    data: {
      name: `CS-Class-${timestamp}`,
      section: "A",
      subjectId: subject1.id,
      termId: term.id,
    },
  });
  await db.classTeacherAssignment.create({
    data: { classId: class1.id, teacherId: teacher1Profile.id, role: "PRIMARY" },
  });
  await db.classEnrollment.create({
    data: { classId: class1.id, studentId: student1Profile.id },
  });

  // Class 2 (Math with Teacher 2, Student 2 enrolled)
  const class2 = await db.class.create({
    data: {
      name: `MATH-Class-${timestamp}`,
      section: "B",
      subjectId: subject2.id,
      termId: term.id,
    },
  });
  await db.classTeacherAssignment.create({
    data: { classId: class2.id, teacherId: teacher2Profile.id, role: "PRIMARY" },
  });
  await db.classEnrollment.create({
    data: { classId: class2.id, studentId: student2Profile.id },
  });

  // Create Sessions & Attendance Records
  // Session 1 for Class 1 (Date: 2026-09-10)
  const session1 = await db.classSession.create({
    data: {
      classId: class1.id,
      subjectId: subject1.id,
      teacherId: teacher1Profile.id,
      date: new Date("2026-09-10T09:00:00Z"),
      startTime: "09:00 AM",
      status: "COMPLETED",
    },
  });
  const record1 = await db.attendanceRecord.create({
    data: {
      classSessionId: session1.id,
      studentId: student1Profile.id,
      status: "PRESENT",
      remarks: "On time",
      recordedById: teacher1User.id,
    },
  });

  // Session 2 for Class 1 (Date: 2026-09-15) - Student 1 marked ABSENT
  const session2 = await db.classSession.create({
    data: {
      classId: class1.id,
      subjectId: subject1.id,
      teacherId: teacher1Profile.id,
      date: new Date("2026-09-15T09:00:00Z"),
      startTime: "09:00 AM",
      status: "COMPLETED",
    },
  });
  const record2 = await db.attendanceRecord.create({
    data: {
      classSessionId: session2.id,
      studentId: student1Profile.id,
      status: "ABSENT",
      remarks: "Unexcused absence",
      recordedById: teacher1User.id,
    },
  });

  // Session 3 for Class 2 (Date: 2026-09-12) - Student 2 marked PRESENT
  const session3 = await db.classSession.create({
    data: {
      classId: class2.id,
      subjectId: subject2.id,
      teacherId: teacher2Profile.id,
      date: new Date("2026-09-12T11:00:00Z"),
      startTime: "11:00 AM",
      status: "COMPLETED",
    },
  });
  const record3 = await db.attendanceRecord.create({
    data: {
      classSessionId: session3.id,
      studentId: student2Profile.id,
      status: "PRESENT",
      remarks: "Active participation",
      recordedById: teacher2User.id,
    },
  });

  console.log("-> Test fixtures populated successfully.");

  // TEST 1: Student Isolation
  // Student 1 logs in: can ONLY view Student 1's records (records 1 and 2, but NOT record 3)
  process.env.TEST_AUTH_USER_ID = student1User.id;
  const student1History = await getAttendanceHistory();
  assert(
    student1History.records.length === 2 &&
      student1History.records.every((r) => r.studentId === student1Profile.id),
    "1. Student Isolation: Student only retrieves personal attendance records"
  );

  // TEST 2: Tamper attempt: Student 1 attempts to pass studentId: student2Profile.id
  const student1TamperHistory = await getAttendanceHistory({
    studentId: student2Profile.id,
  });
  assert(
    student1TamperHistory.records.every((r) => r.studentId === student1Profile.id) &&
      !student1TamperHistory.records.some((r) => r.studentId === student2Profile.id),
    "2. Student Isolation: Client parameter overrides are ignored; student cannot view other students' records"
  );

  // TEST 3: Teacher Isolation
  // Teacher 1 logs in: can ONLY view records for Class 1 (records 1 and 2), NOT Class 2
  process.env.TEST_AUTH_USER_ID = teacher1User.id;
  const teacher1History = await getAttendanceHistory();
  assert(
    teacher1History.records.length === 2 &&
      teacher1History.records.every((r) => r.classSession.class.id === class1.id),
    "3. Teacher Isolation: Faculty only sees records for class sections they are assigned to instruct"
  );

  // Teacher 1 attempts to query Class 2 directly
  const teacher1Class2Query = await getAttendanceHistory({
    classId: class2.id,
  });
  assert(
    teacher1Class2Query.records.length === 0,
    "4. Teacher Isolation: Querying an unassigned class returns zero records for teacher"
  );

  // TEST 4: Admin Global Visibility
  process.env.TEST_AUTH_USER_ID = adminUser.id;
  const adminHistory = await getAttendanceHistory();
  assert(
    adminHistory.records.length >= 3 &&
      adminHistory.records.some((r) => r.id === record1.id) &&
      adminHistory.records.some((r) => r.id === record3.id),
    "5. Admin Oversight: Administrator has global visibility across all classes and cohorts"
  );

  // TEST 5: Date Range Filtering
  // Query records between 2026-09-09 and 2026-09-11 (Should only match record1 from 2026-09-10)
  const dateFiltered = await getAttendanceHistory({
    startDate: "2026-09-09",
    endDate: "2026-09-11",
  });
  assert(
    dateFiltered.records.length === 1 && dateFiltered.records[0]?.id === record1.id,
    "6. Date Range Filtering: Restricts query results to records within requested date bounds"
  );

  // TEST 6: Status Filtering
  // Query status: ABSENT
  const statusFiltered = await getAttendanceHistory({
    status: "ABSENT",
  });
  assert(
    statusFiltered.records.length === 1 && statusFiltered.records[0]?.id === record2.id,
    "7. Status Filtering: Filters records matching ABSENT status"
  );

  // TEST 7: Class & Subject Filtering
  const classFiltered = await getAttendanceHistory({
    classId: class2.id,
  });
  assert(
    classFiltered.records.length === 1 && classFiltered.records[0]?.id === record3.id,
    "8. Class Filtering: Returns records restricted to specified class"
  );

  // TEST 8: Authorized Editing by Assigned Teacher
  // Teacher 1 edits record2 (changing from ABSENT to EXCUSED with remarks)
  process.env.TEST_AUTH_USER_ID = teacher1User.id;
  const editResult = await updateAttendanceRecord({
    recordId: record2.id,
    status: "EXCUSED",
    remarks: "Medical leave approved by Dean",
  });
  assert(editResult.success === true, "9. Authorized Editing: Assigned teacher successfully updates record");

  const updatedRec2 = await db.attendanceRecord.findUnique({ where: { id: record2.id } });
  assert(
    updatedRec2?.status === "EXCUSED" && updatedRec2.remarks === "Medical leave approved by Dean",
    "10. Database Update: Status and remarks correctly updated in database"
  );

  // TEST 9: Unauthorized Edit Prevention (Teacher 2 cannot edit Class 1 record)
  process.env.TEST_AUTH_USER_ID = teacher2User.id;
  const unauthorizedTeacherEdit = await updateAttendanceRecord({
    recordId: record1.id,
    status: "ABSENT",
  });
  assert(
    !unauthorizedTeacherEdit.success &&
      Boolean(unauthorizedTeacherEdit.error?.includes("not assigned")),
    "11. Boundary Guard: Unassigned teacher is prevented from modifying attendance record"
  );

  // Student cannot edit any record
  process.env.TEST_AUTH_USER_ID = student1User.id;
  const studentEditAttempt = await updateAttendanceRecord({
    recordId: record1.id,
    status: "EXCUSED",
  });
  assert(
    !studentEditAttempt.success &&
      Boolean(studentEditAttempt.error?.includes("Insufficient permissions")),
    "12. Role Guard: Student is strictly prevented from editing attendance records"
  );

  // TEST 10: Locked Session Tamper Prevention
  // Admin locks session 1
  process.env.TEST_AUTH_USER_ID = adminUser.id;
  await verifyAndLockSession(session1.id);

  // Teacher 1 attempts to alter record1 on locked session
  process.env.TEST_AUTH_USER_ID = teacher1User.id;
  const lockedEditAttempt = await updateAttendanceRecord({
    recordId: record1.id,
    status: "LATE",
  });
  assert(
    !lockedEditAttempt.success &&
      Boolean(lockedEditAttempt.error?.includes("verified and locked")),
    "13. Tamper Prevention: Teacher is blocked from modifying records on locked session"
  );

  // Admin override on locked session
  process.env.TEST_AUTH_USER_ID = adminUser.id;
  const adminOverride = await updateAttendanceRecord({
    recordId: record1.id,
    status: "LATE",
    remarks: "Administrative time correction",
  });
  assert(
    adminOverride.success === true,
    "14. Admin Override: Administrator can update locked record with audit log"
  );

  // TEST 11: Audit Trail Access
  // Teacher 1 views audit history for record2
  process.env.TEST_AUTH_USER_ID = teacher1User.id;
  const teacherAudit = await getAttendanceRecordAuditHistory(record2.id);
  assert(
    teacherAudit.success === true && (teacherAudit.logs?.length || 0) > 0,
    "15. Audit Inspection: Assigned teacher can view audit history with diff tracking"
  );

  // Student attempts to view audit history
  process.env.TEST_AUTH_USER_ID = student1User.id;
  const studentAudit = await getAttendanceRecordAuditHistory(record2.id);
  assert(
    !studentAudit.success &&
      Boolean(studentAudit.error?.includes("Students cannot access")),
    "16. Audit Privacy: Students are blocked from accessing system audit logs"
  );

  // TEST 12: Filter Options Resolution
  process.env.TEST_AUTH_USER_ID = student1User.id;
  const studentFilters = await getAttendanceFilterOptions();
  assert(
    studentFilters.students.length === 0 && studentFilters.classes.length === 1,
    "17. Filter Scoping: Student filter options do not expose other students"
  );

  // Clean up fixtures
  try {
    await db.auditLog.deleteMany({
      where: {
        entityId: { in: [session1.id, session2.id, session3.id, record1.id, record2.id, record3.id] },
      },
    });
    await db.attendanceRecord.deleteMany({
      where: {
        id: { in: [record1.id, record2.id, record3.id] },
      },
    });
    await db.classSession.deleteMany({
      where: { id: { in: [session1.id, session2.id, session3.id] } },
    });
    await db.classEnrollment.deleteMany({
      where: { classId: { in: [class1.id, class2.id] } },
    });
    await db.classTeacherAssignment.deleteMany({
      where: { classId: { in: [class1.id, class2.id] } },
    });
    await db.class.deleteMany({
      where: { id: { in: [class1.id, class2.id] } },
    });
    await db.subject.deleteMany({
      where: { id: { in: [subject1.id, subject2.id] } },
    });
    await db.studentProfile.deleteMany({
      where: { id: { in: [student1Profile.id, student2Profile.id] } },
    });
    await db.teacherProfile.deleteMany({
      where: { id: { in: [teacher1Profile.id, teacher2Profile.id] } },
    });
    await db.user.deleteMany({
      where: { id: { in: [adminUser.id, teacher1User.id, teacher2User.id, student1User.id, student2User.id] } },
    });
    console.log("-> Test fixtures cleanly purged.");
  } catch (cleanErr) {
    console.warn("Cleanup note:", cleanErr);
  }

  console.log("----------------------------------------------------------");
  console.log(`ATTENDANCE HISTORY TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log("----------------------------------------------------------");

  if (failed > 0) {
    process.exit(1);
  }
}

runAttendanceHistoryTests().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
