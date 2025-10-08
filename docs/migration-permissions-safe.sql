-- ===========================
-- MIGRATION DOUCE - SYSTÈME DE PERMISSIONS
-- Ajoute les nouvelles fonctionnalités sans casser l'existant
-- ===========================

-- 1. CRÉER LA TABLE SUPER ADMINS
CREATE TABLE IF NOT EXISTS super_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AJOUTER LES COLONNES MANQUANTES AUX TABLES EXISTANTES
-- Ajouter display_name et created_by à workspaces (si pas déjà présent)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'display_name') THEN
        ALTER TABLE workspaces ADD COLUMN display_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'created_by') THEN
        ALTER TABLE workspaces ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Ajouter created_by à prospects (si pas déjà présent)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prospects' AND column_name = 'created_by') THEN
        ALTER TABLE prospects ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 3. MIGRER VOTRE UTILISATEUR ACTUEL COMME SUPER ADMIN
-- Remplacez 'martindetours98@gmail.com' par votre email si différent
INSERT INTO super_admins (user_id)
SELECT id FROM auth.users 
WHERE email = 'martindetours98@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- 4. METTRE À JOUR LES DONNÉES EXISTANTES
-- Assigner le created_by pour les workspaces existants
UPDATE workspaces 
SET created_by = (SELECT id FROM auth.users WHERE email = 'martindetours98@gmail.com')
WHERE created_by IS NULL;

-- Assigner le created_by pour les prospects existants (à l'utilisateur admin)
UPDATE prospects 
SET created_by = (SELECT id FROM auth.users WHERE email = 'martindetours98@gmail.com')
WHERE created_by IS NULL;

-- Mettre à jour display_name des workspaces existants
UPDATE workspaces 
SET display_name = name 
WHERE display_name IS NULL;

-- 5. CRÉER LES INDEX DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_super_admins_user_id ON super_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_prospects_created_by ON prospects(created_by);
CREATE INDEX IF NOT EXISTS idx_prospects_assigned_to ON prospects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workspaces_created_by ON workspaces(created_by);

-- 6. FONCTIONS UTILITAIRES MISES À JOUR
-- Fonction pour vérifier si un utilisateur est super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID DEFAULT auth.uid()) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM super_admins 
        WHERE user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction mise à jour pour récupérer le rôle utilisateur
CREATE OR REPLACE FUNCTION get_user_role() 
RETURNS TEXT AS $$
DECLARE
    user_role_val TEXT;
BEGIN
    -- Vérifier d'abord si c'est un super admin
    IF is_super_admin() THEN
        RETURN 'super_admin';
    END IF;
    
    -- Sinon, récupérer le rôle normal
    SELECT ur.role INTO user_role_val 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid()::uuid 
    AND ur.workspace_id = get_user_workspace_id()
    AND ur.is_active = true;
    
    RETURN user_role_val;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Fonction pour vérifier les permissions de modification de prospect
CREATE OR REPLACE FUNCTION can_modify_prospect(prospect_uuid UUID) 
RETURNS BOOLEAN AS $$
DECLARE
    prospect_record RECORD;
    user_role_val TEXT;
BEGIN
    -- Super admin peut tout modifier
    IF is_super_admin() THEN
        RETURN TRUE;
    END IF;
    
    -- Récupérer les infos du prospect
    SELECT * INTO prospect_record 
    FROM prospects 
    WHERE id = prospect_uuid;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Vérifier que c'est dans le bon workspace
    IF prospect_record.workspace_id != get_user_workspace_id() THEN
        RETURN FALSE;
    END IF;
    
    user_role_val := get_user_role();
    
    -- Admin du workspace peut tout modifier
    IF user_role_val = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Manager peut modifier ses prospects et ceux qui lui sont assignés
    IF user_role_val = 'manager' THEN
        RETURN (prospect_record.created_by = auth.uid() OR prospect_record.assigned_to = auth.uid());
    END IF;
    
    -- Agent peut modifier ses prospects et ceux qui lui sont assignés
    IF user_role_val = 'agent' THEN
        RETURN (prospect_record.created_by = auth.uid() OR prospect_record.assigned_to = auth.uid());
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier les permissions de suppression de prospect
CREATE OR REPLACE FUNCTION can_delete_prospect(prospect_uuid UUID) 
RETURNS BOOLEAN AS $$
DECLARE
    prospect_record RECORD;
    user_role_val TEXT;
BEGIN
    -- Super admin peut tout supprimer
    IF is_super_admin() THEN
        RETURN TRUE;
    END IF;
    
    -- Récupérer les infos du prospect
    SELECT * INTO prospect_record 
    FROM prospects 
    WHERE id = prospect_uuid;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Vérifier que c'est dans le bon workspace
    IF prospect_record.workspace_id != get_user_workspace_id() THEN
        RETURN FALSE;
    END IF;
    
    user_role_val := get_user_role();
    
    -- Admin du workspace peut tout supprimer
    IF user_role_val = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Manager peut supprimer seulement ses propres prospects
    IF user_role_val = 'manager' THEN
        RETURN (prospect_record.created_by = auth.uid());
    END IF;
    
    -- Agent peut supprimer seulement ses propres prospects (pas les assignés)
    IF user_role_val = 'agent' THEN
        RETURN (prospect_record.created_by = auth.uid());
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. SUPPRIMER TOUTES LES POLITIQUES EXISTANTES AVANT DE MODIFIER LES FONCTIONS
DROP POLICY IF EXISTS "Users can only see their workspace" ON workspaces;
DROP POLICY IF EXISTS "Users can see roles in their workspace" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Users can see prospects in their workspace" ON prospects;
DROP POLICY IF EXISTS "Users can insert prospects in their workspace" ON prospects;
DROP POLICY IF EXISTS "Users can update prospects in their workspace" ON prospects;
DROP POLICY IF EXISTS "Admins and managers can delete prospects" ON prospects;
DROP POLICY IF EXISTS "Admins can see audit in their workspace" ON prospects_audit;

-- Supprimer toutes les autres politiques qui pourraient exister
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 8. MAINTENANT ON PEUT SUPPRIMER ET RECRÉER LES FONCTIONS
-- Supprimer l'ancienne fonction maintenant que les politiques sont supprimées
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
CREATE POLICY "super_admins_all_workspaces" ON workspaces
    FOR ALL USING (is_super_admin());

CREATE POLICY "admins_own_workspace" ON workspaces
    FOR ALL USING (
        NOT is_super_admin() AND 
        id = get_user_workspace_id()
    );

-- Nouvelles politiques pour user_roles
CREATE POLICY "super_admins_all_roles" ON user_roles
    FOR ALL USING (is_super_admin());

CREATE POLICY "admins_workspace_roles" ON user_roles
    FOR ALL USING (
        NOT is_super_admin() AND 
        workspace_id = get_user_workspace_id() AND 
        get_user_role() = 'admin'
    );

CREATE POLICY "users_see_workspace_roles" ON user_roles
    FOR SELECT USING (
        NOT is_super_admin() AND 
        workspace_id = get_user_workspace_id()
    );

-- Nouvelles politiques pour prospects
CREATE POLICY "super_admins_all_prospects" ON prospects
    FOR ALL USING (is_super_admin());

CREATE POLICY "admins_workspace_prospects" ON prospects
    FOR ALL USING (
        NOT is_super_admin() AND 
        workspace_id = get_user_workspace_id() AND 
        get_user_role() = 'admin'
    );

CREATE POLICY "managers_own_assigned_prospects" ON prospects
    FOR SELECT USING (
        NOT is_super_admin() AND 
        workspace_id = get_user_workspace_id() AND 
        get_user_role() = 'manager'
    );

CREATE POLICY "managers_insert_prospects" ON prospects
    FOR INSERT WITH CHECK (
        NOT is_super_admin() AND 
        workspace_id = get_user_workspace_id() AND 
        get_user_role() IN ('manager', 'admin')
    );

CREATE POLICY "managers_update_own_prospects" ON prospects
    FOR UPDATE USING (
        NOT is_super_admin() AND 
        can_modify_prospect(id)
    );

CREATE POLICY "managers_delete_own_prospects" ON prospects
    FOR DELETE USING (
        NOT is_super_admin() AND 
        can_delete_prospect(id)
    );

CREATE POLICY "agents_assigned_prospects" ON prospects
    FOR SELECT USING (
        NOT is_super_admin() AND 
        workspace_id = get_user_workspace_id() AND 
        get_user_role() = 'agent' AND
        (created_by = auth.uid() OR assigned_to = auth.uid())
    );

CREATE POLICY "agents_insert_prospects" ON prospects
    FOR INSERT WITH CHECK (
        NOT is_super_admin() AND 
        workspace_id = get_user_workspace_id() AND 
        get_user_role() = 'agent'
    );

CREATE POLICY "agents_update_assigned_prospects" ON prospects
    FOR UPDATE USING (
        NOT is_super_admin() AND 
        can_modify_prospect(id) AND 
        get_user_role() = 'agent'
    );

CREATE POLICY "agents_delete_own_prospects" ON prospects
    FOR DELETE USING (
        NOT is_super_admin() AND 
        can_delete_prospect(id) AND 
        get_user_role() = 'agent'
    );

-- 9. RECRÉER TOUTES LES POLITIQUES RLS AVEC LES NOUVELLES FONCTIONS

-- Nouvelles politiques pour workspaces
CREATE TRIGGER update_super_admins_updated_at
    BEFORE UPDATE ON super_admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. TRIGGER POUR UPDATED_AT SUR SUPER_ADMINS
CREATE TRIGGER update_super_admins_updated_at
    BEFORE UPDATE ON super_admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 11. VÉRIFICATION DE LA MIGRATION
SELECT 
    'MIGRATION TERMINÉE' as status,
    (SELECT COUNT(*) FROM super_admins) as super_admins_count,
    (SELECT COUNT(*) FROM workspaces WHERE display_name IS NOT NULL) as workspaces_with_display_name,
    (SELECT COUNT(*) FROM prospects WHERE created_by IS NOT NULL) as prospects_with_creator;

-- Message de confirmation
SELECT '✅ MIGRATION DOUCE TERMINÉE - Vos données existantes sont préservées' as message;