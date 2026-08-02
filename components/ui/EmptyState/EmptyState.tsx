import type { ReactNode } from "react";
import "./EmptyState.css";

type Props = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
};

export default function EmptyState({
  title,
  description,
  icon = "◎",
  action,
  compact = false,
}: Props) {
  return (
    <section
      className={[
        "ri-empty-state",
        compact ? "ri-empty-state-compact" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className="ri-empty-state-icon"
        aria-hidden="true"
      >
        {icon}
      </div>

      <h3>{title}</h3>

      {description && (
        <p>{description}</p>
      )}

      {action && (
        <div className="ri-empty-state-action">
          {action}
        </div>
      )}
    </section>
  );
}