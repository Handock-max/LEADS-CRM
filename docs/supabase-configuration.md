# Configuration Supabase - Ash CRM

## 🚀 Étapes de Configuration

### 1. Créer un Projet Supabase

1. Va sur [supabase.com](https://supabase.com)
2. Crée un nouveau projet
3. Note ton **URL du projet** et ta **clé anonyme**

### 2. Configurer la Base de Données

1. Va dans l'éditeur SQL de Supabase
2. Exécute le script `docs/supabase-setup-enhanced.sql`
3. Vérifie que les tables sont créées :
   - `workspaces`
   - `user_roles`
   - `leads` (si applicable)

### 3. Configurer l'Authentification

#### Pour le Développement Local :
```bash
# Méthode 1: Script automatique
npm run auth:supabase

# Méthode 2: Manuel - Édite .env
VITE_MOCK_AUTH=false
VITE_SUPABASE_URL=https://ton-projet.supabase.co
VITE_SUPABASE_ANON_KEY=ta-cle-anonyme
```

#### Pour GitHub Pages (Production) :
1. Va dans **Settings > Secrets and variables > Actions**
2. Ajoute ces secrets :
   - `VITE_SUPABASE_URL` : https://ton-projet.supabase.co
   - `VITE_SUPABASE_ANON_KEY` : ta-cle-anonyme

### 4. Créer des Utilisateurs de Test

Exécute ce SQL dans Supabase pour créer des utilisateurs de test :

```sql
-- Créer un workspace de test
INSERT INTO workspaces (id, name, slug, settings) VALUES 
('workspace-test', 'Ash CRM Demo', 'ash-crm-demo', '{"lead_statuses": ["nouveau", "contacté", "qualifié", "négociation", "fermé-gagné", "fermé-perdu"]}');

-- Note: Les utilisateurs doivent être créés via l'interface d'authentification Supabase
-- Puis associés aux rôles avec ces requêtes :

-- Admin (remplace USER_ID par l'ID réel de l'utilisateur)
INSERT INTO user_roles (user_id, workspace_id, role, is_active) VALUES 
('USER_ID_ADMIN', 'workspace-test', 'admin', true);

-- Manager
INSERT INTO user_roles (user_id, workspace_id, role, is_active) VALUES 
('USER_ID_MANAGER', 'workspace-test', 'manager', true);

-- Agent
INSERT INTO user_roles (user_id, workspace_id, role, is_active) VALUES 
('USER_ID_AGENT', 'workspace-test', 'agent', true);
```

### 5. Configurer les Politiques RLS (Row Level Security)

```sql
-- Activer RLS sur toutes les tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Politique pour workspaces : utilisateurs peuvent voir leur workspace
CREATE POLICY "Users can view their workspace" ON workspaces
FOR SELECT USING (
  id IN (
    SELECT workspace_id FROM user_roles 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Politique pour user_roles : utilisateurs peuvent voir leurs rôles
CREATE POLICY "Users can view their roles" ON user_roles
FOR SELECT USING (user_id = auth.uid());
```

## 🔧 Scripts Utiles

```bash
# Basculer entre mock et Supabase
npm run auth:toggle

# Forcer le mode mock
npm run auth:mock

# Forcer le mode Supabase
npm run auth:supabase

# Tester en mode production local
npm run build:dev
npm run preview
```

## 🐛 Dépannage

### Erreur "Invalid API key"
- Vérifie que `VITE_SUPABASE_ANON_KEY` est correct
- Assure-toi que la clé n'a pas d'espaces avant/après

### Erreur "Failed to load user permissions"
- Vérifie que les tables `workspaces` et `user_roles` existent
- Assure-toi qu'il y a des données de test dans ces tables

### Erreur de connexion réseau
- Vérifie que `VITE_SUPABASE_URL` est correct
- Teste l'URL dans ton navigateur (doit afficher une page Supabase)

### L'utilisateur ne peut pas se connecter
- Vérifie que l'utilisateur existe dans l'onglet "Authentication" de Supabase
- Assure-toi qu'il a un rôle actif dans la table `user_roles`

## 📊 Vérification de la Configuration

Une fois configuré, tu devrais voir :
- 🚀 **SUPABASE** dans le badge (mode indicateur)
- Les vraies données utilisateur dans le debug
- Possibilité de créer de vrais comptes utilisateur