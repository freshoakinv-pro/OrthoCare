import type { InputHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="oc-focus-ring"
      style={{
        width: "100%",
        minHeight: 44,
        padding: "12px 14px",
        fontFamily: "var(--font-ui)",
        fontSize: "1rem",
        border: "1px solid var(--bark)",
        borderRadius: 6,
        background: "var(--sand)",
        color: "var(--slate)",
      }}
      {...props}
    />
  );
}
