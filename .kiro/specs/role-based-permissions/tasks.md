# Implementation Plan - Système de Permissions par Rôle

## Phase 1: Base de Données et Sécurité

- [x] 1. Mise à jour du schéma de base de données



  - Créer la table `super_admins` avec relation vers `auth.users`
  - Ajouter les colonnes `display_name` et `created_by` à la table `workspaces`
  - Ajouter la colonne `created_by` à la table `prospects`
  - Créer les index de performance nécessaires
  - _Requirements: 1.2, 2.7, 5.1_

- [x] 2. Implémentation des politiques RLS avancées

  - Créer les politiques pour super admins (accès global)
  - Créer les politiques pour admins (workspace uniquement)
  - Créer les politiques pour managers (prospects propres + assignés)
  - Créer les politiques pour agents (prospects assignés uniquement)
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 3. Fonctions utilitaires de base de données

  - Créer `is_super_admin()` pour vérifier le statut super admin
  - Mettre à jour `get_user_role()` pour gérer les super admins
  - Créer `can_modify_prospect()` pour vérifier les permissions de modification
  - Créer `can_delete_prospect()` pour vérifier les permissions de suppression
  - _Requirements: 2.3, 3.3, 4.4, 7.5_

## Phase 2: Services et Logique Métier

- [x] 4. Service de gestion des permissions


- [x] 4.1 Créer `PermissionService` avec méthodes de base

  - Implémenter `canPerform()` pour vérifier les actions autorisées
  - Implémenter `getUserPermissions()` pour récupérer les permissions
  - Implémenter `canAccessWorkspace()` pour vérifier l'accès workspace
  - _Requirements: 6.1, 6.2, 5.1_

- [x] 4.2 Implémenter la matrice de permissions

  - Définir les permissions par rôle (super_admin, admin, manager, agent)
  - Créer les constantes de permissions pour chaque action
  - Implémenter la logique de vérification des permissions
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 5. Service de gestion des workspaces


- [x] 5.1 Créer `WorkspaceService` pour les opérations CRUD


  - Implémenter `createWorkspace()` (super admin uniquement)
  - Implémenter `updateWorkspace()` avec vérification des permissions
  - Implémenter `deleteWorkspace()` (super admin uniquement)
  - Implémenter `getUserWorkspaces()` selon le rôle
  - _Requirements: 1.1, 1.2, 2.6, 5.3_

- [x] 5.2 Ajouter la gestion des paramètres workspace









  - Permettre à l'admin de modifier le nom d'affichage
  - Gérer les paramètres personnalisés du workspace
  - _Requirements: 2.6_



- [x] 6. Mise à jour du service prospects avec permissions


- [x] 6.1 Modifier `ProspectService` pour intégrer les permissions

  - Mettre à jour `getProspects()` pour filtrer selon le rôle
  - Ajouter les vérifications dans `updateProspect()`
  - Ajouter les vérifications dans `deleteProspect()`
  - Implémenter `assignProspect()` pour managers/admins
  - _Requirements: 2.2, 3.2, 4.2, 4.5_

- [x] 6.2 Ajouter la gestion des assignations







  - Permettre aux managers d'assigner des prospects aux agents
  - Vérifier que l'assignation respecte les règles du workspace
  - _Requirements: 3.7, 2.7_

## Phase 3: Interface Utilisateur et Composants

- [x] 7. Composants de contrôle d'accès



- [x] 7.1 Créer le composant `PermissionGate`


  - Afficher/masquer du contenu selon les permissions
  - Gérer les fallbacks pour les actions non autorisées
  - Intégrer avec le système de permissions
  - _Requirements: 6.1, 6.4_

- [x] 7.2 Créer le composant `RoleBasedRoute`


  - Protéger les routes selon les rôles requis
  - Rediriger vers les pages d'erreur appropriées
  - Gérer les cas de permissions insuffisantes
  - _Requirements: 6.4, 8.4_

- [x] 8. Mise à jour du contexte d'authentification


- [x] 8.1 Étendre `AuthContext` avec les permissions


  - Ajouter `isSuperAdmin` et `permissions` au contexte
  - Implémenter `switchWorkspace()` pour changer de workspace
  - Ajouter `checkPermission()` pour vérifications rapides
  - _Requirements: 1.5, 5.4_

- [x] 8.2 Gérer l'état des permissions dans l'interface

  - Mettre à jour l'état lors du changement de workspace
  - Gérer le cache des permissions pour les performances
  - _Requirements: 5.4, 6.2_

- [-] 9. Interface de gestion des workspaces (Super Admin)


- [x] 9.1 Créer la page de gestion des workspaces


  - Liste des workspaces avec actions (créer, modifier, supprimer)
  - Formulaire de création de workspace avec admin associé
  - Interface de gestion des admins par workspace
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 9.2 Ajouter les statistiques globales






  - Vue d'ensemble des workspaces et utilisateurs
  - Métriques d'utilisation par workspace
  - _Requirements: 1.4_

- [x] 10. Interface de paramètres workspace (Admin)







- [x] 10.1 Créer la page de paramètres du workspace





  - Formulaire de modification du nom d'affichage
  - Gestion des paramètres personnalisés
  - Interface de gestion des utilisateurs du workspace
  - _Requirements: 2.6, 2.5_

- [x] 10.2 Ajouter la personnalisation avancée







  - Thèmes et couleurs du workspace
  - Configuration des champs personnalisés
  - _Requirements: 2.6_

## Phase 4: Mise à Jour des Pages Existantes

- [x] 11. Mise à jour de la page CRM



- [x] 11.1 Adapter l'affichage selon les permissions


  - Masquer les boutons de suppression pour les prospects assignés (agents)
  - Masquer les boutons de modification selon les règles
  - Afficher seulement les prospects autorisés selon le rôle
  - _Requirements: 4.2, 4.4, 6.2, 6.3_

- [x] 11.2 Ajouter la gestion des assignations dans l'interface


  - Bouton d'assignation pour managers/admins
  - Sélecteur d'utilisateur pour l'assignation
  - Indicateurs visuels des prospects assignés
  - _Requirements: 2.7, 3.7_

- [x] 12. Mise à jour de la page Dashboard




- [x] 12.1 Adapter les statistiques selon les permissions



  - Afficher les KPIs selon les données visibles par l'utilisateur
  - Filtrer les graphiques selon le rôle (agent = ses données uniquement)
  - _Requirements: 4.2, 6.2_

- [ ]* 12.2 Ajouter des vues spécifiques par rôle
  - Vue manager avec performance des agents
  - Vue admin avec statistiques complètes du workspace
  - _Requirements: 2.2, 3.2_

- [x] 13. Mise à jour de la navigation et du layout






- [x] 13.1 Adapter le menu selon les permissions


  - Masquer "Gestion utilisateurs" pour non-admins
  - Masquer "Paramètres workspace" pour non-admins
  - Ajouter "Gestion workspaces" pour super admins uniquement
  - _Requirements: 6.1, 6.4_

- [x] 13.2 Ajouter le sélecteur de workspace (si applicable)


  - Permettre aux super admins de changer de workspace
  - Afficher le workspace actuel dans l'interface
  - _Requirements: 1.5, 5.4_

## Phase 5: Gestion des Erreurs et Messages

- [ ] 14. Système de gestion des erreurs de permissions
- [ ] 14.1 Créer les classes d'erreurs spécifiques
  - `PermissionException` avec codes d'erreur détaillés
  - Messages d'erreur contextuels selon l'action refusée
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 14.2 Implémenter les hooks de gestion d'erreurs
  - `usePermissionError` pour traiter les erreurs UI
  - Affichage de toasts avec messages explicites
  - Redirection vers pages appropriées si nécessaire
  - _Requirements: 8.4, 8.5_

- [-] 15. Pages d'erreur et feedback utilisateur


- [x] 15.1 Créer la page d'erreur 403 (Accès refusé)



  - Message explicite selon le type de refus
  - Suggestions d'actions alternatives
  - Lien de retour vers les pages autorisées
  - _Requirements: 8.4, 8.5_

- [ ]* 15.2 Ajouter des tooltips explicatifs
  - Expliquer pourquoi certaines actions sont désactivées
  - Guider l'utilisateur vers les bonnes pratiques
  - _Requirements: 8.1, 8.2_

## Phase 6: Audit et Sécurité

- [ ] 16. Système d'audit avancé
- [ ] 16.1 Étendre le système d'audit existant
  - Enregistrer toutes les actions avec contexte de permissions
  - Tracer les tentatives d'accès non autorisées
  - Inclure les informations de workspace et rôle
  - _Requirements: 9.1, 9.2_

- [ ] 16.2 Interface de consultation de l'audit
  - Page d'audit pour admins (leurs données uniquement)
  - Page d'audit globale pour super admins
  - Filtres par utilisateur, action, date
  - _Requirements: 9.3, 9.4, 9.5_



## Phase 7: Migration et Déploiement

- [ ] 18. Migration des données existantes
- [ ] 18.1 Script de migration pour les données actuelles
  - Créer un super admin initial
  - Migrer les workspaces existants
  - Assigner les rôles aux utilisateurs existants
  - _Requirements: 1.1, 2.1_

- [ ] 18.2 Validation de la migration
  - Vérifier l'intégrité des données migrées
  - Tester les permissions sur les données existantes
  - _Requirements: 5.1, 7.5_

- [ ]* 19. Documentation et formation
  - Guide d'utilisation par rôle
  - Documentation des permissions
  - Guide de dépannage des erreurs courantes
  - _Requirements: 8.1, 8.2, 8.3_