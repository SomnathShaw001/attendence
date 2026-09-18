import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { AppShell } from "@/components/dashboard/app-shell";
import { getStudents } from "@/app/students/actions";
import { StudentsClientView } from "@/components/students/students-client-view";

interface StudentsPageProps {
  searchParams: Promise<{
    search?: string;
    batch?: string;
    department?: string;
    status?: string;
  }>;
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Role guard: Only Admins and Teachers can browse student rosters
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    redirect("/unauthorized");
  }

  const resolvedParams = await searchParams;
  const data = await getStudents(resolvedParams);

  return (
    <AppShell>
      <StudentsClientView
        students={data.students}
        batches={data.batches}
        departments={data.departments}
        isAdmin={session.user.role === "ADMIN"}
      />
    </AppShell>
  );
}
