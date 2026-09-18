"use server";

import { db } from "@/lib/db";
import { getServerAuthSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { teacherInputSchema, type TeacherInput } from "@/lib/validations/teacher";

export async function getTeachers(params?: {
  search?: string;
  department?: string;
  status?: string; // "all" | "active" | "deactivated"
}) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Only administrators can view the complete faculty directory.");
  }

  const { search, department, status } = params || {};

  const where: Prisma.TeacherProfileWhereInput = {};

  if (department && department !== "all") {
    where.department = department;
  }

  if (status === "active") {
    where.user = { isActive: true };
  } else if (status === "deactivated") {
    where.user = { isActive: false };
  }

  if (search && search.trim() !== "") {
    const q = search.trim();
    where.OR = [
      { employeeId: { contains: q } },
      { department: { contains: q } },
      { designation: { contains: q } },
      { user: { name: { contains: q } } },
      { user: { email: { contains: q } } },
    ];
  }

  const [teachers, allDepartments, totalCount, activeCount, sessionCount] = await Promise.all([
    db.teacherProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            image: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            assignments: true,
            classSessions: true,
          },
        },
      },
      orderBy: [{ user: { name: "asc" } }],
    }),
    db.teacherProfile.findMany({
      distinct: ["department"],
      select: { department: true },
      orderBy: { department: "asc" },
    }),
    db.teacherProfile.count(),
    db.teacherProfile.count({
      where: { user: { isActive: true } },
    }),
    db.classSession.count(),
  ]);

  return {
    teachers,
    departments: allDepartments.map((d) => d.department),
    stats: {
      total: totalCount,
      active: activeCount,
      totalSessions: sessionCount,
    },
  };
}

export async function getTeacherById(teacherId: string) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Only administrators can view faculty dossiers.");
  }

  const teacher = await db.teacherProfile.findUnique({
    where: { id: teacherId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      assignments: {
        include: {
          class: {
            include: {
              subject: true,
              term: true,
              _count: {
                select: {
                  enrollments: true,
                },
              },
            },
          },
        },
        orderBy: { assignedAt: "desc" },
      },
      classSessions: {
        include: {
          class: true,
          subject: true,
          _count: {
            select: {
              records: true,
            },
          },
        },
        orderBy: { date: "desc" },
        take: 20,
      },
    },
  });

  if (!teacher) {
    throw new Error("Faculty profile not found.");
  }

  return teacher;
}

export async function createTeacher(rawInput: TeacherInput) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Administrator permissions required." };
  }

  const parsed = teacherInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid faculty input data.",
    };
  }

  const data = parsed.data;

  // Check unique email
  const existingEmail = await db.user.findUnique({
    where: { email: data.email },
  });
  if (existingEmail) {
    return { success: false, error: "A user account with this email address already exists." };
  }

  // Check unique employeeId
  const existingEmployeeId = await db.teacherProfile.findUnique({
    where: { employeeId: data.employeeId },
  });
  if (existingEmployeeId) {
    return { success: false, error: `Employee ID "${data.employeeId}" is already assigned to another faculty member.` };
  }

  try {
    const defaultPassword = "Faculty@" + (new Date().getFullYear());
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          role: "TEACHER",
          passwordHash,
          isActive: true,
        },
      });

      const profile = await tx.teacherProfile.create({
        data: {
          userId: user.id,
          employeeId: data.employeeId,
          department: data.department,
          designation: data.designation?.trim() || null,
        },
      });

      return { user, profile };
    });

    revalidatePath("/teachers");
    revalidatePath("/dashboard");

    return {
      success: true,
      teacher: result.profile,
      defaultPasswordNote: "Default account password initialized to Faculty@" + (new Date().getFullYear()),
    };
  } catch (err: unknown) {
    console.error("Failed to create faculty member:", err);
    return { success: false, error: "Internal database error creating faculty record." };
  }
}

export async function updateTeacher(teacherId: string, rawInput: TeacherInput) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Administrator permissions required." };
  }

  const parsed = teacherInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid faculty input data.",
    };
  }

  const data = parsed.data;

  const existingProfile = await db.teacherProfile.findUnique({
    where: { id: teacherId },
    include: { user: true },
  });

  if (!existingProfile) {
    return { success: false, error: "Faculty profile not found." };
  }

  // Check email conflict
  if (data.email !== existingProfile.user.email) {
    const emailConflict = await db.user.findUnique({
      where: { email: data.email },
    });
    if (emailConflict && emailConflict.id !== existingProfile.userId) {
      return { success: false, error: "Another account already uses this email address." };
    }
  }

  // Check employeeId conflict
  if (data.employeeId !== existingProfile.employeeId) {
    const empIdConflict = await db.teacherProfile.findUnique({
      where: { employeeId: data.employeeId },
    });
    if (empIdConflict && empIdConflict.id !== teacherId) {
      return { success: false, error: `Employee ID "${data.employeeId}" is already assigned to another faculty member.` };
    }
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingProfile.userId },
        data: {
          name: data.name,
          email: data.email,
        },
      });

      await tx.teacherProfile.update({
        where: { id: teacherId },
        data: {
          employeeId: data.employeeId,
          department: data.department,
          designation: data.designation?.trim() || null,
        },
      });
    });

    revalidatePath("/teachers");
    revalidatePath(`/teachers/${teacherId}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to update faculty member:", err);
    return { success: false, error: "Internal database error updating faculty record." };
  }
}

export async function toggleTeacherStatus(teacherId: string, isActive: boolean) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Administrator permissions required." };
  }

  const teacher = await db.teacherProfile.findUnique({
    where: { id: teacherId },
    select: { userId: true },
  });

  if (!teacher) {
    return { success: false, error: "Faculty profile not found." };
  }

  try {
    await db.user.update({
      where: { id: teacher.userId },
      data: { isActive },
    });

    revalidatePath("/teachers");
    revalidatePath(`/teachers/${teacherId}`);
    revalidatePath("/dashboard");

    return { success: true, isActive };
  } catch (err: unknown) {
    console.error("Failed to toggle faculty status:", err);
    return { success: false, error: "Failed to update faculty account status." };
  }
}

export async function deleteTeacher(teacherId: string) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Administrator permissions required." };
  }

  const teacher = await db.teacherProfile.findUnique({
    where: { id: teacherId },
    include: {
      user: true,
      classSessions: { select: { id: true } },
      assignments: { select: { id: true } },
    },
  });

  if (!teacher) {
    return { success: false, error: "Faculty profile not found." };
  }

  // Referential integrity safeguard:
  // Cannot hard-delete if teaching sessions were conducted.
  if (teacher.classSessions.length > 0) {
    return {
      success: false,
      error:
        `Cannot delete faculty member with ${teacher.classSessions.length} conducted class sessions. ` +
        `Deactivate the faculty account instead to preserve attendance audit history and institutional records.`,
    };
  }

  try {
    await db.$transaction(async (tx) => {
      // Remove class assignments if any exist
      if (teacher.assignments.length > 0) {
        await tx.classTeacherAssignment.deleteMany({
          where: { teacherId },
        });
      }

      // Delete User (cascades to TeacherProfile)
      await tx.user.delete({
        where: { id: teacher.userId },
      });
    });

    revalidatePath("/teachers");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to safely delete faculty record:", err);
    return { success: false, error: "Internal database error deleting faculty record." };
  }
}
