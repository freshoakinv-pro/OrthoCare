export function Skeleton({
  width = "100%",
  height = 16,
  style,
}: {
  width?: number | string;
  height?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="oc-skeleton"
      style={{
        width,
        height,
        ...style,
      }}
    />
  );
}
