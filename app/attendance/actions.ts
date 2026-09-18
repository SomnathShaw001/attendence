"use server";

import { db } from "@/lib/db";
import { getServerAuthSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import {
  classSessionInputSchema,
  submitAttendanceSchema,
  updateAttendanceRecordSchema,
  type ClassSessionInput,
  type SubmitAttendanceInput,
  type UpdateAttendanceRecordInput,
  type AttendanceStatus,
} from "@/lib/validations/attendance";
function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Gracefully handle headless test runs where Next.js static store is absent
  }
}
/**
 * 1. Create a Class Session
 * Prevents:
 * - Wrong class / subject mismatch
 * - Unauthorized teacher scheduling
 */
export async function createClassSession(rawInput: ClassSessionInput) {
  const session = await getServerAuthSession();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return { success: false, error: "Unauthorized: Only faculty and administrators can schedule class sessions." };
  }

  const parsed = classSessionInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid session parameters.",
    };
  }

  const data = parsed.data;

  // 1. Verify Class & Subject match (Wrong class/subject prevention)
  const classRecord = await db.class.findUnique({
    where: { id: data.classId },
    select: { id: true, subjectId: true, name: true, section: true },
  });

  if (!classRecord) {
    return { success: false, error: "Academic class not found." };
  }

  if (classRecord.subjectId !== data.subjectId) {
    return {
      success: false,
      error: `Integrity Error: The selected subject does not belong to class "${classRecord.name}". Expected subject ID ${classRecord.subjectId}.`,
    };
  }

  // 2. Verify Teacher Authorization (Unauthorized teacher prevention)
  if (session.user.role === "TEACHER") {
    const teacherProfile = await db.teacherProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, user: { select: { isActive: true } } },
    });

    if (!teacherProfile || !teacherProfile.user.isActive) {
      return { success: false, error: "Unauthorized: Active faculty profile required." };
    }

    if (teacherProfile.id !== data.teacherId) {
      return { success: false, error: "Unauthorized: Faculty cannot schedule class sessions for another instructor." };
    }

    const assignment = await db.classTeacherAssignment.findUnique({
      where: {
        classId_teacherId: {
          classId: data.classId,
          teacherId: teacherProfile.id,
        },
      },
    });

    if (!assignment) {
      return { success: false, error: "Unauthorized: You are not an assigned instructor for this class section." };
    }
  }

  try {
    const classSession = await db.$transaction(async (tx) => {
      const created = await tx.classSession.create({
        data: {
          classId: data.classId,
          subjectId: data.subjectId,
          teacherId: data.teacherId,
          date: data.date,
          startTime: data.startTime || null,
          endTime: data.endTime || null,
          room: data.room?.trim() || null,
          status: "SCHEDULED",
        },
      });

      await tx.auditLog.create({
        data: {
          entity: "ClassSession",
          entityId: created.id,
          action: "CREATE",
          performedById: session.user.id,
          details: JSON.stringify({
            classId: data.classId,
            subjectId: data.subjectId,
            date: data.date.toISOString(),
            room: data.room,
          }),
        },
      });

      return created;
    });

    safeRevalidatePath("/attendance");
    safeRevalidatePath(`/classes/${data.classId}`);
    return { success: true, session: classSession };
  } catch (err: unknown) {
    console.error("Failed to create class session:", err);
    return { success: false, error: "Database error while scheduling class session." };
  }
}

/**
 * 2. Get Class Sessions Roster / History
 */
export async function getClassSessions(params?: {
  classId?: string;
  subjectId?: string;
  teacherId?: string;
  status?: string;
  mySessionsOnly?: boolean;
}) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in to view class sessions.");
  }

  const { classId, subjectId, teacherId, status, mySessionsOnly } = params || {};

  const where: Prisma.ClassSessionWhereInput = {};

  if (classId && classId !== "all") {
    where.classId = classId;
  }

  if (subjectId && subjectId !== "all") {
    where.subjectId = subjectId;
  }

  if (teacherId && teacherId !== "all") {
    where.teacherId = teacherId;
  }

  if (status && status !== "all") {
    where.status = status;
  }

  // Role-specific constraints
  if (session.user.role === "TEACHER" && mySessionsOnly) {
    const teacherProfile = await db.teacherProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (teacherProfile) {
      where.teacherId = teacherProfile.id;
    }
  } else if (session.user.role === "STUDENT") {
    // Students can only see sessions for classes they are enrolled in
    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (studentProfile) {
      where.class = {
        enrollments: {
          some: { studentId: studentProfile.id },
        },
      };
    }
  }

  return await db.classSession.findMany({
    where,
    include: {
      class: {
        select: {
          id: true,
          name: true,
          section: true,
          term: { select: { name: true, isCurrent: true } },
        },
      },
      subject: {
        select: {
          id: true,
          code: true,
          name: true,
          credits: true,
        },
      },
      teacher: {
        select: {
          id: true,
          employeeId: true,
          user: { select: { name: true, email: true } },
        },
      },
      _count: {
        select: {
          records: true,
        },
      },
    },
    orderBy: { date: "desc" },
    take: 50,
  });
}

/**
 * 3. Get Session Roll Call Sheet
 * Returns all enrolled students in the class, with their recorded or default status
 */
export async function getSessionRollCall(sessionId: string) {
  const session = await getServerAuthSession();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    throw new Error("Unauthorized: Only faculty and administrators can access roll call sheets.");
  }

  const classSession = await db.classSession.findUnique({
    where: { id: sessionId },
    include: {
      class: {
        include: {
          enrollments: {
            include: {
              student: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      isActive: true,
                    },
                  },
                },
              },
            },
            orderBy: { student: { rollNo: "asc" } },
          },
        },
      },
      subject: true,
      teacher: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
      records: true,
    },
  });

  if (!classSession) {
    throw new Error("Class session not found.");
  }

  // Teacher authorization check: must be assigned to the class
  if (session.user.role === "TEACHER") {
    const teacherProfile = await db.teacherProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    const isAssigned = await db.classTeacherAssignment.findUnique({
      where: {
        classId_teacherId: {
          classId: classSession.classId,
          teacherId: teacherProfile?.id || "",
        },
      },
    });

    if (!isAssigned) {
      throw new Error("Unauthorized: You are not authorized to view or mark attendance for this class section.");
    }
  }

  // Map existing records by studentId
  const recordMap = new Map<string, { id: string; status: string; remarks: string | null }>();
  classSession.records.forEach((rec) => {
    recordMap.set(rec.studentId, {
      id: rec.id,
      status: rec.status,
      remarks: rec.remarks,
    });
  });

  // Build candidate roll call items for all enrolled students
  const rollCallItems = classSession.class.enrollments.map((enr) => {
    const existing = recordMap.get(enr.studentId);
    return {
      studentId: enr.studentId,
      rollNo: enr.student.rollNo,
      name: enr.student.user.name,
      email: enr.student.user.email,
      batch: enr.student.batch,
      department: enr.student.department,
      isActive: enr.student.user.isActive,
      recordId: existing?.id || null,
      status: (existing?.status as AttendanceStatus) || "PRESENT",
      remarks: existing?.remarks || "",
    };
  });

  const isLocked = classSession.verifiedAt !== null;

  return {
    session: {
      id: classSession.id,
      date: classSession.date,
      startTime: classSession.startTime,
      endTime: classSession.endTime,
      room: classSession.room,
      status: classSession.status,
      verifiedAt: classSession.verifiedAt,
      verifiedById: classSession.verifiedById,
      className: classSession.class.name,
      section: classSession.class.section,
      subjectCode: classSession.subject.code,
      subjectName: classSession.subject.name,
      teacherName: classSession.teacher.user.name,
    },
    isLocked,
    rollCallItems,
  };
}

/**
 * 4. Submit Session Attendance Roll Call
 * Enforces:
 * - Duplicate attendance prevention (upsert on @@unique([classSessionId, studentId]))
 * - Invalid student/class combination prevention (verifies enrollment)
 * - Unauthorized teacher recording prevention
 * - Session lock guard
 * - Audit logging
 */
export async function submitAttendance(rawInput: SubmitAttendanceInput) {
  const session = await getServerAuthSession();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return { success: false, error: "Unauthorized: Insufficient permissions to record attendance." };
  }

  const parsed = submitAttendanceSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid roll call submission.",
    };
  }

  const { sessionId, entries } = parsed.data;

  // 1. Fetch Session & Class Enrollments
  const classSession = await db.classSession.findUnique({
    where: { id: sessionId },
    include: {
      class: {
        include: {
          enrollments: { select: { studentId: true } },
          teachers: { select: { teacherId: true } },
        },
      },
    },
  });

  if (!classSession) {
    return { success: false, error: "Class session not found." };
  }

  // 2. Check Session Lock (Unauthorized modification prevention)
  if (classSession.verifiedAt !== null && session.user.role !== "ADMIN") {
    return {
      success: false,
      error: "This session has been verified and locked. Attendance records cannot be edited without administrative override.",
    };
  }

  // 3. Check Teacher Assignment (Unauthorized teacher prevention)
  if (session.user.role === "TEACHER") {
    const teacherProfile = await db.teacherProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, user: { select: { isActive: true } } },
    });

    if (!teacherProfile || !teacherProfile.user.isActive) {
      return { success: false, error: "Unauthorized: Active faculty profile required." };
    }

    const isAssigned = classSession.class.teachers.some((t) => t.teacherId === teacherProfile.id);
    if (!isAssigned) {
      return { success: false, error: "Unauthorized: You are not an assigned instructor for this class section." };
    }
  }

  // 4. Validate Student Enrollment (Invalid student/class combination prevention)
  const enrolledStudentIds = new Set(classSession.class.enrollments.map((e) => e.studentId));
  for (const entry of entries) {
    if (!enrolledStudentIds.has(entry.studentId)) {
      return {
        success: false,
        error: `Integrity Violation: Student ID "${entry.studentId}" is not enrolled in this class cohort.`,
      };
    }
  }

  // 5. Atomic Transaction: Upsert Records & Update Session Status & Audit Log
  try {
    await db.$transaction(async (tx) => {
      // Upsert records to prevent duplicates and support roll call re-submissions
      for (const entry of entries) {
        await tx.attendanceRecord.upsert({
          where: {
            classSessionId_studentId: {
              classSessionId: sessionId,
              studentId: entry.studentId,
            },
          },
          update: {
            status: entry.status,
            remarks: entry.remarks?.trim() || null,
            recordedById: session.user.id,
          },
          create: {
            classSessionId: sessionId,
            studentId: entry.studentId,
            status: entry.status,
            remarks: entry.remarks?.trim() || null,
            recordedById: session.user.id,
          },
        });
      }

      // Mark session COMPLETED if it was SCHEDULED
      if (classSession.status === "SCHEDULED") {
        await tx.classSession.update({
          where: { id: sessionId },
          data: { status: "COMPLETED" },
        });
      }

      // Write Audit Trail
      await tx.auditLog.create({
        data: {
          entity: "ClassSession",
          entityId: sessionId,
          action: "ATTENDANCE_SUBMITTED",
          performedById: session.user.id,
          details: JSON.stringify({
            recordsCount: entries.length,
            presentCount: entries.filter((e) => e.status === "PRESENT").length,
            absentCount: entries.filter((e) => e.status === "ABSENT").length,
            lateCount: entries.filter((e) => e.status === "LATE").length,
            excusedCount: entries.filter((e) => e.status === "EXCUSED").length,
          }),
        },
      });
    });

    safeRevalidatePath("/attendance");
    safeRevalidatePath(`/classes/${classSession.classId}`);
    safeRevalidatePath("/dashboard");

    return { success: true, count: entries.length };
  } catch (err: unknown) {
    console.error("Failed to submit attendance:", err);
    return { success: false, error: "Database error during roll call submission." };
  }
}

/**
 * 5. Update a Single Attendance Record
 * Enforces:
 * - Lock check
 * - Authorization check
 * - Detailed AuditLog before/after diff tracking
 */
export async function updateAttendanceRecord(rawInput: UpdateAttendanceRecordInput) {
  const session = await getServerAuthSession();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return { success: false, error: "Unauthorized: Insufficient permissions to modify attendance." };
  }

  const parsed = updateAttendanceRecordSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid update parameters.",
    };
  }

  const { recordId, status, remarks } = parsed.data;

  const existingRecord = await db.attendanceRecord.findUnique({
    where: { id: recordId },
    include: {
      classSession: {
        include: {
          class: {
            include: {
              teachers: { select: { teacherId: true } },
            },
          },
        },
      },
    },
  });

  if (!existingRecord) {
    return { success: false, error: "Attendance record not found." };
  }

  // Session lock verification
  if (existingRecord.classSession.verifiedAt !== null && session.user.role !== "ADMIN") {
    return {
      success: false,
      error: "This session has been verified and locked. Only administrators can alter locked records.",
    };
  }

  // Teacher authorization check
  if (session.user.role === "TEACHER") {
    const teacherProfile = await db.teacherProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    const isAssigned = existingRecord.classSession.class.teachers.some(
      (t) => t.teacherId === teacherProfile?.id
    );

    if (!isAssigned) {
      return { success: false, error: "Unauthorized: You are not assigned to this class section." };
    }
  }

  const oldStatus = existingRecord.status;
  const oldRemarks = existingRecord.remarks;

  try {
    await db.$transaction(async (tx) => {
      await tx.attendanceRecord.update({
        where: { id: recordId },
        data: {
          status,
          remarks: remarks?.trim() || null,
          recordedById: session.user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          entity: "AttendanceRecord",
          entityId: recordId,
          action: "UPDATE",
          performedById: session.user.id,
          details: JSON.stringify({
            previous: { status: oldStatus, remarks: oldRemarks },
            updated: { status, remarks },
            classSessionId: existingRecord.classSessionId,
            studentId: existingRecord.studentId,
          }),
        },
      });
    });

    safeRevalidatePath("/attendance");
    safeRevalidatePath(`/classes/${existingRecord.classSession.classId}`);
    safeRevalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to update attendance record:", err);
    return { success: false, error: "Database error while updating attendance record." };
  }
}

/**
 * 6. Verify and Lock Class Session
 * Freezes records against unauthorized edits.
 */
export async function verifyAndLockSession(sessionId: string) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Only administrators can verify and lock attendance sessions." };
  }

  const classSession = await db.classSession.findUnique({
    where: { id: sessionId },
    select: { id: true, classId: true, verifiedAt: true },
  });

  if (!classSession) {
    return { success: false, error: "Class session not found." };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.classSession.update({
        where: { id: sessionId },
        data: {
          verifiedAt: new Date(),
          verifiedById: session.user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          entity: "ClassSession",
          entityId: sessionId,
          action: "LOCK",
          performedById: session.user.id,
          details: JSON.stringify({ lockedAt: new Date().toISOString() }),
        },
      });
    });

    safeRevalidatePath("/attendance");
    safeRevalidatePath(`/classes/${classSession.classId}`);
    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to lock session:", err);
    return { success: false, error: "Database error while locking class session." };
  }
}

/**
 * 7. Unlock Class Session (Administrative Override)
 */
export async function unlockSession(sessionId: string) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Only administrators can unlock attendance sessions." };
  }

  const classSession = await db.classSession.findUnique({
    where: { id: sessionId },
    select: { id: true, classId: true },
  });

  if (!classSession) {
    return { success: false, error: "Class session not found." };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.classSession.update({
        where: { id: sessionId },
        data: {
          verifiedAt: null,
          verifiedById: null,
        },
      });

      await tx.auditLog.create({
        data: {
          entity: "ClassSession",
          entityId: sessionId,
          action: "UNLOCK",
          performedById: session.user.id,
          details: JSON.stringify({ unlockedAt: new Date().toISOString() }),
        },
      });
    });

    safeRevalidatePath("/attendance");
    safeRevalidatePath(`/classes/${classSession.classId}`);
    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to unlock session:", err);
    return { success: false, error: "Database error while unlocking class session." };
  }
}

/**
 * 8. Student Attendance Statistical Aggregator
 * Computes exact attended counts, percentage, and debarment risk alert
 */
export async function getStudentAttendanceSummary(studentId: string, classId?: string) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in to view attendance statistics.");
  }

  // Where filter for completed class sessions
  const sessionWhere: Prisma.ClassSessionWhereInput = {
    status: "COMPLETED",
  };

  if (classId) {
    sessionWhere.classId = classId;
  } else {
    sessionWhere.class = {
      enrollments: {
        some: { studentId },
      },
    };
  }

  const [totalSessions, studentRecords] = await Promise.all([
    db.classSession.count({ where: sessionWhere }),
    db.attendanceRecord.findMany({
      where: {
        studentId,
        classSession: sessionWhere,
      },
      select: {
        status: true,
      },
    }),
  ]);

  const presentCount = studentRecords.filter((r) => r.status === "PRESENT").length;
  const lateCount = studentRecords.filter((r) => r.status === "LATE").length;
  const excusedCount = studentRecords.filter((r) => r.status === "EXCUSED").length;
  const absentCount = studentRecords.filter((r) => r.status === "ABSENT").length;

  // Institutional rule: Attended = PRESENT + EXCUSED + (LATE treated as attended)
  const attended = presentCount + lateCount + excusedCount;
  const percentage = totalSessions > 0 ? Number(((attended / totalSessions) * 100).toFixed(1)) : null;

  // Institutional threshold: 75.0%
  const thresholdSetting = await db.systemSetting.findUnique({
    where: { key: "MIN_ATTENDANCE_PERCENTAGE" },
  });
  const threshold = thresholdSetting ? parseFloat(thresholdSetting.value) : 75.0;
  const isDebarmentRisk = percentage !== null && percentage < threshold;

  return {
    totalSessions,
    attended,
    presentCount,
    lateCount,
    excusedCount,
    absentCount,
    percentage,
    threshold,
    isDebarmentRisk,
  };
}

/**
 * 9. Get Teacher's Assigned Classes (or all classes for Admin)
 */
export async function getTeacherClasses() {
  const session = await getServerAuthSession();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    throw new Error("Unauthorized: Faculty or administrator permissions required.");
  }

  const where: Prisma.ClassWhereInput = {};

  if (session.user.role === "TEACHER") {
    const teacherProfile = await db.teacherProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, user: { select: { isActive: true } } },
    });

    if (!teacherProfile || !teacherProfile.user.isActive) {
      throw new Error("Unauthorized: Active faculty credentials required.");
    }

    where.teachers = {
      some: {
        teacherId: teacherProfile.id,
      },
    };
  }

  return await db.class.findMany({
    where,
    include: {
      subject: true,
      term: true,
      teachers: {
        include: {
          teacher: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
        },
      },
      _count: {
        select: {
          enrollments: true,
          classSessions: true,
        },
      },
    },
    orderBy: [{ term: { startDate: "desc" } }, { name: "asc" }],
  });
}

/**
 * 10. Get or Initialize a Class Session for Attendance Taking
 */
export async function getOrCreateClassSession(params: {
  classId: string;
  date: string; // YYYY-MM-DD
  startTime?: string;
  room?: string;
}) {
  const session = await getServerAuthSession();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return { success: false, error: "Unauthorized: Insufficient permissions." };
  }

  const { classId, date, startTime, room } = params;

  const classRecord = await db.class.findUnique({
    where: { id: classId },
    include: {
      subject: true,
      teachers: {
        include: {
          teacher: {
            include: { user: { select: { isActive: true } } },
          },
        },
      },
    },
  });

  if (!classRecord) {
    return { success: false, error: "Class not found." };
  }

  // Resolve Teacher ID to assign
  let teacherId: string;
  if (session.user.role === "TEACHER") {
    const teacherProfile = await db.teacherProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, user: { select: { isActive: true } } },
    });
    if (!teacherProfile || !teacherProfile.user.isActive) {
      return { success: false, error: "Unauthorized: Active faculty profile required." };
    }
    const isAssigned = classRecord.teachers.some((t) => t.teacherId === teacherProfile.id);
    if (!isAssigned) {
      return { success: false, error: "Unauthorized: You are not assigned to this class section." };
    }
    teacherId = teacherProfile.id;
  } else {
    // Admin: use primary teacher or first assigned teacher, or any active teacher
    teacherId = classRecord.teachers[0]?.teacherId;
    if (!teacherId) {
      const anyTeacher = await db.teacherProfile.findFirst({
        where: { user: { isActive: true } },
      });
      if (!anyTeacher) {
        return { success: false, error: "No active faculty available to assign to this session." };
      }
      teacherId = anyTeacher.id;
    }
  }

  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  // Look for an existing session on this date for this class
  let existingSession = await db.classSession.findFirst({
    where: {
      classId,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      class: {
        include: {
          enrollments: {
            include: {
              student: {
                include: {
                  user: { select: { id: true, name: true, email: true, isActive: true } },
                },
              },
            },
            orderBy: { student: { rollNo: "asc" } },
          },
        },
      },
      subject: true,
      teacher: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
      records: true,
    },
  });

  if (!existingSession) {
    // Create new scheduled session
    existingSession = await db.classSession.create({
      data: {
        classId,
        subjectId: classRecord.subjectId,
        teacherId,
        date: targetDate,
        startTime: startTime || "09:00 AM",
        room: room || null,
        status: "SCHEDULED",
      },
      include: {
        class: {
          include: {
            enrollments: {
              include: {
                student: {
                  include: {
                    user: { select: { id: true, name: true, email: true, isActive: true } },
                  },
                },
              },
              orderBy: { student: { rollNo: "asc" } },
            },
          },
        },
        subject: true,
        teacher: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        records: true,
      },
    });

    await db.auditLog.create({
      data: {
        entity: "ClassSession",
        entityId: existingSession.id,
        action: "CREATE",
        performedById: session.user.id,
        details: JSON.stringify({ classId, date }),
      },
    });
  }

  // Format roll call items
  const recordMap = new Map<string, { id: string; status: string; remarks: string | null }>();
  existingSession.records.forEach((rec) => {
    recordMap.set(rec.studentId, {
      id: rec.id,
      status: rec.status,
      remarks: rec.remarks,
    });
  });

  const rollCallItems = existingSession.class.enrollments.map((enr) => {
    const existing = recordMap.get(enr.studentId);
    return {
      studentId: enr.studentId,
      rollNo: enr.student.rollNo,
      name: enr.student.user.name,
      email: enr.student.user.email,
      batch: enr.student.batch,
      department: enr.student.department,
      isActive: enr.student.user.isActive,
      recordId: existing?.id || null,
      status: (existing?.status as AttendanceStatus) || "PRESENT",
      remarks: existing?.remarks || "",
    };
  });

  return {
    success: true,
    session: {
      id: existingSession.id,
      date: existingSession.date,
      startTime: existingSession.startTime,
      endTime: existingSession.endTime,
      room: existingSession.room,
      status: existingSession.status,
      verifiedAt: existingSession.verifiedAt,
      verifiedById: existingSession.verifiedById,
      className: existingSession.class.name,
      section: existingSession.class.section,
      subjectCode: existingSession.subject.code,
      subjectName: existingSession.subject.name,
      teacherName: existingSession.teacher.user.name,
    },
    isLocked: existingSession.verifiedAt !== null,
    rollCallItems,
  };
}

/**
 * 11. Get Filter Options for Attendance History
 * Dynamically resolves accessible classes, subjects, and students based on user role.
 */
export async function getAttendanceFilterOptions() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in to access attendance filters.");
  }

  const role = session.user.role;

  if (role === "STUDENT") {
    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!studentProfile) {
      return { classes: [], subjects: [], students: [] };
    }

    const enrollments = await db.classEnrollment.findMany({
      where: { studentId: studentProfile.id },
      include: {
        class: {
          include: {
            subject: true,
          },
        },
      },
    });

    const classes = enrollments.map((e) => ({
      id: e.class.id,
      name: e.class.name,
      section: e.class.section,
    }));

    const subjectMap = new Map<string, { id: string; code: string; name: string }>();
    enrollments.forEach((e) => {
      subjectMap.set(e.class.subject.id, {
        id: e.class.subject.id,
        code: e.class.subject.code,
        name: e.class.subject.name,
      });
    });

    return {
      classes,
      subjects: Array.from(subjectMap.values()),
      students: [], // Students cannot filter other students
    };
  }

  if (role === "TEACHER") {
    const teacherProfile = await db.teacherProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!teacherProfile) {
      return { classes: [], subjects: [], students: [] };
    }

    const assignments = await db.classTeacherAssignment.findMany({
      where: { teacherId: teacherProfile.id },
      include: {
        class: {
          include: {
            subject: true,
            enrollments: {
              include: {
                student: {
                  include: {
                    user: { select: { name: true, email: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const classes = assignments.map((a) => ({
      id: a.class.id,
      name: a.class.name,
      section: a.class.section,
    }));

    const subjectMap = new Map<string, { id: string; code: string; name: string }>();
    const studentMap = new Map<string, { id: string; rollNo: string; name: string }>();

    assignments.forEach((a) => {
      subjectMap.set(a.class.subject.id, {
        id: a.class.subject.id,
        code: a.class.subject.code,
        name: a.class.subject.name,
      });
      a.class.enrollments.forEach((enr) => {
        studentMap.set(enr.student.id, {
          id: enr.student.id,
          rollNo: enr.student.rollNo,
          name: enr.student.user.name,
        });
      });
    });

    return {
      classes,
      subjects: Array.from(subjectMap.values()),
      students: Array.from(studentMap.values()).sort((a, b) => a.rollNo.localeCompare(b.rollNo)),
    };
  }

  // ADMIN: Global access to all classes, subjects, and students
  const [classes, subjects, students] = await Promise.all([
    db.class.findMany({
      select: { id: true, name: true, section: true },
      orderBy: { name: "asc" },
    }),
    db.subject.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    }),
    db.studentProfile.findMany({
      where: { user: { isActive: true } },
      select: {
        id: true,
        rollNo: true,
        user: { select: { name: true } },
      },
      orderBy: { rollNo: "asc" },
      take: 200,
    }),
  ]);

  return {
    classes,
    subjects,
    students: students.map((s) => ({
      id: s.id,
      rollNo: s.rollNo,
      name: s.user.name,
    })),
  };
}

export interface AttendanceHistoryParams {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  classId?: string;
  subjectId?: string;
  studentId?: string;
  status?: AttendanceStatus | "ALL";
  search?: string;
}

/**
 * 12. Get Attendance History Records
 * Enforces strict multi-tenant role authorization:
 * - STUDENT: Locked to own student records only.
 * - TEACHER: Restricted to assigned class sections only.
 * - ADMIN: Complete institutional visibility.
 * Implements bounded pagination and indexed queries.
 */
export async function getAttendanceHistory(params?: AttendanceHistoryParams) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in to view attendance history.");
  }

  const {
    page = 1,
    pageSize = 15,
    startDate,
    endDate,
    classId,
    subjectId,
    studentId,
    status,
    search,
  } = params || {};

  const safePage = Math.max(1, page);
  const safePageSize = Math.min(50, Math.max(1, pageSize));
  const skip = (safePage - 1) * safePageSize;

  const where: Prisma.AttendanceRecordWhereInput = {};
  const classSessionWhere: Prisma.ClassSessionWhereInput = {};

  // Role Gate & Isolation
  if (session.user.role === "STUDENT") {
    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!studentProfile) {
      return {
        records: [],
        pagination: { total: 0, page: 1, pageSize: safePageSize, totalPages: 0 },
        summary: { total: 0, presentCount: 0, absentCount: 0, lateCount: 0, excusedCount: 0 },
      };
    }

    // Force studentId to self unconditionally
    where.studentId = studentProfile.id;
  } else if (session.user.role === "TEACHER") {
    const teacherProfile = await db.teacherProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!teacherProfile) {
      return {
        records: [],
        pagination: { total: 0, page: 1, pageSize: safePageSize, totalPages: 0 },
        summary: { total: 0, presentCount: 0, absentCount: 0, lateCount: 0, excusedCount: 0 },
      };
    }

    // Teacher can ONLY view records for classes they instruct
    classSessionWhere.class = {
      teachers: {
        some: {
          teacherId: teacherProfile.id,
        },
      },
    };

    if (studentId && studentId !== "all") {
      where.studentId = studentId;
    }
  } else {
    // Admin
    if (studentId && studentId !== "all") {
      where.studentId = studentId;
    }
  }

  // Date Range Filtering on Session Date
  if (startDate || endDate) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setUTCHours(0, 0, 0, 0);
      dateFilter.gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }
    classSessionWhere.date = dateFilter;
  }

  // Class Filter
  if (classId && classId !== "all") {
    classSessionWhere.classId = classId;
  }

  // Subject Filter
  if (subjectId && subjectId !== "all") {
    classSessionWhere.subjectId = subjectId;
  }

  // Status Filter
  if (status && status !== "ALL") {
    where.status = status;
  }

  // Text Search Filter (Student Name, Roll Number, or Email)
  if (search && search.trim()) {
    const query = search.trim();
    where.OR = [
      { student: { rollNo: { contains: query } } },
      { student: { user: { name: { contains: query } } } },
      { student: { user: { email: { contains: query } } } },
    ];
  }

  if (Object.keys(classSessionWhere).length > 0) {
    where.classSession = classSessionWhere;
  }

  // Query database with count & pagination in parallel
  const [total, records, presentCount, absentCount, lateCount, excusedCount] = await Promise.all([
    db.attendanceRecord.count({ where }),
    db.attendanceRecord.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                isActive: true,
              },
            },
          },
        },
        classSession: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                section: true,
              },
            },
            subject: {
              select: {
                id: true,
                code: true,
                name: true,
                credits: true,
              },
            },
            teacher: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ classSession: { date: "desc" } }, { student: { rollNo: "asc" } }],
      skip,
      take: safePageSize,
    }),
    db.attendanceRecord.count({ where: { ...where, status: "PRESENT" } }),
    db.attendanceRecord.count({ where: { ...where, status: "ABSENT" } }),
    db.attendanceRecord.count({ where: { ...where, status: "LATE" } }),
    db.attendanceRecord.count({ where: { ...where, status: "EXCUSED" } }),
  ]);

  return {
    records,
    pagination: {
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize),
    },
    summary: {
      total,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
    },
  };
}

/**
 * 13. Get Audit Trail for an Attendance Record
 * Strict role gate: Students are rejected; Teachers must instruct the class; Admins allowed.
 */
export async function getAttendanceRecordAuditHistory(recordId: string) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return { success: false, error: "Unauthorized: Please sign in." };
  }

  if (session.user.role === "STUDENT") {
    return { success: false, error: "Unauthorized: Students cannot access administrative audit trails." };
  }

  const record = await db.attendanceRecord.findUnique({
    where: { id: recordId },
    include: {
      classSession: {
        include: {
          class: {
            include: {
              teachers: { select: { teacherId: true } },
            },
          },
        },
      },
    },
  });

  if (!record) {
    return { success: false, error: "Attendance record not found." };
  }

  if (session.user.role === "TEACHER") {
    const teacherProfile = await db.teacherProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    const isAssigned = record.classSession.class.teachers.some(
      (t) => t.teacherId === teacherProfile?.id
    );

    if (!isAssigned) {
      return { success: false, error: "Unauthorized: You are not assigned to this class section." };
    }
  }

  const logs = await db.auditLog.findMany({
    where: {
      entity: "AttendanceRecord",
      entityId: recordId,
    },
    include: {
      performedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return { success: true, logs };
}

