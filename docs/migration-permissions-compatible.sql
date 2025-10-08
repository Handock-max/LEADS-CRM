-- ===========================
-- MIGRATION COMPATIBLE - SYSTÈME DE PERMISSIONS
-- S'adapte à la structure existante sans la casser
-- ===========================

-- 1. AJOUTER LE TYPE SUPER_ADMIN À L'ENUM EXISTANT
DO $$ 
BEGIN
    -- Ajouter 'super_admin' au type user_role existant
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. CRÉER LA TABLE SUPER ADMINS
CREATE TABLE IF NOT EXISTS super_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AJOUTER LES COLONNES MANQUANTES (si pas déjà présent)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'display_name') THEN
        ALTER TABLE workspaces ADD COLUMN display_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'created_by') THEN
        ALTER TABLE workspaces ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 4. MIGRER VOTRE UTILISATEUR ACTUEL COMME SUPER ADMIN
INSERT INTO super_admins (user_id)
SELECT id FROM auth.users 
WHERE email = 'martindetours98@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- 5. METTRE À JOUR LES DONNÉES EXISTANTES
UPDATE workspaces 
SET created_by = (SELECT id FROM auth.users WHERE email = 'martindetours98@gmail.com')
WHERE created_by IS NULL;

UPDATE workspaces 
SET display_name = name 
WHERE display_name IS NULL;

-- 6. CRÉER LES INDEX DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_super_admins_user_id ON super_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_created_by ON workspaces(created_by);

-- 7. FONCTIONS UTILITAIRES NOUVELLES (sans modifier les existantes)
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

-- Fonction pour récupérer le rôle avec support super admin (garde le type user_role)
CREATE OR REPLACE FUNCTION get_user_role_enhanced() 
RETURNS user_role AS $$
DECLARE
    user_role_val user_role;
BEGIN
    -- Vérifier d'abord si c'est un super admin
    IF is_super_admin() THEN
        RETURN 'super_admin'::user_role;
    END IF;
    
    -- Sinon, utiliser la logique existante
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
    user_role_val user_role;
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
    
    user_role_val := get_user_role(); -- Utilise la fonction existante
    
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
    user_role_val user_role;
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
    
    user_role_val := get_user_role(); -- Utilise la fonction existante
    
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

-- 8. AJOUTER LES NOUVELLES POLITIQUES RLS (en plus des existantes)
-- Politiques pour super admins (accès global)
CREATE POLICY "super_admins_all_workspaces" ON workspaces
    FOR ALL USING (is_super_admin());

CREATE POLICY "super_admins_all_roles" ON user_roles
    FOR ALL USING (is_super_admin());

CREATE POLICY "super_admins_all_prospects" ON prospects
    FOR ALL USING (is_super_admin());

CREATE POLICY "super_admins_all_audit" ON prospects_audit
    FOR ALL USING (is_super_admin());

-- Politiques améliorées pour les prospects (remplacent les existantes)
DROP POLICY IF EXISTS "Users can see prospects in their workspace" ON prospects;
CREATE POLICY "Users can see prospects in their workspace" ON prospects
    FOR SELECT USING (
        is_super_admin() OR 
        (workspace_id = get_user_workspace_id() AND (
            get_user_role() = 'admin' OR
            get_user_role() = 'manager' OR
            (get_user_role() = 'agent' AND (created_by = auth.uid() OR assigned_to = auth.uid()))
        ))
    );

DROP POLICY IF EXISTS "Users can update prospects in their workspace" ON prospects;
CREATE POLICY "Users can update prospects in their workspace" ON prospects
    FOR UPDATE USING (
        is_super_admin() OR can_modify_prospect(id)
    );

DROP POLICY IF EXISTS "Admins and managers can delete prospects" ON prospects;
CREATE POLICY "Enhanced delete prospects policy" ON prospects
    FOR DELETE USING (
        is_super_admin() OR can_delete_prospect(id)
    );

-- 9. ACTIVER RLS SUR LA TABLE SUPER_ADMINS
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour super_admins : seuls les super admins peuvent voir/modifier
CREATE POLICY "super_admins_manage_themselves" ON super_admins
    FOR ALL USING (is_super_admin());

-- 10. TRIGGER POUR UPDATED_AT SUR SUPER_ADMINS
CREATE TRIGGER update_super_admins_updated_at
    BEFORE UPDATE ON super_admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 11. FONCTION SETUP WORKSPACE POUR SUPER ADMIN
CREATE OR REPLACE FUNCTION create_workspace_with_admin(
    p_workspace_name TEXT,
    p_workspace_slug TEXT,
    p_admin_email TEXT,
    p_admin_password TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    new_workspace_id UUID;
    admin_user_id UUID;
BEGIN
    -- Vérifier que l'utilisateur actuel est super admin
    IF NOT is_super_admin() THEN
        RAISE EXCEPTION 'Seuls les super admins peuvent créer des workspaces';
    END IF;
    
    -- Créer le workspace
    INSERT INTO workspaces (name, slug, display_name, created_by)
    VALUES (p_workspace_name, p_workspace_slug, p_workspace_name, auth.uid())
    RETURNING id INTO new_workspace_id;
    
    -- Si un email admin est fourni, créer l'utilisateur (nécessite une logique côté app)
    -- Pour l'instant, on retourne juste l'ID du workspace
    
    RETURN new_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. VÉRIFICATION DE LA MIGRATION
SELECT 
    'MIGRATION COMPATIBLE TERMINÉE' as status,
    (SELECT COUNT(*) FROM super_admins) as super_admins_count,
    (SELECT COUNT(*) FROM workspaces WHERE display_name IS NOT NULL) as workspaces_with_display_name,
    (SELECT email FROM auth.users WHERE id IN (SELECT user_id FROM super_admins LIMIT 1)) as super_admin_email;

-- Message de confirmation
SELECT '✅ MIGRATION COMPATIBLE TERMINÉE - Structure existante préservée, nouvelles fonctionnalités ajoutées' as message;