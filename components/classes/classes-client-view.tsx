"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClassTable, type ClassItem } from "./class-table";
import { SubjectTable, type SubjectItem } from "./subject-table";
import { ClassFilters } from "./class-filters";
import { ClassDialog } from "./class-dialog";
import { SubjectDialog } from "./subject-dialog";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  BookMarked,
  Users,
  UserCheck,
  Plus,
} from "lucide-react";

interface ClassesClientViewProps {
  classes: ClassItem[];
  subjects: SubjectItem[];
  terms: Array<{ id: string; name: string; isCurrent: boolean }>;
  departments: string[];
  stats: {
    totalClasses: number;
    totalSubjects: number;
    totalEnrollments: number;
    totalAssignments: number;
  };
  isAdmin: boolean;
}

export function ClassesClientView({
  classes,
  subjects,
  terms,
  departments,
  stats,
  isAdmin,
}: ClassesClientViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"classes" | "subjects">("classes");

  // Dialog states
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
  const [classToEdit, setClassToEdit] = useState<ClassItem | null>(null);

  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<SubjectItem | null>(null);

  const handleOpenAddClass = () => {
    setClassToEdit(null);
    setIsClassDialogOpen(true);
  };

  const handleOpenEditClass = (item: ClassItem) => {
    setClassToEdit(item);
    setIsClassDialogOpen(true);
  };

  const handleOpenAddSubject = () => {
    setSubjectToEdit(null);
    setIsSubjectDialogOpen(true);
  };

  const handleOpenEditSubject = (item: SubjectItem) => {
    setSubjectToEdit(item);
    setIsSubjectDialogOpen(true);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Academic Classes & Curriculum
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage course sections, departmental syllabi, instructional allocations, and enrollments.
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenAddSubject}
              className="gap-1.5 text-xs h-9"
            >
              <Plus className="h-4 w-4" />
              Add Subject
            </Button>
            <Button
              size="sm"
              onClick={handleOpenAddClass}
              className="gap-1.5 text-xs h-9"
            >
              <Plus className="h-4 w-4" />
              Establish Class
            </Button>
          </div>
        )}
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Classes */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Class Sections</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{stats.totalClasses}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Scheduled course cohorts</p>
        </div>

        {/* Subjects Catalog */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Course Subjects</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <BookMarked className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{stats.totalSubjects}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Curriculum subjects catalog</p>
        </div>

        {/* Enrolled Students */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Class Enrollments</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{stats.totalEnrollments}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Total student placements</p>
        </div>

        {/* Teaching Allocations */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Faculty Allocations</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{stats.totalAssignments}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Instructor class assignments</p>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="border-b border-border">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab("classes")}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === "classes"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Class Sections ({classes.length})
          </button>
          <button
            onClick={() => setActiveTab("subjects")}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === "subjects"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookMarked className="h-4 w-4" />
            Subject Catalog ({subjects.length})
          </button>
        </div>
      </div>

      {/* Active Tab Content */}
      {activeTab === "classes" ? (
        <div className="space-y-4">
          <ClassFilters terms={terms} departments={departments} />
          <ClassTable
            classes={classes}
            isAdmin={isAdmin}
            onEdit={handleOpenEditClass}
            onRefresh={handleSuccess}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <SubjectTable
            subjects={subjects}
            isAdmin={isAdmin}
            onEdit={handleOpenEditSubject}
            onRefresh={handleSuccess}
          />
        </div>
      )}

      {/* Class Add/Edit Dialog */}
      <ClassDialog
        isOpen={isClassDialogOpen}
        onClose={() => {
          setIsClassDialogOpen(false);
          setClassToEdit(null);
        }}
        onSuccess={handleSuccess}
        subjects={subjects}
        terms={terms}
        classToEdit={classToEdit}
      />

      {/* Subject Add/Edit Dialog */}
      <SubjectDialog
        isOpen={isSubjectDialogOpen}
        onClose={() => {
          setIsSubjectDialogOpen(false);
          setSubjectToEdit(null);
        }}
        onSuccess={handleSuccess}
        subjectToEdit={subjectToEdit}
      />
    </div>
  );
}
