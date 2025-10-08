-- ===========================
-- CORRECTION RLS POUR SUPER_ADMINS
-- Ajoute seulement la sécurité manquante
-- ===========================

-- Activer RLS sur la table super_admins
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Créer une politique simple : seul le propriétaire peut voir son propre enregistrement
DROP POLICY IF EXISTS "super_admins_own_record" ON super_admins;
CREATE POLICY "super_admins_own_record" ON super_admins
    FOR ALL USING (user_id = auth.uid());

-- Politique pour permettre aux super admins de voir tous les enregistrements
-- (mais seulement après qu'ils soient identifiés comme super admin)
DROP POLICY IF EXISTS "super_admins_see_all" ON super_admins;
CREATE POLICY "super_admins_see_all" ON super_admins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM super_admins sa 
            WHERE sa.user_id = auth.uid()
        )
    );

-- Vérification
SELECT 
    'RLS CORRECTION TERMINÉE' as status,
    (SELECT COUNT(*) FROM super_admins) as super_admins_count,
    'RLS activé sur super_admins' as security_status;

-- Message de confirmation
SELECT '✅ CORRECTION RLS TERMINÉE - Table super_admins sécurisée' as message;