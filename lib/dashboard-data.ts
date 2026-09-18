import { db } from "@/lib/db";

export async function getAdminDashboardData() {
  const [
    studentCount,
    teacherCount,
    classCount,
    subjectCount,
    currentTerm,
    thresholdSetting,
    recentAuditLogs,
  ] = await Promise.all([
    db.studentProfile.count(),
    db.teacherProfile.count(),
    db.class.count(),
    db.subject.count(),
    db.academicTerm.findFirst({ where: { isCurrent: true } }),
    db.systemSetting.findUnique({ where: { key: "MIN_ATTENDANCE_PERCENTAGE" } }),
    db.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        performedBy: {
          select: { name: true, email: true, role: true },
        },
      },
    }),
  ]);

  const minAttendanceThreshold = thresholdSetting
    ? parseFloat(thresholdSetting.value) || 75.0
    : 75.0;

  return {
    studentCount,
    teacherCount,
    classCount,
    subjectCount,
    currentTerm,
    minAttendanceThreshold,
    recentAuditLogs,
  };
}

export async function getTeacherDashboardData(userId: string) {
  const teacher = await db.teacherProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: { name: true, email: true, image: true },
      },
    },
  });

  if (!teacher) {
    return {
      teacher: null,
      assignedClasses: [],
      recentSessions: [],
    };
  }

  const [assignedClasses, recentSessions] = await Promise.all([
    db.classTeacherAssignment.findMany({
      where: { teacherId: teacher.id },
      include: {
        class: {
          include: {
            subject: true,
            term: true,
            _count: {
              select: {
                enrollments: true,
                classSessions: true,
              },
            },
          },
        },
      },
    }),
    db.classSession.findMany({
      where: { teacherId: teacher.id },
      include: {
        class: true,
        subject: true,
        _count: {
          select: { records: true },
        },
      },
      orderBy: { date: "desc" },
      take: 6,
    }),
  ]);

  return {
    teacher,
    assignedClasses,
    recentSessions,
  };
}

export async function getStudentDashboardData(userId: string) {
  const student = await db.studentProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: { name: true, email: true, image: true },
      },
    },
  });

  if (!student) {
    return {
      student: null,
      enrollments: [],
      attendanceRecords: [],
      stats: {
        totalRecords: 0,
        attendedCount: 0,
        percentage: null as number | null,
        minThreshold: 75.0,
        isDebarmentRisk: false,
      },
    };
  }

  const [thresholdSetting, enrollments, attendanceRecords] = await Promise.all([
    db.systemSetting.findUnique({ where: { key: "MIN_ATTENDANCE_PERCENTAGE" } }),
    db.classEnrollment.findMany({
      where: { studentId: student.id },
      include: {
        class: {
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
          },
        },
      },
    }),
    db.attendanceRecord.findMany({
      where: { studentId: student.id },
      include: {
        classSession: {
          include: {
            subject: true,
            teacher: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const minThreshold = thresholdSetting
    ? parseFloat(thresholdSetting.value) || 75.0
    : 75.0;

  const totalRecords = attendanceRecords.length;
  const attendedCount = attendanceRecords.filter(
    (r) => r.status === "PRESENT" || r.status === "LATE"
  ).length;

  const percentage =
    totalRecords > 0 ? parseFloat(((attendedCount / totalRecords) * 100).toFixed(1)) : null;

  const isDebarmentRisk = percentage !== null && percentage < minThreshold;

  return {
    student,
    enrollments,
    attendanceRecords,
    stats: {
      totalRecords,
      attendedCount,
      percentage,
      minThreshold,
      isDebarmentRisk,
    },
  };
}
