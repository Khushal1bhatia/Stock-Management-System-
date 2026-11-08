"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="app">
      <main className="main" id="app">
        <div className="view">
          <section className="panel">
            <div className="empty-state">
              <div className="empty-state__icon">
                <Icon name="i-alert" />
              </div>
              <h3>Something went wrong</h3>
              <p>The page could not be loaded. Try again, or return to the overview.</p>
              <div className="page-tools__actions">
                <button className="btn btn--primary" type="button" onClick={reset}>
                  Try again
                </button>
                <Link className="btn btn--secondary" href="/">
                  Back to overview
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
