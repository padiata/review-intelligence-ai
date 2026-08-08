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

const roleLabels: Record<
  UserRole,
  string
> = {
  super_admin:
    "Super administrador",

  hotel_admin:
    "Administrador de hotel",

  manager:
    "Manager",

  operator:
    "Operador",
};

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
          RI
        </div>

        <div>
          <strong>
            Review Intelligence
          </strong>

          <span>
            Lab
          </span>
        </div>
      </div>

      <nav
        className="app-navigation-menu"
        aria-label="Navegación principal"
      >
        <Link
          href="/"
          className={
            isActive("/")
              ? "app-navigation-link active"
              : "app-navigation-link"
          }
        >
          Inicio
        </Link>

        <Link
          href="/capture"
          className={
            isActive("/capture")
              ? "app-navigation-link active"
              : "app-navigation-link"
          }
        >
          Captura
        </Link>

        <Link
          href="/reviews"
          className={
            isActive("/reviews")
              ? "app-navigation-link active"
              : "app-navigation-link"
          }
        >
          Reviews
        </Link>

        {canSeeReports && (
          <Link
            href="/reports"
            className={
              isActive("/reports")
                ? "app-navigation-link active"
                : "app-navigation-link"
            }
          >
            Informes
          </Link>
        )}

        {canSeeAdmin && (
          <>
            <p className="app-navigation-section">
              Administración
            </p>

            <Link
              href="/admin/users"
              className={
                isActive(
                  "/admin/users"
                )
                  ? "app-navigation-link active"
                  : "app-navigation-link"
              }
            >
              Usuarios
            </Link>

            <Link
              href="/admin/entities"
              className={
                isActive(
                  "/admin/entities"
                )
                  ? "app-navigation-link active"
                  : "app-navigation-link"
              }
            >
              Entidades
            </Link>
          </>
        )}
      </nav>

      <div className="app-navigation-account">
        <span>
          {fullName}
        </span>

        <strong>
          {roleLabels[role]}
        </strong>

        <small>
          {entityName ??
            "Acceso global"}
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
            ? "Cerrando..."
            : "Cerrar sesión"}
        </button>
      </div>
    </aside>
  );
}