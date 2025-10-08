import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import userService, { UserWithRole, CreateUserData } from '@/lib/userService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';

interface CreateUserForm {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'manager' | 'agent';
}

const UserManagement = () => {
  const { workspace, userRole } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [createUserForm, setCreateUserForm] = useState<CreateUserForm>({
    email: '',
    password: '',
    full_name: '',
    role: 'agent'
  });
  const [creatingUser, setCreatingUser] = useState(false);

  // Charger les utilisateurs du workspace
  const loadUsers = async () => {
    if (!workspace) return;

    setLoadingUsers(true);
    try {
      const { data, error } = await userService.getWorkspaceUsers(workspace.id);
      if (error) {
        toast.error('Erreur lors du chargement des utilisateurs: ' + error.message);
      } else {
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (workspace) {
      loadUsers();
    }
  }, [workspace]);

  // Vérifier les permissions (admin uniquement)
  if (!userRole || userRole.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Accès refusé</h2>
          <p className="text-gray-600 mb-4">
            Vous devez être administrateur pour accéder à la gestion des utilisateurs.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  // Créer un nouvel utilisateur
  const handleCreateUser = async () => {
    if (!workspace) {
      toast.error('Aucun workspace sélectionné');
      return;
    }

    if (!createUserForm.email || !createUserForm.password) {
      toast.error('Email et mot de passe sont requis');
      return;
    }

    setCreatingUser(true);
    try {
      const userData: CreateUserData = {
        email: createUserForm.email,
        password: createUserForm.password,
        full_name: createUserForm.full_name,
        role: createUserForm.role,
        workspace_id: workspace.id
      };

      const { error } = await userService.createUser(userData);
      
      if (error) {
        toast.error('Erreur lors de la création: ' + error.message);
        return;
      }

      toast.success('Utilisateur créé avec succès');
      setShowCreateUserDialog(false);
      setCreateUserForm({
        email: '',
        password: '',
        full_name: '',
        role: 'agent'
      });
      
      // Recharger la liste des utilisateurs
      await loadUsers();
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      toast.error('Erreur lors de la création de l\'utilisateur');
    } finally {
      setCreatingUser(false);
    }
  };

  // Mettre à jour le rôle d'un utilisateur
  const handleUpdateUserRole = async (userId: string, newRole: 'admin' | 'manager' | 'agent') => {
    if (!workspace) return;

    try {
      const { error } = await userService.updateUserRole(userId, workspace.id, newRole);
      
      if (error) {
        toast.error('Erreur lors de la mise à jour: ' + error.message);
        return;
      }

      toast.success('Rôle mis à jour avec succès');
      await loadUsers();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error);
      toast.error('Erreur lors de la mise à jour du rôle');
    }
  };

  // Supprimer un utilisateur
  const handleDeleteUser = async (userId: string) => {
    if (!workspace) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      const { error } = await userService.deleteUser(userId, workspace.id);
      
      if (error) {
        toast.error('Erreur lors de la suppression: ' + error.message);
        return;
      }

      toast.success('Utilisateur supprimé avec succès');
      await loadUsers();
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      toast.error('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'default';
      case 'agent':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'manager':
        return 'Manager';
      case 'agent':
        return 'Agent';
      default:
        return role;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground">
            Gérez les utilisateurs de votre workspace
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Utilisateurs du workspace
              </CardTitle>
              <CardDescription>
                Liste des utilisateurs ayant accès à ce workspace
              </CardDescription>
            </div>
            <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Ajouter un utilisateur
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                  <DialogDescription>
                    Ajoutez un nouvel utilisateur à votre workspace
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="user-email">Email</Label>
                    <Input
                      id="user-email"
                      type="email"
                      value={createUserForm.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateUserForm((prev: CreateUserForm) => ({ ...prev, email: e.target.value }))}
                      required
                      placeholder="utilisateur@exemple.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="user-password">Mot de passe</Label>
                    <Input
                      id="user-password"
                      type="password"
                      value={createUserForm.password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateUserForm((prev: CreateUserForm) => ({ ...prev, password: e.target.value }))}
                      required
                      placeholder="Mot de passe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="user-name">Nom complet</Label>
                    <Input
                      id="user-name"
                      value={createUserForm.full_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateUserForm((prev: CreateUserForm) => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Nom complet (optionnel)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="user-role">Rôle</Label>
                    <Select
                      value={createUserForm.role}
                      onValueChange={(value: 'admin' | 'manager' | 'agent') => 
                        setCreateUserForm((prev: CreateUserForm) => ({ ...prev, role: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Administrateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateUserDialog(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleCreateUser}
                    disabled={creatingUser}
                  >
                    {creatingUser ? 'Création...' : 'Créer'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="text-center py-4">Chargement des utilisateurs...</div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">{user.full_name || user.email}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={user.role}
                      onValueChange={(newRole: 'admin' | 'manager' | 'agent') => 
                        handleUpdateUserRole(user.id, newRole)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun utilisateur trouvé
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;