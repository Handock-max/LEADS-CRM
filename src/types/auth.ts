import { User } from '@supabase/supabase-js';
import { Permission } from '@/lib/permissionService';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  display_name?: string;
  settings: WorkspaceSettings;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceSettings {
  custom_fields?: CustomField[];
  lead_statuses?: string[];
  default_currency?: string;
  timezone?: string;
  theme?: string;
  language?: string;
  notifications?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  customFields?: CustomField[];
}

export interface CustomField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'select' | 'textarea' | 'checkbox';
  required: boolean;
  options?: string[];
  placeholder?: string;
  defaultValue?: string;
  order: number;
}

export interface UserRole {
  id: string;
  user_id: string;
  workspace_id: string;
  role: 'admin' | 'manager' | 'agent' | 'super_admin';
  is_active: boolean;
  invited_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  workspace: Workspace | null;
  userRole: UserRole | null;
  permissions: Permission[];
  isSuperAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  
  // Méthodes de permissions
  hasPermission: (permission: Permission) => boolean;
  canPerform: (action: 'create' | 'read' | 'update' | 'delete' | 'assign', resource: string, context?: any) => boolean;
  canAccessRoute: (route: string) => boolean;
}

export interface AuthState {
  user: User | null;
  workspace: Workspace | null;
  userRole: UserRole | null;
  permissions: Permission[];
  isSuperAdmin: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}