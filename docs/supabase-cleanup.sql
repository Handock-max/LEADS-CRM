-- ===========================
-- ASH CRM - SCRIPT DE NETTOYAGE COMPLET
-- Supprime toutes les structures existantes pour éviter les conflits
-- ⚠️  ATTENTION: Ce script supprime TOUTES les données !
-- ===========================

-- 1. SUPPRIMER TOUTES LES POLITIQUES RLS
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Supprimer toutes les politiques sur toutes les tables
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 2. SUPPRIMER TOUTES LES VUES
DROP VIEW IF EXISTS v_prospects_stats CASCADE;
DROP VIEW IF EXISTS v_campaign_kpis CASCADE;
DROP VIEW IF EXISTS v_agent_performance CASCADE;

-- 3. SUPPRIMER TOUS LES TRIGGERS (ignore les erreurs si n'existe pas)
DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_prospects_updated_at ON prospects;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS trg_prospects_audit ON prospects;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS trg_leads_audit ON leads;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 4. SUPPRIMER TOUTES LES FONCTIONS
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS fn_prospects_audit() CASCADE;
DROP FUNCTION IF EXISTS fn_leads_audit() CASCADE;
DROP FUNCTION IF EXISTS get_user_workspace_id() CASCADE;
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS setup_initial_workspace(TEXT, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS create_workspace(TEXT, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS invite_user(UUID, TEXT, user_role, UUID) CASCADE;
DROP FUNCTION IF EXISTS accept_invitation(TEXT, UUID) CASCADE;

-- 5. SUPPRIMER TOUTES LES TABLES (dans l'ordre des dépendances)
DROP TABLE IF EXISTS prospects_audit CASCADE;
DROP TABLE IF EXISTS leads_audit CASCADE;
DROP TABLE IF EXISTS user_invitations CASCADE;
DROP TABLE IF EXISTS prospects CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;

-- 6. SUPPRIMER TOUS LES TYPES ENUM
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS lead_status CASCADE;

-- 7. SUPPRIMER TOUS LES INDEX PERSONNALISÉS (ignore les erreurs)
DO $$ 
DECLARE 
    index_name TEXT;
BEGIN
    FOR index_name IN (
        SELECT indexname FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname LIKE 'idx_%'
    ) LOOP
        BEGIN
            EXECUTE format('DROP INDEX IF EXISTS %I', index_name);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END LOOP;
END $$;

-- 8. NETTOYER LES UTILISATEURS AUTH (OPTIONNEL - DÉCOMMENTEZ SI NÉCESSAIRE)
-- ⚠️  ATTENTION: Ceci supprime TOUS les utilisateurs !
-- DELETE FROM auth.users WHERE email != 'votre-email-admin@domain.com';

-- 9. VÉRIFICATION - Lister ce qui reste (optionnel)
DO $$
BEGIN
    RAISE NOTICE 'Vérification des éléments restants...';
    
    -- Compter les tables
    RAISE NOTICE 'Tables restantes: %', (
        SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'
    );
    
    -- Compter les fonctions
    RAISE NOTICE 'Fonctions restantes: %', (
        SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public'
    );
    
    -- Compter les types
    RAISE NOTICE 'Types enum restants: %', (
        SELECT COUNT(*) FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e'
    );
END $$;

-- Message de confirmation
SELECT '✅ NETTOYAGE TERMINÉ - Vous pouvez maintenant exécuter le script de production' as message;