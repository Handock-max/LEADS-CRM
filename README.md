# Ash CRM

CRM minimaliste conçu pour les Sales Development Representatives (SDR) avec dashboard manager.

## Description

Ash CRM est un outil de gestion de prospects léger et efficace qui permet aux SDR de :
- Suivre leurs prospects et leurs statuts
- Offrir aux managers une vue en lecture seule avec KPIs
- Centraliser les données de prospection (appels, emails, LinkedIn, etc.)

## Technologies

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Déploiement**: GitHub Pages

## Installation

```bash
# Cloner le repository
git clone <YOUR_GIT_URL>
cd ash-crm

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

## Configuration Supabase

1. Créer un projet Supabase
2. Exécuter le script SQL fourni dans `/docs/supabase-setup.sql`
3. Configurer les variables d'environnement
4. Ajouter votre UUID utilisateur comme admin

## Rôles utilisateurs

- **Admin (SDR)**: Accès complet au CRM, peut créer/modifier/supprimer des prospects
- **Manager**: Accès en lecture seule au dashboard avec exports CSV/Excel

## Déploiement

```bash
npm run build
# Déployer le dossier dist/ sur GitHub Pages
```
