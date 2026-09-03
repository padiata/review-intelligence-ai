"use client";

import "./AppSidebar.css";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/client";

import {
  useLanguage,
} from "@/lib/i18n/LanguageProvider";

export type UserRole =
  | "super_admin"
  | "hotel_admin"
  | "manager"
  | "operator";

type AppSidebarProps = {
  fullName: string;
  role: UserRole;
  entityName?: string | null;
};

type IconName =
  | "home"
  | "capture"
  | "reviews"
  | "reports"
  | "users"
  | "entities";

function MenuIcon({
  name,
}: {
  name: IconName;
}) {
  const commonProps = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap:
      "round" as const,
    strokeLinejoin:
      "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "home":
      return (
        <svg {...commonProps}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
          <path d="M9 21v-7h6v7" />
        </svg>
      );

    case "capture":
      return (
        <svg {...commonProps}>
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
      );

    case "reviews":
      return (
        <svg {...commonProps}>
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
          <path d="M8 9h8" />
          <path d="M8 13h5" />
        </svg>
      );

    case "reports":
      return (
        <svg {...commonProps}>
          <path d="M4 20V10" />
          <path d="M10 20V4" />
          <path d="M16 20v-7" />
          <path d="M22 20H2" />
        </svg>
      );

    case "users":
      return (
        <svg {...commonProps}>
          <circle
            cx="9"
            cy="8"
            r="3"
          />

          <path d="M3 20c0-4 2.5-6 6-6s6 2 6 6" />
          <path d="M16 5.5a3 3 0 0 1 0 5" />
          <path d="M18 14c2 .7 3 2.5 3 5" />
        </svg>
      );

    case "entities":
      return (
        <svg {...commonProps}>
          <path d="M4 21V5h10v16" />
          <path d="M14 9h6v12" />
          <path d="M8 9h2" />
          <path d="M8 13h2" />
          <path d="M8 17h2" />
          <path d="M17 13h1" />
          <path d="M17 17h1" />
          <path d="M2 21h20" />
        </svg>
      );
  }
}

function NavigationLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: IconName;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "app-navigation-link active"
          : "app-navigation-link"
      }
    >
      <span className="app-navigation-link-icon">
        <MenuIcon
          name={icon}
        />
      </span>

      <span>
        {label}
      </span>
    </Link>
  );
}

export default function AppSidebar({
  fullName,
  role,
  entityName,
}: AppSidebarProps) {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const supabase =
    useMemo(
      () => createClient(),
      []
    );

  const {
    messages,
  } = useLanguage();

  const [
    isLoggingOut,
    setIsLoggingOut,
  ] = useState(false);

  const [
    logoutError,
    setLogoutError,
  ] = useState("");

  const canSeeReports =
    role === "super_admin" ||
    role === "hotel_admin" ||
    role === "manager";

  const canSeeAdmin =
    role === "super_admin" ||
    role === "hotel_admin";

  function isActive(
    path: string
  ) {
    if (path === "/") {
      return pathname === "/";
    }

    return (
      pathname === path ||
      pathname.startsWith(
        `${path}/`
      )
    );
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    setLogoutError("");

    const { error } =
      await supabase.auth.signOut();

    if (error) {
      setLogoutError(
        error.message
      );

      setIsLoggingOut(false);

      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="app-navigation">
      <div className="app-navigation-brand">
        <div className="app-navigation-mark">
          <img
            src="/padiata-mark.png"
            alt="Padiata"
          />
        </div>

        <div>
          <strong>
            Padiata
          </strong>

          <span>
            Review Intelligence Lab
          </span>
        </div>
      </div>

      <nav
        className="app-navigation-menu"
        aria-label="Navegación principal"
      >
        <NavigationLink
          href="/"
          label={
            messages.navigation.home
          }
          icon="home"
          active={
            isActive("/")
          }
        />

        <NavigationLink
          href="/capture"
          label={
            messages.navigation.capture
          }
          icon="capture"
          active={
            isActive(
              "/capture"
            )
          }
        />

        <NavigationLink
          href="/reviews"
          label={
            messages.navigation.reviews
          }
          icon="reviews"
          active={
            isActive(
              "/reviews"
            )
          }
        />

        {canSeeReports && (
          <NavigationLink
            href="/reports"
            label={
              messages.navigation.reports
            }
            icon="reports"
            active={
              isActive(
                "/reports"
              )
            }
          />
        )}

        {canSeeAdmin && (
          <>
            <p className="app-navigation-section">
              {
                messages.navigation
                  .administration
              }
            </p>

            <NavigationLink
              href="/admin/users"
              label={
                messages.navigation.users
              }
              icon="users"
              active={
                isActive(
                  "/admin/users"
                )
              }
            />

            <NavigationLink
              href="/admin/entities"
              label={
                messages.navigation.entities
              }
              icon="entities"
              active={
                isActive(
                  "/admin/entities"
                )
              }
            />
          </>
        )}
      </nav>

      <div className="app-navigation-account">
        <span>
          {fullName}
        </span>

        <strong>
          {messages.roles[role]}
        </strong>

        <small>
          {entityName ??
            messages.common
              .globalAccess}
        </small>

        {logoutError && (
          <p role="alert">
            {logoutError}
          </p>
        )}

        <button
          type="button"
          onClick={() =>
            void handleLogout()
          }
          disabled={
            isLoggingOut
          }
        >
          {isLoggingOut
            ? messages.navigation
                .loggingOut
            : messages.navigation
                .logout}
        </button>
      </div>
    </aside>
  );
}