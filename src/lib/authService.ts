import { User } from '@supabase/supabase-js';
import { Workspace, UserRole } from '@/types/auth';
import { getSupabaseClient, handleSupabaseError } from './supabase';

// Auth service interface
interface AuthService {
  signIn(email: string, password: string): Promise<{ user: User | null; error: Error | null }>;
  signOut(): Promise<{ error: Error | null }>;
  getSession(): Promise<{ user: User | null; error: Error | null }>;
  getUserData(user: User): Promise<{
    workspace: Workspace | null;
    userRole: UserRole | null;
    error: Error | null;
  }>;
  getUserDataForWorkspace(user: User, workspaceId: string): Promise<{
    workspace: Workspace | null;
    userRole: UserRole | null;
    error: Error | null;
  }>;
  onAuthStateChange(callback: (user: User | null) => void): { unsubscribe: () => void };
}

// Supabase auth service implementation
class SupabaseAuthService implements AuthService {
  private supabase = getSupabaseClient();

  async signIn(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: handleSupabaseError(error) };
      }

      return { user: data.user, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: error instanceof Error ? error : new Error('Unknown error during sign in') 
      };
    }
  }

  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        return { error: handleSupabaseError(error) };
      }

      return { error: null };
    } catch (error) {
      return { 
        error: error instanceof Error ? error : new Error('Unknown error during sign out') 
      };
    }
  }

  async getSession(): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error) {
        return { user: null, error: handleSupabaseError(error) };
      }

      return { user: session?.user || null, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: error instanceof Error ? error : new Error('Unknown error getting session') 
      };
    }
  }

  async getUserData(user: User): Promise<{
    workspace: Workspace | null;
    userRole: UserRole | null;
    error: Error | null;
  }> {
    try {
      // Get user role and workspace from Supabase (optimized query)
      const { data: userRoleData, error: roleError } = await this.supabase
        .from('user_roles')
        .select(`
          id,
          role,
          workspace_id,
          workspace:workspaces (
            id,
            name,
            slug
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (roleError) {
        return {
          workspace: null,
          userRole: null,
          error: handleSupabaseError(roleError)
        };
      }

      if (!userRoleData || !userRoleData.workspace) {
        return {
          workspace: null,
          userRole: null,
          error: new Error('No active workspace found for user')
        };
      }

      const workspace: Workspace = {
        id: userRoleData.workspace.id,
        name: userRoleData.workspace.name,
        slug: userRoleData.workspace.slug,
        settings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const userRole: UserRole = {
        id: userRoleData.id,
        role: userRoleData.role,
        workspace_id: workspace.id,
        user_id: user.id,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return {
        workspace,
        userRole,
        error: null
      };

    } catch (error) {
      return {
        workspace: null,
        userRole: null,
        error: error instanceof Error ? error : new Error('Unknown error fetching user data')
      };
    }
  }

  async getUserDataForWorkspace(user: User, workspaceId: string): Promise<{
    workspace: Workspace | null;
    userRole: UserRole | null;
    error: Error | null;
  }> {
    try {
      // Get user role for specific workspace
      const { data: userRoleData, error: roleError } = await this.supabase
        .from('user_roles')
        .select(`
          id,
          role,
          workspace_id,
          workspace:workspaces (
            id,
            name,
            slug,
            display_name,
            settings,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .single();

      if (roleError) {
        return {
          workspace: null,
          userRole: null,
          error: handleSupabaseError(roleError)
        };
      }

      if (!userRoleData || !userRoleData.workspace) {
        return {
          workspace: null,
          userRole: null,
          error: new Error('Workspace not found or access denied')
        };
      }

      const workspace: Workspace = {
        id: userRoleData.workspace.id,
        name: userRoleData.workspace.name,
        slug: userRoleData.workspace.slug,
        display_name: userRoleData.workspace.display_name || userRoleData.workspace.name,
        settings: userRoleData.workspace.settings || {},
        created_at: userRoleData.workspace.created_at,
        updated_at: userRoleData.workspace.updated_at
      };

      const userRole: UserRole = {
        id: userRoleData.id,
        role: userRoleData.role,
        workspace_id: workspace.id,
        user_id: user.id,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return {
        workspace,
        userRole,
        error: null
      };

    } catch (error) {
      return {
        workspace: null,
        userRole: null,
        error: error instanceof Error ? error : new Error('Unknown error fetching workspace data')
      };
    }
  }

  onAuthStateChange(callback: (user: User | null) => void): { unsubscribe: () => void } {
    const { data: { subscription } } = this.supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Supabase auth event:', event, session?.user?.email || 'no user');
        callback(session?.user || null);
      }
    );

    return {
      unsubscribe: () => subscription.unsubscribe()
    };
  }
}

// Export the auth service
export const authService: AuthService = new SupabaseAuthService();