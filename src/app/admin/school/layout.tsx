import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AppShell from "@/components/layout/AppShell";

export default async function SchoolAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== "INSTITUTION_ADMIN") {
    redirect("/login");
  }

  return <AppShell user={session}>{children}</AppShell>;
}
