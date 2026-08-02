"use client";
import "./AppShell.css";
import { ReactNode } from "react";
import AppSidebar from "@/components/navigation/AppSidebar";

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
  title,
  children,
  user,
}: Props) {
  return (
    <div className="app-shell-layout">
      <AppSidebar
        fullName={user.fullName}
        role={user.role}
        entityName={user.entityName}
      />

      <main className="app-shell-content">
        <header className="app-shell-header">
          <h1>{title}</h1>
        </header>

        <section className="app-shell-body">
          {children}
        </section>
      </main>
    </div>
  );
}