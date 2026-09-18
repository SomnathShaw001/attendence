"use server";

import { db } from "@/lib/db";
import { getServerAuthSession } from "@/lib/auth";
import { generateQrPayload, verifyQrPayload } from "@/lib/qr-crypto";
import { qrAttendanceLimiter } from "@/lib/rate-limit";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

export interface ActiveQrSessionResponse {
  classSessionId: string;
  className: string;
  section: string;
  subjectCode: string;
  subjectName: string;
  tokenString: string;
  seq: number;
  expiresInSeconds: number;
  totalCheckinsCount: number;
  isLocked: boolean;
}

export interface QrCheckinResult {
  success: boolean;
  message: string;
  sessionDetails?: {
    className: string;
    section: string;
    subjectCode: string;
    subjectName: string;
    recordedAt: string;
  };
  alreadyRecorded?: boolean;
}

/**
 * Initiates dynamic QR roll call for a class session.
 * Only the assigned instructor or ADMIN can start a QR session.
 */
export async function startQrSession(classSessionId: string): Promise<ActiveQrSessionResponse> {
  const session = await getServerAuthSession();
  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in.");
  }

  const role = session.user.role;
  if (role === "STUDENT") {
    throw new Error("Unauthorized: Students cannot initiate QR attendance sessions.");
  }

  const classSession = await db.classSession.findUnique({
    where: { id: classSessionId },
    include: {
      class: true,
      subject: true,
      records: { where: { status: "PRESENT" } },
    },
  });

  if (!classSession) {
    throw new Error("Class session not found.");
  }

  if (classSession.verifiedAt) {
    throw new Error("Cannot initiate QR attendance: this session has been verified and locked.");
  }

  // Teacher authorization verification
  if (role === "TEACHER") {
    const teacherProfile = await db.teacherProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!teacherProfile) {
      throw new Error("Teacher profile record not found.");
    }
    const assignment = await db.classTeacherAssignment.findUnique({
      where: {
        classId_teacherId: {
          classId: classSession.classId,
          teacherId: teacherProfile.id,
        },
      },
    });
    if (!assignment) {
      throw new Error("Unauthorized: You are not assigned to instruct this class section.");
    }
  }

  // Generate or preserve session secret
  let qrSecret = classSession.qrSecret;
  if (!qrSecret || !classSession.isQrActive) {
    qrSecret = crypto.randomBytes(32).toString("hex");
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15-minute roll call stream ceiling

  await db.classSession.update({
    where: { id: classSessionId },
    data: {
      isQrActive: true,
      qrSecret,
      qrStartedAt: now,
      qrExpiresAt: expiresAt,
      status: "COMPLETED", // Active roll call session
    },
  });

  // Generate initial token (sequence 1, TTL 15s)
  const { rawString } = generateQrPayload(classSession.id, qrSecret, 1, 15);

  return {
    classSessionId: classSession.id,
    className: classSession.class.name,
    section: classSession.class.section,
    subjectCode: classSession.subject.code,
    subjectName: classSession.subject.name,
    tokenString: rawString,
    seq: 1,
    expiresInSeconds: 15,
    totalCheckinsCount: classSession.records.length,
    isLocked: false,
  };
}

/**
 * Refreshes and returns the next dynamic QR token in the sequence.
 * Called continuously by the teacher's projector screen every 10 seconds.
 */
export async function getActiveQrToken(
  classSessionId: string,
  seq: number
): Promise<{ tokenString: string; seq: number; expiresInSeconds: number; checkinsCount: number }> {
  const session = await getServerAuthSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const classSession = await db.classSession.findUnique({
    where: { id: classSessionId },
    select: {
      id: true,
      isQrActive: true,
      qrSecret: true,
      verifiedAt: true,
      _count: {
        select: { records: { where: { status: "PRESENT" } } },
      },
    },
  });

  if (!classSession || !classSession.isQrActive || !classSession.qrSecret) {
    throw new Error("QR attendance session is not currently active.");
  }

  if (classSession.verifiedAt) {
    throw new Error("Session is locked.");
  }

  const nextSeq = seq + 1;
  const { rawString } = generateQrPayload(classSession.id, classSession.qrSecret, nextSeq, 15);

  return {
    tokenString: rawString,
    seq: nextSeq,
    expiresInSeconds: 15,
    checkinsCount: classSession._count.records,
  };
}

/**
 * Terminates the live QR attendance stream.
 */
export async function stopQrSession(classSessionId: string): Promise<{ success: boolean }> {
  const session = await getServerAuthSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const role = session.user.role;
  if (role === "STUDENT") {
    throw new Error("Unauthorized");
  }

  await db.classSession.update({
    where: { id: classSessionId },
    data: {
      isQrActive: false,
    },
  });

  try {
    revalidatePath(`/attendance`);
  } catch {
    // Non-fatal if invoked outside Next.js request context (e.g. unit tests)
  }
  return { success: true };
}

/**
 * Processes a student's scanned QR attendance check-in.
 * Validates cryptographic signature, token freshness, replay resistance, and class enrollment.
 */
export async function submitQrAttendance(
  qrPayloadString: string,
  clientInfo?: { ip?: string; userAgent?: string }
): Promise<QrCheckinResult> {
  const session = await getServerAuthSession();
  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in to check in via QR code.");
  }

  // 1. Resolve Student Identity strictly from authenticated session
  const studentProfile = await db.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, rollNo: true },
  });

  if (!studentProfile) {
    throw new Error("Student record not found. Only enrolled students can submit QR check-in.");
  }

  // Rate Limiting Guard: Prevent brute-force scripted scans and DoS
  const limitCheck = qrAttendanceLimiter.check(`student:${studentProfile.id}`);
  if (!limitCheck.success) {
    return {
      success: false,
      message: `Too many check-in attempts. Please wait a few seconds before retrying.`,
    };
  }

  // 2. Parse payload preliminarily to find classSessionId
  let prelim: { sid?: string; nonce?: string; seq?: number };
  try {
    prelim = JSON.parse(qrPayloadString);
  } catch {
    return { success: false, message: "Invalid QR code scan." };
  }

  if (!prelim.sid || !prelim.nonce) {
    return { success: false, message: "Malformed QR code." };
  }

  // 3. Fetch ClassSession and QR Secret
  const classSession = await db.classSession.findUnique({
    where: { id: prelim.sid },
    include: {
      class: {
        include: {
          enrollments: {
            where: { studentId: studentProfile.id },
          },
        },
      },
      subject: true,
    },
  });

  if (!classSession) {
    return { success: false, message: "Target attendance session not found." };
  }

  if (!classSession.isQrActive || !classSession.qrSecret) {
    return {
      success: false,
      message: "QR roll call is closed for this session. Please speak to your instructor.",
    };
  }

  if (classSession.verifiedAt) {
    return {
      success: false,
      message: "Attendance has already been finalized and locked for this session.",
    };
  }

  // 4. Verify Cryptographic Signature & Expiration
  const verification = verifyQrPayload(qrPayloadString, classSession.qrSecret, 5);
  if (!verification.isValid || !verification.payload) {
    return {
      success: false,
      message: verification.error || "QR code verification failed.",
    };
  }

  // 5. Verify Student Enrollment in Class
  if (classSession.class.enrollments.length === 0) {
    return {
      success: false,
      message: `You are not enrolled in ${classSession.class.name}. Check-in denied.`,
    };
  }

  // 6. Replay Attack Prevention (Check if nonce was already consumed for this session)
  const existingNonce = await db.qrCheckinLog.findUnique({
    where: {
      classSessionId_nonce: {
        classSessionId: classSession.id,
        nonce: verification.payload.nonce,
      },
    },
  });

  if (existingNonce) {
    return {
      success: false,
      message: "Replay detected: This QR token instance has already been consumed. Please scan the current code on screen.",
    };
  }

  // 7. Check if Student is Already Marked for this session (Idempotent duplicate check)
  const existingRecord = await db.attendanceRecord.findUnique({
    where: {
      classSessionId_studentId: {
        classSessionId: classSession.id,
        studentId: studentProfile.id,
      },
    },
  });

  const now = new Date();

  // Atomically record attendance and nonce usage
  await db.$transaction(async (tx) => {
    // Upsert attendance record
    await tx.attendanceRecord.upsert({
      where: {
        classSessionId_studentId: {
          classSessionId: classSession.id,
          studentId: studentProfile.id,
        },
      },
      create: {
        classSessionId: classSession.id,
        studentId: studentProfile.id,
        status: "PRESENT",
        remarks: `Dynamic QR Check-in (Seq #${verification.payload!.seq})`,
        recordedById: session.user.id,
      },
      update: {
        status: "PRESENT",
        remarks: `Dynamic QR Check-in (Seq #${verification.payload!.seq})`,
        recordedById: session.user.id,
      },
    });

    // Record check-in nonce consumption
    await tx.qrCheckinLog.create({
      data: {
        classSessionId: classSession.id,
        studentId: studentProfile.id,
        nonce: verification.payload!.nonce,
        seqNumber: verification.payload!.seq,
        scannedAt: now,
        ipAddress: clientInfo?.ip,
        userAgent: clientInfo?.userAgent,
      },
    });
  });

  return {
    success: true,
    alreadyRecorded: !!existingRecord,
    message: existingRecord
      ? "Your attendance was already recorded and has been verified."
      : "Attendance successfully recorded!",
    sessionDetails: {
      className: classSession.class.name,
      section: classSession.class.section,
      subjectCode: classSession.subject.code,
      subjectName: classSession.subject.name,
      recordedAt: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    },
  };
}
