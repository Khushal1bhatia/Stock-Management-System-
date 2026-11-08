export default function WorkspaceLoading() {
  return (
    <div className="view" aria-busy="true">
      <span className="sr-only">Loading workspace…</span>
      <section className="panel">
        <div className="empty-state">
          <div className="empty-state__icon">
            <span className="loading-dot" aria-hidden="true" />
          </div>
          <h3>Loading stock data</h3>
          <p>Fetching the latest inventory, movements, and supplier details.</p>
        </div>
      </section>
    </div>
  );
}
