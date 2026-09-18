import { z } from "zod";

export const attendanceStatusEnum = z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]);
export type AttendanceStatus = z.infer<typeof attendanceStatusEnum>;

export const sessionStatusEnum = z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]);
export type SessionStatus = z.infer<typeof sessionStatusEnum>;

export const classSessionInputSchema = z.object({
  classId: z.string().min(1, { message: "Please specify an academic class cohort." }),
  subjectId: z.string().min(1, { message: "Please specify the course subject." }),
  teacherId: z.string().min(1, { message: "Please specify the instructor." }),
  date: z.coerce.date({ message: "Valid session date is required." }),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](\s?(AM|PM))?$/i, {
      message: "Start time must be formatted as HH:MM (e.g. 10:00 or 10:00 AM).",
    })
    .optional()
    .nullable(),
  endTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](\s?(AM|PM))?$/i, {
      message: "End time must be formatted as HH:MM (e.g. 11:30 or 11:30 AM).",
    })
    .optional()
    .nullable(),
  room: z.string().max(50, { message: "Room descriptor cannot exceed 50 characters." }).optional().nullable(),
});

export type ClassSessionInput = z.infer<typeof classSessionInputSchema>;

export const attendanceEntrySchema = z.object({
  studentId: z.string().min(1, { message: "Student profile ID is required." }),
  status: attendanceStatusEnum.default("PRESENT"),
  remarks: z.string().max(255, { message: "Remarks cannot exceed 255 characters." }).optional().nullable(),
});

export type AttendanceEntry = z.infer<typeof attendanceEntrySchema>;

export const submitAttendanceSchema = z.object({
  sessionId: z.string().min(1, { message: "Session ID is required." }),
  entries: z.array(attendanceEntrySchema).min(1, { message: "At least one student record must be provided." }),
});

export type SubmitAttendanceInput = z.infer<typeof submitAttendanceSchema>;

export const updateAttendanceRecordSchema = z.object({
  recordId: z.string().min(1, { message: "Record ID is required." }),
  status: attendanceStatusEnum,
  remarks: z.string().max(255).optional().nullable(),
});

export type UpdateAttendanceRecordInput = z.infer<typeof updateAttendanceRecordSchema>;
