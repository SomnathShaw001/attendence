import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { AppShell } from "@/components/dashboard/app-shell";
import {
  getAdminDashboardData,
  getTeacherDashboardData,
  getStudentDashboardData,
} from "@/lib/dashboard-data";
import { AdminDashboardView } from "@/components/dashboard/admin-dashboard-view";
import { TeacherDashboardView } from "@/components/dashboard/teacher-dashboard-view";
import { StudentDashboardView } from "@/components/dashboard/student-dashboard-view";

export default async function DashboardPage() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;

  if (role === "ADMIN") {
    const adminData = await getAdminDashboardData();
    return (
      <AppShell>
        <AdminDashboardView data={adminData} />
      </AppShell>
    );
  }

  if (role === "TEACHER") {
    const teacherData = await getTeacherDashboardData(session.user.id);
    return (
      <AppShell>
        <TeacherDashboardView data={teacherData} />
      </AppShell>
    );
  }

  // Default to STUDENT role
  const studentData = await getStudentDashboardData(session.user.id);
  return (
    <AppShell>
      <StudentDashboardView data={studentData} />
    </AppShell>
  );
}
