"use client";

import { useEffect } from "react";
import { Icon } from "@/components/icons";

export default function WorkspaceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="view">
      <section className="panel">
        <div className="empty-state">
          <div className="empty-state__icon">
            <Icon name="i-alert" />
          </div>
          <h3>Something went wrong</h3>
          <p>This page could not be loaded. Try again without losing your place.</p>
          <button className="btn btn--primary" type="button" onClick={reset}>
            Try again
          </button>
        </div>
      </section>
    </div>
  );
}
