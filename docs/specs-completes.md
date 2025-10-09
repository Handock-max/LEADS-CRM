# Spécifications Complètes - Ash CRM

## Vue d'ensemble du Projet

Ash CRM est une solution SaaS multi-tenant de gestion de la relation client construite avec React, TypeScript et Supabase. Le système implémente une architecture moderne avec isolation complète des données par workspace et un système de permissions granulaires basé sur les rôles.

## Objectifs du Projet

### Objectif Principal
Créer un CRM SaaS moderne permettant à plusieurs organisations d'utiliser la plateforme de manière isolée et sécurisée, avec des fonctionnalités adaptées aux équipes de vente.

### Objectifs Secondaires
- **Multi-tenant** : Isolation complète des données par workspace
- **Permissions granulaires** : Système de rôles avec 4 niveaux (Super Admin, Admin, Manager, Agent)
- **Interface moderne** : Design responsive avec palette Or/Noir/Bleu/Blanc
- **Sécurité robuste** : Row Level Security (RLS) au niveau base de données
- **Évolutivité** : Architecture modulaire et extensible
- **Déploiement automatisé** : CI/CD avec GitHub Actions

## Architecture Technique

### Stack Technologique

#### Frontend
- **React 18** : Framework UI avec hooks et composants fonctionnels
- **TypeScript** : Typage statique pour la robustesse et la maintenabilité
- **Vite** : Build tool moderne et performant
- **React Router** : Navigation côté client avec protection des routes
- **TanStack Query** : Gestion d'état serveur et cache intelligent
- **Tailwind CSS** : Framework CSS utilitaire pour un design cohérent
- **shadcn/ui** : Composants UI modernes et accessibles
- **Lucide React** : Bibliothèque d'icônes SVG optimisées

#### Backend
- **Supabase** : Backend-as-a-Service avec PostgreSQL
- **PostgreSQL** : Base de données relationnelle avec support RLS
- **Supabase Auth** : Authentification et gestion des sessions
- **Supabase Realtime** : Synchronisation temps réel des données
- **Row Level Security** : Isolation des données au niveau base de données

#### Déploiement
- **GitHub Pages** : Hébergement statique gratuit
- **GitHub Actions** : Pipeline CI/CD automatisé
- **Vite Build** : Optimisation et bundling pour la production

## Système de Permissions

### Hiérarchie des Rôles

#### 1. Super Admin
**Responsabilités :** Gestion de la plateforme complète
**Permissions :**
- Création et gestion des workspaces
- Accès à tous les workspaces de la plateforme
- Gestion des administrateurs de workspace
- Supervision globale de la plateforme

#### 2. Admin (Administrateur de Workspace)
**Responsabilités :** Propriétaire et gestionnaire du workspace
**Permissions :**
- Gestion complète de son workspace uniquement
- Création, modification, suppression des utilisateurs de son équipe
- Configuration des paramètres du workspace
- Accès à toutes les données du workspace (prospects, campagnes)

#### 3. Manager
**Responsabilités :** Superviseur d'équipe de vente
**Permissions :**
- Accès à toutes les campagnes du workspace
- Modification des prospects créés ou assignés
- Assignation de prospects aux agents
- Pas d'accès à la gestion des utilisateurs

#### 4. Agent
**Responsabilités :** Utilisateur final, commercial terrain
**Permissions :**
- Accès uniquement aux prospects créés ou assignés
- Modification limitée aux prospects possédés/assignés
- Suppression uniquement des prospects créés par lui-même
- Pas d'accès aux fonctions d'administration

Cette spécification complète fournit une base solide pour le développement, la maintenance et l'évolution d'Ash CRM.