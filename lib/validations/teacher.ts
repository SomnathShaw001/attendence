import { z } from "zod";

export const teacherInputSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Full name must be at least 2 characters long." })
    .max(100, { message: "Name cannot exceed 100 characters." }),
  email: z
    .string()
    .email({ message: "Please provide a valid university email address." })
    .toLowerCase(),
  employeeId: z
    .string()
    .min(2, { message: "Employee ID must be at least 2 characters." })
    .max(30, { message: "Employee ID cannot exceed 30 characters." })
    .trim()
    .toUpperCase(),
  department: z
    .string()
    .min(2, { message: "Department must be specified." })
    .max(100, { message: "Department cannot exceed 100 characters." }),
  designation: z
    .string()
    .max(100, { message: "Designation cannot exceed 100 characters." })
    .optional()
    .nullable(),
});

export type TeacherInput = z.infer<typeof teacherInputSchema>;
