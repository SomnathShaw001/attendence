"use client";

import { useState } from "react";
import { createClass, updateClass } from "@/app/classes/actions";
import type { ClassInput } from "@/lib/validations/class";
import { Button } from "@/components/ui/button";
import { X, Loader2, BookOpen, Edit3, AlertCircle } from "lucide-react";

interface ClassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subjects: Array<{ id: string; code: string; name: string }>;
  terms: Array<{ id: string; name: string; isCurrent: boolean }>;
  classToEdit?: {
    id: string;
    name: string;
    section: string;
    subjectId: string;
    termId: string;
  } | null;
}

export function ClassDialog({
  isOpen,
  onClose,
  onSuccess,
  subjects,
  terms,
  classToEdit,
}: ClassDialogProps) {
  const isEditing = !!classToEdit;

  const [formData, setFormData] = useState<ClassInput>({
    name: classToEdit?.name || "",
    section: classToEdit?.section || "A",
    subjectId: classToEdit?.subjectId || subjects[0]?.id || "",
    termId: classToEdit?.termId || terms.find((t) => t.isCurrent)?.id || terms[0]?.id || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing && classToEdit) {
        const res = await updateClass(classToEdit.id, formData);
        if (!res.success) {
          setError(res.error || "Failed to update class section.");
          setLoading(false);
          return;
        }
      } else {
        const res = await createClass(formData);
        if (!res.success) {
          setError(res.error || "Failed to create class section.");
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
              {isEditing ? <Edit3 className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {isEditing ? "Edit Class Section" : "Create Class Section"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isEditing
                  ? "Update class cohort name, section, or subject mapping."
                  : "Establish a new academic course section and timetable group."}
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
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Academic Subject *
            </label>
            <select
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code} — {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Academic Term / Semester *
            </label>
            <select
              value={formData.termId}
              onChange={(e) => setFormData({ ...formData, termId: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            >
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name} {term.isCurrent ? "(Current Active Term)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Class Cohort Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CSE-3A (DBMS)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Section *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. A, B, LAB-1"
                value={formData.section}
                onChange={(e) =>
                  setFormData({ ...formData, section: e.target.value.toUpperCase() })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground uppercase focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Establish Class"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
