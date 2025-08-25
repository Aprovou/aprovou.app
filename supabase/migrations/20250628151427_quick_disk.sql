/*
  # Adicionar suporte a áudio no feedback de posts

  1. Modificações na tabela post_feedback
    - Adicionar coluna audio_url para armazenar URL do áudio
    - Adicionar coluna audio_duration para duração em segundos
    - Manter compatibilidade com dados existentes

  2. Segurança
    - Manter políticas RLS existentes
    - Permitir inserção e leitura de áudios

  3. Índices
    - Adicionar índice para consultas por post_id
*/

-- Verificar se as colunas já existem antes de adicionar
DO $$
BEGIN
  -- Adicionar coluna audio_url se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'post_feedback' AND column_name = 'audio_url'
  ) THEN
    ALTER TABLE post_feedback ADD COLUMN audio_url text;
  END IF;

  -- Adicionar coluna audio_duration se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'post_feedback' AND column_name = 'audio_duration'
  ) THEN
    ALTER TABLE post_feedback ADD COLUMN audio_duration integer;
  END IF;
END $$;

-- Criar índice para melhor performance nas consultas de feedback por post
CREATE INDEX IF NOT EXISTS idx_post_feedback_post_id_created 
ON post_feedback (post_id, created_at DESC);

-- Atualizar a função de trigger se existir
CREATE OR REPLACE FUNCTION update_post_last_interaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts 
  SET last_interaction_at = NOW()
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;