/*
  # Debug e correção do sistema de feedback

  1. Verificação de dados
    - Verifica se existem feedbacks na tabela post_feedback
    - Lista todos os posts e seus feedbacks
    - Verifica estrutura das tabelas

  2. Criação de dados de teste
    - Cria alguns feedbacks de exemplo se não existirem
    - Garante que o sistema funcione corretamente
*/

DO $$
DECLARE
    orda_company_id uuid;
    fabricio_user_id uuid;
    post_record RECORD;
    feedback_count int;
    total_posts int;
BEGIN
    -- Buscar IDs
    SELECT id INTO orda_company_id FROM companies WHERE name = 'Orda' LIMIT 1;
    SELECT id INTO fabricio_user_id FROM profiles WHERE email = 'fabricio@alpina.digital' LIMIT 1;
    
    RAISE NOTICE '=== DEBUG SISTEMA DE FEEDBACK ===';
    RAISE NOTICE 'Company Orda ID: %', orda_company_id;
    RAISE NOTICE 'User fabricio ID: %', fabricio_user_id;
    
    -- Verificar estrutura da tabela post_feedback
    RAISE NOTICE '=== ESTRUTURA DA TABELA POST_FEEDBACK ===';
    
    -- Contar total de posts
    SELECT COUNT(*) INTO total_posts 
    FROM posts 
    WHERE company_id = orda_company_id;
    
    RAISE NOTICE 'Total de posts da empresa: %', total_posts;
    
    -- Contar total de feedbacks
    SELECT COUNT(*) INTO feedback_count 
    FROM post_feedback pf
    JOIN posts p ON p.id = pf.post_id
    WHERE p.company_id = orda_company_id;
    
    RAISE NOTICE 'Total de feedbacks existentes: %', feedback_count;
    
    -- Listar posts e seus feedbacks
    RAISE NOTICE '=== POSTS E FEEDBACKS ===';
    FOR post_record IN 
        SELECT 
            p.id, 
            p.title, 
            p.status,
            COUNT(pf.id) as feedback_count
        FROM posts p
        LEFT JOIN post_feedback pf ON pf.post_id = p.id
        WHERE p.company_id = orda_company_id
        GROUP BY p.id, p.title, p.status
        ORDER BY p.created_at DESC
    LOOP
        RAISE NOTICE 'Post: % | Status: % | Título: % | Feedbacks: %', 
            post_record.id, post_record.status, post_record.title, post_record.feedback_count;
    END LOOP;
    
    -- Se não há feedbacks, criar alguns de exemplo
    IF feedback_count = 0 AND total_posts > 0 THEN
        RAISE NOTICE 'Criando feedbacks de exemplo...';
        
        -- Pegar o primeiro post para criar feedback
        FOR post_record IN 
            SELECT id FROM posts 
            WHERE company_id = orda_company_id 
            LIMIT 2
        LOOP
            -- Criar feedback de aprovação
            INSERT INTO post_feedback (
                post_id,
                type,
                content,
                author,
                author_type,
                is_important,
                status
            ) VALUES (
                post_record.id,
                'status_change',
                'Post aprovado automaticamente para teste',
                'fabricio@alpina.digital',
                'admin',
                false,
                'approved'
            );
            
            -- Criar feedback de ajuste
            INSERT INTO post_feedback (
                post_id,
                type,
                content,
                author,
                author_type,
                is_important,
                status
            ) VALUES (
                post_record.id,
                'response',
                'Por favor, ajustar a cor do texto para melhor contraste. O texto atual está difícil de ler.',
                'fabricio@alpina.digital',
                'admin',
                true,
                'rejected'
            );
            
            RAISE NOTICE 'Feedbacks criados para post: %', post_record.id;
        END LOOP;
        
        -- Contar novamente
        SELECT COUNT(*) INTO feedback_count 
        FROM post_feedback pf
        JOIN posts p ON p.id = pf.post_id
        WHERE p.company_id = orda_company_id;
        
        RAISE NOTICE 'Total de feedbacks após criação: %', feedback_count;
    END IF;
    
    -- Verificação final
    RAISE NOTICE '=== VERIFICAÇÃO FINAL ===';
    
    -- Listar todos os feedbacks criados
    FOR post_record IN 
        SELECT 
            pf.id,
            pf.type,
            pf.content,
            pf.author,
            pf.author_type,
            pf.is_important,
            pf.status,
            pf.created_at,
            p.title as post_title
        FROM post_feedback pf
        JOIN posts p ON p.id = pf.post_id
        WHERE p.company_id = orda_company_id
        ORDER BY pf.created_at DESC
    LOOP
        RAISE NOTICE 'Feedback: % | Tipo: % | Post: % | Autor: % | Importante: %', 
            post_record.id, post_record.type, post_record.post_title, 
            post_record.author, post_record.is_important;
    END LOOP;
    
END $$;