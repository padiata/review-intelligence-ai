import "./Card.css";

type CardProps = React.HTMLAttributes<HTMLElement> & {
  as?: "section" | "article" | "div";
  padding?: "sm" | "md" | "lg";
};

export default function Card({
  as: Component = "section",
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <Component
      {...props}
      className={`ri-card ri-card-${padding} ${className}`}
    >
      {children}
    </Component>
  );
}