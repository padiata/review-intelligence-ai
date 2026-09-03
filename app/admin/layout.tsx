import { redirect } from "next/navigation";

import AppShell, {
  type UserRole,
} from "@/components/layout/AppShell";

import {
  createClient,
} from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: profile,
  } =
    await supabase
      .from("user_profiles")
      .select(
        "full_name, role, active, entity_id"
      )
      .eq("id", user.id)
      .single();

  if (
    !profile ||
    !profile.active ||
    profile.role !== "super_admin"
  ) {
    redirect("/");
  }

  const role =
    profile.role as UserRole;

  return (
    <AppShell
      title="Administration"
      user={{
        fullName:
          profile.full_name,
        role,
        entityName: null,
      }}
    >
      {children}
    </AppShell>
  );
}
