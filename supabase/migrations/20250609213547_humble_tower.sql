/*
  # Add test posts for fabricio@alpina.digital and Orda company

  1. New Data
    - Creates Orda company if it doesn't exist
    - Ensures fabricio@alpina.digital profile exists
    - Links user to company via company_representatives
    - Creates 8 test posts with different types (feed, carousel, reel)

  2. Post Types
    - 4 Feed posts (single images for Instagram, LinkedIn, Facebook)
    - 2 Carousel posts (multiple images for Instagram)
    - 2 Reel posts (videos with thumbnails for Instagram)

  3. Content Features
    - Realistic social media content
    - Different platforms and scheduling times
    - All posts in 'pending' status for approval testing
    - Professional images from Pexels
*/

-- First, ensure the Orda company exists
INSERT INTO companies (name, cnpj, email, phone, address)
VALUES ('Orda', '12.345.678/0001-90', 'contato@orda.com', '+55 11 99999-9999', 'São Paulo, SP')
ON CONFLICT (cnpj) DO NOTHING;

-- Get the company ID for Orda
DO $$
DECLARE
    orda_company_id uuid;
    fabricio_user_id uuid;
BEGIN
    -- Get Orda company ID
    SELECT id INTO orda_company_id FROM companies WHERE name = 'Orda' LIMIT 1;
    
    -- Get fabricio user ID
    SELECT id INTO fabricio_user_id FROM profiles WHERE email = 'fabricio@alpina.digital' LIMIT 1;
    
    -- If user doesn't exist, we can't proceed
    IF fabricio_user_id IS NULL THEN
        RAISE EXCEPTION 'User fabricio@alpina.digital not found in profiles table';
    END IF;
    
    -- If company doesn't exist, we can't proceed
    IF orda_company_id IS NULL THEN
        RAISE EXCEPTION 'Company Orda not found in companies table';
    END IF;
    
    -- Ensure the user is linked to the company as a representative
    INSERT INTO company_representatives (company_id, profile_id, email)
    VALUES (orda_company_id, fabricio_user_id, 'fabricio@alpina.digital')
    ON CONFLICT (company_id, profile_id) DO NOTHING;
    
    -- Insert test posts
    INSERT INTO posts (
        company_id,
        user_id,
        title,
        content,
        platform,
        scheduled_for,
        status,
        type,
        media,
        thumbnail
    ) VALUES 
    -- Feed Post 1
    (
        orda_company_id,
        fabricio_user_id,
        'Novo produto em destaque',
        'Estamos empolgados em apresentar nossa mais nova inovação! 🚀 Um produto que vai revolucionar a forma como você trabalha. #inovação #tecnologia #novidade',
        'instagram',
        '2024-01-25T14:00:00Z',
        'pending',
        'image',
        '[{"url": "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg", "type": "image"}]',
        NULL
    ),

    -- Carousel Post
    (
        orda_company_id,
        fabricio_user_id,
        'Nossa equipe em ação',
        'Conheça os bastidores da Orda! Aqui você vê nossa equipe dedicada trabalhando para entregar sempre o melhor. Deslize para ver mais! ➡️ #equipe #bastidores #trabalho',
        'instagram',
        '2024-01-26T10:30:00Z',
        'pending',
        'carousel',
        '[
            {"url": "https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg", "type": "image"},
            {"url": "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg", "type": "image"},
            {"url": "https://images.pexels.com/photos/3184632/pexels-photo-3184632.jpeg", "type": "image"}
        ]',
        NULL
    ),

    -- Reel Post
    (
        orda_company_id,
        fabricio_user_id,
        'Tutorial rápido',
        'Em 30 segundos, aprenda como usar nossa plataforma de forma eficiente! 💡 #tutorial #dicas #produtividade',
        'instagram',
        '2024-01-27T16:45:00Z',
        'pending',
        'video',
        '[{"url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4", "type": "video"}]',
        'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg'
    ),

    -- Feed Post 2 - LinkedIn
    (
        orda_company_id,
        fabricio_user_id,
        'Crescimento sustentável',
        'Na Orda, acreditamos que o crescimento deve ser sustentável e responsável. Nossos resultados do último trimestre mostram que é possível crescer respeitando nossos valores e o meio ambiente. 🌱 #sustentabilidade #crescimento #responsabilidade',
        'linkedin',
        '2024-01-28T09:00:00Z',
        'pending',
        'image',
        '[{"url": "https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg", "type": "image"}]',
        NULL
    ),

    -- Feed Post 3 - Facebook
    (
        orda_company_id,
        fabricio_user_id,
        'Evento especial',
        'Não perca nosso evento especial na próxima semana! Será uma oportunidade única de conhecer nossas novidades e networking com profissionais da área. Inscrições abertas! 🎉 #evento #networking #oportunidade',
        'facebook',
        '2024-01-29T18:00:00Z',
        'pending',
        'image',
        '[{"url": "https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg", "type": "image"}]',
        NULL
    ),

    -- Carousel Post 2
    (
        orda_company_id,
        fabricio_user_id,
        'Processo de desenvolvimento',
        'Do conceito à realidade: veja como desenvolvemos nossos produtos com excelência e atenção aos detalhes. Cada etapa é cuidadosamente planejada! 🔧 #desenvolvimento #processo #qualidade',
        'instagram',
        '2024-01-30T12:15:00Z',
        'pending',
        'carousel',
        '[
            {"url": "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg", "type": "image"},
            {"url": "https://images.pexels.com/photos/3184419/pexels-photo-3184419.jpeg", "type": "image"},
            {"url": "https://images.pexels.com/photos/3184420/pexels-photo-3184420.jpeg", "type": "image"},
            {"url": "https://images.pexels.com/photos/3184421/pexels-photo-3184421.jpeg", "type": "image"}
        ]',
        NULL
    ),

    -- Reel Post 2
    (
        orda_company_id,
        fabricio_user_id,
        'Dia na vida de um desenvolvedor',
        'Acompanhe um dia típico na vida de nossos desenvolvedores! Café, código, criatividade e muito aprendizado. ☕💻 #developer #rotina #tecnologia',
        'instagram',
        '2024-01-31T15:30:00Z',
        'pending',
        'video',
        '[{"url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4", "type": "video"}]',
        'https://images.pexels.com/photos/3184454/pexels-photo-3184454.jpeg'
    ),

    -- Feed Post 4 - Weekend content
    (
        orda_company_id,
        fabricio_user_id,
        'Reflexão de fim de semana',
        'O sucesso não é apenas sobre resultados, mas sobre a jornada e as pessoas que encontramos pelo caminho. Que tal refletir sobre isso neste fim de semana? 🤔💭 #reflexão #sucesso #jornada',
        'linkedin',
        '2024-02-01T08:00:00Z',
        'pending',
        'image',
        '[{"url": "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg", "type": "image"}]',
        NULL
    );
    
END $$;