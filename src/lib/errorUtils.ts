import { NavigateFunction } from 'react-router-dom';
import { PermissionErrorContext, PermissionErrorType } from '@/types/errors';

/**
 * Utilitaires pour la gestion des erreurs de permission et redirections
 * 
 * Ce module fournit des fonctions pour créer des contextes d'erreur spécifiques
 * et naviguer vers la page 403 avec les bonnes informations contextuelles.
 * 
 * Dépendances :
 * - react-router-dom : Pour la navigation programmatique
 * - @/types/errors : Types TypeScript pour les contextes d'erreur
 * 
 * Utilisation principale :
 * - Créer des erreurs contextuelles avec des messages spécifiques
 * - Rediriger vers /unauthorized avec le bon contexte
 * - Traduire les termes techniques en français pour l'utilisateur
 */
export class PermissionErrorUtils {
  /**
   * Navigue vers la page 403 non autorisée avec un contexte d'erreur spécifique
   * 
   * @param navigate - Fonction de navigation de React Router
   * @param context - Contexte d'erreur contenant les détails de l'erreur
   * 
   * Fonctionnement :
   * - Utilise navigate() avec replace: true pour éviter l'historique
   * - Passe le contexte via location.state pour la page de destination
   * - La page /unauthorized utilisera ce contexte pour afficher des messages spécifiques
   */
  static navigateToUnauthorized(
    navigate: NavigateFunction, 
    context: PermissionErrorContext = {}
  ) {
    navigate('/unauthorized', {
      state: { errorContext: context },
      replace: true
    });
  }

  /**
   * Crée un contexte d'erreur pour un refus d'accès à une page
   * 
   * @param path - Chemin de la page refusée (ex: '/user-management')
   * @param requiredRole - Rôle requis pour accéder à la page (optionnel)
   * @param message - Message personnalisé (optionnel, généré automatiquement sinon)
   * @returns Contexte d'erreur formaté pour la page 403
   * 
   * Utilisation typique :
   * - Quand un utilisateur tente d'accéder à une page sans les bonnes permissions
   * - Dans les composants ProtectedRoute pour expliquer pourquoi l'accès est refusé
   */
  static createPageAccessError(
    path: string,
    requiredRole?: string,
    message?: string
  ): PermissionErrorContext {
    return {
      type: 'page_access',
      path,
      requiredRole,
      message: message || `Accès refusé à la page ${path}`
    };
  }

  /**
   * Crée un contexte d'erreur pour une action refusée
   * 
   * @param action - Action tentée (ex: 'delete', 'update', 'create')
   * @param resource - Ressource concernée (ex: 'prospects', 'users')
   * @param message - Message personnalisé (optionnel)
   * @returns Contexte d'erreur formaté
   * 
   * Utilisation typique :
   * - Quand un agent tente de supprimer un prospect qui ne lui appartient pas
   * - Quand un manager tente de modifier des données d'un autre workspace
   */
  static createActionDeniedError(
    action: string,
    resource: string,
    message?: string
  ): PermissionErrorContext {
    return {
      type: 'action_denied',
      action,
      resource,
      message: message || `Action ${action} refusée sur ${resource}`
    };
  }

  /**
   * Crée un contexte d'erreur pour un accès workspace refusé
   * 
   * @param message - Message personnalisé (optionnel)
   * @returns Contexte d'erreur formaté
   * 
   * Utilisation typique :
   * - Quand un utilisateur tente d'accéder à un workspace qui ne lui appartient pas
   * - Isolation multi-tenant : chaque workspace est complètement séparé
   */
  static createWorkspaceAccessError(
    message?: string
  ): PermissionErrorContext {
    return {
      type: 'workspace_access',
      message: message || 'Accès au workspace refusé'
    };
  }

  /**
   * Crée un contexte d'erreur pour un rôle insuffisant
   * 
   * @param requiredRole - Rôle minimum requis (ex: 'admin', 'manager')
   * @param message - Message personnalisé (optionnel)
   * @returns Contexte d'erreur formaté
   * 
   * Utilisation typique :
   * - Quand une action nécessite un rôle spécifique
   * - Pour expliquer clairement quel rôle est nécessaire
   */
  static createRoleInsufficientError(
    requiredRole: string,
    message?: string
  ): PermissionErrorContext {
    return {
      type: 'role_insufficient',
      requiredRole,
      message: message || `Rôle ${requiredRole} requis`
    };
  }

  /**
   * Obtient le nom convivial d'un rôle en français
   * 
   * @param role - Rôle technique (ex: 'super_admin', 'admin', 'manager', 'agent')
   * @returns Nom du rôle en français pour l'affichage utilisateur
   * 
   * Mapping des rôles :
   * - super_admin → Super Administrateur (gestion plateforme complète)
   * - admin → Administrateur (gestion workspace)
   * - manager → Manager (supervision équipe)
   * - agent → Agent (utilisateur final)
   */
  static getRoleName(role: string): string {
    switch (role) {
      case 'super_admin':
        return 'Super Administrateur';
      case 'admin':
        return 'Administrateur';
      case 'manager':
        return 'Manager';
      case 'agent':
        return 'Agent';
      default:
        return role;
    }
  }

  /**
   * Obtient le nom convivial d'une action en français
   * 
   * @param action - Action technique (ex: 'create', 'read', 'update', 'delete')
   * @returns Nom de l'action en français pour les messages d'erreur
   * 
   * Actions CRUD traduites :
   * - create → créer
   * - read → consulter
   * - update → modifier
   * - delete → supprimer
   * - assign → assigner (spécifique au CRM)
   */
  static getActionName(action: string): string {
    switch (action) {
      case 'create':
        return 'créer';
      case 'read':
        return 'consulter';
      case 'update':
        return 'modifier';
      case 'delete':
        return 'supprimer';
      case 'assign':
        return 'assigner';
      default:
        return action;
    }
  }

  /**
   * Obtient le nom convivial d'une ressource en français
   * 
   * @param resource - Ressource technique (ex: 'prospects', 'users', 'workspaces')
   * @returns Nom de la ressource en français pour les messages d'erreur
   * 
   * Ressources du CRM :
   * - prospects → prospects (leads/contacts commerciaux)
   * - users → utilisateurs (membres de l'équipe)
   * - workspaces → workspaces (espaces de travail isolés)
   * - settings → paramètres (configuration)
   */
  static getResourceName(resource: string): string {
    switch (resource) {
      case 'prospects':
        return 'prospects';
      case 'users':
        return 'utilisateurs';
      case 'workspaces':
        return 'workspaces';
      case 'settings':
        return 'paramètres';
      default:
        return resource;
    }
  }
}

/**
 * Hook React pour la gestion des erreurs de permission dans les composants
 * 
 * Ce hook simplifie l'utilisation des utilitaires d'erreur dans les composants React.
 * Il fournit une interface cohérente pour créer et gérer les erreurs de permission.
 * 
 * @returns Objet contenant les fonctions utilitaires pour les erreurs de permission
 * 
 * Utilisation dans un composant :
 * ```typescript
 * const { navigateToUnauthorized, createActionDeniedError } = usePermissionError();
 * const navigate = useNavigate();
 * 
 * const handleUnauthorizedAction = () => {
 *   const errorContext = createActionDeniedError('delete', 'prospects');
 *   navigateToUnauthorized(navigate, errorContext);
 * };
 * ```
 * 
 * Avantages :
 * - Interface simplifiée pour les composants
 * - Cohérence dans la gestion des erreurs
 * - Réutilisabilité des patterns d'erreur
 */
export const usePermissionError = () => {
  const navigateToUnauthorized = (
    navigate: NavigateFunction,
    context: PermissionErrorContext = {}
  ) => {
    PermissionErrorUtils.navigateToUnauthorized(navigate, context);
  };

  return {
    navigateToUnauthorized,
    createPageAccessError: PermissionErrorUtils.createPageAccessError,
    createActionDeniedError: PermissionErrorUtils.createActionDeniedError,
    createWorkspaceAccessError: PermissionErrorUtils.createWorkspaceAccessError,
    createRoleInsufficientError: PermissionErrorUtils.createRoleInsufficientError
  };
};