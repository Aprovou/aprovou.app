/*
  # Verificar e corrigir posts de teste

  1. Verificação
    - Listar todos os posts da empresa Orda
    - Verificar status atual dos posts
    - Mostrar dados detalhados para debug

  2. Correção
    - Garantir que existem posts de teste
    - Definir status como 'pending' se necessário
    - Criar posts de teste se não existirem
*/

DO $$
DECLARE
    orda_company_id uuid;
    fabricio_user_id uuid;
    posts_count int;
    pending_posts_count int;
    post_record RECORD;
BEGIN
    -- Buscar IDs
    SELECT id INTO orda_company_id FROM companies WHERE name = 'Orda' LIMIT 1;
    SELECT id INTO fabricio_user_id FROM profiles WHERE email = 'fabricio@alpina.digital' LIMIT 1;
    
    RAISE NOTICE '=== DIAGNÓSTICO DE POSTS ===';
    RAISE NOTICE 'Company Orda ID: %', orda_company_id;
    RAISE NOTICE 'User fabricio ID: %', fabricio_user_id;
    
    -- Contar todos os posts da empresa
    SELECT COUNT(*) INTO posts_count 
    FROM posts 
    WHERE company_id = orda_company_id;
    
    RAISE NOTICE 'Total posts da empresa Orda: %', posts_count;
    
    -- Contar posts pendentes
    SELECT COUNT(*) INTO pending_posts_count 
    FROM posts 
    WHERE company_id = orda_company_id AND status = 'pending';
    
    RAISE NOTICE 'Posts com status pending: %', pending_posts_count;
    
    -- Listar todos os posts com detalhes
    RAISE NOTICE '=== DETALHES DOS POSTS ===';
    FOR post_record IN 
        SELECT id, title, status, created_at 
        FROM posts 
        WHERE company_id = orda_company_id 
        ORDER BY created_at DESC
    LOOP
        RAISE NOTICE 'Post: % | Status: % | Título: %', 
            post_record.id, post_record.status, post_record.title;
    END LOOP;
    
    -- Se não há posts pendentes, mas há posts, mudar status para pending
    IF posts_count > 0 AND pending_posts_count = 0 THEN
        RAISE NOTICE 'Alterando status de todos os posts para pending...';
        
        UPDATE posts 
        SET status = 'pending' 
        WHERE company_id = orda_company_id;
        
        GET DIAGNOSTICS posts_count = ROW_COUNT;
        RAISE NOTICE 'Posts atualizados para pending: %', posts_count;
    END IF;
    
    -- Se não há posts, criar alguns de teste
    IF posts_count = 0 THEN
        RAISE NOTICE 'Criando posts de teste...';
        
        INSERT INTO posts (
            company_id,
            user_id,
            title,
            content,
            platform,
            scheduled_for,
            status,
            type,
            media
        ) VALUES 
        (
            orda_company_id,
            fabricio_user_id,
            'Post de Teste 1',
            'Este é um post de teste para verificar o sistema de aprovação. #teste #aprovacao',
            'instagram',
            NOW() + INTERVAL '1 day',
            'pending',
            'image',
            '[{"url": "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg", "type": "image"}]'
        ),
        (
            orda_company_id,
            fabricio_user_id,
            'Post de Teste 2',
            'Segundo post de teste com conteúdo diferente. #teste #social',
            'linkedin',
            NOW() + INTERVAL '2 days',
            'pending',
            'image',
            '[{"url": "https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg", "type": "image"}]'
        );
        
        RAISE NOTICE 'Posts de teste criados com sucesso!';
    END IF;
    
    -- Verificação final
    SELECT COUNT(*) INTO pending_posts_count 
    FROM posts 
    WHERE company_id = orda_company_id AND status = 'pending';
    
    RAISE NOTICE '=== RESULTADO FINAL ===';
    RAISE NOTICE 'Posts pendentes após correção: %', pending_posts_count;
    
END $$;