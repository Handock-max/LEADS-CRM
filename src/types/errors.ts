export interface PermissionErrorContext {
  type?: 'page_access' | 'action_denied' | 'workspace_access' | 'role_insufficient';
  resource?: string;
  action?: string;
  requiredRole?: string;
  message?: string;
  path?: string;
}

export type PermissionErrorType = 
  | 'page_access'
  | 'action_denied' 
  | 'workspace_access'
  | 'role_insufficient';

export interface AccessiblePage {
  name: string;
  path: string;
  icon: any;
  description: string;
}