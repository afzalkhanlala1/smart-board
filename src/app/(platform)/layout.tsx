import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-72">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
