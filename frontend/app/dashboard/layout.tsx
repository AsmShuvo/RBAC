import type { Metadata } from "next";
import { Sidebar } from "@/app/components/sidebar";

export const metadata: Metadata = {
  title: "Dashboard - RBAC Platform",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64 lg:ml-64 bg-slate-50">
        {children}
      </main>
    </div>
  );
}
