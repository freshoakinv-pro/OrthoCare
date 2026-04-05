export default function App() {
  return (
    <main
      style={{
        minHeight: "100%",
        display: "grid",
        placeItems: "center",
        padding: 24,
        fontFamily: "var(--font-ui)",
        color: "var(--color-slate)",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <h1 style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
          OrthoCare Orchestrator
        </h1>
        <p style={{ color: "var(--color-bark)" }}>Step 1 — monorepo scaffold and Railway wiring.</p>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
          Health: <code>/api/health</code>
        </p>
      </div>
    </main>
  );
}
