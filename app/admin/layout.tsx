import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import "./admin.css";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, role, active")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    !profile.active ||
    profile.role !== "super_admin"
  ) {
    redirect("/");
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-mark">RI</div>
          <div>
            <strong>Administración</strong>
            <span>Review Intelligence Lab</span>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Administración">
          <Link href="/admin/users">Usuarios</Link>
          <span className="admin-nav-disabled">Hoteles · próximamente</span>
          <span className="admin-nav-disabled">Configuración · próximamente</span>
        </nav>

        <div className="admin-sidebar-footer">
          <span>{profile.full_name}</span>
          <strong>Super administrador</strong>
          <Link href="/">Volver al dashboard</Link>
        </div>
      </aside>

      <section className="admin-workspace">{children}</section>
    </main>
  );
}
