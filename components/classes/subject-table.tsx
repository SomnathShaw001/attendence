"use client";

import { useState, useTransition } from "react";
import { Edit2, Trash2, AlertTriangle, BookMarked, Layers, Search } from "lucide-react";
import { deleteSubject } from "@/app/classes/actions";

export interface SubjectItem {
  id: string;
  code: string;
  name: string;
  credits: number;
  department: string;
  _count?: {
    classes: number;
    classSessions: number;
  };
}

interface SubjectTableProps {
  subjects: SubjectItem[];
  isAdmin: boolean;
  onEdit: (subject: SubjectItem) => void;
  onRefresh: () => void;
}

export function SubjectTable({
  subjects,
  isAdmin,
  onEdit,
  onRefresh,
}: SubjectTableProps) {
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  const departments = Array.from(new Set(subjects.map((s) => s.department).filter(Boolean))).sort();

  const filteredSubjects = subjects.filter((s) => {
    const matchesDept = deptFilter === "all" || s.department === deptFilter;
    if (!matchesDept) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.department.toLowerCase().includes(q);
  });

  const handleDelete = (subject: SubjectItem) => {
    const confirm = window.confirm(
      `Are you sure you want to remove subject "${subject.code} - ${subject.name}" from the curriculum catalog?\n\nSubjects linked to active classes cannot be deleted.`
    );
    if (!confirm) return;

    setActionError(null);
    setActiveSubjectId(subject.id);

    startTransition(async () => {
      try {
        const res = await deleteSubject(subject.id);
        if (!res.success) {
          setActionError(res.error || "Failed to delete subject.");
        } else {
          onRefresh();
        }
      } catch {
        setActionError("An unexpected error occurred while deleting subject.");
      } finally {
        setActiveSubjectId(null);
      }
    });
  };

  if (subjects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
          <BookMarked className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground">Curriculum Catalog Empty</h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
          No courses or academic subjects have been added to the syllabus catalog yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Department Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search subjects by code or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
            {filteredSubjects.length} of {subjects.length} courses
          </span>
        </div>
      </div>

      {actionError && (
        <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-600 dark:text-red-400 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/40 font-medium text-muted-foreground uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-5 py-3.5">Course Code</th>
              <th className="px-4 py-3.5">Course Title</th>
              <th className="px-4 py-3.5">Department</th>
              <th className="px-4 py-3.5">Credits</th>
              <th className="px-4 py-3.5">Active Classes</th>
              {isAdmin && <th className="px-5 py-3.5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredSubjects.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-xs text-muted-foreground">
                  No courses match the active search or department filter.
                </td>
              </tr>
            ) : (
              filteredSubjects.map((sub) => {
                const isItemBusy = isPending && activeSubjectId === sub.id;

                return (
                  <tr key={sub.id} className="hover:bg-muted/30 transition-colors duration-100">
                    {/* Code */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-foreground bg-primary/10 text-primary px-2.5 py-1 rounded text-xs">
                        {sub.code}
                      </span>
                    </td>

                    {/* Title */}
                    <td className="px-4 py-3.5 whitespace-nowrap font-medium text-foreground">
                      {sub.name}
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-md bg-secondary/80 px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">
                        {sub.department}
                      </span>
                    </td>

                    {/* Credits */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground">
                      <span className="font-semibold text-foreground">{sub.credits}</span> credit units
                    </td>

                    {/* Classes count */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                        <Layers className="h-3.5 w-3.5 text-blue-500" />
                        {sub._count?.classes ?? 0}
                      </span>
                    </td>

                    {/* Actions */}
                    {isAdmin && (
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEdit(sub)}
                            disabled={isItemBusy}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            title="Edit Subject"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(sub)}
                            disabled={isItemBusy}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-600 transition-colors"
                            title="Delete Subject (Guarded)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
