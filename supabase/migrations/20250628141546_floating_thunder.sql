/*
  # Criar tabela post_history para rastreamento de ações

  1. Nova Tabela
    - `post_history`
      - `id` (uuid, primary key)
      - `post_id` (uuid, foreign key para posts)
      - `user_id` (uuid, foreign key para profiles)
      - `action` (text, 'approved' ou 'rejected')
      - `comment` (text, opcional)
      - `created_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `post_history`
    - Adicionar políticas para usuários autenticados

  3. Verificações
    - Garantir que as tabelas necessárias existem
    - Verificar se o usuário fabricio@alpina.digital está vinculado à empresa Orda
*/

-- Criar tabela post_history se não existir
CREATE TABLE IF NOT EXISTS post_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('approved', 'rejected')),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Adicionar foreign keys
DO $$
BEGIN
  -- Adicionar FK para posts se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'post_history_post_id_fkey'
  ) THEN
    ALTER TABLE post_history 
    ADD CONSTRAINT post_history_post_id_fkey 
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;
  END IF;

  -- Adicionar FK para profiles se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'post_history_user_id_fkey'
  ) THEN
    ALTER TABLE post_history 
    ADD CONSTRAINT post_history_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE post_history ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can read all post history"
  ON post_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert post history"
  ON post_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Verificar e corrigir dados do usuário fabricio@alpina.digital
DO $$
DECLARE
    orda_company_id uuid;
    fabricio_user_id uuid;
    existing_rep_count int;
BEGIN
    -- Buscar empresa Orda
    SELECT id INTO orda_company_id FROM companies WHERE name = 'Orda' LIMIT 1;
    
    -- Buscar usuário fabricio
    SELECT id INTO fabricio_user_id FROM profiles WHERE email = 'fabricio@alpina.digital' LIMIT 1;
    
    -- Log dos IDs encontrados
    RAISE NOTICE 'Company Orda ID: %', orda_company_id;
    RAISE NOTICE 'User fabricio ID: %', fabricio_user_id;
    
    -- Se ambos existem, garantir vinculação
    IF orda_company_id IS NOT NULL AND fabricio_user_id IS NOT NULL THEN
        -- Verificar se já existe vinculação
        SELECT COUNT(*) INTO existing_rep_count 
        FROM company_representatives 
        WHERE company_id = orda_company_id AND profile_id = fabricio_user_id;
        
        RAISE NOTICE 'Existing representatives count: %', existing_rep_count;
        
        -- Se não existe, criar vinculação
        IF existing_rep_count = 0 THEN
            INSERT INTO company_representatives (company_id, profile_id, email)
            VALUES (orda_company_id, fabricio_user_id, 'fabricio@alpina.digital');
            RAISE NOTICE 'Created company representative link';
        ELSE
            RAISE NOTICE 'Company representative link already exists';
        END IF;
        
        -- Verificar posts existentes
        DECLARE
            posts_count int;
        BEGIN
            SELECT COUNT(*) INTO posts_count 
            FROM posts 
            WHERE company_id = orda_company_id;
            
            RAISE NOTICE 'Posts count for company: %', posts_count;
        END;
    ELSE
        RAISE NOTICE 'Missing company or user data';
    END IF;
END $$;