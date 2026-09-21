-- Permite crear un medley y devolver su ID en el mismo INSERT.
-- La política anterior llamaba private.can_view_medley(id), cuya consulta no
-- veía la fila recién insertada durante INSERT ... RETURNING.

drop policy if exists "Users can insert own medleys" on public.medleys;
create policy "Users can insert own medleys"
on public.medleys
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (
    group_id is null
    or exists (
      select 1
      from public.groups g
      where g.id = medleys.group_id
        and g.leader_id = (select auth.uid())
    )
  )
);

drop policy if exists "Members can view accessible medleys" on public.medleys;
create policy "Members can view accessible medleys"
on public.medleys
for select
to authenticated
using (
  user_id = (select auth.uid())
  or lead_user_id = (select auth.uid())
  or (
    group_id is not null
    and (
      exists (
        select 1
        from public.groups g
        where g.id = medleys.group_id
          and g.leader_id = (select auth.uid())
      )
      or exists (
        select 1
        from public.group_members gm
        where gm.group_id = medleys.group_id
          and gm.user_id = (select auth.uid())
      )
    )
  )
);
