import { User } from '@supabase/supabase-js';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  settings: WorkspaceSettings;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceSettings {
  custom_fields?: CustomField[];
  lead_statuses?: string[];
  default_currency?: string;
  timezone?: string;
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  options?: string[];
  required: boolean;
  order: number;
}

export interface UserRole {
  id: string;
  user_id: string;
  workspace_id: string;
  role: 'admin' | 'manager' | 'agent';
  is_active: boolean;
  invited_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  workspace: Workspace | null;
  userRole: UserRole | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export interface AuthState {
  user: User | null;
  workspace: Workspace | null;
  userRole: UserRole | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}