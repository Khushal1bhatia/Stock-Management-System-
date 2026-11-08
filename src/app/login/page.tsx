import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { Icon } from "@/components/icons";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/overview");

  return (
    <div className="login-gate">
      <header className="login-top">
        <div className="login-wordmark">
          <span className="login-wordmark__text">
            <strong>Stock Management System</strong>
            <small>Inventory control</small>
          </span>
        </div>
        <span className="login-access">
          <i aria-hidden="true" />
          ASO Users
        </span>
      </header>

      <main className="login-main">
        <div className="login-intro">
          <Icon name="i-shelf" className="login-icon" />
          <h1>
            Stock Management
            <br />
            System
          </h1>
          <p>Inventory, movements, and supplier control for ASO Users.</p>
        </div>

        <section className="login-entry" aria-labelledby="login-title">
          <div className="login-entry__head">
            <div>
              <h2 id="login-title">Sign in</h2>
              <p>Use your issued ASO Users credentials.</p>
            </div>
            <span className="login-badge">ASO Users</span>
          </div>
          <LoginForm />
          <p className="login-note">Authorized ASO Users only · Contact the inventory administrator for access.</p>
        </section>
      </main>

      <footer className="login-foot">
        <span>© {new Date().getFullYear()} Stock Management System</span>
        <span>Maintained by RSSB Foundation</span>
      </footer>
    </div>
  );
}
