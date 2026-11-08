import Link from "next/link";
import { Icon } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="app">
      <main className="main" id="app">
        <div className="view">
          <section className="panel">
            <div className="empty-state">
              <div className="empty-state__icon">
                <Icon name="i-search" />
              </div>
              <h3>Page not found</h3>
              <p>The page you are looking for does not exist or has moved.</p>
              <Link className="btn btn--primary" href="/">
                Back to the stock system
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
