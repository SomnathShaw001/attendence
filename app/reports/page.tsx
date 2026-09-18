import {
  getAttendanceAnalytics,
  generateStudentReport,
  generateClassReport,
  generateSubjectReport,
  getReportFilterOptions,
  StudentReportItem,
  ClassReportItem,
  SubjectReportItem,
  AttendanceAnalyticsResult,
} from "./actions";
import { ReportsDashboard, ReportTab } from "@/components/reports/reports-dashboard";
import { getServerAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Attendance Reports & Analytics | Attendance System",
  description: "Official institutional attendance reports, student performance, and class analytics",
};

interface ReportsPageProps {
  searchParams: Promise<{
    tab?: string;
    timeframe?: "7d" | "30d" | "90d" | "all";
    classId?: string;
    subjectId?: string;
    studentId?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const role = session.user.role;

  // Default tab selection by role
  let tab: ReportTab = (resolvedParams.tab as ReportTab) || (role === "STUDENT" ? "student" : "analytics");

  // Prevent students from attempting unauthorized tab access
  if (role === "STUDENT" && (tab === "class" || tab === "subject")) {
    tab = "student";
  }

  // Fetch role-scoped filter choices
  const filterOptions = await getReportFilterOptions();

  let analyticsData: AttendanceAnalyticsResult | undefined;
  let studentReportData: StudentReportItem | undefined;
  let classReportData: ClassReportItem | undefined;
  let subjectReportData: SubjectReportItem | undefined;

  try {
    if (tab === "analytics") {
      const timeframe = resolvedParams.timeframe || "30d";
      analyticsData = await getAttendanceAnalytics({
        timeframe,
        classId: resolvedParams.classId,
        subjectId: resolvedParams.subjectId,
      });
    } else if (tab === "student") {
      const targetStudentId =
        role === "STUDENT"
          ? filterOptions.defaultStudentId
          : resolvedParams.studentId || filterOptions.students[0]?.id;

      if (targetStudentId) {
        studentReportData = await generateStudentReport({
          studentId: targetStudentId,
          startDate: resolvedParams.startDate,
          endDate: resolvedParams.endDate,
          subjectId: resolvedParams.subjectId,
        });
      }
    } else if (tab === "class") {
      const targetClassId = resolvedParams.classId || filterOptions.classes[0]?.id;
      if (targetClassId) {
        classReportData = await generateClassReport({
          classId: targetClassId,
          startDate: resolvedParams.startDate,
          endDate: resolvedParams.endDate,
        });
      }
    } else if (tab === "subject") {
      const targetSubjectId = resolvedParams.subjectId || filterOptions.subjects[0]?.id;
      if (targetSubjectId) {
        subjectReportData = await generateSubjectReport({
          subjectId: targetSubjectId,
          classId: resolvedParams.classId,
          startDate: resolvedParams.startDate,
          endDate: resolvedParams.endDate,
        });
      }
    }
  } catch (err: unknown) {
    console.error("Error generating report data on server:", err);
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
      <ReportsDashboard
        currentTab={tab}
        userRole={role}
        userName={session.user.name || "User"}
        filterOptions={filterOptions}
        analyticsData={analyticsData}
        studentReportData={studentReportData}
        classReportData={classReportData}
        subjectReportData={subjectReportData}
      />
    </div>
  );
}
