-- Agregar campo service_time a group_services
ALTER TABLE group_services ADD COLUMN IF NOT EXISTS service_time text;
