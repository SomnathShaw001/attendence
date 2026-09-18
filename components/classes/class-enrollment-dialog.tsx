"use client";

import { useState } from "react";
import { enrollStudentInClass, batchEnrollStudents } from "@/app/classes/actions";
import { Button } from "@/components/ui/button";
import { X, Loader2, UserPlus, AlertCircle, Search, Users } from "lucide-react";

interface ClassEnrollmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classId: string;
  availableStudents: Array<{
    id: string;
    rollNo: string;
    batch: string;
    department: string;
    user: {
      name: string;
      email: string;
    };
  }>;
  availableBatches?: string[];
  availableDepartments?: string[];
}

export function ClassEnrollmentDialog({
  isOpen,
  onClose,
  onSuccess,
  classId,
  availableStudents,
  availableBatches = [],
  availableDepartments = [],
}: ClassEnrollmentDialogProps) {
  const [mode, setMode] = useState<"single" | "batch">("single");

  // Single student state
  const [studentId, setStudentId] = useState(availableStudents[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");

  // Batch enrollment state
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [selectedDept, setSelectedDept] = useState("all");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredCandidates = availableStudents.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.rollNo.toLowerCase().includes(q) ||
      s.user.name.toLowerCase().includes(q) ||
      s.batch.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q)
    );
  });

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      setError("Please select a student to enroll.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessNote(null);

    try {
      const res = await enrollStudentInClass({
        classId,
        studentId,
      });

      if (!res.success) {
        setError(res.error || "Failed to enroll student.");
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBatch === "all" && selectedDept === "all") {
      setError("Please select at least a batch or department to batch enroll.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessNote(null);

    try {
      const res = await batchEnrollStudents(classId, {
        batch: selectedBatch !== "all" ? selectedBatch : undefined,
        department: selectedDept !== "all" ? selectedDept : undefined,
      });

      if (!res.success) {
        setError(res.error || "Failed to batch enroll students.");
        setLoading(false);
        return;
      }

      setSuccessNote(`Successfully enrolled ${res.count} student(s) into this class!`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 800);
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Enroll Students</h2>
              <p className="text-xs text-muted-foreground">
                Register individuals or entire cohorts into this class section.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex rounded-lg bg-muted/60 p-1 mb-4">
          <button
            type="button"
            onClick={() => {
              setMode("single");
              setError(null);
            }}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
              mode === "single"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Single Student
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("batch");
              setError(null);
            }}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
              mode === "batch"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Batch Cohort Enrollment
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successNote && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
            <Users className="h-4 w-4 shrink-0" />
            <span>{successNote}</span>
          </div>
        )}

        {mode === "single" ? (
          availableStudents.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              All active students are currently enrolled in this class section.
            </div>
          ) : (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Filter Candidates
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by student name, roll number, or batch..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Select Student ({filteredCandidates.length} available) *
                </label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 max-h-48"
                  size={6}
                  required
                >
                  {filteredCandidates.map((s) => (
                    <option key={s.id} value={s.id} className="py-1">
                      {s.rollNo} — {s.user.name} ({s.department} • Batch {s.batch})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border mt-6">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !studentId}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enroll Student
                </Button>
              </div>
            </form>
          )
        ) : (
          <form onSubmit={handleBatchSubmit} className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Automatically register all active students matching the chosen academic cohort into this class section.
            </p>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Target Batch / Cohort
              </label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="all">Any / All Batches</option>
                {availableBatches.map((b) => (
                  <option key={b} value={b}>
                    Batch {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Academic Department
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="all">Any / All Departments</option>
                {availableDepartments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
              Students already enrolled in this class will be automatically skipped without duplicates.
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border mt-6">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enroll Cohort
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
