-- Phase 1 Part A: Add new enum values first
do $$ 
begin
  if not exists (select 1 from pg_enum e join pg_type t on e.enumtypid = t.oid where t.typname = 'app_role' and e.enumlabel = 'compliance_officer') then
    alter type app_role add value 'compliance_officer';
  end if;
  
  if not exists (select 1 from pg_enum e join pg_type t on e.enumtypid = t.oid where t.typname = 'app_role' and e.enumlabel = 'audit_viewer') then
    alter type app_role add value 'audit_viewer';
  end if;
end $$;