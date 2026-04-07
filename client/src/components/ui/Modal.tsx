import type { ReactNode } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="oc-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="oc-modal-panel" style={{ width: "100%", padding: 24 }}>
        {title ? (
          <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>{title}</h2>
        ) : null}
        {children}
      </div>
    </div>
  );
}
