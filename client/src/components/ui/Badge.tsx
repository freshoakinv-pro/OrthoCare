import type { ReactNode } from "react";

const interpBg: Record<string, string> = {
  SEVERE: "var(--clay)",
  MODERATE: "#c9a84c",
  MILD: "#a8a05c",
  GOOD: "var(--moss)",
  EXCELLENT: "var(--moss-dark)",
};

export function Badge({
  interpretation,
  children,
}: {
  interpretation?: keyof typeof interpBg;
  children: ReactNode;
}) {
  const bg = interpretation ? interpBg[interpretation] ?? "var(--mist)" : "var(--mist)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: "0.75rem",
        fontFamily: "var(--font-mono)",
        fontWeight: 500,
        background: bg,
        color: "var(--linen)",
      }}
    >
      {children}
    </span>
  );
}
