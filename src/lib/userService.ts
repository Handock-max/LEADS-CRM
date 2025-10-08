import { getSupabaseClient } from './supabase';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
}

export interface UserWithRole extends User {
  role: 'admin' | 'manager' | 'agent' | 'super_admin';
  workspace_id: string;
  workspace_name: string;
  is_active: boolean;
}

export interface CreateUserData {
  email: string;
  password: string;
  full_name?: string;
  role: 'admin' | 'manager' | 'agent' | 'super_admin';
  workspace_id: string;
}

class UserService {
  private supabase = getSupabaseClient();

  /**
   * Récupérer tous les utilisateurs (Super Admin uniquement)
   */
  async getAllUsers(): Promise<{ data: UserWithRole[] | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          workspace_id,
          is_active,
          profiles:user_id (
            id,
            email,
            full_name,
            created_at,
            updated_at
          ),
          workspace:workspaces (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      const users: UserWithRole[] = data?.map((item: any) => ({
        id: item.profiles?.id || item.user_id,
        email: item.profiles?.email || '',
        full_name: item.profiles?.full_name,
        created_at: item.profiles?.created_at || '',
        updated_at: item.profiles?.updated_at || '',
        role: item.role,
        workspace_id: item.workspace_id,
        workspace_name: item.workspace?.name || '',
        is_active: item.is_active
      })) || [];

      return { data: users, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Erreur lors du chargement des utilisateurs')
      };
    }
  }

  /**
   * Récupérer les utilisateurs d'un workspace spécifique
   */
  async getWorkspaceUsers(workspaceId: string): Promise<{ data: UserWithRole[] | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          workspace_id,
          is_active,
          profiles:user_id (
            id,
            email,
            full_name,
            created_at,
            updated_at
          ),
          workspace:workspaces (
            name
          )
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      const users: UserWithRole[] = data?.map((item: any) => ({
        id: item.profiles?.id || item.user_id,
        email: item.profiles?.email || '',
        full_name: item.profiles?.full_name,
        created_at: item.profiles?.created_at || '',
        updated_at: item.profiles?.updated_at || '',
        role: item.role,
        workspace_id: item.workspace_id,
        workspace_name: item.workspace?.name || '',
        is_active: item.is_active
      })) || [];

      return { data: users, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Erreur lors du chargement des utilisateurs du workspace')
      };
    }
  }

  /**
   * Créer un nouvel utilisateur avec rôle
   */
  async createUser(userData: CreateUserData): Promise<{ data: UserWithRole | null; error: Error | null }> {
    try {
      // Créer l'utilisateur via Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name
          }
        }
      });

      if (authError || !authData.user) {
        return { data: null, error: new Error(authError?.message || 'Erreur lors de la création de l\'utilisateur') };
      }

      // Créer le rôle utilisateur
      const { data: roleData, error: roleError } = await this.supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          workspace_id: userData.workspace_id,
          role: userData.role,
          is_active: true
        })
        .select(`
          user_id,
          role,
          workspace_id,
          is_active,
          workspace:workspaces (
            name
          )
        `)
        .single();

      if (roleError) {
        return { data: null, error: new Error(roleError.message) };
      }

      const user: UserWithRole = {
        id: authData.user.id,
        email: authData.user.email || userData.email,
        full_name: userData.full_name,
        created_at: authData.user.created_at,
        updated_at: authData.user.updated_at || authData.user.created_at,
        role: roleData.role,
        workspace_id: roleData.workspace_id,
        workspace_name: roleData.workspace?.name || '',
        is_active: roleData.is_active
      };

      return { data: user, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Erreur lors de la création de l\'utilisateur')
      };
    }
  }

  /**
   * Mettre à jour le rôle d'un utilisateur
   */
  async updateUserRole(
    userId: string,
    workspaceId: string,
    newRole: 'admin' | 'manager' | 'agent' | 'super_admin'
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId);

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Erreur lors de la mise à jour du rôle')
      };
    }
  }

  /**
   * Activer/désactiver un utilisateur
   */
  async toggleUserStatus(
    userId: string,
    workspaceId: string,
    isActive: boolean
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('user_roles')
        .update({ is_active: isActive })
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId);

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Erreur lors de la mise à jour du statut')
      };
    }
  }

  /**
   * Supprimer un utilisateur d'un workspace
   */
  async removeUserFromWorkspace(
    userId: string,
    workspaceId: string
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId);

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Erreur lors de la suppression de l\'utilisateur')
      };
    }
  }

  /**
   * Rechercher des utilisateurs par email
   */
  async searchUsersByEmail(email: string): Promise<{ data: User[] | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('id, email, full_name, created_at, updated_at')
        .ilike('email', `%${email}%`)
        .limit(10);

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      const users: User[] = data?.map((item: any) => ({
        id: item.id,
        email: item.email,
        full_name: item.full_name,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) || [];

      return { data: users, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Erreur lors de la recherche d\'utilisateurs')
      };
    }
  }
}

export const userService = new UserService();