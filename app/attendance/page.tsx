import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { AppShell } from "@/components/dashboard/app-shell";
import { TakeAttendanceFlow } from "@/components/attendance/take-attendance-flow";
import { AttendanceNavTabs } from "@/components/attendance/attendance-nav-tabs";
import { getTeacherClasses } from "@/app/attendance/actions";
import { ClipboardCheck } from "lucide-react";

export const metadata = {
  title: "Take Attendance - Smart Attendance System",
  description: "Mark attendance roll calls, record attendance statuses, and submit verified session records.",
};

export default async function AttendancePage() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Students are automatically routed to Attendance History
  if (session.user.role === "STUDENT") {
    redirect("/attendance/history");
  }

  // Role Gate: Only Admin and Teacher are authorized to take attendance
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    redirect("/attendance/history");
  }

  // Fetch teacher's assigned classes (or all classes for admin)
  let classes: Awaited<ReturnType<typeof getTeacherClasses>> = [];
  try {
    classes = await getTeacherClasses();
  } catch (err: unknown) {
    console.error("Failed to load classes for attendance:", err);
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <ClipboardCheck className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Take Attendance
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Select class cohort, verify candidate roster, mark status by exception, and review before submission.
            </p>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <AttendanceNavTabs userRole={session.user.role} />

        {/* Master Attendance Flow */}
        <TakeAttendanceFlow
          initialClasses={classes}
          userRole={session.user.role}
        />
      </div>
    </AppShell>
  );
}
