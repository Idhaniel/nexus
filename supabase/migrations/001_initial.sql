-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users (managed by Supabase Auth, extend with profile)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text check (role in ('policymaker', 'researcher', 'student', 'admin')) default 'researcher',
  organization text,
  created_at timestamptz default now()
);

-- Scenarios table
create table public.scenarios (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  type text check (type in ('baseline', 'efficiency', 'production_expansion', 'renewable_transition', 'custom')) not null,
  status text check (status in ('draft', 'running', 'completed', 'failed')) default 'draft',
  parameters jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Scenario run results
create table public.scenario_results (
  id uuid primary key default uuid_generate_v4(),
  scenario_id uuid references public.scenarios(id) on delete cascade,
  run_number integer not null default 1,
  water_use_index numeric not null,
  energy_use_index numeric not null,
  food_output_index numeric not null,
  water_use_absolute numeric,
  energy_use_absolute numeric,
  food_output_absolute numeric,
  water_use_lower numeric,
  water_use_upper numeric,
  energy_use_lower numeric,
  energy_use_upper numeric,
  food_output_lower numeric,
  food_output_upper numeric,
  timeline_data jsonb,
  sensitivity_data jsonb,
  model_version text default '1.0.0',
  execution_time_ms integer,
  input_hash text,
  output_hash text,
  created_at timestamptz default now()
);

-- Blockchain provenance records
create table public.provenance_records (
  id uuid primary key default uuid_generate_v4(),
  scenario_id uuid references public.scenarios(id) on delete cascade,
  result_id uuid references public.scenario_results(id) on delete cascade,
  input_hash text not null,
  output_hash text not null,
  parameters_hash text not null,
  model_version_hash text not null,
  combined_hash text not null,
  transaction_hash text,
  block_number bigint,
  block_timestamp timestamptz,
  contract_address text,
  network_name text default 'polygon-amoy',
  on_chain_record_id bigint,
  verification_status text check (verification_status in ('pending', 'confirmed', 'failed')) default 'pending',
  created_at timestamptz default now()
);

-- Sensitivity analysis parameter importance
create table public.sensitivity_analyses (
  id uuid primary key default uuid_generate_v4(),
  result_id uuid references public.scenario_results(id) on delete cascade,
  parameter_name text not null,
  impact_on_water numeric,
  impact_on_energy numeric,
  impact_on_food numeric,
  overall_sensitivity numeric,
  created_at timestamptz default now()
);

-- Row-level security
alter table public.profiles enable row level security;
alter table public.scenarios enable row level security;
alter table public.scenario_results enable row level security;
alter table public.provenance_records enable row level security;
alter table public.sensitivity_analyses enable row level security;

-- RLS Policies
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users can view all scenarios" on public.scenarios for select using (true);
create policy "Users can create scenarios" on public.scenarios for insert with check (auth.uid() = user_id);
create policy "Users can update own scenarios" on public.scenarios for update using (auth.uid() = user_id);
create policy "Users can delete own scenarios" on public.scenarios for delete using (auth.uid() = user_id);

create policy "Anyone can view results" on public.scenario_results for select using (true);
create policy "Anyone can view provenance" on public.provenance_records for select using (true);
create policy "Anyone can view sensitivity" on public.sensitivity_analyses for select using (true);

-- Service role / API routes need insert on scenario_results, provenance, sensitivity — use service role client (bypasses RLS)

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
