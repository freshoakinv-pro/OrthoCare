import type { ButtonHTMLAttributes, ReactNode } from "react";

const base: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "0.9375rem",
  fontWeight: 500,
  padding: "12px 20px",
  minHeight: 44,
  borderRadius: 6,
  cursor: "pointer",
  border: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

type Variant = "primary" | "ghost" | "danger";

export function Button({
  variant = "primary",
  children,
  style,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  const v: React.CSSProperties =
    variant === "primary"
      ? { background: "var(--moss)", color: "var(--linen)" }
      : variant === "danger"
        ? { background: "var(--clay)", color: "var(--linen)" }
        : {
            background: "transparent",
            color: "var(--slate)",
            border: "1px solid var(--bark)",
          };
  return (
    <button type="button" className="oc-focus-ring" style={{ ...base, ...v, ...style }} {...props}>
      {children}
    </button>
  );
}
