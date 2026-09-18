"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AttendanceAnalyticsResult,
  StudentReportItem,
  ClassReportItem,
  SubjectReportItem,
  ReportFilterOptions,
} from "@/app/reports/actions";
import { AttendanceAnalyticsView } from "./attendance-analytics-view";
import { StudentReportView } from "./student-report-view";
import { ClassReportView } from "./class-report-view";
import { SubjectReportView } from "./subject-report-view";
import { exportToCSV, triggerPrint } from "@/lib/export-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileBarChart,
  GraduationCap,
  School,
  BookOpen,
  Calendar,
  Download,
  Printer,
  Filter,
} from "lucide-react";

export type ReportTab = "analytics" | "student" | "class" | "subject";

interface ReportsDashboardProps {
  currentTab: ReportTab;
  userRole: string;
  userName: string;
  filterOptions: ReportFilterOptions;
  analyticsData?: AttendanceAnalyticsResult;
  studentReportData?: StudentReportItem;
  classReportData?: ClassReportItem;
  subjectReportData?: SubjectReportItem;
}

export function ReportsDashboard({
  currentTab,
  userRole,
  userName,
  filterOptions,
  analyticsData,
  studentReportData,
  classReportData,
  subjectReportData,
}: ReportsDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local filter states initialized from searchParams
  const [activeTab, setActiveTab] = useState<ReportTab>(currentTab);
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");
  const [selectedClassId, setSelectedClassId] = useState(searchParams.get("classId") || "");
  const [selectedSubjectId, setSelectedSubjectId] = useState(searchParams.get("subjectId") || "");
  const [selectedStudentId, setSelectedStudentId] = useState(
    searchParams.get("studentId") || filterOptions.defaultStudentId || ""
  );

  const applyFilters = (targetTab: ReportTab = activeTab) => {
    startTransition(() => {
      const params = new URLSearchParams();
      params.set("tab", targetTab);

      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (selectedClassId) params.set("classId", selectedClassId);
      if (selectedSubjectId) params.set("subjectId", selectedSubjectId);
      if (selectedStudentId) params.set("studentId", selectedStudentId);

      router.push(`/reports?${params.toString()}`);
    });
  };

  const handleTabChange = (newTab: ReportTab) => {
    setActiveTab(newTab);
    applyFilters(newTab);
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    const timestamp = new Date().toISOString().split("T")[0];

    if (activeTab === "student" && studentReportData) {
      const headers = [
        "Date",
        "Subject Code",
        "Subject Name",
        "Class",
        "Section",
        "Time",
        "Status",
        "Remarks",
      ];
      const rows = studentReportData.records.map((r) => [
        r.date,
        r.subjectCode,
        r.subjectName,
        r.className,
        r.section,
        r.startTime || "Regular",
        r.status,
        r.remarks || "",
      ]);
      exportToCSV(
        `Student_Report_${studentReportData.student.rollNo}_${timestamp}`,
        headers,
        rows
      );
    } else if (activeTab === "class" && classReportData) {
      const headers = [
        "Roll No",
        "Student Name",
        "Email",
        "Total Sessions",
        "Attended",
        "Absent",
        "Late",
        "Excused",
        "Attendance %",
        "Status",
      ];
      const rows = classReportData.students.map((s) => [
        s.rollNo,
        s.name,
        s.email,
        s.totalSessions,
        s.attendedSessions,
        s.absentSessions,
        s.lateSessions,
        s.excusedSessions,
        s.percentage !== null ? `${s.percentage}%` : "N/A",
        s.isBelowThreshold ? "Low Attendance" : "Good Standing",
      ]);
      exportToCSV(
        `Class_Report_${classReportData.classInfo.name}_Section_${classReportData.classInfo.section}_${timestamp}`,
        headers,
        rows
      );
    } else if (activeTab === "subject" && subjectReportData) {
      const headers = [
        "Class Name",
        "Section",
        "Instructor",
        "Enrolled Students",
        "Total Sessions",
        "Attended Records",
        "Total Records",
        "Attendance %",
      ];
      const rows = subjectReportData.classesBreakdown.map((c) => [
        c.name,
        c.section,
        c.teacherName,
        c.enrolledStudents,
        c.totalSessions,
        c.attendedRecords,
        c.totalRecords,
        c.percentage !== null ? `${c.percentage}%` : "N/A",
      ]);
      exportToCSV(
        `Subject_Report_${subjectReportData.subjectInfo.code}_${timestamp}`,
        headers,
        rows
      );
    } else if (activeTab === "analytics" && analyticsData) {
      const headers = ["Entity", "Type", "Sessions Held", "Audited Records", "Attendance %"];
      const rows = [
        ...analyticsData.subjectWise.map((s) => [
          s.name,
          `Subject (${s.code})`,
          s.totalSessions,
          s.totalRecords,
          s.percentage !== null ? `${s.percentage}%` : "N/A",
        ]),
        ...analyticsData.classWise.map((c) => [
          c.className,
          `Class (${c.section})`,
          c.totalSessions,
          c.totalRecords,
          c.percentage !== null ? `${c.percentage}%` : "N/A",
        ]),
      ];
      exportToCSV(`Analytics_Summary_${timestamp}`, headers, rows);
    }
  };

  const tabs = [
    { id: "analytics" as const, label: "Analytics Overview", icon: FileBarChart, allowed: true },
    { id: "student" as const, label: "Student Report", icon: GraduationCap, allowed: true },
    {
      id: "class" as const,
      label: "Class Report",
      icon: School,
      allowed: userRole === "ADMIN" || userRole === "TEACHER",
    },
    {
      id: "subject" as const,
      label: "Subject Report",
      icon: BookOpen,
      allowed: userRole === "ADMIN" || userRole === "TEACHER",
    },
  ].filter((t) => t.allowed);

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Attendance Reports
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Generate and export official attendance reports backed by verified database records
          </p>
        </div>

        {/* Action Buttons: Export & Print */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={triggerPrint}
            className="flex items-center gap-1.5 text-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print View</span>
          </Button>

          <Button
            size="sm"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-px overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? "border-primary text-primary bg-primary/5 rounded-t-lg"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar (Date Range, Class, Subject, Student) */}
      <Card className="border-border/60 bg-muted/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            {/* Start Date */}
            <div className="flex flex-col gap-1 min-w-[130px]">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 px-2.5 py-1 text-xs rounded-md border border-input bg-background font-mono"
              />
            </div>

            {/* End Date */}
            <div className="flex flex-col gap-1 min-w-[130px]">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 px-2.5 py-1 text-xs rounded-md border border-input bg-background font-mono"
              />
            </div>

            {/* Class Selector (Class / Subject / Student reports) */}
            {activeTab !== "subject" && filterOptions.classes.length > 0 && (
              <div className="flex flex-col gap-1 min-w-[180px]">
                <label className="text-xs font-semibold text-muted-foreground">Class Cohort</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="h-9 px-2.5 py-1 text-xs rounded-md border border-input bg-background"
                >
                  <option value="">
                    {activeTab === "class" ? "-- Select Class Section --" : "All Enrolled Classes"}
                  </option>
                  {filterOptions.classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.section}) - {c.subjectCode}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Subject Selector (Subject report or Student report) */}
            {activeTab !== "class" && filterOptions.subjects.length > 0 && (
              <div className="flex flex-col gap-1 min-w-[180px]">
                <label className="text-xs font-semibold text-muted-foreground">Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="h-9 px-2.5 py-1 text-xs rounded-md border border-input bg-background"
                >
                  <option value="">
                    {activeTab === "subject" ? "-- Select Subject Course --" : "All Subjects"}
                  </option>
                  {filterOptions.subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Student Selector (If Admin or Teacher looking at Student Report) */}
            {activeTab === "student" && userRole !== "STUDENT" && filterOptions.students.length > 0 && (
              <div className="flex flex-col gap-1 min-w-[200px]">
                <label className="text-xs font-semibold text-muted-foreground">Target Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="h-9 px-2.5 py-1 text-xs rounded-md border border-input bg-background"
                >
                  <option value="">-- Select Student --</option>
                  {filterOptions.students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.rollNo} - {st.name} {st.className ? `(${st.className})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Apply Filters Button */}
            <div className="flex items-center gap-2 mt-auto">
              <Button
                size="sm"
                onClick={() => applyFilters(activeTab)}
                disabled={isPending}
                className="h-9 flex items-center gap-1.5 text-xs font-semibold"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{isPending ? "Generating..." : "Apply Range"}</span>
              </Button>

              {(startDate || endDate || selectedClassId || selectedSubjectId) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setSelectedClassId("");
                    setSelectedSubjectId("");
                    applyFilters(activeTab);
                  }}
                  className="h-9 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content Panels */}
      <div>
        {activeTab === "analytics" && analyticsData && (
          <AttendanceAnalyticsView
            initialData={analyticsData}
            userRole={userRole}
            userName={userName}
          />
        )}

        {activeTab === "student" && (
          studentReportData ? (
            <StudentReportView data={studentReportData} />
          ) : (
            <div className="p-12 text-center border border-dashed rounded-xl bg-muted/20">
              <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-foreground">Select a Student to View Report</p>
              <p className="text-xs text-muted-foreground mt-1">
                Choose a student from the filter dropdown above to inspect their attendance history.
              </p>
            </div>
          )
        )}

        {activeTab === "class" && (
          classReportData ? (
            <ClassReportView data={classReportData} />
          ) : (
            <div className="p-12 text-center border border-dashed rounded-xl bg-muted/20">
              <School className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-foreground">Select a Class Section</p>
              <p className="text-xs text-muted-foreground mt-1">
                Choose a class cohort from the filter dropdown above to generate the roster report.
              </p>
            </div>
          )
        )}

        {activeTab === "subject" && (
          subjectReportData ? (
            <SubjectReportView data={subjectReportData} />
          ) : (
            <div className="p-12 text-center border border-dashed rounded-xl bg-muted/20">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-foreground">Select a Subject Course</p>
              <p className="text-xs text-muted-foreground mt-1">
                Choose a subject course from the filter dropdown above to generate the subject report.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
