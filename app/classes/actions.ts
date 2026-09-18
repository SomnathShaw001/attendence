"use server";

import { db } from "@/lib/db";
import { getServerAuthSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import {
  classInputSchema,
  subjectInputSchema,
  assignTeacherSchema,
  enrollStudentSchema,
  type ClassInput,
  type SubjectInput,
  type AssignTeacherInput,
  type EnrollStudentInput,
} from "@/lib/validations/class";

export async function getClasses(params?: {
  search?: string;
  termId?: string;
  department?: string;
  myClassesOnly?: boolean;
}) {
  const session = await getServerAuthSession();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    throw new Error("Unauthorized: Only administrators and faculty can view academic classes.");
  }

  const { search, termId, department, myClassesOnly } = params || {};

  const where: Prisma.ClassWhereInput = {};

  if (myClassesOnly && session.user.role === "TEACHER") {
    where.teachers = {
      some: {
        teacher: {
          userId: session.user.id,
        },
      },
    };
  }

  if (termId && termId !== "all") {
    where.termId = termId;
  }

  if (department && department !== "all") {
    where.subject = { department };
  }

  if (search && search.trim() !== "") {
    const q = search.trim();
    where.OR = [
      { name: { contains: q } },
      { section: { contains: q } },
      { subject: { name: { contains: q } } },
      { subject: { code: { contains: q } } },
    ];
  }

  const [classes, terms, subjects, totalClasses, totalSubjects, totalEnrollments, totalAssignments] =
    await Promise.all([
      db.class.findMany({
        where,
        include: {
          subject: true,
          term: true,
          teachers: {
            include: {
              teacher: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      image: true,
                    },
                  },
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
      }),
      db.academicTerm.findMany({
        orderBy: { startDate: "desc" },
      }),
      db.subject.findMany({
        orderBy: { code: "asc" },
      }),
      db.class.count(),
      db.subject.count(),
      db.classEnrollment.count(),
      db.classTeacherAssignment.count(),
    ]);

  return {
    classes,
    terms,
    subjects,
    stats: {
      totalClasses,
      totalSubjects,
      totalEnrollments,
      totalAssignments,
    },
  };
}

export async function getClassById(classId: string) {
  const session = await getServerAuthSession();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    throw new Error("Unauthorized: Insufficient permissions to view class details.");
  }

  const classRecord = await db.class.findUnique({
    where: { id: classId },
    include: {
      subject: true,
      term: true,
      teachers: {
        include: {
          teacher: {
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
        orderBy: { assignedAt: "desc" },
      },
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
      classSessions: {
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              records: true,
            },
          },
        },
        orderBy: { date: "desc" },
        take: 25,
      },
    },
  });

  if (!classRecord) {
    throw new Error("Class section not found.");
  }

  // Fetch candidate faculty and students for assignment dialogs (only if ADMIN)
  let availableTeachers: Array<{ id: string; employeeId: string; department: string; user: { name: string; email: string } }> = [];
  let availableStudents: Array<{ id: string; rollNo: string; batch: string; department: string; user: { name: string; email: string } }> = [];
  let availableBatches: string[] = [];
  let availableDepartments: string[] = [];

  if (session.user.role === "ADMIN") {
    const assignedTeacherIds = classRecord.teachers.map((t) => t.teacherId);
    const enrolledStudentIds = classRecord.enrollments.map((e) => e.studentId);

    const [teachersRes, studentsRes, allBatches, allDepts] = await Promise.all([
      db.teacherProfile.findMany({
        where: {
          id: { notIn: assignedTeacherIds },
          user: { isActive: true },
        },
        select: {
          id: true,
          employeeId: true,
          department: true,
          user: { select: { name: true, email: true } },
        },
        orderBy: { user: { name: "asc" } },
      }),
      db.studentProfile.findMany({
        where: {
          id: { notIn: enrolledStudentIds },
          user: { isActive: true },
        },
        select: {
          id: true,
          rollNo: true,
          batch: true,
          department: true,
          user: { select: { name: true, email: true } },
        },
        orderBy: { rollNo: "asc" },
      }),
      db.studentProfile.findMany({
        distinct: ["batch"],
        select: { batch: true },
        orderBy: { batch: "asc" },
      }),
      db.studentProfile.findMany({
        distinct: ["department"],
        select: { department: true },
        orderBy: { department: "asc" },
      }),
    ]);

    availableTeachers = teachersRes;
    availableStudents = studentsRes;
    availableBatches = allBatches.map((b) => b.batch);
    availableDepartments = allDepts.map((d) => d.department);
  }

  return {
    classRecord,
    availableTeachers,
    availableStudents,
    availableBatches,
    availableDepartments,
  };
}

export async function createClass(rawInput: ClassInput) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Administrator permissions required." };
  }

  const parsed = classInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid class parameters.",
    };
  }

  const data = parsed.data;

  // Check duplicate section for the same subject and term
  const existing = await db.class.findFirst({
    where: {
      subjectId: data.subjectId,
      termId: data.termId,
      section: data.section,
    },
  });

  if (existing) {
    return {
      success: false,
      error: `A class for this subject with Section "${data.section}" already exists in the selected academic term.`,
    };
  }

  try {
    const newClass = await db.class.create({
      data: {
        name: data.name,
        section: data.section,
        subjectId: data.subjectId,
        termId: data.termId,
      },
    });

    revalidatePath("/classes");
    revalidatePath("/dashboard");

    return { success: true, class: newClass };
  } catch (err: unknown) {
    console.error("Failed to create class:", err);
    return { success: false, error: "Database error while creating class section." };
  }
}

export async function updateClass(classId: string, rawInput: ClassInput) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Administrator permissions required." };
  }

  const parsed = classInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid class parameters.",
    };
  }

  const data = parsed.data;

  // Check section collision with another class
  const existing = await db.class.findFirst({
    where: {
      id: { not: classId },
      subjectId: data.subjectId,
      termId: data.termId,
      section: data.section,
    },
  });

  if (existing) {
    return {
      success: false,
      error: `Another class for this subject with Section "${data.section}" already exists in the selected term.`,
    };
  }

  try {
    await db.class.update({
      where: { id: classId },
      data: {
        name: data.name,
        section: data.section,
        subjectId: data.subjectId,
        termId: data.termId,
      },
    });

    revalidatePath("/classes");
    revalidatePath(`/classes/${classId}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to update class:", err);
    return { success: false, error: "Database error while updating class section." };
  }
}

export async function deleteClass(classId: string) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Administrator permissions required." };
  }

  const classRecord = await db.class.findUnique({
    where: { id: classId },
    include: {
      classSessions: { select: { id: true } },
    },
  });

  if (!classRecord) {
    return { success: false, error: "Class not found." };
  }

  // Referential integrity check: cannot delete if class sessions exist
  if (classRecord.classSessions.length > 0) {
    return {
      success: false,
      error: `Cannot delete class with ${classRecord.classSessions.length} conducted class sessions. Historical attendance logs must be preserved.`,
    };
  }

  try {
    await db.class.delete({
      where: { id: classId },
    });

    revalidatePath("/classes");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to delete class:", err);
    return { success: false, error: "Database error while deleting class." };
  }
}

// ==========================================
// Subject Catalog Actions
// ==========================================

export async function getSubjects() {
  return await db.subject.findMany({
    include: {
      _count: {
        select: {
          classes: true,
          classSessions: true,
        },
      },
    },
    orderBy: { code: "asc" },
  });
}

export async function createSubject(rawInput: SubjectInput) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Administrator permissions required." };
  }

  const parsed = subjectInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid subject parameters.",
    };
  }

  const data = parsed.data;

  // Check unique code
  const existing = await db.subject.findUnique({
    where: { code: data.code },
  });
  if (existing) {
    return { success: false, error: `Subject code "${data.code}" is already in the catalog.` };
  }

  try {
    const subject = await db.subject.create({
      data: {
        code: data.code,
        name: data.name,
        department: data.department,
        credits: data.credits,
      },
    });

    revalidatePath("/classes");
    return { success: true, subject };
  } catch (err: unknown) {
    console.error("Failed to create subject:", err);
    return { success: false, error: "Database error while creating subject." };
  }
}

export async function updateSubject(subjectId: string, rawInput: SubjectInput) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Administrator permissions required." };
  }

  const parsed = subjectInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid subject parameters.",
    };
  }

  const data = parsed.data;

  // Check code collision
  const existing = await db.subject.findUnique({
    where: { code: data.code },
  });
  if (existing && existing.id !== subjectId) {
    return { success: false, error: `Subject code "${data.code}" is already used by another course.` };
  }

  try {
    await db.subject.update({
      where: { id: subjectId },
      data: {
        code: data.code,
        name: data.name,
        department: data.department,
        credits: data.credits,
      },
    });

    revalidatePath("/classes");
    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to update subject:", err);
    return { success: false, error: "Database error while updating subject." };
  }
}

export async function deleteSubject(subjectId: string) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Administrator permissions required." };
  }

  const subject = await db.subject.findUnique({
    where: { id: subjectId },
    include: {
      classes: { select: { id: true } },
      classSessions: { select: { id: true } },
    },
  });

  if (!subject) {
    return { success: false, error: "Subject not found." };
  }

  if (subject.classes.length > 0 || subject.classSessions.length > 0) {
    return {
      success: false,
      error: `Cannot delete subject "${subject.code}" linked to ${subject.classes.length} active classes or ${subject.classSessions.length} teaching sessions.`,
    };
  }

  try {
    await db.subject.delete({
      where: { id: subjectId },
    });

    revalidatePath("/classes");
    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to delete subject:", err);
    return { success: false, error: "Database error while deleting subject." };
  }
}

// ==========================================
// Teacher Assignments & Student Enrollments
// ==========================================

export async function assignTeacherToClass(rawInput: AssignTeacherInput) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Administrator permissions required." };
  }

  const parsed = assignTeacherSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid assignment data.",
    };
  }

  const { classId, teacherId, role } = parsed.data;

  try {
    await db.classTeacherAssignment.upsert({
      where: {
        classId_teacherId: { classId, teacherId },
      },
      update: { role },
      create: { classId, teacherId, role },
    });

    revalidatePath(`/classes/${classId}`);
    revalidatePath("/classes");
    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to assign faculty:", err);
    return { success: false, error: "Database error while assigning faculty to class." };
  }
}

export async function removeTeacherFromClass(classId: string, teacherId: string) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Administrator permissions required." };
  }

  try {
    await db.classTeacherAssignment.delete({
      where: {
        classId_teacherId: { classId, teacherId },
      },
    });

    revalidatePath(`/classes/${classId}`);
    revalidatePath("/classes");
    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to unassign faculty:", err);
    return { success: false, error: "Database error while removing faculty assignment." };
  }
}

export async function enrollStudentInClass(rawInput: EnrollStudentInput) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Administrator permissions required." };
  }

  const parsed = enrollStudentSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid enrollment data.",
    };
  }

  const { classId, studentId } = parsed.data;

  try {
    await db.classEnrollment.upsert({
      where: {
        classId_studentId: { classId, studentId },
      },
      update: {},
      create: { classId, studentId },
    });

    revalidatePath(`/classes/${classId}`);
    revalidatePath("/classes");
    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to enroll student:", err);
    return { success: false, error: "Database error while enrolling student." };
  }
}

export async function unenrollStudentFromClass(classId: string, studentId: string) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Administrator permissions required." };
  }

  try {
    await db.classEnrollment.delete({
      where: {
        classId_studentId: { classId, studentId },
      },
    });

    revalidatePath(`/classes/${classId}`);
    revalidatePath("/classes");
    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to unenroll student:", err);
    return { success: false, error: "Database error while removing student enrollment." };
  }
}

export async function batchEnrollStudents(
  classId: string,
  params: { batch?: string; department?: string }
) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Administrator permissions required." };
  }

  const { batch, department } = params;
  if ((!batch || batch === "all") && (!department || department === "all")) {
    return { success: false, error: "Please specify a cohort batch or department to batch enroll." };
  }

  const where: Prisma.StudentProfileWhereInput = {
    user: { isActive: true },
  };

  if (batch && batch !== "all") {
    where.batch = batch;
  }
  if (department && department !== "all") {
    where.department = department;
  }

  const candidateStudents = await db.studentProfile.findMany({
    where,
    select: { id: true },
  });

  if (candidateStudents.length === 0) {
    return { success: false, error: "No active students found matching the selected criteria." };
  }

  const existing = await db.classEnrollment.findMany({
    where: { classId },
    select: { studentId: true },
  });
  const existingSet = new Set(existing.map((e) => e.studentId));
  const toEnroll = candidateStudents.filter((s) => !existingSet.has(s.id));

  if (toEnroll.length === 0) {
    return {
      success: false,
      error: "All students matching these criteria are already enrolled in this class.",
    };
  }

  try {
    await db.classEnrollment.createMany({
      data: toEnroll.map((s) => ({
        classId,
        studentId: s.id,
      })),
    });

    revalidatePath(`/classes/${classId}`);
    revalidatePath("/classes");
    return { success: true, count: toEnroll.length };
  } catch (err: unknown) {
    console.error("Failed to batch enroll students:", err);
    return { success: false, error: "Database error during cohort enrollment." };
  }
}

