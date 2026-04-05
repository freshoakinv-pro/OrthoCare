import { Card } from "@/components/ui/Card";

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <Card>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <p style={{ color: "var(--bark)" }}>This section is being wired to live data.</p>
    </Card>
  );
}
