import type { ReactNode } from "react";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: "var(--font-ui)",
          fontSize: "0.9375rem",
        }}
      >
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function Tr({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <tr
      style={{
        borderBottom: "1px solid var(--stone)",
        height: 52,
        ...style,
      }}
    >
      {children}
    </tr>
  );
}

export function Th({ children }: { children: ReactNode }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "12px 16px",
        fontWeight: 500,
        color: "var(--bark)",
      }}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  style,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <td style={{ padding: "12px 16px", verticalAlign: "middle", ...style }}>{children}</td>
  );
}
