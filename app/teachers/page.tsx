import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { AppShell } from "@/components/dashboard/app-shell";
import { getTeachers } from "@/app/teachers/actions";
import { TeachersClientView } from "@/components/teachers/teachers-client-view";

interface TeachersPageProps {
  searchParams: Promise<{
    search?: string;
    department?: string;
    status?: string;
  }>;
}

export default async function TeachersPage({ searchParams }: TeachersPageProps) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Role guard: Only Admins can manage faculty directory
  if (session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  const resolvedParams = await searchParams;
  const data = await getTeachers(resolvedParams);

  return (
    <AppShell>
      <TeachersClientView
        teachers={data.teachers}
        departments={data.departments}
        stats={data.stats}
      />
    </AppShell>
  );
}
