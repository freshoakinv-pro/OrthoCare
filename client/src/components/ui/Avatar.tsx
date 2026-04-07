export function Avatar({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: "var(--moss)",
        color: "var(--linen)",
        display: "grid",
        placeItems: "center",
        fontFamily: "var(--font-ui)",
        fontSize: "0.875rem",
        fontWeight: 600,
      }}
      aria-hidden
    >
      {initials}
    </div>
  );
}
