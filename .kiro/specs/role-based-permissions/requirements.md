# Requirements Document - Système de Permissions par Rôle

## Introduction

Ce document définit les exigences pour implémenter un système de permissions granulaires basé sur les rôles (Admin, Manager, Agent) dans Ash CRM. Le système doit contrôler l'accès aux fonctionnalités et aux données selon le rôle de l'utilisateur dans le workspace.

## Requirements

### Requirement 1 - Permissions Super Admin

**User Story:** En tant que super administrateur, je veux pouvoir créer et gérer des workspaces et leurs administrateurs, afin de pouvoir onboarder de nouveaux clients sur la plateforme.

#### Acceptance Criteria

1. WHEN un super admin se connecte THEN il SHALL avoir accès à un panneau de gestion des workspaces
2. WHEN un super admin crée un workspace THEN il SHALL pouvoir définir le nom du workspace et créer un admin associé
3. WHEN un super admin assigne un admin à un workspace THEN cet admin SHALL devenir propriétaire de ce workspace
4. WHEN un super admin consulte la liste des workspaces THEN il SHALL voir tous les workspaces de la plateforme
5. WHEN un super admin accède à un workspace THEN il SHALL avoir les mêmes droits qu'un admin sur ce workspace
6. WHEN un super admin supprime un workspace THEN toutes les données associées SHALL être supprimées après confirmation

### Requirement 2 - Permissions Admin (Workspace)

**User Story:** En tant qu'administrateur de workspace, je veux avoir un accès complet à mon workspace et pouvoir le personnaliser, afin de gérer mon équipe et adapter l'outil à mes besoins.

#### Acceptance Criteria

1. WHEN un admin de workspace se connecte THEN il SHALL avoir accès à toutes les pages de son workspace (CRM, Dashboard, Gestion utilisateurs, Paramètres)
2. WHEN un admin consulte le CRM THEN il SHALL voir tous les prospects de son workspace uniquement
3. WHEN un admin modifie un prospect THEN il SHALL pouvoir modifier n'importe quel prospect de son workspace
4. WHEN un admin supprime un prospect THEN il SHALL pouvoir supprimer n'importe quel prospect de son workspace
5. WHEN un admin accède à la gestion utilisateurs THEN il SHALL pouvoir créer, modifier et supprimer des utilisateurs de son workspace
6. WHEN un admin accède aux paramètres THEN il SHALL pouvoir modifier le nom d'affichage de son workspace
7. WHEN un admin assigne des prospects THEN il SHALL pouvoir assigner n'importe quel prospect à n'importe quel utilisateur de son workspace
8. WHEN un admin tente d'accéder à un autre workspace THEN il SHALL être refusé

### Requirement 3 - Permissions Manager

**User Story:** En tant que manager, je veux avoir accès à la plupart des fonctionnalités sauf la gestion des utilisateurs, afin de pouvoir superviser les agents sans compromettre la sécurité du système.

#### Acceptance Criteria

1. WHEN un utilisateur avec le rôle 'manager' se connecte THEN il SHALL avoir accès au CRM et Dashboard
2. WHEN un manager consulte le CRM THEN il SHALL voir tous les prospects du workspace
3. WHEN un manager modifie un prospect THEN il SHALL pouvoir modifier seulement les prospects qu'il a créés ou qui lui sont assignés
4. WHEN un manager tente de modifier un prospect d'un autre utilisateur THEN il SHALL recevoir un message d'erreur de permission
5. WHEN un manager supprime un prospect THEN il SHALL pouvoir supprimer seulement les prospects qu'il a créés
6. WHEN un manager tente d'accéder à la gestion utilisateurs THEN il SHALL être redirigé vers une page d'accès refusé
7. WHEN un manager assigne des prospects THEN il SHALL pouvoir assigner des prospects aux agents de son workspace

### Requirement 4 - Permissions Agent

**User Story:** En tant qu'agent, je veux voir seulement mes prospects et ceux qui me sont assignés, afin de me concentrer sur mon travail sans être distrait par les données des autres.

#### Acceptance Criteria

1. WHEN un utilisateur avec le rôle 'agent' se connecte THEN il SHALL avoir accès au CRM et Dashboard
2. WHEN un agent consulte le CRM THEN il SHALL voir seulement les prospects qu'il a créés ou qui lui sont assignés
3. WHEN un agent modifie un prospect THEN il SHALL pouvoir modifier seulement les prospects qu'il a créés ou qui lui sont assignés
4. WHEN un agent tente de modifier un prospect d'un autre utilisateur THEN il SHALL recevoir un message d'erreur de permission
5. WHEN un agent supprime un prospect THEN il SHALL pouvoir supprimer seulement les prospects qu'il a créés lui-même
6. WHEN un agent tente de supprimer un prospect assigné par un manager THEN il SHALL recevoir un message d'erreur de permission
7. WHEN un agent tente d'accéder à la gestion utilisateurs THEN il SHALL être redirigé vers une page d'accès refusé

### Requirement 5 - Gestion Multi-Workspace

**User Story:** En tant que système, je veux isoler complètement les données entre workspaces, afin que chaque client ait ses données privées et sécurisées.

#### Acceptance Criteria

1. WHEN un utilisateur se connecte THEN il SHALL voir seulement les données de son workspace
2. WHEN un admin de workspace A tente d'accéder aux données du workspace B THEN l'accès SHALL être refusé
3. WHEN un workspace est créé THEN il SHALL avoir ses propres tables de prospects, utilisateurs et paramètres
4. WHEN un utilisateur change de workspace THEN toutes les données affichées SHALL être mises à jour
5. WHEN un workspace est supprimé THEN toutes ses données SHALL être supprimées définitivement

### Requirement 6 - Contrôle d'accès Interface

**User Story:** En tant qu'utilisateur, je veux que l'interface s'adapte à mon rôle, afin de voir seulement les fonctionnalités auxquelles j'ai accès.

#### Acceptance Criteria

1. WHEN un utilisateur se connecte THEN l'interface SHALL afficher seulement les menus correspondant à son rôle
2. WHEN un agent consulte la liste des prospects THEN les boutons de suppression SHALL être visibles seulement pour ses propres prospects
3. WHEN un manager consulte la liste des prospects THEN les boutons de modification SHALL être visibles seulement pour les prospects qu'il peut modifier
4. WHEN un utilisateur non-admin accède au système THEN le menu "Gestion utilisateurs" SHALL être masqué
5. WHEN un utilisateur tente d'accéder à une page non autorisée THEN il SHALL être redirigé vers une page d'erreur 403

### Requirement 7 - Sécurité Base de Données

**User Story:** En tant que système, je veux que les permissions soient appliquées au niveau de la base de données, afin de garantir la sécurité même en cas de contournement de l'interface.

#### Acceptance Criteria

1. WHEN un agent fait une requête pour voir tous les prospects THEN la base de données SHALL retourner seulement ses prospects
2. WHEN un manager tente de modifier un prospect d'un autre utilisateur THEN la base de données SHALL rejeter la requête
3. WHEN un agent tente de supprimer un prospect assigné THEN la base de données SHALL rejeter la requête
4. WHEN un utilisateur fait une requête sur un workspace différent THEN la base de données SHALL rejeter la requête
5. WHEN les politiques RLS sont appliquées THEN elles SHALL respecter les règles de permissions par rôle

### Requirement 8 - Messages d'Erreur et Feedback

**User Story:** En tant qu'utilisateur, je veux recevoir des messages clairs quand je n'ai pas les permissions, afin de comprendre pourquoi une action est refusée.

#### Acceptance Criteria

1. WHEN un utilisateur tente une action non autorisée THEN il SHALL recevoir un message d'erreur explicite
2. WHEN un agent tente de supprimer un prospect assigné THEN le message SHALL expliquer "Vous ne pouvez supprimer que vos propres prospects"
3. WHEN un manager tente de modifier un prospect d'un autre THEN le message SHALL expliquer "Vous ne pouvez modifier que vos prospects ou ceux qui vous sont assignés"
4. WHEN un utilisateur accède à une page interdite THEN la page d'erreur SHALL suggérer les pages accessibles
5. WHEN une action est refusée THEN l'interface SHALL rester stable sans crash

### Requirement 9 - Audit et Traçabilité

**User Story:** En tant qu'administrateur, je veux pouvoir tracer qui a fait quoi, afin de maintenir la sécurité et la responsabilité dans le système.

#### Acceptance Criteria

1. WHEN un utilisateur modifie un prospect THEN l'action SHALL être enregistrée dans l'audit avec l'ID utilisateur
2. WHEN un utilisateur supprime un prospect THEN l'action SHALL être enregistrée avec les détails complets
3. WHEN un admin consulte l'audit THEN il SHALL voir toutes les actions du workspace
4. WHEN un manager consulte l'audit THEN il SHALL voir seulement les actions liées à ses prospects
5. WHEN un agent consulte l'audit THEN il SHALL voir seulement ses propres actions