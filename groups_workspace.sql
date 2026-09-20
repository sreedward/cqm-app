-- CQM · espacio de trabajo para servicios y recursos del grupo
-- Seguro para ejecutar más de una vez.

alter table public.group_services
  add column if not exists arrival_time text,
  add column if not exists location text,
  add column if not exists rehearsal_date date,
  add column if not exists rehearsal_time text,
  add column if not exists dress_code text,
  add column if not exists leader_note text,
  add column if not exists schedule jsonb not null default '[]'::jsonb;

create table if not exists public.group_resources (
  id bigint generated always as identity primary key,
  group_id bigint not null references public.groups(id) on delete cascade,
  service_id bigint references public.group_services(id) on delete cascade,
  kind text not null check (kind in ('link', 'pdf', 'audio', 'note')),
  title text not null check (char_length(title) between 1 and 140),
  external_url text,
  storage_path text,
  body text,
  file_name text,
  mime_type text,
  file_size bigint check (file_size is null or file_size >= 0),
  audience_roles text[] not null default '{}'::text[],
  notify_team boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint group_resources_payload_check check (
    (kind = 'link' and external_url is not null)
    or (kind in ('pdf', 'audio') and storage_path is not null)
    or (kind = 'note' and body is not null)
  )
);

create index if not exists group_resources_group_idx
  on public.group_resources(group_id, created_at desc);
create index if not exists group_resources_service_idx
  on public.group_resources(service_id, created_at desc)
  where service_id is not null;
create index if not exists group_resources_created_by_idx
  on public.group_resources(created_by);

alter table public.group_resources enable row level security;

drop policy if exists "Miembros ven recursos permitidos" on public.group_resources;
create policy "Miembros ven recursos permitidos"
on public.group_resources for select
to authenticated
using (
  exists (
    select 1
    from public.groups g
    where g.id = group_resources.group_id
      and g.leader_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.group_members gm
    where gm.group_id = group_resources.group_id
      and gm.user_id = (select auth.uid())
      and (
        cardinality(group_resources.audience_roles) = 0
        or gm.roles && group_resources.audience_roles
        or exists (
          select 1 from public.service_members sm
          where sm.service_id = group_resources.service_id
            and sm.user_id = (select auth.uid())
            and sm.instrument = any(group_resources.audience_roles)
        )
      )
  )
);

drop policy if exists "Lider crea recursos" on public.group_resources;
create policy "Lider crea recursos"
on public.group_resources for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.groups g
    where g.id = group_resources.group_id
      and g.leader_id = (select auth.uid())
  )
  and (
    service_id is null
    or exists (
      select 1 from public.group_services gs
      where gs.id = group_resources.service_id
        and gs.group_id = group_resources.group_id
    )
  )
);

drop policy if exists "Lider actualiza recursos" on public.group_resources;
create policy "Lider actualiza recursos"
on public.group_resources for update
to authenticated
using (
  exists (
    select 1 from public.groups g
    where g.id = group_resources.group_id
      and g.leader_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.groups g
    where g.id = group_resources.group_id
      and g.leader_id = (select auth.uid())
  )
);

drop policy if exists "Lider elimina recursos" on public.group_resources;
create policy "Lider elimina recursos"
on public.group_resources for delete
to authenticated
using (
  exists (
    select 1 from public.groups g
    where g.id = group_resources.group_id
      and g.leader_id = (select auth.uid())
  )
);

grant select, insert, update, delete on public.group_resources to authenticated;
grant usage, select on sequence public.group_resources_id_seq to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'group-resources',
  'group-resources',
  false,
  26214400,
  array['application/pdf', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/x-wav']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Miembros descargan recursos del grupo" on storage.objects;
create policy "Miembros descargan recursos del grupo"
on storage.objects for select
to authenticated
using (
  bucket_id = 'group-resources'
  and exists (
    select 1
    from public.group_resources r
    join public.groups g on g.id = r.group_id
    left join public.group_members gm
      on gm.group_id = r.group_id and gm.user_id = (select auth.uid())
    where r.storage_path = storage.objects.name
      and (g.leader_id = (select auth.uid()) or gm.user_id is not null)
      and (
        g.leader_id = (select auth.uid())
        or cardinality(r.audience_roles) = 0
        or gm.roles && r.audience_roles
        or exists (
          select 1 from public.service_members sm
          where sm.service_id = r.service_id
            and sm.user_id = (select auth.uid())
            and sm.instrument = any(r.audience_roles)
        )
      )
  )
);

drop policy if exists "Lider sube recursos del grupo" on storage.objects;
create policy "Lider sube recursos del grupo"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'group-resources'
  and split_part(name, '/', 3) = (select auth.uid())::text
  and exists (
    select 1 from public.groups g
    where g.id::text = split_part(name, '/', 1)
      and g.leader_id = (select auth.uid())
  )
);

drop policy if exists "Lider elimina recursos del grupo" on storage.objects;
create policy "Lider elimina recursos del grupo"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'group-resources'
  and exists (
    select 1 from public.groups g
    where g.id::text = split_part(name, '/', 1)
      and g.leader_id = (select auth.uid())
  )
);
