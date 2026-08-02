import type { ReactNode } from "react";
import "./Alert.css";

type AlertVariant =
  | "success"
  | "warning"
  | "danger"
  | "info";

type Props = {
  title?: string;
  children: ReactNode;
  variant?: AlertVariant;
};

const icons: Record<AlertVariant, string> = {
  success: "✓",
  warning: "!",
  danger: "×",
  info: "i",
};

export default function Alert({
  title,
  children,
  variant = "info",
}: Props) {
  return (
    <div
      className={`ri-alert ri-alert-${variant}`}
      role={
        variant === "danger"
          ? "alert"
          : "status"
      }
    >
      <span
        className="ri-alert-icon"
        aria-hidden="true"
      >
        {icons[variant]}
      </span>

      <div className="ri-alert-content">
        {title && (
          <strong>{title}</strong>
        )}

        <div className="ri-alert-message">
          {children}
        </div>
      </div>
    </div>
  );
}