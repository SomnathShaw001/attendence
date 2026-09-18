"use client";

import { useState } from "react";
import { X, Check, Edit3, Loader2, AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AttendanceStatus } from "@/lib/validations/attendance";
import { updateAttendanceRecord } from "@/app/attendance/actions";
import { AttendanceRecordItem } from "./attendance-record-detail-modal";

interface AttendanceEditDialogProps {
  record: AttendanceRecordItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userRole: string;
}

export function AttendanceEditDialog({
  record,
  isOpen,
  onClose,
  onSuccess,
  userRole,
}: AttendanceEditDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>(
    (record?.status as AttendanceStatus) || "PRESENT"
  );
  const [remarks, setRemarks] = useState(record?.remarks || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !record) return null;

  const isLocked = record.classSession.verifiedAt !== null;
  const isAuthorized = userRole === "ADMIN" || (!isLocked && userRole === "TEACHER");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized) {
      setError("Unauthorized: This session is locked or you lack editing permissions.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await updateAttendanceRecord({
        recordId: record.id,
        status: selectedStatus,
        remarks: remarks.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error || "Failed to update attendance record.");
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: unknown) {
      console.error("Failed to update record:", err);
      setError("An unexpected network error occurred while updating.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Edit3 className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Edit Attendance Record</h3>
              <p className="text-xs text-slate-500">
                {record.student.user.name} • [{record.student.rollNo}]
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Lock Warning */}
          {isLocked && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                {userRole === "ADMIN"
                  ? "Administrative Override: This session was locked, but your administrator privileges allow modification."
                  : "Session Locked: This session has been verified. Only administrators can alter locked records."}
              </span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Status Options */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Attendance Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["PRESENT", "ABSENT", "LATE", "EXCUSED"] as AttendanceStatus[]).map((status) => {
                const isSelected = selectedStatus === status;
                const statusStyles: Record<AttendanceStatus, string> = {
                  PRESENT: isSelected
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "border-slate-200 hover:bg-emerald-50 text-slate-700",
                  ABSENT: isSelected
                    ? "bg-rose-600 text-white border-rose-600"
                    : "border-slate-200 hover:bg-rose-50 text-slate-700",
                  LATE: isSelected
                    ? "bg-amber-600 text-white border-amber-600"
                    : "border-slate-200 hover:bg-amber-50 text-slate-700",
                  EXCUSED: isSelected
                    ? "bg-sky-600 text-white border-sky-600"
                    : "border-slate-200 hover:bg-sky-50 text-slate-700",
                };

                return (
                  <button
                    key={status}
                    type="button"
                    disabled={!isAuthorized || isSubmitting}
                    onClick={() => setSelectedStatus(status)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      statusStyles[status]
                    } ${!isAuthorized ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{status}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Remarks Field */}
          <div className="space-y-1.5">
            <label htmlFor="edit-remarks" className="block text-xs font-semibold text-slate-700">
              Remarks & Justification Note
            </label>
            <textarea
              id="edit-remarks"
              rows={3}
              disabled={!isAuthorized || isSubmitting}
              placeholder="e.g., Medical leave slip verified, late due to transit delay, etc."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white disabled:bg-slate-50 disabled:opacity-75"
            />
          </div>

          <p className="text-[11px] text-slate-500">
            All modifications are recorded in the audit trail with before and after values and timestamped.
          </p>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!isAuthorized || isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
