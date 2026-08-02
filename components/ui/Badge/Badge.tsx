import "./Badge.css";

type BadgeColor =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "gray";

type Props = {
  children: React.ReactNode;
  color?: BadgeColor;
};

export default function Badge({
  children,
  color = "gray",
}: Props) {
  return (
    <span className={`ri-badge ri-badge-${color}`}>
      {children}
    </span>
  );
}