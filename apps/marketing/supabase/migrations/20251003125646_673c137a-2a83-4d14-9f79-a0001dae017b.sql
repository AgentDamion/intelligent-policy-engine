-- RLS policies for evidence bucket uploads scoped by workspace folder
begin;

create policy "Evidence: workspace members can upload"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] is not null
    and ((storage.foldername(name))[1])::uuid = any (public.get_user_workspaces(auth.uid()))
  );

create policy "Evidence: workspace members can read"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] is not null
    and ((storage.foldername(name))[1])::uuid = any (public.get_user_workspaces(auth.uid()))
  );

create policy "Evidence: workspace members can update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] is not null
    and ((storage.foldername(name))[1])::uuid = any (public.get_user_workspaces(auth.uid()))
  )
  with check (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] is not null
    and ((storage.foldername(name))[1])::uuid = any (public.get_user_workspaces(auth.uid()))
  );

create policy "Evidence: workspace members can delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] is not null
    and ((storage.foldername(name))[1])::uuid = any (public.get_user_workspaces(auth.uid()))
  );

commit;