"use client";

import { useState } from "react";
import { assignTeacherToClass } from "@/app/classes/actions";
import { Button } from "@/components/ui/button";
import { X, Loader2, UserCheck, AlertCircle } from "lucide-react";

interface ClassAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classId: string;
  availableTeachers: Array<{
    id: string;
    employeeId: string;
    department: string;
    user: {
      name: string;
      email: string;
    };
  }>;
}

export function ClassAssignmentDialog({
  isOpen,
  onClose,
  onSuccess,
  classId,
  availableTeachers,
}: ClassAssignmentDialogProps) {
  const [teacherId, setTeacherId] = useState(availableTeachers[0]?.id || "");
  const [role, setRole] = useState<"PRIMARY" | "ASSISTANT" | "LAB_INSTRUCTOR">("PRIMARY");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId) {
      setError("Please select a faculty member.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await assignTeacherToClass({
        classId,
        teacherId,
        role,
      });

      if (!res.success) {
        setError(res.error || "Failed to assign faculty member.");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
          <div className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Assign Faculty Instructor</h2>
              <p className="text-xs text-muted-foreground">
                Allocate a teacher and designate their instructional role.
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

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {availableTeachers.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            All active faculty members are already assigned to this class.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Faculty Member *
              </label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                required
              >
                {availableTeachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.user.name} ({t.employeeId} - {t.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Teaching Responsibility / Role *
              </label>
              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "PRIMARY" | "ASSISTANT" | "LAB_INSTRUCTOR")
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="PRIMARY">PRIMARY (Lead Course Instructor)</option>
                <option value="ASSISTANT">ASSISTANT (Teaching Assistant)</option>
                <option value="LAB_INSTRUCTOR">LAB_INSTRUCTOR (Laboratory Instructor)</option>
              </select>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border mt-6">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign Faculty
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
