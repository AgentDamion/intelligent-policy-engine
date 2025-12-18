-- Update handle_new_user trigger to use account_type from metadata if provided
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, first_name, last_name, account_type)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    (new.raw_user_meta_data ->> 'account_type')::account_type -- use account_type from metadata if provided
  );
  return new;
end;
$function$;