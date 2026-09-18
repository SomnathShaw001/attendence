import { z } from "zod";

export const subjectInputSchema = z.object({
  code: z
    .string()
    .min(2, { message: "Course code must be at least 2 characters." })
    .max(20, { message: "Course code cannot exceed 20 characters." })
    .trim()
    .toUpperCase(),
  name: z
    .string()
    .min(2, { message: "Course title must be at least 2 characters." })
    .max(100, { message: "Course title cannot exceed 100 characters." }),
  credits: z.coerce
    .number()
    .int()
    .min(1, { message: "Credits must be at least 1." })
    .max(10, { message: "Credits cannot exceed 10." })
    .default(3),
  department: z
    .string()
    .min(2, { message: "Department must be specified." })
    .max(100, { message: "Department cannot exceed 100 characters." }),
});

export type SubjectInput = z.infer<typeof subjectInputSchema>;

export const classInputSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Class name must be at least 2 characters." })
    .max(100, { message: "Class name cannot exceed 100 characters." }),
  section: z
    .string()
    .min(1, { message: "Section must be specified." })
    .max(10, { message: "Section cannot exceed 10 characters." })
    .trim()
    .toUpperCase(),
  subjectId: z
    .string()
    .min(1, { message: "Please select an academic subject." }),
  termId: z
    .string()
    .min(1, { message: "Please select an academic term." }),
});

export type ClassInput = z.infer<typeof classInputSchema>;

export const assignTeacherSchema = z.object({
  classId: z.string().min(1),
  teacherId: z.string().min(1, { message: "Please select a faculty member." }),
  role: z
    .enum(["PRIMARY", "ASSISTANT", "LAB_INSTRUCTOR"])
    .default("PRIMARY"),
});

export type AssignTeacherInput = z.infer<typeof assignTeacherSchema>;

export const enrollStudentSchema = z.object({
  classId: z.string().min(1),
  studentId: z.string().min(1, { message: "Please select a student." }),
});

export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>;
