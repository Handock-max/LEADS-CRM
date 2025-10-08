# Guide d'Utilisation - Assignation de Prospects

Ce guide explique comment utiliser les nouvelles fonctionnalités d'assignation de prospects dans Ash CRM.

## Vue d'ensemble

Le système d'assignation permet aux managers et administrateurs d'assigner des prospects aux agents de leur workspace, respectant les règles de permissions définies dans le système.

## Fonctionnalités Implémentées

### 1. Service d'Assignation (`prospectService.ts`)

#### Méthodes disponibles :

- **`assignProspect(prospectId, assignedToUserId, userRole, currentUserId, workspaceId)`**
  - Assigne un prospect à un utilisateur
  - Vérifie que l'utilisateur assigné appartient au même workspace
  - Respecte les permissions (managers/admins uniquement)

- **`unassignProspect(prospectId, userRole, currentUserId)`**
  - Retire l'assignation d'un prospect
  - Permissions requises : managers/admins

- **`assignMultipleProspects(prospectIds, assignedToUserId, userRole, currentUserId, workspaceId)`**
  - Assigne plusieurs prospects à un utilisateur en une seule opération
  - Optimisé pour les assignations en lot

### 2. Hook d'Assignation (`useProspectAssignment.ts`)

Le hook `useProspectAssignment` fournit une interface simple pour gérer les assignations :

```typescript
const {
  loading,
  error,
  workspaceUsers,
  loadWorkspaceUsers,
  assignProspect,
  unassignProspect,
  assignMultipleProspects,
  canAssignProspects,
  getAssignableUsers,
  clearError
} = useProspectAssignment();
```

#### Fonctionnalités :
- Chargement automatique des utilisateurs du workspace
- Gestion des états de chargement et d'erreur
- Vérification des permissions
- Filtrage des utilisateurs assignables selon le rôle

### 3. Composants d'Interface

#### `ProspectAssignment`
Composant dropdown pour assigner un prospect individuel :
- Affiche l'utilisateur actuellement assigné
- Permet de changer l'assignation
- Respecte les permissions utilisateur

```tsx
<ProspectAssignment
  prospect={prospect}
  onAssignmentChange={handleAssignmentChange}
/>
```

#### `BulkProspectAssignment`
Modal pour l'assignation en lot :
- Sélection de plusieurs prospects
- Assignation à un utilisateur en une fois
- Interface claire avec confirmation

```tsx
<BulkProspectAssignment
  isOpen={showModal}
  selectedProspects={selectedProspects}
  onAssignmentComplete={handleBulkComplete}
  onClose={handleClose}
/>
```

#### `EnhancedProspectTable`
Table améliorée avec fonctionnalités d'assignation :
- Sélection multiple avec checkboxes
- Colonne d'assignation intégrée
- Barre d'actions pour assignation en lot

### 4. Règles de Permissions

#### Super Admin
- Peut assigner n'importe quel prospect à n'importe quel utilisateur
- Accès à tous les workspaces

#### Admin (Workspace)
- Peut assigner tous les prospects de son workspace
- Peut assigner à tous les utilisateurs de son workspace

#### Manager
- Peut assigner tous les prospects du workspace
- Peut assigner seulement aux agents (pas aux autres managers)

#### Agent
- Ne peut pas assigner de prospects
- Voit seulement ses prospects et ceux qui lui sont assignés

### 5. Validation des Assignations

Le système vérifie automatiquement :
- **Permissions** : L'utilisateur a-t-il le droit d'assigner ?
- **Workspace** : L'utilisateur assigné appartient-il au même workspace ?
- **Rôle cible** : Le rôle de l'utilisateur assigné est-il compatible ?

## Intégration dans l'Interface

### Exemple d'utilisation dans une page CRM :

```tsx
import { EnhancedProspectTable } from '@/components/EnhancedProspectTable';

function CRMPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);

  const handleProspectUpdate = (updatedProspect: Prospect) => {
    setProspects(prospects.map(p => 
      p.id === updatedProspect.id ? updatedProspect : p
    ));
  };

  const handleBulkUpdate = (updatedProspects: Prospect[]) => {
    // Mettre à jour plusieurs prospects après assignation en lot
    setProspects(prospects.map(p => {
      const updated = updatedProspects.find(up => up.id === p.id);
      return updated || p;
    }));
  };

  return (
    <EnhancedProspectTable
      prospects={prospects}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onProspectUpdate={handleProspectUpdate}
      onBulkUpdate={handleBulkUpdate}
    />
  );
}
```

## Gestion des Erreurs

Le système gère plusieurs types d'erreurs :

- **Permissions insuffisantes** : "Permissions insuffisantes pour assigner des prospects"
- **Utilisateur invalide** : "L'utilisateur assigné n'appartient pas à ce workspace"
- **Prospect non trouvé** : "Prospect non trouvé"
- **Erreurs réseau** : Messages d'erreur contextuels

## Base de Données

### Modifications requises :

1. **Table `prospects`** : Colonne `assigned_to` (UUID, référence vers `auth.users`)
2. **Table `user_roles`** : Gestion des rôles par workspace
3. **Politiques RLS** : Filtrage automatique selon les permissions

### Exemple de politique RLS pour les managers :

```sql
CREATE POLICY "managers_own_and_assigned" ON prospects
    FOR SELECT USING (
        workspace_id = get_user_workspace_id() AND
        (created_by = auth.uid() OR assigned_to = auth.uid()) AND
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'manager'
        )
    );
```

## Tests et Validation

Pour tester les fonctionnalités :

1. **Test des permissions** : Vérifier que chaque rôle ne peut assigner que selon ses droits
2. **Test workspace** : Vérifier l'isolation entre workspaces
3. **Test assignation** : Vérifier que les assignations sont correctement sauvegardées
4. **Test interface** : Vérifier que l'UI s'adapte aux permissions

## Migration

Pour activer ces fonctionnalités sur un système existant :

1. Exécuter les migrations de base de données
2. Mettre à jour les politiques RLS
3. Remplacer les composants de table existants
4. Tester les permissions avec différents rôles

## Prochaines Étapes

Fonctionnalités à implémenter :
- Notifications d'assignation
- Historique des assignations
- Assignation automatique selon des règles
- Statistiques d'assignation par utilisateur