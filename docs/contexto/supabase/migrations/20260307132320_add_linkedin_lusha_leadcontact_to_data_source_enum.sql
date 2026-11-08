-- Adiciona novos valores ao enum data_source
ALTER TYPE data_source ADD VALUE IF NOT EXISTS 'LINKEDIN';
ALTER TYPE data_source ADD VALUE IF NOT EXISTS 'LUSHA';
ALTER TYPE data_source ADD VALUE IF NOT EXISTS 'LEADCONTACT';
