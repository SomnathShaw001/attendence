"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AttendanceAnalyticsResult,
  DebarmentRiskStudent,
} from "@/app/reports/actions";
import { DonutChart, BarChart, TrendChart } from "@/components/charts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  School,
  TrendingUp,
} from "lucide-react";

interface AttendanceAnalyticsViewProps {
  initialData: AttendanceAnalyticsResult;
  userRole: string;
  userName: string;
}

type TimeframeOption = "7d" | "30d" | "90d" | "all";

export function AttendanceAnalyticsView({
  initialData,
  userRole,
  userName,
}: AttendanceAnalyticsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentTimeframe = (searchParams.get("timeframe") as TimeframeOption) || "30d";
  const [timeframe, setTimeframe] = useState<TimeframeOption>(currentTimeframe);

  const handleTimeframeChange = (newTimeframe: TimeframeOption) => {
    setTimeframe(newTimeframe);
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("timeframe", newTimeframe);
      router.push(`/reports?${params.toString()}`);
    });
  };

  const {
    overallPercentage,
    threshold,
    totalSessionsHeld,
    totalRecordsAudited,
    statusDistribution,
    subjectWise,
    classWise,
    timelineTrends,
    debarmentRiskStudents,
  } = initialData;

  const donutData = statusDistribution.map((s) => ({
    label: s.status.charAt(0) + s.status.slice(1).toLowerCase(),
    value: s.count,
    color: s.color,
  }));

  const subjectBarData = subjectWise.map((s) => ({
    label: s.code,
    sublabel: s.name,
    value: s.percentage ?? 0,
    secondaryValue: s.totalRecords,
  }));

  const classBarData = classWise.map((c) => ({
    label: `${c.className} (${c.section})`,
    sublabel: c.subjectCode,
    value: c.percentage ?? 0,
    secondaryValue: c.totalRecords,
  }));

  const trendChartData = timelineTrends.map((t) => ({
    date: t.label,
    percentage: t.percentage ?? 0,
    total: t.totalRecords,
    present: t.attendedRecords,
  }));

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Attendance Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {userRole === "STUDENT"
              ? `Personal course performance and longitudinal trends for ${userName}`
              : userRole === "TEACHER"
              ? `Analytics across courses and cohorts assigned to ${userName}`
              : "Institution-wide attendance metrics, subject performance, and student risk analysis"}
          </p>
        </div>

        {/* Timeframe selector pill */}
        <div className="flex items-center gap-1.5 p-1 bg-muted rounded-lg border border-border/60 self-start sm:self-auto">
          {(
            [
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "90d", label: "90 Days" },
              { id: "all", label: "All Time" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => handleTimeframeChange(t.id)}
              disabled={isPending}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                timeframe === t.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              } ${isPending ? "opacity-70 cursor-wait" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Percentage */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Overall Attendance</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {overallPercentage !== null ? `${overallPercentage.toFixed(1)}%` : "N/A"}
              </span>
              {overallPercentage !== null && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    overallPercentage >= threshold
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  Target: {threshold}%
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {totalRecordsAudited.toLocaleString()} attendance entries recorded
            </p>
          </CardContent>
        </Card>

        {/* Sessions Conducted */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Sessions Held</span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <CalendarDays className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {totalSessionsHeld.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Unique class attendance sessions
            </p>
          </CardContent>
        </Card>

        {/* Total Records Evaluated */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Entries Audited</span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {totalRecordsAudited.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Student session check-ins
            </p>
          </CardContent>
        </Card>

        {/* Students Below Threshold */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Below Threshold</span>
              <div
                className={`p-2 rounded-lg ${
                  debarmentRiskStudents.length > 0
                    ? "bg-rose-500/10 text-rose-500"
                    : "bg-emerald-500/10 text-emerald-500"
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span
                className={`text-3xl font-bold tracking-tight ${
                  debarmentRiskStudents.length > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                }`}
              >
                {debarmentRiskStudents.length}
              </span>
              <span className="text-xs text-muted-foreground">
                (&lt; {threshold}% mark)
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {debarmentRiskStudents.length === 0
                ? "All students meet attendance policy"
                : "Require recovery plan to prevent debarment"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Status Distribution & Longitudinal Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <Card className="border-border/60 shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Attendance Distribution
            </CardTitle>
            <CardDescription className="text-xs">
              Present, late, absent, and excused breakdown
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <DonutChart
              data={donutData}
              centerLabel={overallPercentage !== null ? `${overallPercentage.toFixed(1)}%` : "0%"}
              centerSublabel="Average Rate"
            />
          </CardContent>
        </Card>

        {/* Longitudinal Trends */}
        <Card className="border-border/60 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Attendance Trends Over Time
            </CardTitle>
            <CardDescription className="text-xs">
              Daily longitudinal attendance percentage vs {threshold}% institutional target
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <TrendChart data={trendChartData} threshold={threshold} height={230} />
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Subject-Wise & Class-Wise Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject-Wise Performance */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              Subject-Wise Attendance
            </CardTitle>
            <CardDescription className="text-xs">
              Attendance rates grouped by academic subject code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={subjectBarData}
              threshold={threshold}
              emptyMessage="No subject attendance records found for this timeframe"
            />
          </CardContent>
        </Card>

        {/* Class-Wise Performance */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <School className="w-4 h-4 text-amber-500" />
              Class / Cohort Attendance
            </CardTitle>
            <CardDescription className="text-xs">
              Comparative attendance performance across enrolled classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={classBarData}
              threshold={threshold}
              emptyMessage="No class attendance records found for this timeframe"
            />
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Students Below Threshold / At Risk */}
      {userRole !== "STUDENT" && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                Students Below Attendance Threshold ({threshold}%)
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Students requiring continuous attendance to reach the required minimum benchmark
              </CardDescription>
            </div>
            {debarmentRiskStudents.length > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                {debarmentRiskStudents.length} At Risk
              </span>
            )}
          </CardHeader>
          <CardContent>
            {debarmentRiskStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl bg-muted/20 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                <p className="text-sm font-semibold text-foreground">
                  No Students At Risk
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All active students currently maintain attendance at or above {threshold}%.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/80 text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Student</th>
                      <th className="pb-3 font-semibold">Roll Number</th>
                      <th className="pb-3 font-semibold">Class</th>
                      <th className="pb-3 font-semibold text-right">Attended / Total</th>
                      <th className="pb-3 font-semibold text-right">Rate</th>
                      <th className="pb-3 font-semibold text-right">Consecutive Sessions to 75%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {debarmentRiskStudents.map((student: DebarmentRiskStudent) => (
                      <tr key={student.studentId} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 font-medium text-foreground">
                          {student.name}
                        </td>
                        <td className="py-3 font-mono text-xs text-muted-foreground">
                          {student.rollNo || "—"}
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">
                          {student.className}
                        </td>
                        <td className="py-3 text-right text-xs tabular-nums text-foreground">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {student.attendedSessions}
                          </span>
                          <span className="text-muted-foreground"> / {student.totalSessions}</span>
                        </td>
                        <td className="py-3 text-right">
                          <span className="font-semibold text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 tabular-nums">
                            {student.percentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 text-right font-semibold text-xs tabular-nums text-amber-600 dark:text-amber-400">
                          +{student.sessionsNeededToRecover} session{student.sessionsNeededToRecover === 1 ? "" : "s"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
