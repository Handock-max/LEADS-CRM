import { User } from '@supabase/supabase-js';
import { Workspace, UserRole } from '@/types/auth';

// Mock users data
export const MOCK_USERS = {
  'admin@ashcrm.com': {
    password: 'password123',
    user: {
      id: 'mock-admin-id',
      email: 'admin@ashcrm.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as User,
    workspace: {
      id: 'workspace-1',
      name: 'Ash CRM Demo',
      slug: 'ash-crm-demo',
      settings: {
        custom_fields: [],
        lead_statuses: ['nouveau', 'contacté', 'qualifié', 'négociation', 'fermé-gagné', 'fermé-perdu'],
        default_currency: 'EUR',
        timezone: 'Europe/Paris',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Workspace,
    userRole: {
      id: 'role-admin-1',
      user_id: 'mock-admin-id',
      workspace_id: 'workspace-1',
      role: 'admin' as const,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as UserRole,
  },
  'manager@ashcrm.com': {
    password: 'password123',
    user: {
      id: 'mock-manager-id',
      email: 'manager@ashcrm.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as User,
    workspace: {
      id: 'workspace-1',
      name: 'Ash CRM Demo',
      slug: 'ash-crm-demo',
      settings: {
        custom_fields: [],
        lead_statuses: ['nouveau', 'contacté', 'qualifié', 'négociation', 'fermé-gagné', 'fermé-perdu'],
        default_currency: 'EUR',
        timezone: 'Europe/Paris',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Workspace,
    userRole: {
      id: 'role-manager-1',
      user_id: 'mock-manager-id',
      workspace_id: 'workspace-1',
      role: 'manager' as const,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as UserRole,
  },
  'agent@ashcrm.com': {
    password: 'password123',
    user: {
      id: 'mock-agent-id',
      email: 'agent@ashcrm.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as User,
    workspace: {
      id: 'workspace-1',
      name: 'Ash CRM Demo',
      slug: 'ash-crm-demo',
      settings: {
        custom_fields: [],
        lead_statuses: ['nouveau', 'contacté', 'qualifié', 'négociation', 'fermé-gagné', 'fermé-perdu'],
        default_currency: 'EUR',
        timezone: 'Europe/Paris',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Workspace,
    userRole: {
      id: 'role-agent-1',
      user_id: 'mock-agent-id',
      workspace_id: 'workspace-1',
      role: 'agent' as const,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as UserRole,
  },
};

// Mock auth service
export class MockAuthService {
  private currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    // Restore session from localStorage
    const savedUser = localStorage.getItem('mock-auth-user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('mock-auth-user');
      }
    }
  }

  // Simulate sign in
  async signIn(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockUser = MOCK_USERS[email as keyof typeof MOCK_USERS];
    
    if (!mockUser || mockUser.password !== password) {
      return {
        user: null,
        error: new Error('Invalid login credentials')
      };
    }

    this.currentUser = mockUser.user;
    localStorage.setItem('mock-auth-user', JSON.stringify(mockUser.user));
    
    // Notify listeners
    this.listeners.forEach(listener => listener(this.currentUser));

    return {
      user: mockUser.user,
      error: null
    };
  }

  // Simulate sign out
  async signOut(): Promise<{ error: Error | null }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    this.currentUser = null;
    localStorage.removeItem('mock-auth-user');
    
    // Notify listeners
    this.listeners.forEach(listener => listener(null));

    return { error: null };
  }

  // Get current session
  async getSession(): Promise<{ user: User | null; error: Error | null }> {
    return {
      user: this.currentUser,
      error: null
    };
  }

  // Get user data (workspace and role)
  async getUserData(user: User): Promise<{
    workspace: Workspace | null;
    userRole: UserRole | null;
    error: Error | null;
  }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400));

    const mockUser = MOCK_USERS[user.email as keyof typeof MOCK_USERS];
    
    if (!mockUser) {
      return {
        workspace: null,
        userRole: null,
        error: new Error('User data not found')
      };
    }

    return {
      workspace: mockUser.workspace,
      userRole: mockUser.userRole,
      error: null
    };
  }

  // Subscribe to auth changes
  onAuthStateChange(callback: (user: User | null) => void): { unsubscribe: () => void } {
    this.listeners.push(callback);
    
    return {
      unsubscribe: () => {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
          this.listeners.splice(index, 1);
        }
      }
    };
  }
}

export const mockAuthService = new MockAuthService();