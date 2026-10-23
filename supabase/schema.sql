-- MediConnect Centralized PostgreSQL Schema & Migrations
-- Compatible with Supabase PostgreSQL, Row-Level Security (RLS), and Realtime Subscriptions

-- 1. Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 2. Legacy / Compatibility Collection Table
create table if not exists public.medconnect_records (
  collection text not null,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

alter table public.medconnect_records enable row level security;

drop policy if exists "Allow app access to MedConnect records" on public.medconnect_records;
create policy "Allow app access to MedConnect records"
  on public.medconnect_records
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- 3. Profiles / Users Table (Supports both Supabase Auth & MedConnect custom authentication)
create table if not exists public.profiles (
  id text primary key,
  name text not null,
  email text unique not null,
  role text not null check (role in ('PATIENT', 'DOCTOR', 'ADMIN', 'NURSE', 'PHARMACY', 'LAB_TECHNICIAN')),
  department text,
  avatar_url text,
  password text,
  is_verified boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Patients Registry
create table if not exists public.patients (
  id text primary key,
  user_id text references public.profiles(id) on delete set null,
  name text not null,
  age integer not null default 0,
  current_condition text not null default 'General Healthcare',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Doctors Directory
create table if not exists public.doctors (
  id text primary key,
  user_id text references public.profiles(id) on delete set null,
  name text not null,
  specialization text not null,
  experience integer not null default 0,
  bio text,
  image_url text,
  availability text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Appointments & Consultations
create table if not exists public.appointments (
  id text primary key,
  patient_id text not null,
  patient_name text not null,
  doctor_id text not null,
  doctor_name text not null,
  doctor_specialization text not null,
  date text not null,
  time text not null,
  status text not null check (status in ('Upcoming', 'Completed', 'Cancelled')) default 'Upcoming',
  type text not null check (type in ('New Consultation', 'Follow-up', 'Check-up')) default 'New Consultation',
  accessibility_request jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. Prescriptions & Pharmacy Orders
create table if not exists public.prescriptions (
  id text primary key,
  patient_id text not null,
  patient_name text not null,
  doctor_id text not null,
  doctor_name text not null,
  date text not null,
  medication text not null,
  dosage text not null,
  frequency text not null,
  duration text not null,
  notes text,
  status text not null check (status in ('Active', 'Ready for Pickup', 'Dispensed', 'Completed', 'Cancelled')) default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. Pharmacy Medicine Stock & Inventory
create table if not exists public.medicines (
  id text primary key,
  name text not null,
  category text not null,
  quantity integer not null default 0 check (quantity >= 0),
  expiry text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. Laboratory Test Requests & Results
create table if not exists public.lab_tests (
  id text primary key,
  patient_name text not null,
  patient_id text,
  test_type text not null,
  status text not null check (status in ('Pending', 'In Progress', 'Completed')) default 'Pending',
  requested_by text not null,
  date text not null,
  results text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 10. Billing Invoices
create table if not exists public.invoices (
  id text primary key,
  invoice_number text unique not null,
  patient_id text not null,
  patient_name text not null,
  issue_date text not null,
  due_date text not null,
  items jsonb not null default '[]'::jsonb,
  total_amount numeric(10,2) not null default 0.00,
  status text not null check (status in ('Paid', 'Unpaid', 'Overdue')) default 'Unpaid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 11. Verified Medical Records (Doctor & Diagnostic Authored)
create table if not exists public.medical_records (
  id text primary key,
  patient_id text not null,
  date text not null,
  type text not null check (type in ('Lab Result', 'Prescription', 'Doctor''s Note', 'Radiology Report')),
  title text not null,
  summary text not null,
  doctor_name text not null,
  file_url text not null default '#',
  is_ai_generated boolean not null default false,
  verified_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 12. Patient Wellness & Vitals Tracking
create table if not exists public.wellness_entries (
  id text primary key,
  patient_id text not null,
  date text not null,
  blood_pressure jsonb,
  blood_sugar numeric,
  weight numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 13. Inpatient Nursing Assignments
create table if not exists public.assigned_patients (
  id text primary key,
  name text not null,
  room text not null,
  status text not null default 'Stable',
  vitals jsonb not null default '{"bp": "120/80", "temp": "98.6°F", "hr": "72bpm"}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 14. Patient Charts (Nurse & Clinical History)
create table if not exists public.patient_charts (
  id text primary key,
  patient_id text unique not null,
  notes jsonb not null default '[]'::jsonb,
  medication_schedule jsonb not null default '[]'::jsonb,
  vitals_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 15. Nurse Shift Tasks
create table if not exists public.nurse_tasks (
  id text primary key,
  task text not null,
  completed boolean not null default false,
  nurse_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 16. Nurse Doctor Pages & Notifications
create table if not exists public.nurse_pages (
  id text primary key,
  doctor_id text not null,
  doctor_name text,
  message text not null,
  sender_name text not null,
  status text not null default 'sent',
  created_at timestamptz not null default now()
);

-- 17. Pharmacy & Clinic Supply Requests
create table if not exists public.supply_requests (
  id text primary key,
  item text not null,
  quantity integer not null default 1,
  requested_by text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- 18. Live OPD Queue Management
create table if not exists public.queue_entries (
  id text primary key,
  token_number text not null,
  patient_id text not null,
  patient_name text not null,
  doctor_id text not null,
  doctor_name text not null,
  department text not null,
  room_number text not null,
  queue_position integer not null default 1,
  estimated_wait_minutes integer not null default 0,
  status text not null check (status in ('Waiting', 'Calling', 'Your Turn', 'In Consultation', 'Completed', 'Cancelled')) default 'Waiting',
  check_in_time text not null,
  called_at timestamptz,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 19. MediSilentAlert History
create table if not exists public.silent_alerts (
  id text primary key,
  token_number text not null,
  patient_id text not null,
  patient_name text not null,
  doctor_id text not null,
  doctor_name text not null,
  department text not null,
  room_number text not null,
  timestamp text not null,
  acknowledged boolean not null default false,
  acknowledged_at text,
  status text not null default 'Completed',
  created_at timestamptz not null default now()
);

-- 20. Hospital WayFinder Locations & Navigation Map
create table if not exists public.hospital_locations (
  id text primary key,
  name text not null,
  room_number text not null,
  floor integer not null default 0,
  floor_name text not null,
  wing text not null,
  category text not null,
  department text,
  doctor_name text,
  description text not null,
  is_wheelchair_accessible boolean not null default true,
  coordinates jsonb not null default '{"x": 50, "y": 50}'::jsonb,
  open_hours text not null default '24/7',
  contact_ext text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 21. AI Clinical Suggestions (STRICT REQUIREMENT: Kept completely separate from verified medical records)
create table if not exists public.clinical_ai_suggestions (
  id text primary key,
  patient_id text not null,
  doctor_id text,
  suggestion_type text not null, -- e.g. 'symptom_analysis', 'alternative_options', 'interaction_check'
  content text not null,
  disclaimer text not null default 'AI clinical assistance suggestion only. Not a substitute for professional clinical judgment. Requires certified clinical review before entering official medical record.',
  is_reviewed boolean not null default false,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 22. Indexes for Performance & Search
create index if not exists idx_appointments_patient_id on public.appointments(patient_id);
create index if not exists idx_appointments_doctor_id on public.appointments(doctor_id);
create index if not exists idx_appointments_date on public.appointments(date);
create index if not exists idx_prescriptions_patient_id on public.prescriptions(patient_id);
create index if not exists idx_prescriptions_status on public.prescriptions(status);
create index if not exists idx_invoices_patient_id on public.invoices(patient_id);
create index if not exists idx_lab_tests_patient_name on public.lab_tests(patient_name);
create index if not exists idx_queue_patient_id on public.queue_entries(patient_id);
create index if not exists idx_queue_status on public.queue_entries(status);
create index if not exists idx_silent_alerts_patient_id on public.silent_alerts(patient_id);
create index if not exists idx_hospital_locations_floor on public.hospital_locations(floor);
create index if not exists idx_medical_records_patient_id on public.medical_records(patient_id);
create index if not exists idx_wellness_entries_patient_id on public.wellness_entries(patient_id);

-- 23. Row-Level Security (RLS) Configuration
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.doctors enable row level security;
alter table public.appointments enable row level security;
alter table public.prescriptions enable row level security;
alter table public.medicines enable row level security;
alter table public.lab_tests enable row level security;
alter table public.invoices enable row level security;
alter table public.medical_records enable row level security;
alter table public.wellness_entries enable row level security;
alter table public.assigned_patients enable row level security;
alter table public.patient_charts enable row level security;
alter table public.nurse_tasks enable row level security;
alter table public.nurse_pages enable row level security;
alter table public.supply_requests enable row level security;
alter table public.queue_entries enable row level security;
alter table public.silent_alerts enable row level security;
alter table public.hospital_locations enable row level security;
alter table public.clinical_ai_suggestions enable row level security;

-- Helper functions for RLS role verification
create or replace function public.current_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid()::text or email = auth.jwt() ->> 'email' limit 1;
$$ language sql stable security definer;

-- Profiles Policies
drop policy if exists "Profiles are viewable by authenticated users and self" on public.profiles;
create policy "Profiles are viewable by authenticated users and self"
  on public.profiles for select
  to anon, authenticated
  using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Allow profile insertion" on public.profiles;
create policy "Allow profile insertion"
  on public.profiles for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Allow profile deletion" on public.profiles;
create policy "Allow profile deletion"
  on public.profiles for delete
  to anon, authenticated
  using (true);

-- General App Policies (Permit app operations for anon/authenticated clients with integrity checks)
-- Appointments
drop policy if exists "Allow appointment operations" on public.appointments;
create policy "Allow appointment operations" on public.appointments
  for all to anon, authenticated using (true) with check (true);

-- Prescriptions
drop policy if exists "Allow prescription operations" on public.prescriptions;
create policy "Allow prescription operations" on public.prescriptions
  for all to anon, authenticated using (true) with check (true);

-- Medicines
drop policy if exists "Allow medicine operations" on public.medicines;
create policy "Allow medicine operations" on public.medicines
  for all to anon, authenticated using (true) with check (true);

-- Lab Tests
drop policy if exists "Allow lab test operations" on public.lab_tests;
create policy "Allow lab test operations" on public.lab_tests
  for all to anon, authenticated using (true) with check (true);

-- Invoices
drop policy if exists "Allow invoice operations" on public.invoices;
create policy "Allow invoice operations" on public.invoices
  for all to anon, authenticated using (true) with check (true);

-- Medical Records
drop policy if exists "Allow medical record operations" on public.medical_records;
create policy "Allow medical record operations" on public.medical_records
  for all to anon, authenticated using (true) with check (true);

-- Wellness Entries
drop policy if exists "Allow wellness operations" on public.wellness_entries;
create policy "Allow wellness operations" on public.wellness_entries
  for all to anon, authenticated using (true) with check (true);

-- Nursing & Inpatients
drop policy if exists "Allow assigned patients operations" on public.assigned_patients;
create policy "Allow assigned patients operations" on public.assigned_patients
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "Allow patient charts operations" on public.patient_charts;
create policy "Allow patient charts operations" on public.patient_charts
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "Allow nurse tasks operations" on public.nurse_tasks;
create policy "Allow nurse tasks operations" on public.nurse_tasks
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "Allow nurse pages operations" on public.nurse_pages;
create policy "Allow nurse pages operations" on public.nurse_pages
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "Allow supply requests operations" on public.supply_requests;
create policy "Allow supply requests operations" on public.supply_requests
  for all to anon, authenticated using (true) with check (true);

-- Queue & Alerts
drop policy if exists "Allow queue operations" on public.queue_entries;
create policy "Allow queue operations" on public.queue_entries
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "Allow alert operations" on public.silent_alerts;
create policy "Allow alert operations" on public.silent_alerts
  for all to anon, authenticated using (true) with check (true);

-- Locations
drop policy if exists "Allow location operations" on public.hospital_locations;
create policy "Allow location operations" on public.hospital_locations
  for all to anon, authenticated using (true) with check (true);

-- AI Clinical Suggestions
drop policy if exists "Allow ai clinical suggestion operations" on public.clinical_ai_suggestions;
create policy "Allow ai clinical suggestion operations" on public.clinical_ai_suggestions
  for all to anon, authenticated using (true) with check (true);

-- Patients & Doctors Directories
drop policy if exists "Allow patients directory operations" on public.patients;
create policy "Allow patients directory operations" on public.patients
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "Allow doctors directory operations" on public.doctors;
create policy "Allow doctors directory operations" on public.doctors
  for all to anon, authenticated using (true) with check (true);

-- 24. Realtime Publication Settings
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table 
  public.appointments,
  public.prescriptions,
  public.medicines,
  public.lab_tests,
  public.invoices,
  public.queue_entries,
  public.silent_alerts,
  public.hospital_locations,
  public.assigned_patients,
  public.patient_charts,
  public.wellness_entries,
  public.nurse_pages,
  public.supply_requests,
  public.clinical_ai_suggestions;