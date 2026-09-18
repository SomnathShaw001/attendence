import { notFound, redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { AppShell } from "@/components/dashboard/app-shell";
import { getClassById } from "@/app/classes/actions";
import { ClassDetailClientView } from "@/components/classes/class-detail-client-view";

interface ClassDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClassDetailPage({ params }: ClassDetailPageProps) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Role guard: Only Admins and Teachers can view class details
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    redirect("/unauthorized");
  }

  const { id } = await params;

  let data;
  try {
    data = await getClassById(id);
  } catch {
    notFound();
  }

  return (
    <AppShell>
      <ClassDetailClientView
        classRecord={data.classRecord}
        availableTeachers={data.availableTeachers}
        availableStudents={data.availableStudents}
        availableBatches={data.availableBatches}
        availableDepartments={data.availableDepartments}
        isAdmin={session.user.role === "ADMIN"}
      />
    </AppShell>
  );
}
