import type { ReactNode } from "react";
import "./PageHeader.css";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: Props) {
  return (
    <header className="ri-page-header">
      <div className="ri-page-header-content">
        {eyebrow && (
          <p className="ri-page-header-eyebrow">
            {eyebrow}
          </p>
        )}

        <h1>{title}</h1>

        {description && (
          <p className="ri-page-header-description">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="ri-page-header-actions">
          {actions}
        </div>
      )}
    </header>
  );
}