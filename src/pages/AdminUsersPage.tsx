import { DashboardLayout } from '@/components/DashboardLayout';
import { AdminUsersSection } from '@/components/AdminUsersSection';

export default function AdminUsersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Benutzerverwaltung</h1>
          <p className="text-muted-foreground text-sm mt-1">Mitarbeiterkonten und Einladungen verwalten</p>
        </div>
        <AdminUsersSection />
      </div>
    </DashboardLayout>
  );
}
