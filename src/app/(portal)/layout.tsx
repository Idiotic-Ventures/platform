import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PortalNav } from "@/components/portal/portal-nav";
import { TopBar } from "@/components/layout/top-bar";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Admins can still access the portal — no redirect needed
  // But the admin console is their primary home

  return (
    <div className="flex min-h-screen bg-background">
      <PortalNav />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
