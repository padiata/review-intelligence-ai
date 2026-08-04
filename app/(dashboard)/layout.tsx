import { redirect } from "next/navigation";

import AppShell from "@/components/layout/AppShell";
import type { UserRole } from "@/components/navigation/AppSidebar";
import { createClient } from "@/lib/supabase/server";

type UserProfile = {
  full_name: string | null;
  role: UserRole;
  active: boolean;
  entity_id: number | null;
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const {
    data: profileData,
    error: profileError,
  } = await supabase
    .from("user_profiles")
    .select(`
      full_name,
      role,
      active,
      entity_id
    `)
    .eq("id", user.id)
    .single();

  const profile =
    profileData as UserProfile | null;

  if (
    profileError ||
    !profile ||
    !profile.active
  ) {
    redirect("/login");
  }

  let entityName: string | null = null;

  if (profile.entity_id) {
    const { data: entity } = await supabase
      .from("entity_config")
      .select("entity_name")
      .eq("id", profile.entity_id)
      .maybeSingle();

    entityName =
      entity?.entity_name ?? null;
  }

  return (
    <AppShell
      title="Review Intelligence Lab"
      user={{
        fullName:
          profile.full_name?.trim() ||
          user.email ||
          "Usuario",
        role: profile.role,
        entityName:
          entityName ??
          (profile.role === "super_admin"
            ? "Acceso global"
            : "Hotel no asignado"),
      }}
    >
      {children}
    </AppShell>
  );
}