import { z } from "zod";

export const studentInputSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid institutional email address"),
  rollNo: z.string().trim().min(2, "Roll number must be at least 2 characters").max(30),
  batch: z.string().trim().min(2, "Batch name must be at least 2 characters").max(30),
  department: z.string().trim().min(2, "Department must be at least 2 characters").max(50),
  admissionYear: z.coerce
    .number()
    .int()
    .min(2000, "Admission year must be 2000 or later")
    .max(2050, "Admission year cannot exceed 2050"),
  password: z.string().optional(),
});

export type StudentInput = z.infer<typeof studentInputSchema>;
