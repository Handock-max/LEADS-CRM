# Système de Gestion des Erreurs de Permission (403)

Ce document explique comment utiliser le système de gestion des erreurs de permission qui fournit des messages d'erreur contextuels et des suggestions d'actions alternatives.

## Objectif

Fournir une expérience utilisateur cohérente et informative lors des erreurs de permission, avec :
- Messages explicites selon le type de refus d'accès
- Suggestions d'actions alternatives basées sur le rôle utilisateur
- Navigation directe vers les pages autorisées
- Interface moderne et accessible

## Vue d'ensemble

Le système comprend :
- Une page d'erreur 403 améliorée (`/unauthorized`)
- Des utilitaires pour créer des contextes d'erreur spécifiques
- Une intégration avec les composants de protection des routes
- Des messages d'erreur explicites selon le type de refus

## Composants Principaux

### 1. Page d'Erreur 403 (`src/pages/Unauthorized.tsx`)

La page d'erreur 403 améliorée affiche :
- Un message d'erreur spécifique selon le contexte
- Les informations de l'utilisateur actuel (email, rôle)
- Des suggestions d'actions alternatives
- Une liste des pages accessibles selon le rôle
- Des boutons de navigation contextuels

### 2. Utilitaires d'Erreur (`src/lib/errorUtils.ts`)

La classe `PermissionErrorUtils` fournit des méthodes pour :
- Créer des contextes d'erreur spécifiques
- Naviguer vers la page 403 avec le bon contexte
- Obtenir des noms conviviaux pour les rôles, actions et ressources

### 3. Types d'Erreur (`src/types/errors.ts`)

Définit les interfaces TypeScript pour :
- `PermissionErrorContext` : Contexte d'erreur avec type, ressource, action, etc.
- `PermissionErrorType` : Types d'erreurs supportés
- `AccessiblePage` : Structure des pages accessibles

## Types d'Erreurs Supportés

### 1. Accès à une Page Refusé (`page_access`)
Utilisé quand un utilisateur tente d'accéder à une page pour laquelle il n'a pas les permissions.

```typescript
const errorContext = PermissionErrorUtils.createPageAccessError(
  '/user-management',
  'admin',
  'Seuls les administrateurs peuvent accéder à la gestion des utilisateurs'
);
```

### 2. Action Refusée (`action_denied`)
Utilisé quand une action spécifique est refusée (ex: supprimer un prospect).

```typescript
const errorContext = PermissionErrorUtils.createActionDeniedError(
  'delete',
  'prospects',
  'Vous ne pouvez supprimer que vos propres prospects'
);
```

### 3. Accès Workspace Refusé (`workspace_access`)
Utilisé quand l'accès à un workspace spécifique est refusé.

```typescript
const errorContext = PermissionErrorUtils.createWorkspaceAccessError(
  'Vous n\'avez pas accès à ce workspace'
);
```

### 4. Rôle Insuffisant (`role_insufficient`)
Utilisé quand le rôle de l'utilisateur est insuffisant pour une action.

```typescript
const errorContext = PermissionErrorUtils.createRoleInsufficientError(
  'manager',
  'Cette action nécessite le rôle Manager ou supérieur'
);
```

## Utilisation dans les Composants

### Navigation avec Contexte d'Erreur

```typescript
import { useNavigate } from 'react-router-dom';
import { PermissionErrorUtils } from '@/lib/errorUtils';

const MyComponent = () => {
  const navigate = useNavigate();

  const handleUnauthorizedAction = () => {
    const errorContext = PermissionErrorUtils.createActionDeniedError(
      'delete',
      'prospects',
      'Vous ne pouvez supprimer que vos propres prospects'
    );
    
    PermissionErrorUtils.navigateToUnauthorized(navigate, errorContext);
  };

  // ...
};
```

### Utilisation du Hook

```typescript
import { usePermissionError } from '@/lib/errorUtils';

const MyComponent = () => {
  const { navigateToUnauthorized, createActionDeniedError } = usePermissionError();
  const navigate = useNavigate();

  const handleError = () => {
    const errorContext = createActionDeniedError('delete', 'prospects');
    navigateToUnauthorized(navigate, errorContext);
  };

  // ...
};
```

### Intégration avec ProtectedRoute

Le composant `ProtectedRoute` utilise automatiquement le nouveau système :

```typescript
// Dans App.tsx
<Route 
  path="/user-management" 
  element={
    <ProtectedRoute requiredRoles={['admin']}>
      <AppLayout>
        <UserManagement />
      </AppLayout>
    </ProtectedRoute>
  } 
/>
```

Si l'utilisateur n'a pas le bon rôle, il sera redirigé vers `/unauthorized` avec un contexte d'erreur approprié.

## Messages d'Erreur Contextuels

La page 403 affiche des messages spécifiques selon :

### Le Rôle de l'Utilisateur
- **Agent** : Messages axés sur les prospects assignés et les limitations
- **Manager** : Messages sur la gestion d'équipe et les permissions étendues
- **Admin** : Messages sur la gestion du workspace
- **Super Admin** : Messages sur la gestion globale

### Le Type d'Erreur
- **Accès page** : Explique pourquoi la page est inaccessible
- **Action refusée** : Détaille les règles de propriété/assignation
- **Workspace** : Explique l'isolation des données
- **Rôle insuffisant** : Indique le rôle requis

### Suggestions d'Actions
- Pages alternatives accessibles
- Actions recommandées selon le rôle
- Contacts pour obtenir des permissions

## Exemples d'Intégration

### Dans un Composant de Liste de Prospects

```typescript
const ProspectList = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();

  const handleDeleteProspect = (prospect: Prospect) => {
    // Vérifier les permissions avant l'action
    if (prospect.created_by !== user?.id) {
      const errorContext = PermissionErrorUtils.createActionDeniedError(
        'delete',
        'prospects',
        userRole?.role === 'agent' 
          ? 'Vous ne pouvez supprimer que vos propres prospects'
          : 'Vous ne pouvez supprimer que les prospects que vous avez créés'
      );
      
      PermissionErrorUtils.navigateToUnauthorized(navigate, errorContext);
      return;
    }

    // Procéder à la suppression
    deleteProspect(prospect.id);
  };

  // ...
};
```

### Dans un Middleware de Route

```typescript
const checkWorkspaceAccess = (workspaceId: string) => {
  if (!canAccessWorkspace(workspaceId)) {
    const errorContext = PermissionErrorUtils.createWorkspaceAccessError(
      `Accès refusé au workspace ${workspaceId}`
    );
    
    navigate('/unauthorized', { state: { errorContext } });
    return false;
  }
  return true;
};
```

## Bonnes Pratiques

1. **Toujours fournir un contexte** : Utilisez les utilitaires pour créer des contextes d'erreur spécifiques
2. **Messages explicites** : Expliquez clairement pourquoi l'action est refusée
3. **Suggestions utiles** : Proposez des alternatives ou des contacts
4. **Cohérence** : Utilisez les mêmes patterns dans toute l'application
5. **Logging** : Enregistrez les tentatives d'accès non autorisées pour l'audit

