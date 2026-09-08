-- PreceptorIA · Esquema inicial para Supabase
-- Ejecutar en SQL Editor del proyecto.

create extension if not exists pgcrypto;

create table if not exists public.instituciones (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  ciclo text default '2026',
  preceptor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.estudiantes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  institucion_id uuid references public.instituciones(id) on delete cascade,
  apellido text not null,
  nombre text not null,
  dni text,
  curso text not null,
  division text not null,
  turno text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asistencia (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  estudiante_id uuid not null references public.estudiantes(id) on delete cascade,
  fecha date not null,
  estado text not null check (estado in ('presente','ausente','tarde')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(estudiante_id, fecha)
);

create table if not exists public.registros (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  institucion_id uuid references public.instituciones(id) on delete cascade,
  estudiante_id uuid references public.estudiantes(id) on delete set null,
  fecha date not null default current_date,
  tipo text not null check (tipo in ('novedad','justificacion','convivencia','familia')),
  detalle text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.instituciones enable row level security;
alter table public.estudiantes enable row level security;
alter table public.asistencia enable row level security;
alter table public.registros enable row level security;

create policy "instituciones_propias" on public.instituciones
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "estudiantes_propios" on public.estudiantes
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "asistencia_propia" on public.asistencia
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "registros_propios" on public.registros
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create index if not exists idx_estudiantes_owner on public.estudiantes(owner_id);
create index if not exists idx_asistencia_owner_fecha on public.asistencia(owner_id, fecha);
create index if not exists idx_registros_owner_tipo on public.registros(owner_id, tipo);
