import type { ReactNode } from "react";

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        gap: 8,
        borderBottom: "1px solid var(--stone)",
        marginBottom: 16,
      }}
    >
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.id)}
            className="oc-focus-ring"
            style={{
              padding: "12px 16px",
              minHeight: 44,
              border: "none",
              background: "transparent",
              fontFamily: "var(--font-ui)",
              fontSize: "0.9375rem",
              color: isActive ? "var(--moss)" : "var(--bark)",
              cursor: "pointer",
              borderBottom: isActive ? "3px solid var(--moss)" : "3px solid transparent",
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ id, active, children }: { id: string; active: string; children: ReactNode }) {
  if (id !== active) return null;
  return <div role="tabpanel">{children}</div>;
}
