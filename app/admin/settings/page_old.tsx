"use client";

import Link from "next/link";

import {
  useLanguage,
} from "@/lib/i18n/LanguageProvider";

function SettingsIcon({
  type,
}: {
  type: "profiles" | "taxonomy";
}) {
  const commonProps = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (type === "profiles") {
    return (
      <svg {...commonProps}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-4 2.5-6 6-6s6 2 6 6" />
        <path d="M16 5.5a3 3 0 0 1 0 5" />
        <path d="M18 14c2 .7 3 2.5 3 5" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M4 5h16" />
      <path d="M7 5v5" />
      <path d="M7 10h10" />
      <path d="M12 10v5" />
      <path d="M12 15H8" />
      <path d="M12 15h4" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  );
}

export default function AdminSettingsPage() {
  const {
    messages,
  } = useLanguage();

  const copy =
    messages.settingsPage;

  return (
    <>
      <header className="admin-header">
        <div>
          <p>
            {copy.eyebrow}
          </p>

          <h1>
            {copy.title}
          </h1>

          <span>
            {copy.description}
          </span>
        </div>
      </header>

      <section className="admin-settings-grid">
        <article className="admin-card admin-settings-card">
          <div className="admin-settings-card-icon">
            <SettingsIcon
              type="profiles"
            />
          </div>

          <h2>
            {copy.userProfiles.title}
          </h2>

          <p>
            {copy.userProfiles.description}
          </p>

          <div className="admin-settings-card-action">
            <Link
              href="/admin/settings/user-profiles"
              className="admin-settings-link"
            >
              {copy.open}
            </Link>
          </div>
        </article>

        <article className="admin-card admin-settings-card">
          <div className="admin-settings-card-icon">
            <SettingsIcon
              type="taxonomy"
            />
          </div>

          <h2>
            {copy.taxonomies.title}
          </h2>

          <p>
            {copy.taxonomies.description}
          </p>

          <div className="admin-settings-card-action">
            <Link
              href="/admin/settings/taxonomies"
              className="admin-settings-link"
            >
              {copy.open}
            </Link>
          </div>
        </article>
      </section>
    </>
  );
}
