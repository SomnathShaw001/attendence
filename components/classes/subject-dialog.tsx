"use client";

import { useState } from "react";
import { createSubject, updateSubject } from "@/app/classes/actions";
import type { SubjectInput } from "@/lib/validations/class";
import { Button } from "@/components/ui/button";
import { X, Loader2, BookmarkPlus, Edit3, AlertCircle } from "lucide-react";

interface SubjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subjectToEdit?: {
    id: string;
    code: string;
    name: string;
    credits: number;
    department: string;
  } | null;
}

const DEPARTMENTS = [
  "Computer Science",
  "Information Technology",
  "Electronics & Communication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Mathematics",
  "Physics",
  "Humanities & Management",
];

export function SubjectDialog({
  isOpen,
  onClose,
  onSuccess,
  subjectToEdit,
}: SubjectDialogProps) {
  const isEditing = !!subjectToEdit;

  const [formData, setFormData] = useState<SubjectInput>({
    code: subjectToEdit?.code || "",
    name: subjectToEdit?.name || "",
    credits: subjectToEdit?.credits || 3,
    department: subjectToEdit?.department || "Computer Science",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing && subjectToEdit) {
        const res = await updateSubject(subjectToEdit.id, formData);
        if (!res.success) {
          setError(res.error || "Failed to update subject.");
          setLoading(false);
          return;
        }
      } else {
        const res = await createSubject(formData);
        if (!res.success) {
          setError(res.error || "Failed to add course subject.");
          setLoading(false);
          return;
        }
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
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
          <div className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {isEditing ? <Edit3 className="h-5 w-5" /> : <BookmarkPlus className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {isEditing ? "Edit Subject Catalog Entry" : "Add Course Subject"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isEditing
                  ? "Update syllabus details, course codes, and credit units."
                  : "Introduce a new academic subject to the institutional curriculum."}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Course Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CS301"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground uppercase font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Course Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Operating Systems"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Department *
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Credits (Units) *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={formData.credits}
                onChange={(e) =>
                  setFormData({ ...formData, credits: parseInt(e.target.value) || 3 })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add to Catalog"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
