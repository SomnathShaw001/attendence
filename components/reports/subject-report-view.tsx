"use client";

import React from "react";
import { SubjectReportItem } from "@/app/reports/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, School, AlertTriangle } from "lucide-react";

interface SubjectReportViewProps {
  data: SubjectReportItem;
}

export function SubjectReportView({ data }: SubjectReportViewProps) {
  const { subjectInfo, summary, classesBreakdown, studentsAtRisk } = data;

  return (
    <div className="space-y-6">
      {/* Subject Information Banner */}
      <Card className="border-border/70 shadow-sm bg-gradient-to-r from-muted/40 via-background to-muted/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl border border-blue-500/20">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">{subjectInfo.code}</h2>
                  <Badge variant="outline" className="text-xs">
                    {subjectInfo.credits} Credits
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {subjectInfo.name} &bull; Department of {subjectInfo.department}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Subject Attendance:</span>
              <span
                className={`text-2xl font-bold ${
                  summary.overallPercentage !== null && summary.overallPercentage >= summary.threshold
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {summary.overallPercentage !== null ? `${summary.overallPercentage.toFixed(1)}%` : "N/A"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <span className="text-xs font-medium text-muted-foreground">Class Cohorts</span>
            <p className="text-2xl font-bold mt-1 text-foreground">{summary.totalClasses}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <span className="text-xs font-medium text-muted-foreground">Total Lectures</span>
            <p className="text-2xl font-bold mt-1 text-foreground">{summary.totalSessions}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <span className="text-xs font-medium text-muted-foreground">Entries Audited</span>
            <p className="text-2xl font-bold mt-1 text-foreground">{summary.totalRecords}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Below 75% Target</span>
            <p className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">
              {summary.studentsBelowThresholdCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Class Section Breakdown */}
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <School className="w-4 h-4 text-indigo-500" />
            Class Sections Offering {subjectInfo.code}
          </CardTitle>
          <CardDescription className="text-xs">
            Performance comparison across all enrolled class batches
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classesBreakdown.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No class sections associated with this subject.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Class</th>
                    <th className="pb-3 font-semibold">Section</th>
                    <th className="pb-3 font-semibold">Instructor</th>
                    <th className="pb-3 font-semibold text-center">Students</th>
                    <th className="pb-3 font-semibold text-center">Sessions</th>
                    <th className="pb-3 font-semibold text-right">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {classesBreakdown.map((c) => (
                    <tr key={c.classId} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 font-medium text-foreground">{c.name}</td>
                      <td className="py-3 text-xs text-muted-foreground">{c.section}</td>
                      <td className="py-3 text-xs text-muted-foreground">{c.teacherName}</td>
                      <td className="py-3 text-center font-mono text-xs text-muted-foreground">
                        {c.enrolledStudents}
                      </td>
                      <td className="py-3 text-center font-mono text-xs text-muted-foreground">
                        {c.totalSessions}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`font-semibold tabular-nums text-xs px-2 py-0.5 rounded ${
                            c.percentage !== null && c.percentage < summary.threshold
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {c.percentage !== null ? `${c.percentage.toFixed(1)}%` : "N/A"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Students Below Threshold for Subject */}
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-4 h-4" />
            Students Below Threshold in {subjectInfo.code} ({studentsAtRisk.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Students falling short of the {summary.threshold}% minimum attendance benchmark in this course
          </CardDescription>
        </CardHeader>
        <CardContent>
          {studentsAtRisk.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              All students meet or exceed the {summary.threshold}% attendance requirement for this subject.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Roll No</th>
                    <th className="pb-3 font-semibold">Student Name</th>
                    <th className="pb-3 font-semibold">Class Section</th>
                    <th className="pb-3 font-semibold text-right">Attended / Total</th>
                    <th className="pb-3 font-semibold text-right">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {studentsAtRisk.map((st) => (
                    <tr key={st.studentId} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 font-mono text-xs font-medium text-foreground">
                        {st.rollNo}
                      </td>
                      <td className="py-3 font-medium text-foreground">{st.name}</td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {st.className} ({st.section})
                      </td>
                      <td className="py-3 text-right text-xs tabular-nums text-foreground">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {st.attendedSessions}
                        </span>
                        <span className="text-muted-foreground"> / {st.totalSessions}</span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="font-semibold text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 tabular-nums">
                          {st.percentage.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
