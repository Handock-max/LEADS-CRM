-- ===========================
-- ASH CRM - PRODUCTION MVP SETUP
-- Configuration complète pour déploiement production
-- ===========================

-- 1. Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ===========================
-- 2. TYPES ENUM
-- ===========================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'agent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM ('nouveau','contacte','relance','rdv','perdu','gagne','qualifie','non_qualifie');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===========================
-- 3. TABLES PRINCIPALES
-- ===========================

-- Table workspaces (multi-tenant)
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table user_roles (gestion des rôles par workspace)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    invited_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, workspace_id)
);

-- Table prospects/leads (données CRM principales)
CREATE TABLE IF NOT EXISTS prospects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id),
    
    -- Données prospect
    entreprise TEXT NOT NULL,
    contact TEXT,
    poste TEXT,
    email CITEXT,
    telephone TEXT,
    statut lead_status DEFAULT 'nouveau',
    prochaine_action DATE,
    notes TEXT,
    
    -- Métadonnées
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table audit pour traçabilité
CREATE TABLE IF NOT EXISTS prospects_audit (
    id BIGSERIAL PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    prospect_id UUID,
    user_id UUID,
    action TEXT, -- insert/update/delete
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- 4. TRIGGERS POUR UPDATED_AT
-- ===========================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prospects_updated_at ON prospects;
CREATE TRIGGER update_prospects_updated_at
    BEFORE UPDATE ON prospects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================
-- 5. TRIGGER AUDIT
-- ===========================
CREATE OR REPLACE FUNCTION fn_prospects_audit() 
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO prospects_audit(workspace_id, prospect_id, user_id, action, old_data)
        VALUES (OLD.workspace_id, OLD.id, auth.uid()::uuid, 'delete', to_jsonb(OLD));
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO prospects_audit(workspace_id, prospect_id, user_id, action, old_data, new_data)
        VALUES (NEW.workspace_id, NEW.id, auth.uid()::uuid, 'update', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO prospects_audit(workspace_id, prospect_id, user_id, action, new_data)
        VALUES (NEW.workspace_id, NEW.id, auth.uid()::uuid, 'insert', to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language plpgsql security definer;

DROP TRIGGER IF EXISTS trg_prospects_audit ON prospects;
CREATE TRIGGER trg_prospects_audit
    AFTER INSERT OR UPDATE OR DELETE ON prospects
    FOR EACH ROW EXECUTE FUNCTION fn_prospects_audit();

-- ===========================
-- 6. FONCTIONS UTILITAIRES
-- ===========================

-- Fonction pour récupérer le workspace de l'utilisateur
CREATE OR REPLACE FUNCTION get_user_workspace_id() 
RETURNS UUID AS $$
DECLARE
    workspace_id UUID;
BEGIN
    SELECT ur.workspace_id INTO workspace_id 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid()::uuid 
    AND ur.is_active = true
    LIMIT 1;
    RETURN workspace_id;
END;
$$ language plpgsql stable security definer;

-- Fonction pour récupérer le rôle de l'utilisateur
CREATE OR REPLACE FUNCTION get_user_role() 
RETURNS user_role AS $$
DECLARE
    user_role_val user_role;
BEGIN
    SELECT ur.role INTO user_role_val 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid()::uuid 
    AND ur.workspace_id = get_user_workspace_id()
    AND ur.is_active = true;
    RETURN user_role_val;
END;
$$ language plpgsql stable security definer;

-- ===========================
-- 7. ROW LEVEL SECURITY (RLS)
-- ===========================

-- Activer RLS sur toutes les tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects_audit ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour workspaces
DROP POLICY IF EXISTS "Users can only see their workspace" ON workspaces;
CREATE POLICY "Users can only see their workspace"
    ON workspaces FOR SELECT
    USING (id = get_user_workspace_id());

-- Politiques RLS pour user_roles
DROP POLICY IF EXISTS "Users can see roles in their workspace" ON user_roles;
CREATE POLICY "Users can see roles in their workspace"
    ON user_roles FOR SELECT
    USING (workspace_id = get_user_workspace_id());

DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
CREATE POLICY "Admins can manage roles"
    ON user_roles FOR ALL
    USING (workspace_id = get_user_workspace_id() AND get_user_role() = 'admin');

-- Politiques RLS pour prospects
DROP POLICY IF EXISTS "Users can see prospects in their workspace" ON prospects;
CREATE POLICY "Users can see prospects in their workspace"
    ON prospects FOR SELECT
    USING (workspace_id = get_user_workspace_id());

DROP POLICY IF EXISTS "Users can insert prospects in their workspace" ON prospects;
CREATE POLICY "Users can insert prospects in their workspace"
    ON prospects FOR INSERT
    WITH CHECK (workspace_id = get_user_workspace_id());

DROP POLICY IF EXISTS "Users can update prospects in their workspace" ON prospects;
CREATE POLICY "Users can update prospects in their workspace"
    ON prospects FOR UPDATE
    USING (workspace_id = get_user_workspace_id());

DROP POLICY IF EXISTS "Admins and managers can delete prospects" ON prospects;
CREATE POLICY "Admins and managers can delete prospects"
    ON prospects FOR DELETE
    USING (workspace_id = get_user_workspace_id() AND get_user_role() IN ('admin', 'manager'));

-- Politiques RLS pour audit
DROP POLICY IF EXISTS "Admins can see audit in their workspace" ON prospects_audit;
CREATE POLICY "Admins can see audit in their workspace"
    ON prospects_audit FOR SELECT
    USING (workspace_id = get_user_workspace_id() AND get_user_role() IN ('admin', 'manager'));

-- ===========================
-- 8. INDEX POUR PERFORMANCE
-- ===========================
CREATE INDEX IF NOT EXISTS idx_user_roles_workspace ON user_roles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_prospects_workspace ON prospects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_prospects_assigned ON prospects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(statut);
CREATE INDEX IF NOT EXISTS idx_prospects_email ON prospects(lower(email));
CREATE INDEX IF NOT EXISTS idx_prospects_created_at ON prospects(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_workspace ON prospects_audit(workspace_id);

-- ===========================
-- 9. VUES POUR DASHBOARD
-- ===========================
CREATE OR REPLACE VIEW v_prospects_stats AS
SELECT 
    workspace_id,
    COUNT(*) as total_prospects,
    COUNT(*) FILTER (WHERE statut = 'nouveau') as nouveaux,
    COUNT(*) FILTER (WHERE statut = 'contacte') as contactes,
    COUNT(*) FILTER (WHERE statut = 'relance') as relances,
    COUNT(*) FILTER (WHERE statut = 'rdv') as rdv,
    COUNT(*) FILTER (WHERE statut = 'gagne') as gagnes,
    COUNT(*) FILTER (WHERE statut = 'perdu') as perdus,
    ROUND(
        (COUNT(*) FILTER (WHERE statut = 'gagne')::numeric / 
         NULLIF(COUNT(*) FILTER (WHERE statut IN ('gagne', 'perdu')), 0)) * 100, 2
    ) as taux_conversion
FROM prospects
GROUP BY workspace_id;

-- ===========================
-- 10. FONCTION SETUP INITIAL
-- ===========================
CREATE OR REPLACE FUNCTION setup_initial_workspace(
    p_workspace_name TEXT,
    p_workspace_slug TEXT,
    p_admin_user_id UUID
) RETURNS UUID AS $$
DECLARE
    new_workspace_id UUID;
BEGIN
    -- Créer le workspace
    INSERT INTO workspaces (name, slug)
    VALUES (p_workspace_name, p_workspace_slug)
    RETURNING id INTO new_workspace_id;
    
    -- Assigner le rôle admin
    INSERT INTO user_roles (user_id, workspace_id, role)
    VALUES (p_admin_user_id, new_workspace_id, 'admin');
    
    RETURN new_workspace_id;
END;
$$ language plpgsql security definer;

-- ===========================
-- 11. DONNÉES EXEMPLE (OPTIONNEL)
-- ===========================
-- Décommentez et modifiez avec votre UUID utilisateur réel
/*
-- Exemple de création de workspace
SELECT setup_initial_workspace(
    'Ash CRM', 
    'ash-crm', 
    'VOTRE-UUID-UTILISATEUR-ICI'::uuid
);

-- Exemple de prospects
INSERT INTO prospects (workspace_id, entreprise, contact, poste, email, telephone, statut, notes, created_by)
SELECT 
    w.id,
    'Globex Corp',
    'Jean Dupont', 
    'Directeur Achat',
    'jean.dupont@globex.com',
    '+228 90 00 11 22',
    'contacte',
    'Attente retour devis',
    'VOTRE-UUID-UTILISATEUR-ICI'::uuid
FROM workspaces w WHERE w.slug = 'ash-crm';
*/