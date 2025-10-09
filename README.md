# Ash CRM - Système de Gestion de la Relation Client

Un CRM SaaS moderne multi-tenant construit avec React, TypeScript et Supabase pour la gestion des prospects et des processus de vente.

## Fonctionnalités Principales

- **Gestion des Prospects** : Création, modification et suivi des prospects avec champs personnalisables
- **Gestion des Utilisateurs** : Contrôle d'accès basé sur les rôles (Super Admin/Admin/Manager/Agent)
- **Dashboard Analytique** : Métriques en temps réel et indicateurs de performance
- **Personnalisation Workspace** : Adaptation du CRM avec champs personnalisés et thèmes
- **Architecture Multi-Tenant** : Isolation sécurisée des données entre workspaces
- **Design Responsive** : Interface optimisée pour desktop, tablette et mobile
- **Système d'Erreurs Contextuelles** : Messages d'erreur 403 intelligents avec suggestions

## Stack Technique

- **Frontend** : React 18, TypeScript, Vite
- **Composants UI** : shadcn/ui, Tailwind CSS
- **Backend** : Supabase (PostgreSQL, Auth, Realtime)
- **Gestion d'État** : TanStack Query, Zustand
- **Déploiement** : GitHub Pages avec CI/CD automatisé

## Démarrage Rapide

### Prérequis

- Node.js 18+ et npm
- Compte et projet Supabase

### Installation

1. Cloner le repository :
```bash
git clone https://github.com/your-username/LEADS-CRM.git
cd LEADS-CRM
```

2. Installer les dépendances :
```bash
npm install
```

3. Configurer les variables d'environnement :
```bash
cp .env.example .env
```

Éditer `.env` avec vos identifiants Supabase :
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Configurer la base de données :
- Exécuter les scripts SQL dans `docs/supabase-setup-enhanced.sql` dans l'éditeur SQL Supabase
- Cela créera toutes les tables, politiques RLS et fonctions nécessaires

5. Démarrer le serveur de développement :
```bash
npm run dev
```

## Structure du Projet

```
src/
├── components/          # Composants UI réutilisables
│   ├── ui/             # Composants de base (shadcn/ui)
│   └── business/       # Composants métier spécifiques
├── pages/              # Pages de l'application
├── hooks/              # Hooks React personnalisés
├── lib/                # Services et utilitaires
│   ├── errorUtils.ts   # Gestion des erreurs de permission
│   ├── supabase.ts     # Configuration Supabase
│   └── services/       # Services métier
├── contexts/           # Contextes React (Auth, Workspace)
├── types/              # Définitions TypeScript
│   └── errors.ts       # Types pour les erreurs de permission
└── styles/             # Styles globaux et thèmes
```

## Système de Rôles

### Hiérarchie des Permissions

1. **Super Admin** : Gestion de la plateforme complète
   - Création et gestion des workspaces
   - Accès à tous les workspaces
   - Gestion des administrateurs

2. **Admin** : Propriétaire du workspace
   - Gestion complète de son workspace
   - Gestion des utilisateurs de son équipe
   - Configuration des paramètres workspace

3. **Manager** : Superviseur d'équipe
   - Supervision des agents
   - Assignation des prospects
   - Accès aux données de l'équipe

4. **Agent** : Utilisateur final
   - Gestion de ses prospects personnels
   - Accès limité aux données assignées

## Fonctionnalités Avancées

### Système d'Erreurs 403 Contextuelles
- **Messages spécifiques** selon le type d'erreur et le rôle utilisateur
- **Suggestions d'actions** alternatives pour guider l'utilisateur
- **Navigation intelligente** vers les pages autorisées
- **Interface cohérente** pour toutes les erreurs de permission

### Sécurité Multi-Tenant
- **Row Level Security (RLS)** : Isolation au niveau base de données
- **Validation multi-niveaux** : Client, serveur et base de données
- **Audit trail complet** : Traçabilité de toutes les actions
- **Gestion des sessions** sécurisée avec Supabase Auth

## Documentation Technique

### Guides Principaux
- [Architecture Technique](docs/architecture-technique.md) - Vue d'ensemble de l'architecture
- [Guide des Fonctions](docs/guide-fonctions.md) - Documentation détaillée des fonctions
- [Spécifications Complètes](docs/specs-completes.md) - Spécifications du projet
- [Système d'Erreurs de Permission](docs/permission-error-system.md) - Gestion des erreurs 403

### Guides de Configuration
- [Configuration Supabase](docs/supabase-configuration.md) - Setup de la base de données
- [Guide de Personnalisation Workspace](docs/workspace-customization-guide.md) - Customisation
- [Guide d'Assignation des Prospects](docs/prospect-assignment-guide.md) - Gestion des assignations
- [Setup Production](docs/supabase-production-setup.sql) - Configuration production

### Spécifications Métier
- [Spécifications Permissions par Rôle](.kiro/specs/role-based-permissions/) - Système de permissions
- [Spécifications Intégration Supabase](.kiro/specs/supabase-integration/) - Architecture multi-tenant

## Déploiement

L'application est automatiquement déployée sur GitHub Pages lors des push sur la branche main.

### Déploiement Manuel

```bash
npm run build
npm run deploy
```

### Configuration CI/CD

Le pipeline GitHub Actions inclut :
1. Vérification de la qualité du code (ESLint, TypeScript)
2. Tests unitaires
3. Build de production
4. Déploiement automatique
5. Notifications en cas d'échec

## Développement

### Standards de Code
- **Commentaires en français** : Toute la documentation et les commentaires
- **Types TypeScript** : Typage strict pour toutes les fonctions
- **Architecture modulaire** : Séparation claire des responsabilités
- **Tests unitaires** : Couverture des fonctions critiques

### Bonnes Pratiques
- **Gestion d'erreurs cohérente** : Utilisation du système d'erreurs contextuelles
- **Permissions granulaires** : Vérification à tous les niveaux
- **Performance optimisée** : Code splitting et cache intelligent
- **Accessibilité** : Respect des standards WCAG

## Contribution

1. Fork du repository
2. Créer une branche feature : `git checkout -b feature/nouvelle-fonctionnalite`
3. Commit des modifications : `git commit -am 'Ajout nouvelle fonctionnalité'`
4. Push vers la branche : `git push origin feature/nouvelle-fonctionnalite`
5. Soumettre une pull request

## Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour les détails.

## Support

Pour le support et les questions, veuillez ouvrir une issue dans le repository GitHub.

## Roadmap

### Version Actuelle (v1.0)
- ✅ Architecture multi-tenant
- ✅ Système de permissions granulaires
- ✅ Gestion des erreurs contextuelles
- ✅ Interface responsive moderne

### Prochaines Versions
- 🔄 Intégrations tierces (email, calendrier)
- 🔄 Analytics avancées et rapports
- 🔄 API publique pour intégrations
- 🔄 Application mobile native
