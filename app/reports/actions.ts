"use server";

import { db } from "@/lib/db";
import { getServerAuthSession } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export interface AttendanceAnalyticsParams {
  timeframe?: "7d" | "30d" | "90d" | "all";
  classId?: string;
  subjectId?: string;
}

export interface StatusDistributionItem {
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  count: number;
  percentage: number;
  color: string;
}

export interface SubjectAttendanceItem {
  subjectId: string;
  code: string;
  name: string;
  totalSessions: number;
  totalRecords: number;
  attendedRecords: number;
  percentage: number | null;
}

export interface ClassAttendanceItem {
  classId: string;
  className: string;
  section: string;
  subjectCode: string;
  totalSessions: number;
  totalRecords: number;
  attendedRecords: number;
  percentage: number | null;
}

export interface TimelineTrendPoint {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "Sep 12"
  totalSessions: number;
  totalRecords: number;
  attendedRecords: number;
  percentage: number | null;
}

export interface DebarmentRiskStudent {
  studentId: string;
  rollNo: string;
  name: string;
  email: string;
  department: string;
  batch: string;
  className: string;
  totalSessions: number;
  attendedSessions: number;
  absentSessions: number;
  percentage: number;
  sessionsNeededToRecover: number;
}

export interface AttendanceAnalyticsResult {
  overallPercentage: number | null;
  threshold: number;
  totalSessionsHeld: number;
  totalRecordsAudited: number;
  attendedCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  statusDistribution: StatusDistributionItem[];
  subjectWise: SubjectAttendanceItem[];
  classWise: ClassAttendanceItem[];
  timelineTrends: TimelineTrendPoint[];
  debarmentRiskStudents: DebarmentRiskStudent[];
  role: string;
  filterOptions: {
    classes: Array<{ id: string; name: string; section: string }>;
    subjects: Array<{ id: string; code: string; name: string }>;
  };
}

export interface StudentReportItem {
  student: {
    id: string;
    rollNo: string;
    name: string;
    email: string;
    department: string;
    batch: string;
  };
  summary: {
    totalSessions: number;
    attendedSessions: number;
    absentSessions: number;
    lateSessions: number;
    excusedSessions: number;
    overallPercentage: number | null;
    threshold: number;
    isBelowThreshold: boolean;
  };
  subjectBreakdown: Array<{
    subjectId: string;
    code: string;
    name: string;
    totalSessions: number;
    attendedSessions: number;
    absentSessions: number;
    lateSessions: number;
    excusedSessions: number;
    percentage: number | null;
  }>;
  records: Array<{
    id: string;
    date: string;
    status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
    remarks: string | null;
    subjectCode: string;
    subjectName: string;
    className: string;
    section: string;
    startTime: string | null;
    endTime: string | null;
  }>;
}

export interface ClassReportItem {
  classInfo: {
    id: string;
    name: string;
    section: string;
    subjectCode: string;
    subjectName: string;
    teacherName: string;
  };
  summary: {
    totalSessions: number;
    enrolledStudentsCount: number;
    totalRecords: number;
    overallPercentage: number | null;
    threshold: number;
    studentsBelowThresholdCount: number;
  };
  students: Array<{
    studentId: string;
    rollNo: string;
    name: string;
    email: string;
    department: string;
    batch: string;
    totalSessions: number;
    attendedSessions: number;
    absentSessions: number;
    lateSessions: number;
    excusedSessions: number;
    percentage: number | null;
    isBelowThreshold: boolean;
  }>;
  sessions: Array<{
    id: string;
    date: string;
    startTime: string | null;
    endTime: string | null;
    status: string;
    teacherName: string;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
    totalCount: number;
    percentage: number | null;
  }>;
}

export interface SubjectReportItem {
  subjectInfo: {
    id: string;
    code: string;
    name: string;
    department: string;
    credits: number;
  };
  summary: {
    totalClasses: number;
    totalSessions: number;
    totalRecords: number;
    overallPercentage: number | null;
    threshold: number;
    studentsBelowThresholdCount: number;
  };
  classesBreakdown: Array<{
    classId: string;
    name: string;
    section: string;
    teacherName: string;
    enrolledStudents: number;
    totalSessions: number;
    attendedRecords: number;
    totalRecords: number;
    percentage: number | null;
  }>;
  studentsAtRisk: Array<{
    studentId: string;
    rollNo: string;
    name: string;
    className: string;
    section: string;
    attendedSessions: number;
    totalSessions: number;
    percentage: number;
  }>;
}

export interface ReportFilterOptions {
  classes: Array<{ id: string; name: string; section: string; subjectCode: string }>;
  subjects: Array<{ id: string; code: string; name: string }>;
  students: Array<{ id: string; rollNo: string; name: string; className?: string }>;
  role: string;
  defaultStudentId?: string;
}

/**
 * Calculates comprehensive attendance analytics based on live database data.
 * Adheres strictly to multi-tenant role authorization:
 * - ADMIN: System-wide analytics across all classes and cohorts.
 * - TEACHER: Restricted exclusively to assigned class sections.
 * - STUDENT: Scoped to courses the student is enrolled in, showing personal attendance metrics.
 */
export async function getAttendanceAnalytics(
  params?: AttendanceAnalyticsParams
): Promise<AttendanceAnalyticsResult> {
  const session = await getServerAuthSession();
  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in to view attendance analytics.");
  }

  const role = session.user.role;
  const { timeframe = "30d", classId, subjectId } = params || {};

  // 1. Resolve Timeframe Boundary Date
  let startDate: Date | undefined;
  const now = new Date();

  if (timeframe === "7d") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (timeframe === "30d") {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (timeframe === "90d") {
    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  }

  // 2. Resolve Threshold Setting
  const thresholdSetting = await db.systemSetting.findUnique({
    where: { key: "MIN_ATTENDANCE_PERCENTAGE" },
  });
  const threshold = thresholdSetting ? parseFloat(thresholdSetting.value) : 75.0;

  // 3. Build Role Scopes & Filter Options
  let allowedClassIds: string[] | undefined;
  let currentStudentProfileId: string | undefined;

  let filterClasses: Array<{ id: string; name: string; section: string }> = [];
  let filterSubjects: Array<{ id: string; code: string; name: string }> = [];

  if (role === "STUDENT") {
    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!studentProfile) {
      return getEmptyAnalyticsResult(threshold, role);
    }
    currentStudentProfileId = studentProfile.id;

    const enrollments = await db.classEnrollment.findMany({
      where: { studentId: studentProfile.id },
      include: {
        class: {
          include: { subject: true },
        },
      },
    });

    allowedClassIds = enrollments.map((e) => e.classId);
    filterClasses = enrollments.map((e) => ({
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
    filterSubjects = Array.from(subjectMap.values());
  } else if (role === "TEACHER") {
    const teacherProfile = await db.teacherProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!teacherProfile) {
      return getEmptyAnalyticsResult(threshold, role);
    }

    const assignments = await db.classTeacherAssignment.findMany({
      where: { teacherId: teacherProfile.id },
      include: {
        class: {
          include: { subject: true },
        },
      },
    });

    allowedClassIds = assignments.map((a) => a.classId);
    filterClasses = assignments.map((a) => ({
      id: a.class.id,
      name: a.class.name,
      section: a.class.section,
    }));

    const subjectMap = new Map<string, { id: string; code: string; name: string }>();
    assignments.forEach((a) => {
      subjectMap.set(a.class.subject.id, {
        id: a.class.subject.id,
        code: a.class.subject.code,
        name: a.class.subject.name,
      });
    });
    filterSubjects = Array.from(subjectMap.values());
  } else {
    // Admin: full access
    const [allClasses, allSubjects] = await Promise.all([
      db.class.findMany({
        select: { id: true, name: true, section: true },
        orderBy: { name: "asc" },
      }),
      db.subject.findMany({
        select: { id: true, code: true, name: true },
        orderBy: { code: "asc" },
      }),
    ]);
    filterClasses = allClasses;
    filterSubjects = allSubjects;
  }

  // 4. Session Where Condition
  const sessionWhere: Prisma.ClassSessionWhereInput = {
    status: "COMPLETED",
  };

  if (startDate) {
    sessionWhere.date = { gte: startDate };
  }

  if (allowedClassIds) {
    sessionWhere.classId = { in: allowedClassIds };
  }

  if (classId && classId !== "all") {
    if (allowedClassIds && !allowedClassIds.includes(classId)) {
      return getEmptyAnalyticsResult(threshold, role, filterClasses, filterSubjects);
    }
    sessionWhere.classId = classId;
  }

  if (subjectId && subjectId !== "all") {
    sessionWhere.subjectId = subjectId;
  }

  // 5. Attendance Record Where Condition
  const recordWhere: Prisma.AttendanceRecordWhereInput = {
    classSession: sessionWhere,
  };

  if (role === "STUDENT" && currentStudentProfileId) {
    recordWhere.studentId = currentStudentProfileId;
  }

  // 6. Fetch Completed Sessions & Records with Projections
  const [sessions, records] = await Promise.all([
    db.classSession.findMany({
      where: sessionWhere,
      select: {
        id: true,
        date: true,
        classId: true,
        subjectId: true,
        class: { select: { id: true, name: true, section: true } },
        subject: { select: { id: true, code: true, name: true } },
      },
      orderBy: { date: "asc" },
    }),
    db.attendanceRecord.findMany({
      where: recordWhere,
      select: {
        id: true,
        status: true,
        studentId: true,
        classSessionId: true,
        student: {
          select: {
            id: true,
            rollNo: true,
            batch: true,
            department: true,
            user: { select: { name: true, email: true } },
          },
        },
        classSession: {
          select: {
            id: true,
            date: true,
            classId: true,
            subjectId: true,
            class: { select: { id: true, name: true, section: true } },
            subject: { select: { id: true, code: true, name: true } },
          },
        },
      },
    }),
  ]);

  const totalSessionsHeld = sessions.length;
  const totalRecordsAudited = records.length;

  if (totalRecordsAudited === 0) {
    return {
      overallPercentage: null,
      threshold,
      totalSessionsHeld,
      totalRecordsAudited: 0,
      attendedCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      statusDistribution: [
        { status: "PRESENT", count: 0, percentage: 0, color: "#10b981" },
        { status: "ABSENT", count: 0, percentage: 0, color: "#f43f5e" },
        { status: "LATE", count: 0, percentage: 0, color: "#f59e0b" },
        { status: "EXCUSED", count: 0, percentage: 0, color: "#0ea5e9" },
      ],
      subjectWise: [],
      classWise: [],
      timelineTrends: [],
      debarmentRiskStudents: [],
      role,
      filterOptions: {
        classes: filterClasses,
        subjects: filterSubjects,
      },
    };
  }

  // 7. Calculate Status Distribution Counts & Overall Percentage
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;

  records.forEach((r) => {
    if (r.status === "PRESENT") presentCount++;
    else if (r.status === "ABSENT") absentCount++;
    else if (r.status === "LATE") lateCount++;
    else if (r.status === "EXCUSED") excusedCount++;
  });

  const attendedCount = presentCount + lateCount + excusedCount;
  const overallPercentage =
    totalRecordsAudited > 0
      ? Number(((attendedCount / totalRecordsAudited) * 100).toFixed(1))
      : null;

  const statusDistribution: StatusDistributionItem[] = [
    {
      status: "PRESENT",
      count: presentCount,
      percentage: Number(((presentCount / totalRecordsAudited) * 100).toFixed(1)),
      color: "#10b981", // emerald-500
    },
    {
      status: "ABSENT",
      count: absentCount,
      percentage: Number(((absentCount / totalRecordsAudited) * 100).toFixed(1)),
      color: "#f43f5e", // rose-500
    },
    {
      status: "LATE",
      count: lateCount,
      percentage: Number(((lateCount / totalRecordsAudited) * 100).toFixed(1)),
      color: "#f59e0b", // amber-500
    },
    {
      status: "EXCUSED",
      count: excusedCount,
      percentage: Number(((excusedCount / totalRecordsAudited) * 100).toFixed(1)),
      color: "#0ea5e9", // sky-500
    },
  ];

  // 8. Subject-Wise Attendance Aggregation
  const subjectAgg = new Map<
    string,
    {
      subjectId: string;
      code: string;
      name: string;
      sessionsSet: Set<string>;
      totalRecords: number;
      attendedRecords: number;
    }
  >();

  records.forEach((r) => {
    const sub = r.classSession.subject;
    if (!subjectAgg.has(sub.id)) {
      subjectAgg.set(sub.id, {
        subjectId: sub.id,
        code: sub.code,
        name: sub.name,
        sessionsSet: new Set(),
        totalRecords: 0,
        attendedRecords: 0,
      });
    }
    const current = subjectAgg.get(sub.id)!;
    current.sessionsSet.add(r.classSessionId);
    current.totalRecords++;
    if (r.status === "PRESENT" || r.status === "LATE" || r.status === "EXCUSED") {
      current.attendedRecords++;
    }
  });

  const subjectWise: SubjectAttendanceItem[] = Array.from(subjectAgg.values())
    .map((s) => ({
      subjectId: s.subjectId,
      code: s.code,
      name: s.name,
      totalSessions: s.sessionsSet.size,
      totalRecords: s.totalRecords,
      attendedRecords: s.attendedRecords,
      percentage:
        s.totalRecords > 0
          ? Number(((s.attendedRecords / s.totalRecords) * 100).toFixed(1))
          : null,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));

  // 9. Class-Wise Attendance Aggregation
  const classAgg = new Map<
    string,
    {
      classId: string;
      className: string;
      section: string;
      subjectCode: string;
      sessionsSet: Set<string>;
      totalRecords: number;
      attendedRecords: number;
    }
  >();

  records.forEach((r) => {
    const cls = r.classSession.class;
    const sub = r.classSession.subject;
    if (!classAgg.has(cls.id)) {
      classAgg.set(cls.id, {
        classId: cls.id,
        className: cls.name,
        section: cls.section,
        subjectCode: sub.code,
        sessionsSet: new Set(),
        totalRecords: 0,
        attendedRecords: 0,
      });
    }
    const current = classAgg.get(cls.id)!;
    current.sessionsSet.add(r.classSessionId);
    current.totalRecords++;
    if (r.status === "PRESENT" || r.status === "LATE" || r.status === "EXCUSED") {
      current.attendedRecords++;
    }
  });

  const classWise: ClassAttendanceItem[] = Array.from(classAgg.values())
    .map((c) => ({
      classId: c.classId,
      className: c.className,
      section: c.section,
      subjectCode: c.subjectCode,
      totalSessions: c.sessionsSet.size,
      totalRecords: c.totalRecords,
      attendedRecords: c.attendedRecords,
      percentage:
        c.totalRecords > 0
          ? Number(((c.attendedRecords / c.totalRecords) * 100).toFixed(1))
          : null,
    }))
    .sort((a, b) => a.className.localeCompare(b.className));

  // 10. Longitudinal Attendance Trends (Timeline by Day)
  const timelineAgg = new Map<
    string,
    {
      dateStr: string;
      label: string;
      sessionsSet: Set<string>;
      totalRecords: number;
      attendedRecords: number;
    }
  >();

  records.forEach((r) => {
    const d = new Date(r.classSession.date);
    const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
    const label = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);

    if (!timelineAgg.has(dateStr)) {
      timelineAgg.set(dateStr, {
        dateStr,
        label,
        sessionsSet: new Set(),
        totalRecords: 0,
        attendedRecords: 0,
      });
    }

    const point = timelineAgg.get(dateStr)!;
    point.sessionsSet.add(r.classSessionId);
    point.totalRecords++;
    if (r.status === "PRESENT" || r.status === "LATE" || r.status === "EXCUSED") {
      point.attendedRecords++;
    }
  });

  const timelineTrends: TimelineTrendPoint[] = Array.from(timelineAgg.keys())
    .sort()
    .map((dateStr) => {
      const p = timelineAgg.get(dateStr)!;
      return {
        date: dateStr,
        label: p.label,
        totalSessions: p.sessionsSet.size,
        totalRecords: p.totalRecords,
        attendedRecords: p.attendedRecords,
        percentage:
          p.totalRecords > 0
            ? Number(((p.attendedRecords / p.totalRecords) * 100).toFixed(1))
            : null,
      };
    });

  // 11. Students Below Threshold (< 75.0% by default)
  // For students, this assesses whether they are at debarment risk.
  // For teachers & admins, this flags all cohort students needing recovery.
  const studentAgg = new Map<
    string,
    {
      studentId: string;
      rollNo: string;
      name: string;
      email: string;
      department: string;
      batch: string;
      className: string;
      totalSessions: number;
      attendedSessions: number;
      absentSessions: number;
    }
  >();

  records.forEach((r) => {
    const key = r.studentId;
    if (!studentAgg.has(key)) {
      studentAgg.set(key, {
        studentId: r.student.id,
        rollNo: r.student.rollNo,
        name: r.student.user.name,
        email: r.student.user.email,
        department: r.student.department,
        batch: r.student.batch,
        className: `${r.classSession.class.name} (${r.classSession.class.section})`,
        totalSessions: 0,
        attendedSessions: 0,
        absentSessions: 0,
      });
    }

    const current = studentAgg.get(key)!;
    current.totalSessions++;
    if (r.status === "PRESENT" || r.status === "LATE" || r.status === "EXCUSED") {
      current.attendedSessions++;
    } else {
      current.absentSessions++;
    }
  });

  const debarmentRiskStudents: DebarmentRiskStudent[] = [];

  studentAgg.forEach((st) => {
    if (st.totalSessions > 0) {
      const pct = Number(((st.attendedSessions / st.totalSessions) * 100).toFixed(1));
      if (pct < threshold) {
        // Recovery calculation:
        // (attended + X) / (total + X) >= (threshold / 100)
        // attended + X >= 0.75 * total + 0.75 * X
        // 0.25 * X >= 0.75 * total - attended
        // X >= (0.75 * total - attended) / 0.25
        const targetDecimal = threshold / 100;
        const deficit = targetDecimal * st.totalSessions - st.attendedSessions;
        const needed = deficit > 0 ? Math.ceil(deficit / (1 - targetDecimal)) : 0;

        debarmentRiskStudents.push({
          ...st,
          percentage: pct,
          sessionsNeededToRecover: needed,
        });
      }
    }
  });

  debarmentRiskStudents.sort((a, b) => a.percentage - b.percentage);

  return {
    overallPercentage,
    threshold,
    totalSessionsHeld,
    totalRecordsAudited,
    attendedCount,
    absentCount,
    lateCount,
    excusedCount,
    statusDistribution,
    subjectWise,
    classWise,
    timelineTrends,
    debarmentRiskStudents,
    role,
    filterOptions: {
      classes: filterClasses,
      subjects: filterSubjects,
    },
  };
}

function getEmptyAnalyticsResult(
  threshold: number,
  role: string,
  classes: Array<{ id: string; name: string; section: string }> = [],
  subjects: Array<{ id: string; code: string; name: string }> = []
): AttendanceAnalyticsResult {
  return {
    overallPercentage: null,
    threshold,
    totalSessionsHeld: 0,
    totalRecordsAudited: 0,
    attendedCount: 0,
    absentCount: 0,
    lateCount: 0,
    excusedCount: 0,
    statusDistribution: [
      { status: "PRESENT", count: 0, percentage: 0, color: "#10b981" },
      { status: "ABSENT", count: 0, percentage: 0, color: "#f43f5e" },
      { status: "LATE", count: 0, percentage: 0, color: "#f59e0b" },
      { status: "EXCUSED", count: 0, percentage: 0, color: "#0ea5e9" },
    ],
    subjectWise: [],
    classWise: [],
    timelineTrends: [],
    debarmentRiskStudents: [],
    role,
    filterOptions: {
      classes,
      subjects,
    },
  };
}

/**
 * Generates an in-depth Student Attendance Report.
 * - STUDENT role: Enforces query for self only.
 * - TEACHER role: Permitted only if the student is enrolled in a class assigned to teacher.
 * - ADMIN role: Global access.
 */
export async function generateStudentReport(params: {
  studentId?: string;
  startDate?: string;
  endDate?: string;
  subjectId?: string;
}): Promise<StudentReportItem> {
  const session = await getServerAuthSession();
  if (!session?.user) {
    throw new Error("Unauthorized: Please log in to access attendance reports.");
  }

  const role = session.user.role;
  let targetStudentId = params.studentId;

  // 1. Role Authorization Check
  if (role === "STUDENT") {
    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!studentProfile) {
      throw new Error("Student profile record not found.");
    }
    // Students can NEVER query other students
    targetStudentId = studentProfile.id;
  } else if (!targetStudentId) {
    throw new Error("Student ID is required to generate a student attendance report.");
  }

  if (role === "TEACHER") {
    const teacherProfile = await db.teacherProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!teacherProfile) {
      throw new Error("Teacher profile record not found.");
    }

    // Verify student is in at least one class assigned to this teacher
    const teacherClasses = await db.classTeacherAssignment.findMany({
      where: { teacherId: teacherProfile.id },
      select: { classId: true },
    });
    const teacherClassIds = teacherClasses.map((tc) => tc.classId);

    const enrollment = await db.classEnrollment.findFirst({
      where: {
        studentId: targetStudentId,
        classId: { in: teacherClassIds },
      },
    });

    if (!enrollment) {
      throw new Error("Unauthorized: You do not have permission to access reports for this student.");
    }
  }

  // 2. Fetch Student Profile
  const student = await db.studentProfile.findUnique({
    where: { id: targetStudentId },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  if (!student) {
    throw new Error("Target student not found.");
  }

  // 3. Resolve Date-Range
  const sessionWhere: Prisma.ClassSessionWhereInput = {
    status: "COMPLETED",
  };

  if (params.startDate || params.endDate) {
    sessionWhere.date = {};
    if (params.startDate) {
      sessionWhere.date.gte = new Date(params.startDate);
    }
    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      sessionWhere.date.lte = end;
    }
  }

  if (params.subjectId && params.subjectId !== "all") {
    sessionWhere.subjectId = params.subjectId;
  }

  // Teacher scoping constraint on sessions
  if (role === "TEACHER") {
    const teacherProfile = await db.teacherProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (teacherProfile) {
      const teacherAssignments = await db.classTeacherAssignment.findMany({
        where: { teacherId: teacherProfile.id },
        select: { classId: true },
      });
      sessionWhere.classId = { in: teacherAssignments.map((a) => a.classId) };
    }
  }

  // 4. Resolve Threshold
  const thresholdSetting = await db.systemSetting.findUnique({
    where: { key: "MIN_ATTENDANCE_PERCENTAGE" },
  });
  const threshold = thresholdSetting ? parseFloat(thresholdSetting.value) : 75.0;

  // 5. Query Records
  const records = await db.attendanceRecord.findMany({
    where: {
      studentId: targetStudentId,
      classSession: sessionWhere,
    },
    include: {
      classSession: {
        include: {
          class: true,
          subject: true,
        },
      },
    },
    orderBy: {
      classSession: {
        date: "desc",
      },
    },
  });

  // 6. Aggregate Counts & Percentages
  let attendedCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;

  const subjectMap = new Map<
    string,
    {
      subjectId: string;
      code: string;
      name: string;
      total: number;
      attended: number;
      absent: number;
      late: number;
      excused: number;
    }
  >();

  records.forEach((r) => {
    const sub = r.classSession.subject;
    if (!subjectMap.has(sub.id)) {
      subjectMap.set(sub.id, {
        subjectId: sub.id,
        code: sub.code,
        name: sub.name,
        total: 0,
        attended: 0,
        absent: 0,
        late: 0,
        excused: 0,
      });
    }

    const s = subjectMap.get(sub.id)!;
    s.total++;

    if (r.status === "PRESENT") {
      attendedCount++;
      s.attended++;
    } else if (r.status === "LATE") {
      lateCount++;
      attendedCount++;
      s.late++;
      s.attended++;
    } else if (r.status === "EXCUSED") {
      excusedCount++;
      attendedCount++;
      s.excused++;
      s.attended++;
    } else {
      absentCount++;
      s.absent++;
    }
  });

  const totalSessions = records.length;
  const overallPercentage =
    totalSessions > 0 ? Number(((attendedCount / totalSessions) * 100).toFixed(1)) : null;

  const subjectBreakdown = Array.from(subjectMap.values())
    .map((s) => ({
      subjectId: s.subjectId,
      code: s.code,
      name: s.name,
      totalSessions: s.total,
      attendedSessions: s.attended,
      absentSessions: s.absent,
      lateSessions: s.late,
      excusedSessions: s.excused,
      percentage: s.total > 0 ? Number(((s.attended / s.total) * 100).toFixed(1)) : null,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));

  const formattedRecords = records.map((r) => ({
    id: r.id,
    date: new Date(r.classSession.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    status: r.status as "PRESENT" | "ABSENT" | "LATE" | "EXCUSED",
    remarks: r.remarks,
    subjectCode: r.classSession.subject.code,
    subjectName: r.classSession.subject.name,
    className: r.classSession.class.name,
    section: r.classSession.class.section,
    startTime: r.classSession.startTime,
    endTime: r.classSession.endTime,
  }));

  return {
    student: {
      id: student.id,
      rollNo: student.rollNo,
      name: student.user.name,
      email: student.user.email,
      department: student.department,
      batch: student.batch,
    },
    summary: {
      totalSessions,
      attendedSessions: attendedCount,
      absentSessions: absentCount,
      lateSessions: lateCount,
      excusedSessions: excusedCount,
      overallPercentage,
      threshold,
      isBelowThreshold: overallPercentage !== null && overallPercentage < threshold,
    },
    subjectBreakdown,
    records: formattedRecords,
  };
}

/**
 * Generates an in-depth Class Attendance Report.
 * - TEACHER: Permitted only for assigned classes.
 * - ADMIN: Global access.
 * - STUDENT: Unauthorized.
 */
export async function generateClassReport(params: {
  classId: string;
  startDate?: string;
  endDate?: string;
}): Promise<ClassReportItem> {
  const session = await getServerAuthSession();
  if (!session?.user) {
    throw new Error("Unauthorized: Please log in to access class reports.");
  }

  const role = session.user.role;
  if (role === "STUDENT") {
    throw new Error("Unauthorized: Students cannot generate class-wide attendance reports.");
  }

  if (role === "TEACHER") {
    const teacherProfile = await db.teacherProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!teacherProfile) {
      throw new Error("Teacher profile record not found.");
    }
    const assignment = await db.classTeacherAssignment.findUnique({
      where: {
        classId_teacherId: {
          classId: params.classId,
          teacherId: teacherProfile.id,
        },
      },
    });
    if (!assignment) {
      throw new Error("Unauthorized: You are not assigned to instruct this class section.");
    }
  }

  // 1. Fetch Class Info
  const classItem = await db.class.findUnique({
    where: { id: params.classId },
    include: {
      subject: true,
      teachers: {
        include: {
          teacher: {
            include: { user: { select: { name: true } } },
          },
        },
      },
      enrollments: {
        include: {
          student: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
      },
    },
  });

  if (!classItem) {
    throw new Error("Class section not found.");
  }

  // 2. Date Boundaries for Sessions
  const sessionWhere: Prisma.ClassSessionWhereInput = {
    classId: params.classId,
    status: "COMPLETED",
  };

  if (params.startDate || params.endDate) {
    sessionWhere.date = {};
    if (params.startDate) {
      sessionWhere.date.gte = new Date(params.startDate);
    }
    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      sessionWhere.date.lte = end;
    }
  }

  // 3. Resolve Threshold
  const thresholdSetting = await db.systemSetting.findUnique({
    where: { key: "MIN_ATTENDANCE_PERCENTAGE" },
  });
  const threshold = thresholdSetting ? parseFloat(thresholdSetting.value) : 75.0;

  // 4. Query Sessions and Records
  const sessions = await db.classSession.findMany({
    where: sessionWhere,
    include: {
      teacher: { include: { user: { select: { name: true } } } },
      records: true,
    },
    orderBy: { date: "asc" },
  });

  // 5. Aggregate Per Student
  const enrolledStudents = classItem.enrollments.map((e) => e.student);
  const studentMap = new Map<
    string,
    {
      studentId: string;
      rollNo: string;
      name: string;
      email: string;
      department: string;
      batch: string;
      total: number;
      attended: number;
      absent: number;
      late: number;
      excused: number;
    }
  >();

  enrolledStudents.forEach((st) => {
    studentMap.set(st.id, {
      studentId: st.id,
      rollNo: st.rollNo,
      name: st.user.name,
      email: st.user.email,
      department: st.department,
      batch: st.batch,
      total: 0,
      attended: 0,
      absent: 0,
      late: 0,
      excused: 0,
    });
  });

  let totalRecords = 0;
  let totalAttendedRecords = 0;

  const formattedSessions = sessions.map((sess) => {
    let sessPresent = 0;
    let sessAbsent = 0;
    let sessLate = 0;
    let sessExcused = 0;

    sess.records.forEach((rec) => {
      totalRecords++;
      const s = studentMap.get(rec.studentId);
      if (s) {
        s.total++;
        if (rec.status === "PRESENT") {
          s.attended++;
          sessPresent++;
          totalAttendedRecords++;
        } else if (rec.status === "LATE") {
          s.late++;
          s.attended++;
          sessLate++;
          totalAttendedRecords++;
        } else if (rec.status === "EXCUSED") {
          s.excused++;
          s.attended++;
          sessExcused++;
          totalAttendedRecords++;
        } else {
          s.absent++;
          sessAbsent++;
        }
      }
    });

    const sessionTotal = sessPresent + sessAbsent + sessLate + sessExcused;
    const sessionAttended = sessPresent + sessLate + sessExcused;

    return {
      id: sess.id,
      date: new Date(sess.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      startTime: sess.startTime,
      endTime: sess.endTime,
      status: sess.status,
      teacherName: sess.teacher?.user?.name || "Faculty",
      presentCount: sessPresent,
      absentCount: sessAbsent,
      lateCount: sessLate,
      excusedCount: sessExcused,
      totalCount: sessionTotal,
      percentage:
        sessionTotal > 0
          ? Number(((sessionAttended / sessionTotal) * 100).toFixed(1))
          : null,
    };
  });

  let studentsBelowThresholdCount = 0;
  const students = Array.from(studentMap.values())
    .map((s) => {
      const pct =
        s.total > 0 ? Number(((s.attended / s.total) * 100).toFixed(1)) : null;
      const isBelow = pct !== null && pct < threshold;
      if (isBelow) {
        studentsBelowThresholdCount++;
      }
      return {
        studentId: s.studentId,
        rollNo: s.rollNo,
        name: s.name,
        email: s.email,
        department: s.department,
        batch: s.batch,
        totalSessions: s.total,
        attendedSessions: s.attended,
        absentSessions: s.absent,
        lateSessions: s.late,
        excusedSessions: s.excused,
        percentage: pct,
        isBelowThreshold: isBelow,
      };
    })
    .sort((a, b) => a.rollNo.localeCompare(b.rollNo));

  const overallPercentage =
    totalRecords > 0
      ? Number(((totalAttendedRecords / totalRecords) * 100).toFixed(1))
      : null;

  return {
    classInfo: {
      id: classItem.id,
      name: classItem.name,
      section: classItem.section,
      subjectCode: classItem.subject.code,
      subjectName: classItem.subject.name,
      teacherName: classItem.teachers[0]?.teacher?.user?.name || "Unassigned",
    },
    summary: {
      totalSessions: sessions.length,
      enrolledStudentsCount: enrolledStudents.length,
      totalRecords,
      overallPercentage,
      threshold,
      studentsBelowThresholdCount,
    },
    students,
    sessions: formattedSessions,
  };
}

/**
 * Generates an in-depth Subject Attendance Report.
 * - TEACHER: Permitted for subjects they teach.
 * - ADMIN: Global access.
 * - STUDENT: Unauthorized.
 */
export async function generateSubjectReport(params: {
  subjectId: string;
  classId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<SubjectReportItem> {
  const session = await getServerAuthSession();
  if (!session?.user) {
    throw new Error("Unauthorized: Please log in to access subject reports.");
  }

  const role = session.user.role;
  if (role === "STUDENT") {
    throw new Error("Unauthorized: Students cannot generate subject reports.");
  }

  if (role === "TEACHER") {
    const teacherProfile = await db.teacherProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!teacherProfile) {
      throw new Error("Teacher profile record not found.");
    }
    const assignment = await db.classTeacherAssignment.findFirst({
      where: {
        teacherId: teacherProfile.id,
        class: { subjectId: params.subjectId },
      },
    });
    if (!assignment) {
      throw new Error("Unauthorized: You do not teach classes offering this subject.");
    }
  }

  // 1. Fetch Subject Info
  const subject = await db.subject.findUnique({
    where: { id: params.subjectId },
  });
  if (!subject) {
    throw new Error("Subject not found.");
  }

  // 2. Resolve Threshold
  const thresholdSetting = await db.systemSetting.findUnique({
    where: { key: "MIN_ATTENDANCE_PERCENTAGE" },
  });
  const threshold = thresholdSetting ? parseFloat(thresholdSetting.value) : 75.0;

  // 3. Resolve Session Query
  const sessionWhere: Prisma.ClassSessionWhereInput = {
    subjectId: params.subjectId,
    status: "COMPLETED",
  };

  if (params.classId && params.classId !== "all") {
    sessionWhere.classId = params.classId;
  }

  if (role === "TEACHER") {
    const teacherProfile = await db.teacherProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (teacherProfile) {
      const assignments = await db.classTeacherAssignment.findMany({
        where: { teacherId: teacherProfile.id },
        select: { classId: true },
      });
      sessionWhere.classId = { in: assignments.map((a) => a.classId) };
    }
  }

  if (params.startDate || params.endDate) {
    sessionWhere.date = {};
    if (params.startDate) {
      sessionWhere.date.gte = new Date(params.startDate);
    }
    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      sessionWhere.date.lte = end;
    }
  }

  // 4. Query Classes Offering this Subject
  const classWhere: Prisma.ClassWhereInput = {
    subjectId: params.subjectId,
  };
  if (params.classId && params.classId !== "all") {
    classWhere.id = params.classId;
  }

  const classes = await db.class.findMany({
    where: classWhere,
    include: {
      teachers: {
        include: { teacher: { include: { user: { select: { name: true } } } } },
      },
      enrollments: true,
    },
  });

  // 5. Query Records for Subject
  const records = await db.attendanceRecord.findMany({
    where: {
      classSession: sessionWhere,
    },
    include: {
      classSession: {
        include: {
          class: true,
        },
      },
      student: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
  });

  // 6. Breakdown by Class Section
  const classBreakdownMap = new Map<
    string,
    {
      classId: string;
      name: string;
      section: string;
      teacherName: string;
      enrolledStudents: number;
      sessionsSet: Set<string>;
      attendedRecords: number;
      totalRecords: number;
    }
  >();

  classes.forEach((c) => {
    classBreakdownMap.set(c.id, {
      classId: c.id,
      name: c.name,
      section: c.section,
      teacherName: c.teachers[0]?.teacher?.user?.name || "Unassigned",
      enrolledStudents: c.enrollments.length,
      sessionsSet: new Set(),
      attendedRecords: 0,
      totalRecords: 0,
    });
  });

  // Also accumulate student attendance across this subject
  const studentMap = new Map<
    string,
    {
      studentId: string;
      rollNo: string;
      name: string;
      className: string;
      section: string;
      attended: number;
      total: number;
    }
  >();

  let totalAttended = 0;
  const allSessionsSet = new Set<string>();

  records.forEach((r) => {
    allSessionsSet.add(r.classSessionId);
    const cb = classBreakdownMap.get(r.classSession.classId);
    if (cb) {
      cb.sessionsSet.add(r.classSessionId);
      cb.totalRecords++;
      if (r.status === "PRESENT" || r.status === "LATE" || r.status === "EXCUSED") {
        cb.attendedRecords++;
        totalAttended++;
      }
    }

    if (!studentMap.has(r.studentId)) {
      studentMap.set(r.studentId, {
        studentId: r.student.id,
        rollNo: r.student.rollNo,
        name: r.student.user.name,
        className: r.classSession.class.name,
        section: r.classSession.class.section,
        attended: 0,
        total: 0,
      });
    }

    const st = studentMap.get(r.studentId)!;
    st.total++;
    if (r.status === "PRESENT" || r.status === "LATE" || r.status === "EXCUSED") {
      st.attended++;
    }
  });

  const classesBreakdown = Array.from(classBreakdownMap.values()).map((c) => ({
    classId: c.classId,
    name: c.name,
    section: c.section,
    teacherName: c.teacherName,
    enrolledStudents: c.enrolledStudents,
    totalSessions: c.sessionsSet.size,
    attendedRecords: c.attendedRecords,
    totalRecords: c.totalRecords,
    percentage:
      c.totalRecords > 0
        ? Number(((c.attendedRecords / c.totalRecords) * 100).toFixed(1))
        : null,
  }));

  const studentsAtRisk: SubjectReportItem["studentsAtRisk"] = [];
  studentMap.forEach((st) => {
    if (st.total > 0) {
      const pct = Number(((st.attended / st.total) * 100).toFixed(1));
      if (pct < threshold) {
        studentsAtRisk.push({
          studentId: st.studentId,
          rollNo: st.rollNo,
          name: st.name,
          className: st.className,
          section: st.section,
          attendedSessions: st.attended,
          totalSessions: st.total,
          percentage: pct,
        });
      }
    }
  });

  studentsAtRisk.sort((a, b) => a.percentage - b.percentage);

  const totalRecords = records.length;
  const overallPercentage =
    totalRecords > 0
      ? Number(((totalAttended / totalRecords) * 100).toFixed(1))
      : null;

  return {
    subjectInfo: {
      id: subject.id,
      code: subject.code,
      name: subject.name,
      department: subject.department,
      credits: subject.credits,
    },
    summary: {
      totalClasses: classes.length,
      totalSessions: allSessionsSet.size,
      totalRecords,
      overallPercentage,
      threshold,
      studentsBelowThresholdCount: studentsAtRisk.length,
    },
    classesBreakdown,
    studentsAtRisk,
  };
}

/**
 * Returns role-scoped filter choices for report selectors.
 */
export async function getReportFilterOptions(): Promise<ReportFilterOptions> {
  const session = await getServerAuthSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const role = session.user.role;

  if (role === "STUDENT") {
    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: { select: { name: true } },
        enrollments: {
          include: {
            class: { include: { subject: true } },
          },
        },
      },
    });

    if (!studentProfile) {
      return { classes: [], subjects: [], students: [], role };
    }

    const classes = studentProfile.enrollments.map((e) => ({
      id: e.class.id,
      name: e.class.name,
      section: e.class.section,
      subjectCode: e.class.subject.code,
    }));

    const subjectMap = new Map<string, { id: string; code: string; name: string }>();
    studentProfile.enrollments.forEach((e) => {
      subjectMap.set(e.class.subject.id, {
        id: e.class.subject.id,
        code: e.class.subject.code,
        name: e.class.subject.name,
      });
    });

    return {
      classes,
      subjects: Array.from(subjectMap.values()),
      students: [
        {
          id: studentProfile.id,
          rollNo: studentProfile.rollNo,
          name: studentProfile.user.name,
        },
      ],
      role,
      defaultStudentId: studentProfile.id,
    };
  }

  if (role === "TEACHER") {
    const teacherProfile = await db.teacherProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        assignments: {
          include: {
            class: {
              include: {
                subject: true,
                enrollments: {
                  include: {
                    student: {
                      include: { user: { select: { name: true } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!teacherProfile) {
      return { classes: [], subjects: [], students: [], role };
    }

    const classes = teacherProfile.assignments.map((a) => ({
      id: a.class.id,
      name: a.class.name,
      section: a.class.section,
      subjectCode: a.class.subject.code,
    }));

    const subjectMap = new Map<string, { id: string; code: string; name: string }>();
    const studentMap = new Map<string, { id: string; rollNo: string; name: string; className: string }>();

    teacherProfile.assignments.forEach((a) => {
      subjectMap.set(a.class.subject.id, {
        id: a.class.subject.id,
        code: a.class.subject.code,
        name: a.class.subject.name,
      });

      a.class.enrollments.forEach((e) => {
        studentMap.set(e.student.id, {
          id: e.student.id,
          rollNo: e.student.rollNo,
          name: e.student.user.name,
          className: `${a.class.name} (${a.class.section})`,
        });
      });
    });

    return {
      classes,
      subjects: Array.from(subjectMap.values()),
      students: Array.from(studentMap.values()).sort((a, b) =>
        a.rollNo.localeCompare(b.rollNo)
      ),
      role,
    };
  }

  // ADMIN: Global
  const [classes, subjects, students] = await Promise.all([
    db.class.findMany({
      select: {
        id: true,
        name: true,
        section: true,
        subject: { select: { code: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.subject.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    }),
    db.studentProfile.findMany({
      select: {
        id: true,
        rollNo: true,
        user: { select: { name: true } },
      },
      orderBy: { rollNo: "asc" },
    }),
  ]);

  return {
    classes: classes.map((c) => ({
      id: c.id,
      name: c.name,
      section: c.section,
      subjectCode: c.subject.code,
    })),
    subjects,
    students: students.map((s) => ({
      id: s.id,
      rollNo: s.rollNo,
      name: s.user.name,
    })),
    role,
  };
}

