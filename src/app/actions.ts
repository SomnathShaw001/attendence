"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function getStudentDashboardData() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || (session.user as any).role !== "STUDENT") {
    throw new Error("Unauthorized");
  }

  // Fetch the student profile
  const student = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      attendanceRecords: {
        include: {
          classSession: {
            include: { subject: true }
          }
        }
      }
    }
  });

  if (!student) {
    throw new Error("Student profile not found");
  }

  const totalClasses = student.attendanceRecords.length;
  const attendedClasses = student.attendanceRecords.filter(r => r.status === "PRESENT" || r.status === "LATE").length;

  return {
    student,
    totalClasses,
    attendedClasses,
    percentage: totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0
  };
}
