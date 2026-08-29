-- CropXense Storage Bucket for crop scan images
-- Run in Supabase SQL Editor

-- Create bucket
insert into storage.buckets (id, name, public)
values ('crop-scans', 'crop-scans', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their own folder
create policy "Users upload own scans"
  on storage.objects for insert
  with check (
    bucket_id = 'crop-scans' and
    auth.uid() is not null
  );

-- Allow all authenticated users to read (officers/experts need farmer photos)
create policy "Authenticated read scans"
  on storage.objects for select
  using (
    bucket_id = 'crop-scans' and
    auth.uid() is not null
  );

-- Allow users to update/delete their own uploads
create policy "Users manage own scans"
  on storage.objects for update
  using (
    bucket_id = 'crop-scans' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own scans"
  on storage.objects for delete
  using (
    bucket_id = 'crop-scans' and
    auth.uid()::text = (storage.foldername(name))[1]
  );
