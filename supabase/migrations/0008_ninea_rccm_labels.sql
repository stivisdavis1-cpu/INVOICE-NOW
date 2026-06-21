-- 1. Add ninea_label and rccm_label columns to settings
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS ninea_label text DEFAULT 'NINEA' NOT NULL,
ADD COLUMN IF NOT EXISTS rccm_label text DEFAULT 'RCCM' NOT NULL;
