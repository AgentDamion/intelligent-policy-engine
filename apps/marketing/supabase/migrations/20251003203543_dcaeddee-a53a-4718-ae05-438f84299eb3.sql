-- Storage RLS for policy-requests folder in evidence bucket

-- DROP old conflicting policies if any
drop policy if exists "Agency members can upload policy-requests evidence" on storage.objects;
drop policy if exists "Agency members can read policy-requests evidence" on storage.objects;
drop policy if exists "Agency members can update policy-requests evidence" on storage.objects;
drop policy if exists "Agency members can delete policy-requests evidence" on storage.objects;

-- INSERT (upload)
create policy "Agency members can upload policy-requests evidence"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] = 'policy-requests'
    and exists (
      select 1 from public.workspace_members wm
      where wm.user_id = auth.uid()
        and wm.workspace_id = ((storage.foldername(name))[2])::uuid
    )
  );

-- SELECT (read)
create policy "Agency members can read policy-requests evidence"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] = 'policy-requests'
    and exists (
      select 1 from public.workspace_members wm
      where wm.user_id = auth.uid()
        and wm.workspace_id = ((storage.foldername(name))[2])::uuid
    )
  );

-- UPDATE (rename/metadata)
create policy "Agency members can update policy-requests evidence"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] = 'policy-requests'
    and exists (
      select 1 from public.workspace_members wm
      where wm.user_id = auth.uid()
        and wm.workspace_id = ((storage.foldername(name))[2])::uuid
    )
  )
  with check (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] = 'policy-requests'
    and exists (
      select 1 from public.workspace_members wm
      where wm.user_id = auth.uid()
        and wm.workspace_id = ((storage.foldername(name))[2])::uuid
    )
  );

-- DELETE
create policy "Agency members can delete policy-requests evidence"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] = 'policy-requests'
    and exists (
      select 1 from public.workspace_members wm
      where wm.user_id = auth.uid()
        and wm.workspace_id = ((storage.foldername(name))[2])::uuid
    )
  );