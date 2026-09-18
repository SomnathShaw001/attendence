"use server";

import { db } from "@/lib/db";
import { getServerAuthSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { studentInputSchema, type StudentInput } from "@/lib/validations/student";

export async function getStudents(params?: {
  search?: string;
  batch?: string;
  department?: string;
  status?: string; // "all" | "active" | "deactivated"
}) {
  const session = await getServerAuthSession();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    throw new Error("Unauthorized: Only administrators and faculty can view the student roster.");
  }

  const { search, batch, department, status } = params || {};

  // Build Prisma filter query
  const where: Prisma.StudentProfileWhereInput = {};

  if (batch && batch !== "all") {
    where.batch = batch;
  }

  if (department && department !== "all") {
    where.department = department;
  }

  if (status === "active") {
    where.user = { isActive: true };
  } else if (status === "deactivated") {
    where.user = { isActive: false };
  }

  if (search && search.trim() !== "") {
    const query = search.trim();
    where.OR = [
      { rollNo: { contains: query } },
      { user: { name: { contains: query } } },
      { user: { email: { contains: query } } },
    ];
  }

  const [students, allBatches, allDepartments] = await Promise.all([
    db.studentProfile.findMany({
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
            enrollments: true,
            attendanceRecords: true,
          },
        },
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

  return {
    students,
    batches: allBatches.map((b) => b.batch),
    departments: allDepartments.map((d) => d.department),
  };
}

export async function getStudentById(id: string) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in to view student details.");
  }

  // Students can only view their own profile; Admin/Teacher can view any
  if (session.user.role === "STUDENT") {
    const ownProfile = await db.studentProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (ownProfile?.id !== id) {
      throw new Error("Unauthorized: You cannot access other student profiles.");
    }
  }

  const student = await db.studentProfile.findUnique({
    where: { id },
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
      enrollments: {
        include: {
          class: {
            include: {
              subject: true,
              term: true,
            },
          },
        },
      },
      attendanceRecords: {
        include: {
          classSession: {
            include: {
              subject: true,
              teacher: {
                include: { user: { select: { name: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!student) {
    throw new Error("Student profile not found.");
  }

  const total = student.attendanceRecords.length;
  const attended = student.attendanceRecords.filter(
    (r) => r.status === "PRESENT" || r.status === "LATE"
  ).length;
  const percentage = total > 0 ? parseFloat(((attended / total) * 100).toFixed(1)) : null;

  return {
    ...student,
    stats: {
      total,
      attended,
      percentage,
    },
  };
}

export async function createStudent(data: StudentInput) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Forbidden: Only administrators are authorized to register students.");
  }

  const validated = studentInputSchema.parse(data);
  const normalizedEmail = validated.email.toLowerCase().trim();
  const normalizedRoll = validated.rollNo.toUpperCase().trim();

  // Check unique constraints
  const [existingUser, existingRoll] = await Promise.all([
    db.user.findUnique({ where: { email: normalizedEmail } }),
    db.studentProfile.findUnique({ where: { rollNo: normalizedRoll } }),
  ]);

  if (existingUser) {
    throw new Error(`An account with email ${normalizedEmail} already exists.`);
  }

  if (existingRoll) {
    throw new Error(`A student with roll number ${normalizedRoll} is already registered.`);
  }

  const initialPassword = validated.password?.trim() || "Student@123";
  const passwordHash = await bcrypt.hash(initialPassword, 10);

  const newStudent = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: validated.name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: "STUDENT",
        isActive: true,
      },
    });

    const profile = await tx.studentProfile.create({
      data: {
        userId: user.id,
        rollNo: normalizedRoll,
        batch: validated.batch.trim(),
        department: validated.department.trim(),
        admissionYear: validated.admissionYear,
      },
    });

    await tx.auditLog.create({
      data: {
        entity: "StudentProfile",
        entityId: profile.id,
        action: "CREATE",
        performedById: session.user.id,
        details: JSON.stringify({
          rollNo: profile.rollNo,
          email: user.email,
          name: user.name,
        }),
      },
    });

    return profile;
  });

  revalidatePath("/students");
  revalidatePath("/dashboard");
  return { success: true, studentId: newStudent.id };
}

export async function updateStudent(studentId: string, data: StudentInput) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Forbidden: Only administrators are authorized to edit student records.");
  }

  const validated = studentInputSchema.parse(data);
  const normalizedEmail = validated.email.toLowerCase().trim();
  const normalizedRoll = validated.rollNo.toUpperCase().trim();

  const student = await db.studentProfile.findUnique({
    where: { id: studentId },
    include: { user: true },
  });

  if (!student) {
    throw new Error("Student profile not found.");
  }

  // Check unique constraints for conflicts with other users
  if (normalizedEmail !== student.user.email) {
    const conflictEmail = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (conflictEmail) {
      throw new Error(`The email ${normalizedEmail} is already in use by another user.`);
    }
  }

  if (normalizedRoll !== student.rollNo) {
    const conflictRoll = await db.studentProfile.findUnique({ where: { rollNo: normalizedRoll } });
    if (conflictRoll) {
      throw new Error(`The roll number ${normalizedRoll} is already registered.`);
    }
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: student.userId },
      data: {
        name: validated.name.trim(),
        email: normalizedEmail,
      },
    });

    await tx.studentProfile.update({
      where: { id: studentId },
      data: {
        rollNo: normalizedRoll,
        batch: validated.batch.trim(),
        department: validated.department.trim(),
        admissionYear: validated.admissionYear,
      },
    });

    await tx.auditLog.create({
      data: {
        entity: "StudentProfile",
        entityId: studentId,
        action: "UPDATE",
        performedById: session.user.id,
        details: JSON.stringify({
          previous: {
            rollNo: student.rollNo,
            email: student.user.email,
            name: student.user.name,
          },
          updated: {
            rollNo: normalizedRoll,
            email: normalizedEmail,
            name: validated.name.trim(),
          },
        }),
      },
    });
  });

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleStudentStatus(studentId: string) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Forbidden: Only administrators can modify student activation status.");
  }

  const student = await db.studentProfile.findUnique({
    where: { id: studentId },
    include: { user: true },
  });

  if (!student) {
    throw new Error("Student profile not found.");
  }

  const newStatus = !student.user.isActive;

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: student.userId },
      data: { isActive: newStatus },
    });

    await tx.auditLog.create({
      data: {
        entity: "StudentProfile",
        entityId: studentId,
        action: newStatus ? "REACTIVATE" : "DEACTIVATE",
        performedById: session.user.id,
        details: JSON.stringify({
          rollNo: student.rollNo,
          isActive: newStatus,
        }),
      },
    });
  });

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/dashboard");
  return { success: true, isActive: newStatus };
}

export async function deleteStudent(studentId: string) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Forbidden: Only administrators can delete student accounts.");
  }

  const student = await db.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      _count: {
        select: { attendanceRecords: true },
      },
    },
  });

  if (!student) {
    throw new Error("Student profile not found.");
  }

  // Integrity Guard: Block deletion if student has permanent historical attendance records
  if (student._count.attendanceRecords > 0) {
    throw new Error(
      `Cannot permanently delete student ${student.rollNo} because ${student._count.attendanceRecords} attendance record(s) exist. Please deactivate the student account instead to maintain institutional audit compliance.`
    );
  }

  await db.$transaction(async (tx) => {
    await tx.auditLog.create({
      data: {
        entity: "StudentProfile",
        entityId: studentId,
        action: "DELETE",
        performedById: session.user.id,
        details: JSON.stringify({
          rollNo: student.rollNo,
          userId: student.userId,
        }),
      },
    });

    // Deleting the User cascades to StudentProfile and ClassEnrollment
    await tx.user.delete({
      where: { id: student.userId },
    });
  });

  revalidatePath("/students");
  revalidatePath("/dashboard");
  return { success: true };
}
