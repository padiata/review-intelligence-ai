import AppShell from "@/components/layout/AppShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      title="Review Intelligence Lab"
      user={{
        fullName: "Administrador",
        role: "super_admin",
        entityName: "Demo",
      }}
    >
      {children}
    </AppShell>
  );
}