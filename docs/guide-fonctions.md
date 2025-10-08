# Guide des Fonctions - Ash CRM

## Vue d'ensemble

Ce document détaille toutes les fonctions créées dans le projet, leur utilité, leurs dépendances et leur fonctionnement. Chaque fonction est documentée en français avec des exemples d'utilisation.

## Gestion des Erreurs de Permission

### PermissionErrorUtils.navigateToUnauthorized()

**Localisation :** `src/lib/errorUtils.ts`

**Utilité :** Redirige l'utilisateur vers la page d'erreur 403 avec un contexte d'erreur spécifique.

**Paramètres :**
- `navigate: NavigateFunction` - Fonction de navigation de React Router
- `context: PermissionErrorContext` - Contexte d'erreur (optionnel)

**Dépendances :**
- `react-router-dom` : Pour la fonction navigate()
- `@/types/errors` : Interface PermissionErrorContext

**Fonctionnement :**
1. Utilise navigate() avec `replace: true` pour éviter l'ajout à l'historique
2. Passe le contexte d'erreur via `location.state`
3. La page `/unauthorized` récupère ce contexte pour afficher des messages spécifiques

**Exemple d'utilisation :**
```typescript
import { useNavigate } from 'react-router-dom';
import { PermissionErrorUtils } from '@/lib/errorUtils';

const MyComponent = () => {
  const navigate = useNavigate();
  
  const handleUnauthorizedAccess = () => {
    const errorContext = PermissionErrorUtils.createPageAccessError(
      '/user-management',
      'admin',
      'Seuls les administrateurs peuvent gérer les utilisateurs'
    );
    
    PermissionErrorUtils.navigateToUnauthorized(navigate, errorContext);
  };
};
```

### PermissionErrorUtils.createPageAccessError()

**Utilité :** Crée un contexte d'erreur pour un refus d'accès à une page.

**Paramètres :**
- `path: string` - Chemin de la page refusée
- `requiredRole?: string` - Rôle requis (optionnel)
- `message?: string` - Message personnalisé (optionnel)

**Retour :** `PermissionErrorContext` avec type 'page_access'

**Cas d'usage typiques :**
- Agent tentant d'accéder à `/user-management`
- Manager tentant d'accéder à `/workspace-settings`
- Utilisateur sans rôle tentant d'accéder à une page protégée

### PermissionErrorUtils.createActionDeniedError()

**Utilité :** Crée un contexte d'erreur pour une action refusée sur une ressource.

**Paramètres :**
- `action: string` - Action tentée (delete, update, create, etc.)
- `resource: string` - Ressource concernée (prospects, users, etc.)
- `message?: string` - Message personnalisé (optionnel)

**Retour :** `PermissionErrorContext` avec type 'action_denied'

**Cas d'usage typiques :**
- Agent tentant de supprimer un prospect qui ne lui appartient pas
- Manager tentant de modifier un prospect d'un autre workspace
- Utilisateur tentant une action sans les permissions nécessaires

**Exemple :**
```typescript
// Dans un composant de gestion des prospects
const handleDeleteProspect = (prospect: Prospect) => {
  if (prospect.created_by !== currentUser.id) {
    const errorContext = PermissionErrorUtils.createActionDeniedError(
      'delete',
      'prospects',
      'Vous ne pouvez supprimer que vos propres prospects'
    );
    
    PermissionErrorUtils.navigateToUnauthorized(navigate, errorContext);
    return;
  }
  
  // Procéder à la suppression
  deleteProspect(prospect.id);
};
```

### PermissionErrorUtils.createWorkspaceAccessError()

**Utilité :** Crée un contexte d'erreur pour un accès workspace refusé.

**Paramètres :**
- `message?: string` - Message personnalisé (optionnel)

**Retour :** `PermissionErrorContext` avec type 'workspace_access'

**Cas d'usage :** Isolation multi-tenant - utilisateur tentant d'accéder à un workspace qui ne lui appartient pas.

### PermissionErrorUtils.createRoleInsufficientError()

**Utilité :** Crée un contexte d'erreur pour un rôle insuffisant.

**Paramètres :**
- `requiredRole: string` - Rôle minimum requis
- `message?: string` - Message personnalisé (optionnel)

**Retour :** `PermissionErrorContext` avec type 'role_insufficient'

**Cas d'usage :** Action nécessitant un rôle spécifique (ex: seuls les admins peuvent créer des utilisateurs).

### PermissionErrorUtils.getRoleName()

**Utilité :** Convertit un rôle technique en nom convivial français.

**Paramètres :**
- `role: string` - Rôle technique (super_admin, admin, manager, agent)

**Retour :** `string` - Nom du rôle en français

**Mapping :**
- `super_admin` → "Super Administrateur"
- `admin` → "Administrateur"
- `manager` → "Manager"
- `agent` → "Agent"

**Utilisation :** Affichage des rôles dans l'interface utilisateur.

### PermissionErrorUtils.getActionName()

**Utilité :** Convertit une action technique en verbe français.

**Paramètres :**
- `action: string` - Action technique (create, read, update, delete, assign)

**Retour :** `string` - Verbe d'action en français

**Mapping :**
- `create` → "créer"
- `read` → "consulter"
- `update` → "modifier"
- `delete` → "supprimer"
- `assign` → "assigner"

**Utilisation :** Messages d'erreur contextuels et interface utilisateur.

### PermissionErrorUtils.getResourceName()

**Utilité :** Convertit une ressource technique en nom français.

**Paramètres :**
- `resource: string` - Ressource technique (prospects, users, workspaces, settings)

**Retour :** `string` - Nom de la ressource en français

**Mapping :**
- `prospects` → "prospects"
- `users` → "utilisateurs"
- `workspaces` → "workspaces"
- `settings` → "paramètres"

**Utilisation :** Messages d'erreur et interface utilisateur.

## Hook usePermissionError()

**Localisation :** `src/lib/errorUtils.ts`

**Utilité :** Hook React simplifiant l'utilisation des utilitaires d'erreur dans les composants.

**Retour :** Objet contenant toutes les fonctions utilitaires

**Dépendances :**
- `react` : Pour la structure de hook
- `react-router-dom` : NavigateFunction
- `@/types/errors` : Types des contextes d'erreur

**Avantages :**
- Interface simplifiée pour les composants
- Cohérence dans la gestion des erreurs
- Réutilisabilité des patterns d'erreur

**Exemple d'utilisation :**
```typescript
import { useNavigate } from 'react-router-dom';
import { usePermissionError } from '@/lib/errorUtils';

const ProspectManagement = () => {
  const navigate = useNavigate();
  const { 
    navigateToUnauthorized, 
    createActionDeniedError 
  } = usePermissionError();
  
  const handleUnauthorizedDelete = () => {
    const errorContext = createActionDeniedError(
      'delete', 
      'prospects',
      'Vous ne pouvez supprimer que vos propres prospects'
    );
    
    navigateToUnauthorized(navigate, errorContext);
  };
  
  return (
    <div>
      {/* Interface de gestion des prospects */}
    </div>
  );
};
```

## Page Unauthorized

**Localisation :** `src/pages/Unauthorized.tsx`

**Utilité :** Page d'erreur 403 contextuelle affichant des messages spécifiques selon le type d'erreur.

**Dépendances principales :**
- `react-router-dom` : useNavigate, useLocation
- `@/contexts/AuthContext` : useAuth hook
- `@/components/ui/*` : Composants UI (Button, Card, Badge)
- `lucide-react` : Icônes
- `@/types/errors` : Types des contextes d'erreur

### Fonction getErrorDetails()

**Utilité :** Détermine le message d'erreur et les suggestions selon le contexte.

**Fonctionnement :**
1. Récupère le contexte d'erreur depuis `location.state`
2. Détermine le type d'erreur selon le chemin actuel si non fourni
3. Génère un message spécifique selon le type d'erreur et le rôle utilisateur
4. Fournit des suggestions d'actions alternatives

**Types d'erreurs gérés :**
- `page_access` : Messages spécifiques par page (/user-management, /workspace-settings, etc.)
- `action_denied` : Messages selon l'action refusée (delete_prospect, modify_prospect)
- `workspace_access` : Message d'isolation workspace
- `role_insufficient` : Message de rôle insuffisant

### Fonction getAccessiblePages()

**Utilité :** Génère la liste des pages accessibles selon le rôle utilisateur.

**Retour :** `AccessiblePage[]` - Liste des pages avec nom, chemin, icône et description

**Logique :**
1. Pages de base pour tous : CRM, Dashboard
2. Pages admin : Gestion utilisateurs, Paramètres workspace
3. Pages super admin : Gestion workspaces

**Utilisation :** Affichage de boutons de navigation directe sur la page d'erreur.

## Composant ProtectedRoute

**Localisation :** `src/components/ProtectedRoute.tsx`

**Utilité :** Composant de protection des routes avec vérification des rôles et redirection contextuelle.

**Dépendances :**
- `react-router-dom` : Navigate, useLocation
- `@/contexts/AuthContext` : useAuth
- `@/lib/errorUtils` : PermissionErrorUtils
- `@/types/auth` : UserRole
- `lucide-react` : Loader2 pour le loading

**Fonctionnement :**
1. Vérification de l'état de chargement de l'authentification
2. Redirection vers `/login` si non authentifié
3. Vérification du rôle utilisateur
4. Redirection vers `/unauthorized` avec contexte si rôle insuffisant
5. Rendu du contenu protégé si autorisé

**Amélioration apportée :** Utilisation des utilitaires d'erreur pour créer des contextes spécifiques lors des redirections.

## Types TypeScript

**Localisation :** `src/types/errors.ts`

### Interface PermissionErrorContext

**Utilité :** Définit la structure complète d'un contexte d'erreur de permission.

**Propriétés :**
- `type?` : Type d'erreur (page_access, action_denied, workspace_access, role_insufficient)
- `resource?` : Ressource concernée (prospects, users, workspaces, settings)
- `action?` : Action tentée (create, read, update, delete, assign)
- `requiredRole?` : Rôle minimum requis
- `message?` : Message personnalisé
- `path?` : Chemin de la page refusée

**Utilisation :** Passé via `location.state` lors des redirections vers `/unauthorized`.

### Type PermissionErrorType

**Utilité :** Énumération des types d'erreurs supportés.

**Valeurs :**
- `page_access` : Accès à une page refusé
- `action_denied` : Action spécifique refusée
- `workspace_access` : Accès workspace refusé
- `role_insufficient` : Rôle insuffisant

### Interface AccessiblePage

**Utilité :** Structure d'une page accessible pour l'affichage sur la page d'erreur.

**Propriétés :**
- `name` : Nom affiché
- `path` : Chemin de navigation
- `icon` : Composant d'icône Lucide React
- `description` : Description de la fonctionnalité

## Intégration et Flux de Données

### Flux d'Erreur Complet

1. **Détection** : ProtectedRoute ou service détecte un accès non autorisé
2. **Création du contexte** : Utilisation des utilitaires pour créer le contexte approprié
3. **Redirection** : Navigation vers `/unauthorized` avec le contexte
4. **Affichage** : Page Unauthorized utilise le contexte pour afficher des messages spécifiques
5. **Actions** : Suggestions et navigation vers les pages autorisées

### Cohérence des Messages

Tous les messages d'erreur sont en français et suivent une logique cohérente :
- Explication claire de pourquoi l'accès est refusé
- Suggestions d'actions alternatives
- Navigation directe vers les pages autorisées
- Informations sur le rôle actuel et les permissions

Cette architecture garantit une expérience utilisateur cohérente et informative lors des erreurs de permission.