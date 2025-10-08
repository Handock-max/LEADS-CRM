import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Menu, Settings, Building, UserCog, ChevronDown } from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { workspaceService } from '@/lib/workspaceService';
import { Workspace } from '@/types/auth';
import { toast } from 'sonner';

const menuItems = [
  { title: 'CRM', url: '/crm', icon: Users, roles: ['admin', 'manager', 'agent'] },
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'agent'] },
  { title: 'Gestion utilisateurs', url: '/user-management', icon: UserCog, roles: ['admin'] },
  { title: 'Paramètres Workspace', url: '/workspace-settings', icon: Settings, roles: ['admin'] },
  { title: 'Gestion Workspaces', url: '/workspace-management', icon: Building, roles: ['super_admin'] },
];

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { signOut, userRole, workspace, isSuperAdmin, switchWorkspace } = useAuth();
  const [availableWorkspaces, setAvailableWorkspaces] = useState<Workspace[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);

  // Load available workspaces for super admins
  useEffect(() => {
    const loadWorkspaces = async () => {
      if (!isSuperAdmin) return;

      setLoadingWorkspaces(true);
      try {
        const { data, error } = await workspaceService.getAllWorkspaces();
        if (error) {
          console.error('Error loading workspaces:', error);
          toast.error('Erreur lors du chargement des workspaces');
        } else {
          setAvailableWorkspaces(data || []);
        }
      } catch (error) {
        console.error('Error loading workspaces:', error);
        toast.error('Erreur lors du chargement des workspaces');
      } finally {
        setLoadingWorkspaces(false);
      }
    };

    loadWorkspaces();
  }, [isSuperAdmin]);

  const handleWorkspaceChange = async (workspaceId: string) => {
    if (!isSuperAdmin || !switchWorkspace) return;

    try {
      await switchWorkspace(workspaceId);
      toast.success('Workspace changé avec succès');
    } catch (error) {
      console.error('Error switching workspace:', error);
      toast.error('Erreur lors du changement de workspace');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r" collapsible="icon">
          <SidebarContent>
            <div className="p-4 border-b">
              <h2 className="text-lg font-bold">Ash CRM</h2>
              {isSuperAdmin && workspace && (
                <div className="mt-3">
                  <Select
                    value={workspace.id}
                    onValueChange={handleWorkspaceChange}
                    disabled={loadingWorkspaces}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        <div className="flex items-center justify-between w-full">
                          <span className="truncate">{workspace.display_name || workspace.name}</span>
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableWorkspaces.map((ws) => (
                        <SelectItem key={ws.id} value={ws.id}>
                          {ws.display_name || ws.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems
                    .filter((item) => !userRole || item.roles.includes(userRole.role))
                    .map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            isActive
                              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                              : 'hover:bg-accent'
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="mt-auto p-4 border-t">
              <Button variant="outline" className="w-full" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                <span>Déconnexion</span>
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="border-b bg-card h-14 flex items-center px-4">
            <SidebarTrigger />
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};
