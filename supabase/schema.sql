-- quran_progress table
create table public.quran_progress (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    surah_number integer not null,
    ayah_number integer not null,
    best_score integer default 0,
    attempts integer default 0,
    last_practiced_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    unique(user_id, surah_number, ayah_number)
);

-- RLS Policies
alter table public.quran_progress enable row level security;

create policy "Users can view their own quran progress"
    on public.quran_progress for select
    using ( auth.uid() = user_id );

create policy "Users can insert their own quran progress"
    on public.quran_progress for insert
    with check ( auth.uid() = user_id );

create policy "Users can update their own quran progress"
    on public.quran_progress for update
    using ( auth.uid() = user_id );
