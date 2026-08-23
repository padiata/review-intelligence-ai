"use client";

import "./AppShell.css";

import { ReactNode } from "react";

import AppSidebar from "@/components/navigation/AppSidebar";

import {
  useLanguage,
} from "@/lib/i18n/LanguageProvider";

export type UserRole =
  | "super_admin"
  | "hotel_admin"
  | "manager"
  | "operator";

type Props = {
  title: string;
  children: ReactNode;

  user: {
    fullName: string;
    role: UserRole;
    entityName?: string | null;
  };
};

export default function AppShell({
  children,
  user,
}: Props) {
  const {
    language,
    messages,
    setLanguage,
  } = useLanguage();

  return (
    <div className="app-shell-layout">
      <AppSidebar
        fullName={user.fullName}
        role={user.role}
        entityName={user.entityName}
      />

      <main className="app-shell-content">
        <header className="app-shell-header">
          <h1 className="app-shell-tagline">
            {messages.shell.tagline}
          </h1>

          <div
            className="app-shell-language"
            aria-label="Language"
          >
            <button
              type="button"
              className={
                language === "es"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setLanguage("es")
              }
            >
              ES
            </button>

            <span>
              |
            </span>

            <button
              type="button"
              className={
                language === "en"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setLanguage("en")
              }
            >
              EN
            </button>
          </div>
        </header>

        <section className="app-shell-body">
          {children}
        </section>
      </main>
    </div>
  );
}