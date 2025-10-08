/**
 * Types TypeScript pour la gestion des erreurs de permission
 * 
 * Ce fichier définit les interfaces et types utilisés dans le système de gestion
 * des erreurs 403 (accès refusé) du CRM.
 * 
 * Architecture :
 * - PermissionErrorContext : Contexte complet d'une erreur de permission
 * - PermissionErrorType : Types d'erreurs supportés
 * - AccessiblePage : Structure des pages accessibles selon le rôle
 */

/**
 * Contexte d'erreur de permission
 * 
 * Cette interface définit toutes les informations nécessaires pour afficher
 * une page d'erreur 403 contextuelle et utile à l'utilisateur.
 * 
 * Propriétés :
 * - type : Type d'erreur (détermine le message et les suggestions)
 * - resource : Ressource concernée (prospects, users, workspaces, etc.)
 * - action : Action tentée (create, read, update, delete, assign)
 * - requiredRole : Rôle minimum requis pour l'action
 * - message : Message personnalisé (optionnel, généré automatiquement sinon)
 * - path : Chemin de la page refusée (pour les erreurs page_access)
 * 
 * Utilisation :
 * - Passé via location.state lors de la redirection vers /unauthorized
 * - Utilisé par la page Unauthorized pour afficher des messages spécifiques
 */
export interface PermissionErrorContext {
  /** Type d'erreur de permission */
  type?: 'page_access' | 'action_denied' | 'workspace_access' | 'role_insufficient';
  
  /** Ressource concernée par l'erreur (prospects, users, workspaces, settings) */
  resource?: string;
  
  /** Action tentée (create, read, update, delete, assign) */
  action?: string;
  
  /** Rôle minimum requis pour effectuer l'action */
  requiredRole?: string;
  
  /** Message d'erreur personnalisé (optionnel) */
  message?: string;
  
  /** Chemin de la page refusée (pour type: 'page_access') */
  path?: string;
}

/**
 * Types d'erreurs de permission supportés
 * 
 * Chaque type correspond à un scénario d'erreur spécifique :
 * 
 * - page_access : Accès à une page refusé (ex: agent → /user-management)
 * - action_denied : Action spécifique refusée (ex: supprimer prospect d'autrui)
 * - workspace_access : Accès à un workspace refusé (isolation multi-tenant)
 * - role_insufficient : Rôle insuffisant pour une action (ex: agent → admin action)
 */
export type PermissionErrorType = 
  | 'page_access'      // Accès à une page refusé
  | 'action_denied'    // Action spécifique refusée
  | 'workspace_access' // Accès workspace refusé
  | 'role_insufficient'; // Rôle insuffisant

/**
 * Structure d'une page accessible
 * 
 * Utilisé pour afficher la liste des pages auxquelles l'utilisateur
 * peut accéder selon son rôle, avec navigation directe.
 * 
 * Propriétés :
 * - name : Nom affiché de la page (ex: "Gestion utilisateurs")
 * - path : Chemin de la page (ex: "/user-management")
 * - icon : Composant d'icône Lucide React
 * - description : Description courte de la fonctionnalité
 * 
 * Utilisation :
 * - Généré dynamiquement selon le rôle de l'utilisateur
 * - Affiché sous forme de boutons cliquables sur la page 403
 */
export interface AccessiblePage {
  /** Nom affiché de la page */
  name: string;
  
  /** Chemin de navigation de la page */
  path: string;
  
  /** Composant d'icône (Lucide React) */
  icon: any;
  
  /** Description courte de la fonctionnalité */
  description: string;
}