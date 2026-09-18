"use client";

import { Check, X, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RollCallStudent } from "./roll-call-card";

interface AttendanceReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  classNameTitle: string;
  subjectTitle: string;
  dateStr: string;
  items: RollCallStudent[];
}

export function AttendanceReviewDialog({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  classNameTitle,
  subjectTitle,
  dateStr,
  items,
}: AttendanceReviewDialogProps) {
  if (!isOpen) return null;

  const total = items.length;
  const presentStudents = items.filter((i) => i.status === "PRESENT");
  const absentStudents = items.filter((i) => i.status === "ABSENT");
  const lateStudents = items.filter((i) => i.status === "LATE");
  const excusedStudents = items.filter((i) => i.status === "EXCUSED");

  const presentCount = presentStudents.length;
  const absentCount = absentStudents.length;
  const lateCount = lateStudents.length;
  const excusedCount = excusedStudents.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Review Roll Call Submission</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {classNameTitle} • {subjectTitle} • {dateStr}
            </p>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Metrics Breakdown */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-2.5 text-center">
              <span className="text-[11px] font-semibold text-emerald-700 block">Present</span>
              <span className="text-lg font-bold text-emerald-800">{presentCount}</span>
            </div>
            <div className="bg-rose-50 border border-rose-200/60 rounded-xl p-2.5 text-center">
              <span className="text-[11px] font-semibold text-rose-700 block">Absent</span>
              <span className="text-lg font-bold text-rose-800">{absentCount}</span>
            </div>
            <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-2.5 text-center">
              <span className="text-[11px] font-semibold text-amber-700 block">Late</span>
              <span className="text-lg font-bold text-amber-800">{lateCount}</span>
            </div>
            <div className="bg-sky-50 border border-sky-200/60 rounded-xl p-2.5 text-center">
              <span className="text-[11px] font-semibold text-sky-700 block">Excused</span>
              <span className="text-lg font-bold text-sky-800">{excusedCount}</span>
            </div>
          </div>

          {/* Absent Students Confirmation Alert */}
          {absentCount > 0 ? (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>Verify {absentCount} Absent Student{absentCount > 1 ? "s" : ""}:</span>
              </div>
              <ul className="divide-y divide-rose-200/60 text-xs max-h-36 overflow-y-auto pl-1 pr-1">
                {absentStudents.map((s) => (
                  <li key={s.studentId} className="py-1.5 flex items-center justify-between">
                    <span className="font-medium text-rose-900">
                      {s.rollNo ? `[${s.rollNo}] ` : ""}{s.name}
                    </span>
                    <span className="text-[11px] text-rose-700 font-mono">{s.email}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-800 font-medium">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Full Attendance: All {total} enrolled students marked Present or Excused!</span>
            </div>
          )}

          {/* Late or Excused Notes */}
          {(lateCount > 0 || excusedCount > 0) && (
            <div className="border border-slate-200 rounded-xl p-3 space-y-2">
              <span className="text-xs font-semibold text-slate-700 block">
                Exceptions & Remarks ({lateCount + excusedCount}):
              </span>
              <ul className="divide-y divide-slate-100 text-xs max-h-32 overflow-y-auto">
                {[...lateStudents, ...excusedStudents].map((s) => (
                  <li key={s.studentId} className="py-1.5 flex items-start justify-between gap-2">
                    <div>
                      <span className="font-medium text-slate-900">
                        {s.rollNo ? `[${s.rollNo}] ` : ""}{s.name}
                      </span>
                      <span
                        className={`ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                          s.status === "LATE"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-sky-100 text-sky-800"
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                    {s.remarks && (
                      <span className="text-[11px] text-slate-500 italic text-right truncate max-w-[180px]">
                        &ldquo;{s.remarks}&rdquo;
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-slate-500">
            Clicking <strong>Confirm & Submit</strong> will atomically record these {total} attendance entries and log an audit trail entry. You can update individual records later unless the session is locked.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Back to Edit
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Submitting...
              </>
            ) : (
              "Confirm & Submit Attendance"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
