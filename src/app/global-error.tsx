"use client";

/**
 * Last-resort error boundary. It replaces the root layout, so it must render
 * its own <html> and <body> and cannot rely on the app stylesheet.
 */
export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#f2ebdc",
          color: "#17221d",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif"
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "24px"
          }}
        >
          <div style={{ maxWidth: "440px", textAlign: "center" }}>
            <p
              style={{
                margin: "0 0 12px",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#5d6b63"
              }}
            >
              Stock Management System
            </p>
            <h1 style={{ margin: "0 0 10px", fontSize: "26px", lineHeight: 1.2 }}>Something went wrong</h1>
            <p style={{ margin: "0 0 22px", fontSize: "14px", lineHeight: 1.6, color: "#42524a" }}>
              The page could not be loaded. Try again, or reload the app.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                border: 0,
                borderRadius: "10px",
                padding: "11px 20px",
                background: "#123b2e",
                color: "#f7f2e6",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Try again
            </button>
            {error.digest ? (
              <p style={{ margin: "18px 0 0", fontSize: "11px", color: "#6d7a73" }}>Reference: {error.digest}</p>
            ) : null}
          </div>
        </main>
      </body>
    </html>
  );
}
