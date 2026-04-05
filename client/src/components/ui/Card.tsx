import type { CSSProperties, ReactNode } from "react";

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        background: "var(--linen)",
        border: "1px solid var(--bark)",
        borderRadius: "var(--radius-card)",
        padding: 24,
        boxShadow: "var(--shadow-card)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
