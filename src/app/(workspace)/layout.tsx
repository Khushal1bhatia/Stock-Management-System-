import { requireUser } from "@/lib/auth/current-user";
import { getAttentionProducts, getStats } from "@/lib/queries";
import { formatDateLong } from "@/lib/format";
import { WorkspaceProvider } from "@/components/workspace-provider";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { MobileNav } from "@/components/mobile-nav";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [stats, attention] = await Promise.all([getStats(), getAttentionProducts()]);

  return (
    <WorkspaceProvider user={user}>
      <a className="skip-link" href="#app">
        Skip to content
      </a>

      <div className="app">
        <Sidebar user={user} stats={stats} />

        <div className="shell">
          <Topbar user={user} stats={stats} attention={attention} todayLabel={formatDateLong()} />

          <main className="main" id="app" tabIndex={-1}>
            {children}
          </main>

          <footer className="app-foot">
            <span>© {new Date().getFullYear()} Stock Management System</span>
            <span>Inventory control · USD</span>
          </footer>
        </div>
      </div>

      <MobileNav />
    </WorkspaceProvider>
  );
}
