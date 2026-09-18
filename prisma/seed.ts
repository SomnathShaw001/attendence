import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database accounts...");

  // 1. Seed System Settings
  await prisma.systemSetting.upsert({
    where: { key: "MIN_ATTENDANCE_PERCENTAGE" },
    update: {},
    create: {
      key: "MIN_ATTENDANCE_PERCENTAGE",
      value: "75.0",
      description: "Minimum overall attendance percentage before debarment warning is issued",
    },
  });

  // 2. Hash default passwords
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const teacherPassword = await bcrypt.hash("Teacher@123", 10);
  const studentPassword = await bcrypt.hash("Student@123", 10);

  // 3. Seed Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@university.edu" },
    update: {},
    create: {
      email: "admin@university.edu",
      name: "Dr. Arthur Vance (Dean/Admin)",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  // 4. Seed Teacher
  const teacher = await prisma.user.upsert({
    where: { email: "teacher@university.edu" },
    update: {},
    create: {
      email: "teacher@university.edu",
      name: "Prof. Sarah Connor",
      passwordHash: teacherPassword,
      role: "TEACHER",
      teacherProfile: {
        create: {
          employeeId: "FAC-10024",
          department: "Computer Science",
          designation: "Associate Professor",
        },
      },
    },
  });

  // 5. Seed Student
  const student = await prisma.user.upsert({
    where: { email: "student@university.edu" },
    update: {},
    create: {
      email: "student@university.edu",
      name: "Alex Mercer",
      passwordHash: studentPassword,
      role: "STUDENT",
      studentProfile: {
        create: {
          rollNo: "CS2026-042",
          batch: "CSE-2026",
          department: "Computer Science",
          admissionYear: 2024,
        },
      },
    },
  });

  // 6. Seed Academic Term & Subject
  const term = await prisma.academicTerm.upsert({
    where: { id: "term-fall-2026" },
    update: {},
    create: {
      id: "term-fall-2026",
      name: "Fall Semester 2026",
      startDate: new Date("2026-08-01"),
      endDate: new Date("2026-12-20"),
      isCurrent: true,
    },
  });

  const subject = await prisma.subject.upsert({
    where: { code: "CS301" },
    update: {},
    create: {
      code: "CS301",
      name: "Database Management Systems",
      credits: 4,
      department: "Computer Science",
    },
  });

  console.log(`Seeding complete:
  - Admin: ${admin.email} (Admin@123)
  - Teacher: ${teacher.email} (Teacher@123)
  - Student: ${student.email} (Student@123)
  - Term: ${term.name}
  - Subject: ${subject.name}`);
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
