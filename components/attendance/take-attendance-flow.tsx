"use client";

import { useState, useEffect } from "react";
import { AttendanceStatus } from "@/lib/validations/attendance";
import {
  BookOpen,
  GraduationCap,
  Users,
  AlertCircle,
  CheckCircle2,
  Lock,
  Loader2,
  RefreshCw,
  Send,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AttendanceSummaryBar } from "./attendance-summary-bar";
import { RollCallCard, RollCallStudent } from "./roll-call-card";
import { AttendanceReviewDialog } from "./attendance-review-dialog";
import { QrDisplayModal } from "./qr-display-modal";
import { getOrCreateClassSession, submitAttendance } from "@/app/attendance/actions";
import { startQrSession, ActiveQrSessionResponse } from "@/app/attendance/qr/actions";

export interface ClassOption {
  id: string;
  name: string;
  section: string;
  subject: {
    id: string;
    code: string;
    name: string;
  };
  term: {
    id: string;
    name: string;
  };
  _count: {
    enrollments: number;
    classSessions: number;
  };
}

interface TakeAttendanceFlowProps {
  initialClasses: ClassOption[];
  userRole: string;
}

export function TakeAttendanceFlow({ initialClasses, userRole }: TakeAttendanceFlowProps) {
  // Format today's date in local YYYY-MM-DD
  const getTodayDateStr = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // State
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClasses[0]?.id || ""
  );
  const [attendanceDate, setAttendanceDate] = useState<string>(getTodayDateStr());
  const [startTime, setStartTime] = useState<string>("09:00 AM");

  // Loaded Session State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionMeta, setSessionMeta] = useState<{
    status: string;
    verifiedAt: Date | null;
    teacherName: string;
  } | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // Student Roll Call
  const [items, setItems] = useState<RollCallStudent[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState(Boolean(initialClasses[0]?.id));
  const [fetchTrigger, setFetchTrigger] = useState(0);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | AttendanceStatus>("ALL");

  // Submission & Feedback State
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrModalSession, setQrModalSession] = useState<ActiveQrSessionResponse | null>(null);
  const [isStartingQr, setIsStartingQr] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const selectedClass = initialClasses.find((c) => c.id === selectedClassId);

  const handleLaunchQr = async () => {
    if (!sessionId) return;
    setIsStartingQr(true);
    setFeedback(null);
    try {
      const res = await startQrSession(sessionId);
      setQrModalSession(res);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to launch QR roll call.";
      setFeedback({ type: "error", message: errMsg });
    } finally {
      setIsStartingQr(false);
    }
  };

  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    setIsLoadingSession(true);
    setFeedback(null);
  };

  const handleDateChange = (newDate: string) => {
    setAttendanceDate(newDate);
    setIsLoadingSession(true);
    setFeedback(null);
  };

  const handleRefresh = () => {
    setIsLoadingSession(true);
    setFeedback(null);
    setFetchTrigger((prev) => prev + 1);
  };

  // Fetch session data asynchronously on parameter change
  useEffect(() => {
    let ignore = false;
    if (!selectedClassId) {
      return;
    }

    getOrCreateClassSession({
      classId: selectedClassId,
      date: attendanceDate,
      startTime,
    })
      .then((res) => {
        if (ignore) return;
        setIsLoadingSession(false);
        if (!res.success || !res.session || !res.rollCallItems) {
          setFeedback({
            type: "error",
            message: res.error || "Failed to load class session.",
          });
          setItems([]);
          setSessionId(null);
          setSessionMeta(null);
          setIsLocked(false);
        } else {
          setSessionId(res.session.id);
          setIsLocked(Boolean(res.isLocked));
          setSessionMeta({
            status: res.session.status,
            verifiedAt: res.session.verifiedAt,
            teacherName: res.session.teacherName,
          });

          // Set roll call candidates
          setItems(
            res.rollCallItems.map((item) => ({
              ...item,
              status: (item.status as AttendanceStatus) || "PRESENT",
              remarks: item.remarks || "",
            }))
          );
        }
      })
      .catch((err: unknown) => {
        if (ignore) return;
        console.error("Failed to load roll call:", err);
        setIsLoadingSession(false);
        setFeedback({
          type: "error",
          message: "Network error occurred while fetching class session.",
        });
      });

    return () => {
      ignore = true;
    };
  }, [selectedClassId, attendanceDate, startTime, fetchTrigger]);

  // Handler: Change Individual Student Status
  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    if (isLocked) return;
    setItems((prev) =>
      prev.map((item) =>
        item.studentId === studentId ? { ...item, status: newStatus } : item
      )
    );
  };

  // Handler: Change Individual Remarks
  const handleRemarksChange = (studentId: string, remarks: string) => {
    if (isLocked) return;
    setItems((prev) =>
      prev.map((item) =>
        item.studentId === studentId ? { ...item, remarks } : item
      )
    );
  };

  // Handler: Bulk Mark All Present
  const handleMarkAllPresent = () => {
    if (isLocked) return;
    setItems((prev) =>
      prev.map((item) => ({ ...item, status: "PRESENT" as AttendanceStatus }))
    );
  };

  // Handler: Bulk Mark All Absent
  const handleMarkAllAbsent = () => {
    if (isLocked) return;
    setItems((prev) =>
      prev.map((item) => ({ ...item, status: "ABSENT" as AttendanceStatus }))
    );
  };

  // Handler: Final Submission
  const handleSubmitAttendance = async () => {
    if (!sessionId) {
      setFeedback({ type: "error", message: "No active session loaded." });
      setIsReviewOpen(false);
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payload = {
        sessionId,
        entries: items.map((item) => ({
          studentId: item.studentId,
          status: item.status,
          remarks: item.remarks ? item.remarks.trim() : null,
        })),
      };

      const res = await submitAttendance(payload);

      if (!res.success) {
        setFeedback({
          type: "error",
          message: res.error || "Failed to submit attendance roll call.",
        });
      } else {
        setFeedback({
          type: "success",
          message: `Attendance submitted successfully for ${res.count || items.length} students! Session is now completed.`,
        });
        if (sessionMeta) {
          setSessionMeta({ ...sessionMeta, status: "COMPLETED" });
        }
      }
    } catch (err: unknown) {
      console.error("Error submitting attendance:", err);
      setFeedback({
        type: "error",
        message: "An unexpected network error occurred while submitting attendance. Your marks have been preserved.",
      });
    } finally {
      setIsSubmitting(false);
      setIsReviewOpen(false);
    }
  };

  // Filtered students for display
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate live counts
  const presentCount = items.filter((i) => i.status === "PRESENT").length;
  const absentCount = items.filter((i) => i.status === "ABSENT").length;
  const lateCount = items.filter((i) => i.status === "LATE").length;
  const excusedCount = items.filter((i) => i.status === "EXCUSED").length;

  // No Classes Assigned Empty State
  if (initialClasses.length === 0) {
    return (
      <EmptyState
        title="No Classes Available"
        description={
          userRole === "TEACHER"
            ? "You are not currently assigned to any active class sections. Please contact an administrator to be assigned to a class."
            : "No classes exist in the system yet. Create a class and enroll students to start taking attendance."
        }
        icon={GraduationCap}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Controls & Class Selection Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Class Selector & Auto Subject Display */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="class-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Class Section
              </label>
              <select
                id="class-select"
                value={selectedClassId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                {initialClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} (Sec {cls.section}) • {cls.subject.code} ({cls._count.enrollments} enrolled)
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Readout (Auto-bound) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Subject
              </label>
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 h-10">
                <BookOpen className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span className="truncate">
                  {selectedClass?.subject.name}
                </span>
                <span className="text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-mono border border-indigo-200/60 ml-auto">
                  {selectedClass?.subject.code}
                </span>
              </div>
            </div>
          </div>

          {/* Date & Time Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="attendance-date" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Attendance Date
              </label>
              <div className="relative">
                <input
                  id="attendance-date"
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="start-time" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Session Time
              </label>
              <div className="relative">
                <input
                  id="start-time"
                  type="text"
                  placeholder="e.g. 09:00 AM"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Session Metadata Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              {items.length} Enrolled Student{items.length !== 1 ? "s" : ""}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">Status:</span>
              <Badge
                variant={
                  sessionMeta?.status === "COMPLETED"
                    ? "success"
                    : sessionMeta?.status === "IN_PROGRESS"
                    ? "warning"
                    : "default"
                }
              >
                {sessionMeta?.status || "SCHEDULED"}
              </Badge>
            </span>
            {isLocked && (
              <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[11px] font-semibold">
                <Lock className="w-3 h-3 text-amber-600" />
                Session Locked & Verified (Read-Only)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isLocked && sessionId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoadingSession || isStartingQr}
                onClick={handleLaunchQr}
                className="text-xs h-7 text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-semibold"
              >
                <QrCode className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                {isStartingQr ? "Starting QR..." : "Launch QR Roll Call"}
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isLoadingSession}
              onClick={handleRefresh}
              className="text-xs h-7 text-slate-500 hover:text-slate-800"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoadingSession ? "animate-spin" : ""}`} />
              Refresh Roster
            </Button>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-sm font-medium">
            {feedback.message}
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold hover:opacity-75"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoadingSession ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-700">Loading enrolled roster & attendance session...</p>
        </div>
      ) : items.length === 0 ? (
        /* Empty Roster State */
        <EmptyState
          title="No Students Enrolled"
          description={`No students are currently enrolled in "${selectedClass?.name}". Please enroll students via Class Management before taking attendance.`}
          icon={Users}
        />
      ) : (
        /* Roll Call Workspace */
        <div className="space-y-4">
          {/* Summary Metrics & Quick Action Bar */}
          <AttendanceSummaryBar
            total={items.length}
            presentCount={presentCount}
            absentCount={absentCount}
            lateCount={lateCount}
            excusedCount={excusedCount}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onMarkAllPresent={handleMarkAllPresent}
            onMarkAllAbsent={handleMarkAllAbsent}
            isReadOnly={isLocked}
          />

          {/* Student Roster Grid */}
          <div className="space-y-2">
            {filteredItems.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center text-sm text-slate-500">
                No students match the current search or filter criteria.
              </div>
            ) : (
              filteredItems.map((student, idx) => (
                <RollCallCard
                  key={student.studentId}
                  item={student}
                  index={idx}
                  onStatusChange={handleStatusChange}
                  onRemarksChange={handleRemarksChange}
                  isReadOnly={isLocked}
                />
              ))
            )}
          </div>

          {/* Floating / Bottom Review & Submit Bar */}
          {!isLocked && (
            <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-300/80 shadow-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-600 flex items-center gap-3">
                <span className="font-semibold text-slate-900">
                  Total: {items.length} students
                </span>
                <span>•</span>
                <span className="text-emerald-700 font-semibold">{presentCount} Present</span>
                <span>•</span>
                <span className="text-rose-700 font-semibold">{absentCount} Absent</span>
                <span>•</span>
                <span className="text-amber-700 font-semibold">{lateCount} Late</span>
                <span>•</span>
                <span className="text-sky-700 font-semibold">{excusedCount} Excused</span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => setIsReviewOpen(true)}
                  disabled={items.length === 0 || isSubmitting}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Review & Submit Attendance
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review Dialog */}
      <AttendanceReviewDialog
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onConfirm={handleSubmitAttendance}
        isSubmitting={isSubmitting}
        classNameTitle={`${selectedClass?.name || ""} (${selectedClass?.section || ""})`}
        subjectTitle={`${selectedClass?.subject.code || ""} - ${selectedClass?.subject.name || ""}`}
        dateStr={attendanceDate}
        items={items}
      />

      {/* Live QR Roll Call Modal */}
      {qrModalSession && (
        <QrDisplayModal
          initialSession={qrModalSession}
          onClose={() => {
            setQrModalSession(null);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}
