# Guide d'Authentification - Ash CRM

## Mode Mock vs Supabase

Le système d'authentification peut fonctionner en deux modes :

### 🧪 Mode Mock (par défaut)
- **Avantage** : Pas besoin de configurer Supabase
- **Usage** : Parfait pour le développement et les tests
- **Configuration** : `VITE_MOCK_AUTH=true` dans `.env`

### 🚀 Mode Supabase (production)
- **Avantage** : Authentification réelle avec base de données
- **Usage** : Pour la production
- **Configuration** : `VITE_MOCK_AUTH=false` dans `.env`

## Comptes de Test (Mode Mock)

| Rôle | Email | Mot de passe | Accès |
|------|-------|--------------|-------|
| **Admin** | admin@ashcrm.com | password123 | Toutes les pages (CRM, Dashboard) |
| **Manager** | manager@ashcrm.com | password123 | Dashboard uniquement |
| **Agent** | agent@ashcrm.com | password123 | Dashboard uniquement |

## Configuration

### Pour utiliser le Mode Mock (recommandé pour débuter)

1. Assure-toi que ton fichier `.env` contient :
```env
VITE_MOCK_AUTH=true
```

2. Lance l'application :
```bash
npm run dev
```

3. Connecte-toi avec un des comptes de test ci-dessus

### Pour passer au Mode Supabase

#### Option 1: Développement Local
1. Configure ton projet Supabase
2. Mets à jour ton fichier `.env` :
```env
VITE_MOCK_AUTH=false
VITE_SUPABASE_URL=ton_url_supabase
VITE_SUPABASE_ANON_KEY=ta_clé_anonyme_supabase
```

3. Exécute le script SQL dans `docs/supabase-setup-enhanced.sql`
4. Redémarre l'application

#### Option 2: Production (GitHub Pages)
1. Configure les secrets GitHub :
   - `VITE_SUPABASE_URL` : Ton URL Supabase
   - `VITE_SUPABASE_ANON_KEY` : Ta clé anonyme Supabase

2. Le déploiement utilisera automatiquement Supabase (pas de mock en production)

3. Assure-toi que les tables Supabase sont créées avec le script SQL

#### Option 3: Test Production Local
1. Copie tes vraies valeurs Supabase dans `.env.production`
2. Lance en mode production :
```bash
npm run build:dev  # Build en mode développement
# ou
VITE_APP_ENVIRONMENT=production npm run build  # Build production
```

## Fonctionnalités Implémentées

✅ **Authentification complète**
- Connexion/déconnexion
- Persistance de session
- Gestion d'erreurs

✅ **Contrôle d'accès basé sur les rôles**
- Routes protégées
- Redirections automatiques selon le rôle
- Page d'accès non autorisé

✅ **Interface moderne**
- Design responsive
- Validation de formulaire avec Zod
- États de chargement
- Messages d'erreur conviviaux

✅ **Système adaptatif**
- Bascule facile entre mock et Supabase
- Même interface pour les deux modes
- Configuration par variables d'environnement

## Structure des Fichiers

```
src/
├── contexts/
│   └── AuthContext.tsx          # Contexte d'authentification principal
├── lib/
│   ├── authService.ts          # Service adaptatif (mock/Supabase)
│   ├── mockAuth.ts             # Service d'authentification mock
│   └── supabase.ts             # Client Supabase
├── components/
│   └── ProtectedRoute.tsx      # Composant de protection des routes
├── pages/
│   ├── Login.tsx               # Page de connexion
│   └── Unauthorized.tsx        # Page d'accès non autorisé
└── types/
    └── auth.ts                 # Types TypeScript
```

## Prochaines Étapes

1. **Tester l'authentification** avec les comptes mock
2. **Configurer Supabase** quand tu es prêt
3. **Implémenter les fonctionnalités CRM** avec l'authentification en place
4. **Déployer** avec le mode Supabase activé

## Indicateur de Mode

En développement, tu verras un badge en haut à droite qui indique le mode actuel :
- 🧪 **MOCK AUTH** : Mode mock activé
- 🚀 **SUPABASE** : Mode Supabase activé

## Dépannage

### L'application ne démarre pas
- Vérifie que le fichier `.env` existe
- Assure-toi que `VITE_MOCK_AUTH=true` pour commencer
- Si erreur de validation Supabase : vérifie que `VITE_MOCK_AUTH=true` dans `.env`

### Erreur de connexion en mode mock
- Utilise exactement les emails et mots de passe listés ci-dessus
- Vérifie la console pour les messages de debug
- Regarde l'indicateur de mode pour confirmer que le mock est actif

### Erreur en mode Supabase
- Vérifie tes variables d'environnement Supabase
- Assure-toi que les tables sont créées avec le script SQL
- Regarde la console réseau pour les erreurs API
- L'indicateur doit afficher 🚀 SUPABASE

### Erreur "Invalid Supabase URL format"
- Cette erreur apparaît si `VITE_MOCK_AUTH=false` mais que les URLs Supabase ne sont pas configurées
- Solution : Soit configure Supabase, soit remets `VITE_MOCK_AUTH=true`