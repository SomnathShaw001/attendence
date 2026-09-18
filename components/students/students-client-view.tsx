"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StudentFilters } from "@/components/students/student-filters";
import { StudentTable, StudentListItem } from "@/components/students/student-table";
import { StudentDialog } from "@/components/students/student-dialog";

interface StudentsClientViewProps {
  students: StudentListItem[];
  batches: string[];
  departments: string[];
  isAdmin: boolean;
}

export function StudentsClientView({
  students,
  batches,
  departments,
  isAdmin,
}: StudentsClientViewProps) {
  const router = useRouter();
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Student Directory</h2>
            <Badge variant="default">
              {students.length} {students.length === 1 ? "Student" : "Students"}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Browse, filter, register, and manage institutional student cohorts.
          </p>
        </div>

        {isAdmin && (
          <Button variant="primary" size="md" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Register Student
          </Button>
        )}
      </div>

      {/* Filters Bar */}
      <StudentFilters batches={batches} departments={departments} />

      {/* Students Data Table */}
      <StudentTable students={students} isAdmin={isAdmin} />

      {/* Add Student Modal */}
      {isAdmin && (
        <StudentDialog
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
