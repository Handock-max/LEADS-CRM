import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { workspaceService } from '@/lib/workspaceService';
import { userService, UserWithRole } from '@/lib/userService';
import { Workspace } from '@/types/auth';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Users, BarChart3, TrendingUp, Activity } from 'lucide-react';

interface WorkspaceWithStats extends Workspace {
  totalUsers: number;
  activeUsers: number;
  totalProspects: number;
}

interface CreateWorkspaceForm {
  name: string;
  slug: string;
  display_name: string;
  admin_email: string;
}

interface GlobalStats {
  totalWorkspaces: number;
  totalUsers: number;
  activeUsers: number;
  totalProspects: number;
  averageUsersPerWorkspace: number;
  averageProspectsPerWorkspace: number;
  workspaceUsageMetrics: Array<{
    workspaceId: string;
    workspaceName: string;
    totalUsers: number;
    activeUsers: number;
    totalProspects: number;
    lastActivity?: string;
  }>;
}

const WorkspaceManagement: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceWithStats[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUsersDialog, setShowUsersDialog] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [workspaceUsers, setWorkspaceUsers] = useState<UserWithRole[]>([]);
  const [createForm, setCreateForm] = useState<CreateWorkspaceForm>({
    name: '',
    slug: '',
    display_name: '',
    admin_email: ''
  });

  // Vérifier les permissions (Super Admin uniquement)
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Accès refusé</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Vous devez être Super Admin pour accéder à cette page.
            </p>
            <Button onClick={() => window.history.back()}>
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Charger les statistiques globales
  const loadGlobalStats = async () => {
    try {
      setStatsLoading(true);
      const { data, error } = await workspaceService.getGlobalStats();
      
      if (error) {
        toast.error(error.message);
        return;
      }

      setGlobalStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques globales:', error);
      toast.error('Erreur lors du chargement des statistiques globales');
    } finally {
      setStatsLoading(false);
    }
  };

  // Charger les workspaces
  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const { data, error } = await workspaceService.getAllWorkspaces();
      
      if (error) {
        toast.error(error.message);
        return;
      }

      if (data) {
        // Charger les statistiques pour chaque workspace
        const workspacesWithStats = await Promise.all(
          data.map(async (workspace) => {
            const { data: stats } = await workspaceService.getWorkspaceStats(workspace.id);
            return {
              ...workspace,
              totalUsers: stats?.totalUsers || 0,
              activeUsers: stats?.activeUsers || 0,
              totalProspects: stats?.totalProspects || 0
            };
          })
        );
        
        setWorkspaces(workspacesWithStats);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des workspaces:', error);
      toast.error('Erreur lors du chargement des workspaces');
    } finally {
      setLoading(false);
    }
  };

  // Charger les utilisateurs d'un workspace
  const loadWorkspaceUsers = async (workspaceId: string) => {
    try {
      const { data, error } = await userService.getWorkspaceUsers(workspaceId);
      
      if (error) {
        toast.error(error.message);
        return;
      }

      setWorkspaceUsers(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    }
  };

  useEffect(() => {
    loadGlobalStats();
    loadWorkspaces();
  }, []);

  // Générer le slug automatiquement
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Gérer les changements du formulaire
  const handleFormChange = (field: keyof CreateWorkspaceForm, value: string) => {
    setCreateForm(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-générer le slug quand le nom change
      if (field === 'name') {
        updated.slug = generateSlug(value);
        if (!updated.display_name) {
          updated.display_name = value;
        }
      }
      
      return updated;
    });
  };

  // Créer un workspace
  const handleCreateWorkspace = async () => {
    if (!createForm.name || !createForm.admin_email) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setCreating(true);

      // Vérifier si le slug est disponible
      const { available, error: slugError } = await workspaceService.isSlugAvailable(createForm.slug);
      
      if (slugError) {
        toast.error(slugError.message);
        return;
      }

      if (!available) {
        toast.error('Ce nom de workspace est déjà utilisé');
        return;
      }

      // Rechercher l'utilisateur admin
      const { data: users, error: userError } = await userService.searchUsersByEmail(createForm.admin_email);
      
      if (userError) {
        toast.error(userError.message);
        return;
      }

      const adminUser = users?.find(u => u.email === createForm.admin_email);
      
      if (!adminUser) {
        toast.error('Utilisateur admin non trouvé');
        return;
      }

      // Créer le workspace avec admin
      const { data, error } = await workspaceService.createWorkspaceWithAdmin(
        {
          name: createForm.name,
          slug: createForm.slug,
          display_name: createForm.display_name,
          settings: {}
        },
        adminUser.id
      );

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Workspace créé avec succès');
      setShowCreateDialog(false);
      setCreateForm({ name: '', slug: '', display_name: '', admin_email: '' });
      loadGlobalStats();
      loadWorkspaces();
      
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast.error('Erreur lors de la création du workspace');
    } finally {
      setCreating(false);
    }
  };

  // Supprimer un workspace
  const handleDeleteWorkspace = async (workspace: Workspace) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le workspace "${workspace.display_name || workspace.name}" ?`)) {
      return;
    }

    try {
      const { error } = await workspaceService.deleteWorkspace(workspace.id);
      
      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Workspace supprimé avec succès');
      loadGlobalStats();
      loadWorkspaces();
      
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression du workspace');
    }
  };

  // Afficher les utilisateurs d'un workspace
  const handleShowUsers = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    loadWorkspaceUsers(workspace.id);
    setShowUsersDialog(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestion des Workspaces
              </h1>
              <p className="mt-2 text-gray-600">
                Gérez tous les workspaces et leurs administrateurs
              </p>
            </div>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Workspace
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Créer un nouveau workspace</DialogTitle>
                  <DialogDescription>
                    Créez un nouveau workspace et assignez un administrateur
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nom du workspace *</Label>
                    <Input
                      id="name"
                      value={createForm.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      placeholder="Mon Workspace"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="slug">Identifiant (slug) *</Label>
                    <Input
                      id="slug"
                      value={createForm.slug}
                      onChange={(e) => handleFormChange('slug', e.target.value)}
                      placeholder="mon-workspace"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="display_name">Nom d'affichage</Label>
                    <Input
                      id="display_name"
                      value={createForm.display_name}
                      onChange={(e) => handleFormChange('display_name', e.target.value)}
                      placeholder="Mon Workspace"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="admin_email">Email de l'administrateur *</Label>
                    <Input
                      id="admin_email"
                      type="email"
                      value={createForm.admin_email}
                      onChange={(e) => handleFormChange('admin_email', e.target.value)}
                      placeholder="admin@example.com"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleCreateWorkspace}
                    disabled={creating}
                  >
                    {creating ? 'Création...' : 'Créer'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistiques globales */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Vue d'ensemble de la plateforme
          </h2>
          
          {statsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : globalStats ? (
            <>
              {/* Métriques principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Workspaces</p>
                        <p className="text-2xl font-bold text-gray-900">{globalStats.totalWorkspaces}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Utilisateurs Actifs</p>
                        <p className="text-2xl font-bold text-gray-900">{globalStats.activeUsers}</p>
                        <p className="text-xs text-gray-500">sur {globalStats.totalUsers} total</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Prospects</p>
                        <p className="text-2xl font-bold text-gray-900">{globalStats.totalProspects}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Activity className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Moyenne/Workspace</p>
                        <p className="text-lg font-bold text-gray-900">{globalStats.averageUsersPerWorkspace} users</p>
                        <p className="text-sm text-gray-500">{globalStats.averageProspectsPerWorkspace} prospects</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Métriques d'utilisation par workspace */}
              <Card>
                <CardHeader>
                  <CardTitle>Métriques d'utilisation par workspace</CardTitle>
                  <CardDescription>
                    Détail de l'activité et de l'utilisation de chaque workspace
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Workspace</TableHead>
                        <TableHead>Utilisateurs</TableHead>
                        <TableHead>Prospects</TableHead>
                        <TableHead>Dernière activité</TableHead>
                        <TableHead>Taux d'activité</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {globalStats.workspaceUsageMetrics.map((metric) => {
                        const activityRate = metric.totalUsers > 0 ? Math.round((metric.activeUsers / metric.totalUsers) * 100) : 0;
                        const lastActivityDate = metric.lastActivity ? new Date(metric.lastActivity) : null;
                        const daysSinceActivity = lastActivityDate ? Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
                        
                        return (
                          <TableRow key={metric.workspaceId}>
                            <TableCell>
                              <div className="font-medium">{metric.workspaceName}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{metric.activeUsers} actifs</div>
                                <div className="text-muted-foreground">{metric.totalUsers} total</div>
                              </div>
                            </TableCell>
                            <TableCell>{metric.totalProspects}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {lastActivityDate ? (
                                  <>
                                    <div>{lastActivityDate.toLocaleDateString('fr-FR')}</div>
                                    <div className="text-muted-foreground">
                                      {daysSinceActivity === 0 ? 'Aujourd\'hui' : 
                                       daysSinceActivity === 1 ? 'Hier' : 
                                       `Il y a ${daysSinceActivity} jours`}
                                    </div>
                                  </>
                                ) : (
                                  <span className="text-muted-foreground">Aucune activité</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      activityRate >= 80 ? 'bg-green-500' :
                                      activityRate >= 50 ? 'bg-yellow-500' :
                                      activityRate >= 20 ? 'bg-orange-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${activityRate}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">{activityRate}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Impossible de charger les statistiques globales</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Liste des workspaces */}
        <Card>
          <CardHeader>
            <CardTitle>Workspaces ({workspaces.length})</CardTitle>
            <CardDescription>
              Liste de tous les workspaces avec leurs statistiques
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Chargement des workspaces...</p>
              </div>
            ) : workspaces.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Aucun workspace trouvé</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workspace</TableHead>
                    <TableHead>Identifiant</TableHead>
                    <TableHead>Utilisateurs</TableHead>
                    <TableHead>Prospects</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workspaces.map((workspace) => (
                    <TableRow key={workspace.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {workspace.display_name || workspace.name}
                          </div>
                          {workspace.display_name && workspace.display_name !== workspace.name && (
                            <div className="text-sm text-muted-foreground">
                              {workspace.name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{workspace.slug}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{workspace.activeUsers} actifs</div>
                          <div className="text-muted-foreground">
                            {workspace.totalUsers} total
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{workspace.totalProspects}</TableCell>
                      <TableCell>
                        {new Date(workspace.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShowUsers(workspace)}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {/* TODO: Implémenter l'édition */}}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteWorkspace(workspace)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog des utilisateurs */}
        <Dialog open={showUsersDialog} onOpenChange={setShowUsersDialog}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Utilisateurs - {selectedWorkspace?.display_name || selectedWorkspace?.name}
              </DialogTitle>
              <DialogDescription>
                Gérez les utilisateurs et leurs rôles dans ce workspace
              </DialogDescription>
            </DialogHeader>
            
            <div className="max-h-96 overflow-y-auto">
              {workspaceUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workspaceUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {user.full_name || user.email}
                            </div>
                            {user.full_name && (
                              <div className="text-sm text-muted-foreground">
                                {user.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? 'default' : 'destructive'}>
                            {user.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowUsersDialog(false)}
              >
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default WorkspaceManagement;