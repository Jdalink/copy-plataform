import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-row">
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <div className="flex flex-1 flex-col bg-muted/40">
        <Header />
        {children}
      </div>
    </div>
  );
}