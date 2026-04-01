import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  BarChart3,
  Settings,
  Users,
  FileText,
  LogOut,
  Key,
  LayoutDashboard,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function AppSidebar() {
  const { profile, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const adminItems = [
    { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
    { title: 'Statistik', url: '/admin/statistics', icon: BarChart3 },
    { title: 'Benutzer', url: '/admin/users', icon: Users },
    { title: 'Alle Formulare', url: '/admin/forms', icon: FileText },
  ];

  const designerItems = [
    { title: 'Dashboard', url: '/designer', icon: LayoutDashboard },
    { title: 'Meine Formulare', url: '/designer/forms', icon: FileText },
    { title: 'Terminvormerke', url: '/designer/appointments', icon: Clock },
  ];

  const items = profile?.role === 'admin' ? adminItems : designerItems;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarContent className="flex flex-col justify-between h-full">
        <div>
          <div className="px-4 py-5 flex items-center gap-2">
            {!collapsed && (
              <h2 className="text-sm font-bold tracking-wider text-foreground uppercase">
                <span className="text-primary">|</span> Einwilligungs-Manager
              </h2>
            )}
          </div>
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground/60 text-xs uppercase tracking-wider">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === '/admin' || item.url === '/designer'}
                        className="hover:bg-muted/50 rounded-lg transition-all duration-200 text-sidebar-foreground"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-primary"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
        <div className="p-4 space-y-2">
          <NavLink
            to={profile?.role === 'admin' ? '/admin/settings' : '/designer/settings'}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-md transition-colors"
            activeClassName="text-primary"
          >
            <Key className="h-4 w-4" />
            {!collapsed && <span>Einstellungen</span>}
          </NavLink>
          {!collapsed && profile && (
            <div className="pt-2">
              <p className="text-sm font-medium text-foreground">{profile.full_name}</p>
              <p className="text-xs text-primary capitalize">{profile.role}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {!collapsed && 'Abmelden'}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border/40 bg-background px-4 gap-4">
            <SidebarTrigger />
            <div className="flex-1" />
            <span className="text-sm text-muted-foreground font-medium">
              {profile?.full_name}
            </span>
          </header>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
