import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { TopBar } from "@/components/layout/top-bar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/admin");
  }

  // Role check — only admins access /admin/*
  if ((session.user as any)?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen">
      {/* H8 fix: Distinct admin sidebar — dark bg, Admin Console branding */}
      <AdminSidebar />
      <div className="flex-1 flex flex-col bg-muted/10">
        <TopBar />
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
