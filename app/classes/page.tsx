import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { AppShell } from "@/components/dashboard/app-shell";
import { getClasses } from "@/app/classes/actions";
import { ClassesClientView } from "@/components/classes/classes-client-view";

interface ClassesPageProps {
  searchParams: Promise<{
    search?: string;
    termId?: string;
    department?: string;
  }>;
}

export default async function ClassesPage({ searchParams }: ClassesPageProps) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Role guard: Only Admins and Teachers can view classes and subjects
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    redirect("/unauthorized");
  }

  const resolvedParams = await searchParams;
  const data = await getClasses(resolvedParams);

  // Extract distinct departments from subjects
  const departments = Array.from(
    new Set(data.subjects.map((s) => s.department).filter(Boolean))
  ).sort();

  return (
    <AppShell>
      <ClassesClientView
        classes={data.classes}
        subjects={data.subjects}
        terms={data.terms}
        departments={departments}
        stats={data.stats}
        isAdmin={session.user.role === "ADMIN"}
      />
    </AppShell>
  );
}
