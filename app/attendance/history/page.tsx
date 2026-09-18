import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { AppShell } from "@/components/dashboard/app-shell";
import { AttendanceNavTabs } from "@/components/attendance/attendance-nav-tabs";
import { AttendanceHistoryClientView } from "@/components/attendance/attendance-history-client-view";
import { getAttendanceFilterOptions } from "@/app/attendance/actions";
import { History } from "lucide-react";

export const metadata = {
  title: "Attendance History - Smart Attendance System",
  description: "Inspect historical attendance roll calls, filter by dates, classes, subjects, and view audit trails.",
};

export default async function AttendanceHistoryPage() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Preload filter options scoped to the authenticated user's role
  let filterOptions: Awaited<ReturnType<typeof getAttendanceFilterOptions>> = {
    classes: [],
    subjects: [],
    students: [],
  };

  try {
    filterOptions = await getAttendanceFilterOptions();
  } catch (err: unknown) {
    console.error("Failed to load attendance filter options:", err);
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <History className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Attendance History
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {session.user.role === "STUDENT"
                ? "View your personal session records, attendance statuses, and historical course statistics."
                : "Inspect past attendance roll calls, filter by dates and cohorts, perform authorized adjustments, and trace audit logs."}
            </p>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <AttendanceNavTabs userRole={session.user.role} />

        {/* Interactive History View */}
        <AttendanceHistoryClientView
          initialClasses={filterOptions.classes}
          initialSubjects={filterOptions.subjects}
          initialStudents={filterOptions.students}
          userRole={session.user.role}
        />
      </div>
    </AppShell>
  );
}
