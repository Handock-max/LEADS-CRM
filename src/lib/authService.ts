import { User } from '@supabase/supabase-js';
import { Workspace, UserRole } from '@/types/auth';
import { env } from './env';
import { supabase, handleSupabaseError } from './supabase';
import { mockAuthService, MOCK_USERS } from './mockAuth';

// Unified auth service interface
export interface AuthService {
  signIn(email: string, password: string): Promise<{ user: User | null; error: Error | null }>;
  signOut(): Promise<{ error: Error | null }>;
  getSession(): Promise<{ user: User | null; error: Error | null }>;
  getUserData(user: User): Promise<{
    workspace: Workspace | null;
    userRole: UserRole | null;
    error: Error | null;
  }>;
  onAuthStateChange(callback: (user: User | null) => void): { unsubscribe: () => void };
}

// Supabase auth service implementation
class SupabaseAuthService implements AuthService {
  async signIn(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async getSession(): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      return { user: session?.user || null, error };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async getUserData(user: User): Promise<{
    workspace: Workspace | null;
    userRole: UserRole | null;
    error: Error | null;
  }> {
    try {
      // Fetch user role and workspace in a single query with join
      const { data: userRoleData, error: roleError } = await supabase
        .from('user_roles')
        .select(`
          *,
          workspace:workspaces(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (roleError) {
        return {
          workspace: null,
          userRole: null,
          error: new Error('Failed to load user permissions. Please contact your administrator.')
        };
      }

      if (!userRoleData) {
        return {
          workspace: null,
          userRole: null,
          error: new Error('No active workspace found. Please contact your administrator.')
        };
      }

      const userRole: UserRole = {
        id: userRoleData.id,
        user_id: userRoleData.user_id,
        workspace_id: userRoleData.workspace_id,
        role: userRoleData.role,
        is_active: userRoleData.is_active,
        invited_by: userRoleData.invited_by,
        created_at: userRoleData.created_at,
        updated_at: userRoleData.updated_at,
      };

      const workspace: Workspace = userRoleData.workspace;

      return { workspace, userRole, error: null };
    } catch (error) {
      return {
        workspace: null,
        userRole: null,
        error: new Error(handleSupabaseError(error))
      };
    }
  }

  onAuthStateChange(callback: (user: User | null) => void): { unsubscribe: () => void } {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        callback(session?.user || null);
      }
    );

    return {
      unsubscribe: () => subscription.unsubscribe()
    };
  }
}

// Mock auth service wrapper to match interface
class MockAuthServiceWrapper implements AuthService {
  async signIn(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    return mockAuthService.signIn(email, password);
  }

  async signOut(): Promise<{ error: Error | null }> {
    return mockAuthService.signOut();
  }

  async getSession(): Promise<{ user: User | null; error: Error | null }> {
    return mockAuthService.getSession();
  }

  async getUserData(user: User): Promise<{
    workspace: Workspace | null;
    userRole: UserRole | null;
    error: Error | null;
  }> {
    return mockAuthService.getUserData(user);
  }

  onAuthStateChange(callback: (user: User | null) => void): { unsubscribe: () => void } {
    return mockAuthService.onAuthStateChange(callback);
  }
}

// Export the appropriate service based on environment
export const authService: AuthService = env.VITE_MOCK_AUTH 
  ? new MockAuthServiceWrapper()
  : new SupabaseAuthService();

// Export mock users for development reference
export { MOCK_USERS };