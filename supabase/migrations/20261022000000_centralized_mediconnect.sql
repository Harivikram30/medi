-- Migration: 20261022000000_centralized_mediconnect.sql
-- Description: Centralizes entire MediConnect hospital management system onto Supabase PostgreSQL

-- Combine schema creation and baseline seeds
\ir ../schema.sql
\ir ../seed.sql
