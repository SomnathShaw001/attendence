"use client";

import { useEffect, useState } from "react";
import { X, BookOpen, GraduationCap, Lock, ShieldCheck, FileText, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { getAttendanceRecordAuditHistory } from "@/app/attendance/actions";

export interface AttendanceRecordItem {
  id: string;
  status: string;
  remarks: string | null;
  recordedById: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  student: {
    id: string;
    rollNo: string;
    batch: string;
    department: string;
    user: {
      name: string;
      email: string;
      image: string | null;
      isActive: boolean;
    };
  };
  classSession: {
    id: string;
    date: Date | string;
    startTime: string | null;
    endTime: string | null;
    room: string | null;
    status: string;
    verifiedAt: Date | string | null;
    class: {
      id: string;
      name: string;
      section: string;
    };
    subject: {
      id: string;
      code: string;
      name: string;
      credits: number;
    };
    teacher: {
      user: {
        name: string;
        email: string;
      };
    };
  };
}

interface AttendanceRecordDetailModalProps {
  record: AttendanceRecordItem | null;
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  details: string | null;
  createdAt: Date | string;
  performedBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export function AttendanceRecordDetailModal({
  record,
  isOpen,
  onClose,
  userRole,
}: AttendanceRecordDetailModalProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(true);
  const [auditError, setAuditError] = useState<string | null>(null);

  const isStaff = userRole === "ADMIN" || userRole === "TEACHER";

  useEffect(() => {
    let ignore = false;
    if (!isOpen || !record || !isStaff) {
      return;
    }

    getAttendanceRecordAuditHistory(record.id)
      .then((res) => {
        if (ignore) return;
        setIsLoadingAudit(false);
        if (res.success && res.logs) {
          setAuditLogs(res.logs);
        } else {
          setAuditError(res.error || "Failed to load audit trail.");
        }
      })
      .catch((err: unknown) => {
        if (ignore) return;
        console.error("Audit load error:", err);
        setIsLoadingAudit(false);
        setAuditError("Network error while fetching audit history.");
      });

    return () => {
      ignore = true;
    };
  }, [isOpen, record, isStaff]);

  if (!isOpen || !record) return null;

  const isLocked = record.classSession.verifiedAt !== null;

  const statusVariantMap: Record<string, "success" | "danger" | "warning" | "default"> = {
    PRESENT: "success",
    ABSENT: "danger",
    LATE: "warning",
    EXCUSED: "default",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Attendance Record Details</h3>
              <p className="text-xs text-slate-500">
                {record.classSession.class.name} • {record.classSession.subject.code}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Status & Session Summary Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-slate-500 block mb-1 font-medium">Recorded Status</span>
              <div className="flex items-center gap-2">
                <Badge
                  variant={statusVariantMap[record.status] || "default"}
                  className="text-sm px-3 py-1 font-bold"
                >
                  {record.status}
                </Badge>
                {isLocked && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Lock className="w-3 h-3 text-amber-600" />
                    Session Verified & Locked
                  </span>
                )}
              </div>
            </div>

            <div className="text-right sm:text-right">
              <span className="text-slate-500 block mb-0.5">Session Date</span>
              <span className="text-sm font-semibold text-slate-900">
                {formatDate(record.classSession.date)}
              </span>
              {record.classSession.startTime && (
                <span className="text-slate-500 block">
                  {record.classSession.startTime}
                  {record.classSession.endTime ? ` - ${record.classSession.endTime}` : ""}
                </span>
              )}
            </div>
          </div>

          {/* Student Profile Card */}
          <div className="border border-slate-200/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-900 border-b border-slate-100 pb-2">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>Student Information</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <span className="text-slate-500 block">Roll Number</span>
                <span className="font-semibold text-slate-800 font-mono text-sm">
                  {record.student.rollNo}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Student Name</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {record.student.user.name}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Email Address</span>
                <span className="text-slate-700 font-medium truncate block">
                  {record.student.user.email}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Department & Batch</span>
                <span className="text-slate-700 font-medium">
                  {record.student.department || "General"} ({record.student.batch || "2026"})
                </span>
              </div>
            </div>
          </div>

          {/* Session & Course Details */}
          <div className="border border-slate-200/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-900 border-b border-slate-100 pb-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Session & Curriculum Context</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <span className="text-slate-500 block">Course Subject</span>
                <span className="font-semibold text-slate-800">
                  {record.classSession.subject.code} - {record.classSession.subject.name}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Class Section</span>
                <span className="font-semibold text-slate-800">
                  {record.classSession.class.name} (Sec {record.classSession.class.section})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Instructor</span>
                <span className="text-slate-800 font-medium">
                  {record.classSession.teacher.user.name}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Classroom / Venue</span>
                <span className="text-slate-800 font-medium">
                  {record.classSession.room || "Main Lecture Hall"}
                </span>
              </div>
            </div>
          </div>

          {/* Justification / Remarks */}
          <div className="border border-slate-200/80 rounded-xl p-4 space-y-1.5">
            <span className="text-slate-600 font-semibold block">Remarks & Excuse Justification</span>
            <div className="p-3 bg-slate-50 rounded-lg text-slate-700 italic">
              {record.remarks ? `"${record.remarks}"` : "No special remarks or excuse notes recorded."}
            </div>
          </div>

          {/* Timestamps & Tracking */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-slate-500 pt-2 border-t border-slate-100 text-[11px]">
            <span>
              Recorded on: <strong className="text-slate-700">{formatDate(record.createdAt)}</strong>
            </span>
            <span>
              Last updated: <strong className="text-slate-700">{formatDate(record.updatedAt)}</strong>
            </span>
          </div>

          {/* Embedded Audit Trail (Authorized Staff Only) */}
          {isStaff && (
            <div className="border border-slate-200/80 rounded-xl p-4 space-y-3 pt-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Audit Trail & Change History</span>
                </div>
                {isLoadingAudit && <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />}
              </div>

              {auditError && (
                <div className="p-2.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{auditError}</span>
                </div>
              )}

              {!isLoadingAudit && auditLogs.length === 0 && !auditError && (
                <p className="text-slate-500 italic py-1">
                  Original record entry. No subsequent alterations recorded in the audit log.
                </p>
              )}

              {auditLogs.length > 0 && (
                <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto pr-1">
                  {auditLogs.map((log) => {
                    let parsedDetails: {
                      previous?: { status?: string; remarks?: string | null };
                      updated?: { status?: string; remarks?: string | null };
                    } = {};
                    try {
                      if (log.details) {
                        parsedDetails = JSON.parse(log.details);
                      }
                    } catch {
                      // Fallback
                    }

                    return (
                      <div key={log.id} className="py-2 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-800">
                            {log.action} by {log.performedBy?.name || "System"} ({log.performedBy?.role || "SYSTEM"})
                          </span>
                          <span className="text-slate-400 font-mono">
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                        {parsedDetails.previous && parsedDetails.updated && (
                          <div className="text-[11px] text-slate-600 flex items-center gap-2 flex-wrap">
                            <span>
                              Status: <strong className="line-through text-slate-400">{parsedDetails.previous.status}</strong> →{" "}
                              <strong className="text-emerald-700">{parsedDetails.updated.status}</strong>
                            </span>
                            {parsedDetails.updated.remarks !== parsedDetails.previous.remarks && (
                              <span className="italic text-slate-500">
                                (Note: &ldquo;{parsedDetails.updated.remarks || "cleared"}&rdquo;)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
