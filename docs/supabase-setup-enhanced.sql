-- ===========================
-- ENHANCED SUPABASE SETUP FOR ASH CRM SAAS
-- Multi-tenant architecture with workspaces
-- ===========================

-- 1. Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "citext";

-- ===========================
-- 2. WORKSPACES (Multi-tenant)
-- ===========================
create table if not exists workspaces (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    slug text unique not null, -- for URL-friendly workspace identification
    settings jsonb default '{}', -- custom columns, branding, etc.
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- ===========================
-- 3. ENHANCED ROLES TABLE
-- ===========================
create type user_role as enum ('admin', 'manager', 'agent');

create table if not exists user_roles (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade,
    workspace_id uuid references workspaces(id) on delete cascade,
    role user_role not null,
    invited_by uuid references auth.users(id),
    invited_at timestamptz default now(),
    first_login_at timestamptz,
    is_active boolean default true,
    created_at timestamptz default now(),
    unique(user_id, workspace_id)
);

-- ===========================
-- 4. CAMPAIGNS TABLE
-- ===========================
create table if not exists campaigns (
    id uuid primary key default uuid_generate_v4(),
    workspace_id uuid references workspaces(id) on delete cascade,
    name text not null,
    description text,
    objective text,
    start_date date,
    end_date date,
    created_by uuid references auth.users(id),
    is_active boolean default true,
    settings jsonb default '{}', -- custom fields configuration
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- ===========================
-- 5. ENHANCED PROSPECTS/LEADS TABLE
-- ===========================
create type lead_status as enum ('nouveau','contacte','relance','rdv','perdu','gagne','qualifie','non_qualifie');

create table if not exists leads (
    id uuid primary key default uuid_generate_v4(),
    workspace_id uuid references workspaces(id) on delete cascade,
    campaign_id uuid references campaigns(id) on delete set null,
    assigned_to uuid references auth.users(id), -- agent responsible
    
    -- Standard fields
    entreprise text not null,
    contact text,
    poste text,
    email citext,
    telephone text,
    status lead_status default 'nouveau',
    source text,
    
    -- Tracking fields
    derniere_action timestamptz,
    prochaine_action date,
    resultat text,
    notes text,
    
    -- Custom fields (dynamic)
    custom_fields jsonb default '{}',
    
    -- Metadata
    created_by uuid references auth.users(id),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- ===========================
-- 6. ENHANCED AUDIT TABLE
-- ===========================
create table if not exists leads_audit (
    id bigserial primary key,
    workspace_id uuid references workspaces(id) on delete cascade,
    lead_id uuid,
    user_id uuid,
    action text, -- insert/update/delete/export
    table_name text default 'leads',
    payload jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamptz default now()
);

-- ===========================
-- 7. USER INVITATIONS TABLE
-- ===========================
create table if not exists user_invitations (
    id uuid primary key default uuid_generate_v4(),
    workspace_id uuid references workspaces(id) on delete cascade,
    email citext not null,
    role user_role not null,
    invited_by uuid references auth.users(id),
    invitation_token text unique not null,
    expires_at timestamptz not null,
    accepted_at timestamptz,
    created_at timestamptz default now()
);

-- ===========================
-- 8. TRIGGERS FOR AUDIT
-- ===========================
create or replace function fn_leads_audit() returns trigger as $$
begin
    if (tg_op = 'DELETE') then
        insert into leads_audit(workspace_id, lead_id, user_id, action, payload)
        values (old.workspace_id, old.id, auth.uid()::uuid, 'delete', to_jsonb(old));
        return old;
    elsif (tg_op = 'UPDATE') then
        insert into leads_audit(workspace_id, lead_id, user_id, action, payload)
        values (new.workspace_id, new.id, auth.uid()::uuid, 'update', 
                jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new)));
        new.updated_at = now();
        return new;
    elsif (tg_op = 'INSERT') then
        insert into leads_audit(workspace_id, lead_id, user_id, action, payload)
        values (new.workspace_id, new.id, auth.uid()::uuid, 'insert', to_jsonb(new));
        return new;
    end if;
    return null;
end;
$$ language plpgsql security definer;

create trigger trg_leads_audit
    after insert or update or delete on leads
    for each row execute function fn_leads_audit();

-- ===========================
-- 9. ENHANCED VIEWS FOR DASHBOARD
-- ===========================
create or replace view v_campaign_kpis as
select 
    c.id as campaign_id,
    c.name as campaign_name,
    c.workspace_id,
    count(l.id) as total_leads,
    count(l.id) filter (where l.status = 'nouveau') as nouveaux,
    count(l.id) filter (where l.status = 'contacte') as contactes,
    count(l.id) filter (where l.status = 'rdv') as rdv,
    count(l.id) filter (where l.status = 'gagne') as gagnes,
    count(l.id) filter (where l.status = 'perdu') as perdus,
    round(
        (count(l.id) filter (where l.status = 'gagne')::numeric / 
         nullif(count(l.id) filter (where l.status in ('gagne', 'perdu')), 0)) * 100, 2
    ) as conversion_rate
from campaigns c
left join leads l on c.id = l.campaign_id
group by c.id, c.name, c.workspace_id;

create or replace view v_agent_performance as
select 
    ur.user_id,
    ur.workspace_id,
    count(l.id) as total_leads,
    count(l.id) filter (where l.status = 'gagne') as leads_gagnes,
    count(l.id) filter (where l.created_at >= date_trunc('week', now())) as leads_semaine,
    avg(extract(days from (l.updated_at - l.created_at))) as avg_cycle_days
from user_roles ur
left join leads l on ur.user_id = l.assigned_to
where ur.role = 'agent'
group by ur.user_id, ur.workspace_id;

-- ===========================
-- 10. ROW LEVEL SECURITY POLICIES
-- ===========================

-- Enable RLS on all tables
alter table workspaces enable row level security;
alter table user_roles enable row level security;
alter table campaigns enable row level security;
alter table leads enable row level security;
alter table leads_audit enable row level security;
alter table user_invitations enable row level security;

-- Helper function to get user's workspace
create or replace function get_user_workspace_id() returns uuid as $$
declare
    workspace_id uuid;
begin
    select ur.workspace_id into workspace_id 
    from user_roles ur 
    where ur.user_id = auth.uid()::uuid and ur.is_active = true
    limit 1;
    return workspace_id;
end;
$$ language plpgsql stable security definer;

-- Helper function to get user's role
create or replace function get_user_role() returns user_role as $$
declare
    user_role_val user_role;
begin
    select ur.role into user_role_val 
    from user_roles ur 
    where ur.user_id = auth.uid()::uuid 
    and ur.workspace_id = get_user_workspace_id()
    and ur.is_active = true;
    return user_role_val;
end;
$$ language plpgsql stable security definer;

-- WORKSPACES policies
create policy "Users can only see their workspace"
    on workspaces for select
    using (id = get_user_workspace_id());

-- USER_ROLES policies
create policy "Users can see roles in their workspace"
    on user_roles for select
    using (workspace_id = get_user_workspace_id());

create policy "Admins and managers can manage roles"
    on user_roles for all
    using (workspace_id = get_user_workspace_id() and get_user_role() in ('admin', 'manager'));

-- CAMPAIGNS policies
create policy "Users can see campaigns in their workspace"
    on campaigns for select
    using (workspace_id = get_user_workspace_id());

create policy "Agents can only modify their own campaigns"
    on campaigns for all
    using (
        workspace_id = get_user_workspace_id() and
        (get_user_role() in ('admin', 'manager') or created_by = auth.uid()::uuid)
    );

-- LEADS policies
create policy "Users can see leads in their workspace"
    on leads for select
    using (workspace_id = get_user_workspace_id());

create policy "Agents can only modify their assigned leads"
    on leads for insert
    with check (
        workspace_id = get_user_workspace_id() and
        (get_user_role() in ('admin', 'manager') or assigned_to = auth.uid()::uuid)
    );

create policy "Agents can only update their assigned leads"
    on leads for update
    using (
        workspace_id = get_user_workspace_id() and
        (get_user_role() in ('admin', 'manager') or assigned_to = auth.uid()::uuid)
    );

create policy "Only admins and managers can delete leads"
    on leads for delete
    using (
        workspace_id = get_user_workspace_id() and
        get_user_role() in ('admin', 'manager')
    );

-- AUDIT policies
create policy "Users can see audit in their workspace"
    on leads_audit for select
    using (workspace_id = get_user_workspace_id() and get_user_role() in ('admin', 'manager'));

-- ===========================
-- 11. UTILITY FUNCTIONS
-- ===========================

-- Create workspace and admin user
create or replace function create_workspace(
    workspace_name text,
    workspace_slug text,
    admin_user_id uuid
) returns uuid as $$
declare
    new_workspace_id uuid;
begin
    -- Create workspace
    insert into workspaces (name, slug)
    values (workspace_name, workspace_slug)
    returning id into new_workspace_id;
    
    -- Add admin role
    insert into user_roles (user_id, workspace_id, role)
    values (admin_user_id, new_workspace_id, 'admin');
    
    return new_workspace_id;
end;
$$ language plpgsql security definer;

-- Invite user to workspace
create or replace function invite_user(
    p_workspace_id uuid,
    p_email text,
    p_role user_role,
    p_invited_by uuid
) returns text as $$
declare
    invitation_token text;
begin
    -- Generate unique token
    invitation_token := encode(gen_random_bytes(32), 'base64');
    
    -- Create invitation
    insert into user_invitations (
        workspace_id, email, role, invited_by, 
        invitation_token, expires_at
    ) values (
        p_workspace_id, p_email, p_role, p_invited_by,
        invitation_token, now() + interval '7 days'
    );
    
    return invitation_token;
end;
$$ language plpgsql security definer;

-- Accept invitation
create or replace function accept_invitation(
    p_token text,
    p_user_id uuid
) returns boolean as $$
declare
    invitation_record record;
begin
    -- Get invitation
    select * into invitation_record
    from user_invitations
    where invitation_token = p_token
    and expires_at > now()
    and accepted_at is null;
    
    if not found then
        return false;
    end if;
    
    -- Create user role
    insert into user_roles (user_id, workspace_id, role, invited_by)
    values (p_user_id, invitation_record.workspace_id, invitation_record.role, invitation_record.invited_by);
    
    -- Mark invitation as accepted
    update user_invitations
    set accepted_at = now()
    where id = invitation_record.id;
    
    return true;
end;
$$ language plpgsql security definer;

-- ===========================
-- 12. INDEXES FOR PERFORMANCE
-- ===========================
create index if not exists idx_user_roles_workspace on user_roles(workspace_id);
create index if not exists idx_user_roles_user on user_roles(user_id);
create index if not exists idx_campaigns_workspace on campaigns(workspace_id);
create index if not exists idx_leads_workspace on leads(workspace_id);
create index if not exists idx_leads_campaign on leads(campaign_id);
create index if not exists idx_leads_assigned on leads(assigned_to);
create index if not exists idx_leads_status on leads(status);
create index if not exists idx_leads_email on leads(lower(email));
create index if not exists idx_audit_workspace on leads_audit(workspace_id);
create index if not exists idx_invitations_token on user_invitations(invitation_token);

-- ===========================
-- 13. SAMPLE DATA (OPTIONAL)
-- ===========================
-- Uncomment and modify with your actual admin user UUID
/*
-- Create sample workspace
select create_workspace('Demo Company', 'demo-company', '<YOUR-ADMIN-UUID>');

-- Get the workspace ID for sample data
-- insert into campaigns (workspace_id, name, description, created_by)
-- select id, 'Campagne Q1 2024', 'Prospection premier trimestre', '<YOUR-ADMIN-UUID>'
-- from workspaces where slug = 'demo-company';
*/