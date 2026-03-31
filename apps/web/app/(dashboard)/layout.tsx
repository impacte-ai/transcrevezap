import { Sidebar } from '@/components/sidebar';
import { Footer } from '@/components/footer';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto px-8 py-6">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
