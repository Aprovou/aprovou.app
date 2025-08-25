import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Post } from '@/types/post';

export function useAllPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPosts();
      subscribeToPostChanges();
    } else {
      // Reset state when user is not authenticated
      setPosts([]);
      setLoading(false);
      setError(null);
    }
  }, [user]);

  async function fetchPosts() {
    try {
      setLoading(true);
      console.log('🔍 Iniciando busca de todos os posts...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      console.log('👤 User ID:', user.id);
      console.log('📧 User email:', user.email);

      // Get the user's company_id through company_representatives table
      const { data: representatives, error: representativeError } = await supabase
        .from('company_representatives')
        .select('company_id, email')
        .eq('profile_id', user.id);

      console.log('🏢 Representatives query result:', representatives);
      console.log('❌ Representatives error:', representativeError);

      if (representativeError) throw representativeError;
      if (!representatives || representatives.length === 0) {
        console.log('⚠️ Nenhuma empresa encontrada para o usuário');
        throw new Error('No company found');
      }

      // Use the first company if multiple exist
      const companyId = representatives[0].company_id;
      console.log('🏢 Company ID encontrado:', companyId);

      // Fetch ALL posts for that company (not just pending)
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          platform,
          scheduled_for,
          status,
          created_at,
          user_id,
          media,
          type,
          thumbnail,
          company_id
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      console.log('📝 Posts query result:', postsData);
      console.log('❌ Posts error:', postsError);
      console.log('📊 Total posts encontrados:', postsData?.length || 0);

      if (postsError) throw postsError;

      const formattedPosts = postsData?.map(post => ({
        ...post,
        scheduledFor: post.scheduled_for
      })) || [];

      console.log('✅ Posts formatados:', formattedPosts);
      setPosts(formattedPosts);
    } catch (err: any) {
      console.error('💥 Erro ao buscar posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function subscribeToPostChanges() {
    const subscription = supabase
      .channel('posts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        () => {
          console.log('🔄 Posts alterados, recarregando...');
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  async function approvePost(postId: string) {
    try {
      console.log('✅ Aprovando post:', postId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error: updateError } = await supabase
        .from('posts')
        .update({ status: 'approved' })
        .eq('id', postId);

      if (updateError) throw updateError;

      // Inserir feedback de aprovação
      try {
        const { error: feedbackError } = await supabase
          .from('post_feedback')
          .insert({
            post_id: postId,
            type: 'status_change',
            content: 'Post aprovado',
            author: user.email || 'Usuário',
            author_type: 'admin',
            is_important: false,
            status: 'approved'
          });

        if (feedbackError) {
          console.warn('Aviso: Não foi possível salvar feedback:', feedbackError);
        }
      } catch (feedbackErr) {
        console.warn('Erro ao salvar feedback:', feedbackErr);
      }

      await fetchPosts();
    } catch (err: any) {
      console.error('Error approving post:', err);
      setError(err.message);
    }
  }

  async function rejectPost(postId: string, comment?: string, audioUrl?: string) {
    try {
      console.log('❌ Rejeitando post:', postId, 'Comentário:', comment, 'Áudio:', audioUrl);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error: updateError } = await supabase
        .from('posts')
        .update({ status: 'rejected' })
        .eq('id', postId);

      if (updateError) throw updateError;

      // Inserir feedback de rejeição
      try {
        const { error: feedbackError } = await supabase
          .from('post_feedback')
          .insert({
            post_id: postId,
            type: 'response',
            content: comment || 'Ajustes solicitados',
            audio_url: audioUrl,
            author: user.email || 'Usuário',
            author_type: 'admin',
            is_important: true,
            status: 'rejected'
          });

        if (feedbackError) {
          console.warn('Aviso: Não foi possível salvar feedback:', feedbackError);
        }
      } catch (feedbackErr) {
        console.warn('Erro ao salvar feedback:', feedbackErr);
      }

      await fetchPosts();
    } catch (err: any) {
      console.error('Error rejecting post:', err);
      setError(err.message);
    }
  }

  // Função para refetch manual (para pull-to-refresh)
  const refetch = async () => {
    await fetchPosts();
  };

  return {
    posts,
    loading,
    error,
    approvePost,
    rejectPost,
    refetch, // Exportar função de refetch
  };
}

// Manter compatibilidade com o nome antigo
export const usePendingPosts = useAllPosts;