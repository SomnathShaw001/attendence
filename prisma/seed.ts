import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('password123', 10)

  // Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@college.edu' },
    update: {},
    create: {
      email: 'admin@college.edu',
      name: 'Admin User',
      password,
      role: 'ADMIN',
    },
  })

  // Create Faculty
  const facultyUser = await prisma.user.upsert({
    where: { email: 'faculty@college.edu' },
    update: {},
    create: {
      email: 'faculty@college.edu',
      name: 'Prof. Reynolds',
      password,
      role: 'FACULTY',
      teacherProfile: {
        create: {
          department: 'Computer Science',
        },
      },
    },
  })

  // Create Student
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@college.edu' },
    update: {},
    create: {
      email: 'student@college.edu',
      name: 'John Doe',
      password,
      role: 'STUDENT',
      studentProfile: {
        create: {
          rollNo: 'CS2026-001',
          batch: 'CSE-A',
        },
      },
    },
  })

  // Add a Subject
  const subject = await prisma.subject.upsert({
    where: { code: 'CS101' },
    update: {},
    create: {
      code: 'CS101',
      name: 'Data Structures and Algorithms',
    },
  })

  console.log('Database seeded!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
