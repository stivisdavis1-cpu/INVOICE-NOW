-- Migration: Add alerts jsonb column to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS alerts jsonb;
