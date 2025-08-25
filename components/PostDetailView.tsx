import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Linking, Modal } from 'react-native';
import { X, Check, ChevronLeft, ChevronRight, CircleAlert as AlertCircle, Download, Clock, History, Volume2, Calendar, Play } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { Post, MediaItem, SupabaseMediaObject } from '@/types/post';
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';

interface PostFeedback {
  id: string;
  type: 'response' | 'note' | 'status_change';
  content?: string;
  audio_url?: string;
  audio_duration?: number;
  author: string;
  author_type: 'admin' | 'user';
  is_important: boolean;
  status?: string;
  created_at: string;
}

interface PostDetailViewProps {
  post: Post;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export function PostDetailView({ post, onClose, onApprove, onReject }: PostDetailViewProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [feedback, setFeedback] = useState<PostFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [processedMedia, setProcessedMedia] = useState<MediaItem[]>([]);

  useEffect(() => {
    processMediaData();
    fetchFeedback();
    subscribeToFeedback();
  }, [post.id, post.media]);

  const processMediaData = () => {
    console.log('🔄 Processing media data for post:', post.id);
    console.log('📱 Raw media:', post.media);

    let media: MediaItem[] = [];

    // Verificar se media é um objeto com estrutura Supabase {urls: [...], count: ..., files: [...]}
    if (post.media && typeof post.media === 'object' && !Array.isArray(post.media)) {
      const mediaObj = post.media as SupabaseMediaObject;
      console.log('🔍 Processing Supabase media object:', mediaObj);
      
      if (mediaObj.urls && Array.isArray(mediaObj.urls)) {
        media = mediaObj.urls.map(url => ({
          url,
          type: 'image' as const // Assumindo que são imagens por padrão
        }));
        console.log('✅ Converted Supabase URLs to MediaItem array:', media);
      }
    }
    // Se media é array de MediaItem
    else if (post.media && Array.isArray(post.media)) {
      media = post.media;
      console.log('✅ Using existing MediaItem array:', media);
    }
    // Se media é string (JSON string)
    else if (typeof post.media === 'string') {
      try {
        const parsedMedia = JSON.parse(post.media);
        console.log('📝 Parsed media from string:', parsedMedia);
        
        // Verificar se o JSON parseado tem a estrutura Supabase
        if (parsedMedia.urls && Array.isArray(parsedMedia.urls)) {
          media = parsedMedia.urls.map((url: string) => ({
            url,
            type: 'image' as const
          }));
          console.log('✅ Converted parsed Supabase URLs to MediaItem array:', media);
        }
        // Verificar se é array de MediaItem
        else if (Array.isArray(parsedMedia)) {
          media = parsedMedia;
          console.log('✅ Using parsed MediaItem array:', media);
        }
      } catch (e) {
        console.error('❌ Error parsing media JSON:', e);
        media = [];
      }
    }

    console.log('✅ Final processed media:', media);
    setProcessedMedia(media);
  };

  const isCarousel = post.type === 'carousel' && processedMedia.length > 1;

  async function fetchFeedback() {
    try {
      setLoading(true);
      console.log('🔍 Buscando feedback para post:', post.id);
      
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('post_feedback')
        .select(`
          id,
          type,
          content,
          audio_url,
          audio_duration,
          author,
          author_type,
          is_important,
          status,
          created_at
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: false });

      console.log('📝 Feedback query result:', feedbackData);
      console.log('❌ Feedback error:', feedbackError);

      if (feedbackError) {
        console.error('Erro ao buscar feedback:', feedbackError);
        throw feedbackError;
      }

      if (feedbackData) {
        console.log('✅ Feedback encontrado:', feedbackData.length, 'itens');
        setFeedback(feedbackData);
      } else {
        console.log('⚠️ Nenhum feedback encontrado');
        setFeedback([]);
      }
    } catch (err) {
      console.error('💥 Error fetching feedback:', err);
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  }

  function subscribeToFeedback() {
    const subscription = supabase
      .channel('post_feedback_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_feedback',
          filter: `post_id=eq.${post.id}`
        },
        (payload) => {
          console.log('🔄 Feedback alterado, recarregando...', payload);
          fetchFeedback();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  const handleDownload = () => {
    if (!processedMedia[currentMediaIndex]) return;
    Linking.openURL(processedMedia[currentMediaIndex].url);
  };

  const handlePlayAudio = (audioUrl: string) => {
    if (audioUrl) {
      Linking.openURL(audioUrl);
    }
  };

  const renderMedia = () => {
    if (!processedMedia[currentMediaIndex]) {
      return (
        <View style={styles.noMediaContainer}>
          <Text style={styles.noMediaText}>Nenhuma mídia disponível</Text>
        </View>
      );
    }

    const currentMedia = processedMedia[currentMediaIndex];

    if (post.type === 'video') {
      const thumbnailUrl = post.thumbnail || currentMedia.url;
      return (
        <View style={styles.videoContainer}>
          <Image 
            source={{ uri: thumbnailUrl }}
            style={styles.media}
            resizeMode="contain"
            onError={(error) => {
              console.error('❌ Video thumbnail load error:', error.nativeEvent.error);
            }}
            onLoad={() => {
              console.log('✅ Video thumbnail loaded successfully:', thumbnailUrl);
            }}
          />
          <View style={styles.playButton}>
            <View style={styles.playIcon} />
          </View>
        </View>
      );
    }

    return (
      <Image 
        source={{ uri: currentMedia.url }}
        style={styles.media}
        resizeMode="contain"
        onError={(error) => {
          console.error('❌ Image load error:', error.nativeEvent.error);
        }}
        onLoad={() => {
          console.log('✅ Image loaded successfully:', currentMedia.url);
        }}
      />
    );
  };

  const formatScheduledDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) {
        return 'Data não disponível';
      }
      return format(date, "dd 'de' MMMM', às' HH:mm", { locale: ptBR });
    } catch (error) {
      return 'Data não disponível';
    }
  };

  const formatFeedbackDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) {
        return 'Data não disponível';
      }
      return format(date, "dd/MM 'às' HH:mm");
    } catch (error) {
      return 'Data não disponível';
    }
  };

  const formatAudioDuration = (duration?: number) => {
    if (!duration) return '';
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'approved':
        return { text: 'Aprovado', color: '#74f787' };
      case 'rejected':
        return { text: 'Ajustes', color: '#FF9500' };
      case 'pending':
        return { text: 'Pendente', color: '#8E8E93' }; // Mudança: de azul para cinza
      default:
        return { text: 'Desconhecido', color: '#666' };
    }
  };

  const getAuthorName = (email: string) => {
    // Extrair nome do email (parte antes do @)
    const name = email.split('@')[0];
    // Capitalizar primeira letra
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const statusInfo = getStatusInfo(post.status);
  const showActionButtons = post.status === 'pending';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X color="#000" size={24} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => setShowHistory(true)} 
            style={styles.historyButton}
          >
            <History color="#000" size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDownload} style={styles.downloadButton}>
            <Download color="#000" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.mediaContainer}>
          {renderMedia()}
          
          {isCarousel && processedMedia && (
            <>
              <TouchableOpacity 
                style={[styles.carouselButton, styles.prevButton]}
                onPress={() => setCurrentMediaIndex(i => Math.max(0, i - 1))}
                disabled={currentMediaIndex === 0}
              >
                <ChevronLeft color="#000" size={24} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.carouselButton, styles.nextButton]}
                onPress={() => setCurrentMediaIndex(i => Math.min(processedMedia.length - 1, i + 1))}
                disabled={currentMediaIndex === processedMedia.length - 1}
              >
                <ChevronRight color="#000" size={24} />
              </TouchableOpacity>

              <View style={styles.paginationDots}>
                {processedMedia.map((_, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.paginationDot,
                      index === currentMediaIndex && styles.paginationDotActive
                    ]} 
                  />
                ))}
              </View>
            </>
          )}
        </View>

        <View style={styles.details}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
              <Text style={styles.statusText}>{statusInfo.text}</Text>
            </View>
          </View>
          
          <View style={styles.scheduledContainer}>
            <Calendar size={16} color="#666" />
            <Text style={styles.scheduledDate}>
              Agendado para {formatScheduledDate(post.scheduledFor)}
            </Text>
          </View>
          
          <Text style={styles.title}>{post.title}</Text>
          <Text style={styles.caption}>{post.content}</Text>
        </View>
      </ScrollView>

      {showActionButtons && (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton]} 
            onPress={onReject}
          >
            <AlertCircle color="#fff" size={24} />
            <Text style={styles.actionText}>Solicitar Ajustes</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.approveButton]} 
            onPress={onApprove}
          >
            <Check color="#fff" size={24} />
            <Text style={styles.actionText}>Aprovar</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showHistory}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Conversas</Text>
              <TouchableOpacity 
                onPress={() => setShowHistory(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {loading ? (
                <Text style={styles.loadingText}>Carregando conversas...</Text>
              ) : feedback.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Nenhuma conversa ainda</Text>
                  <Text style={styles.emptySubtext}>
                    As aprovações e solicitações de ajustes aparecerão aqui.
                  </Text>
                </View>
              ) : (
                <View style={styles.chatContainer}>
                  {feedback.map((item) => {
                    const isStatusChange = item.type === 'status_change';
                    const authorName = getAuthorName(item.author);
                    
                    return (
                      <View key={item.id} style={styles.messageContainer}>
                        {/* Cabeçalho da mensagem */}
                        <View style={styles.messageHeader}>
                          <Text style={styles.authorName}>{authorName}</Text>
                          <Text style={styles.messageTime}>
                            {formatFeedbackDate(item.created_at)}
                          </Text>
                        </View>
                        
                        {/* Conteúdo da mensagem */}
                        <View style={[
                          styles.messageBubble,
                          isStatusChange && styles.statusChangeBubble
                        ]}>
                          {isStatusChange ? (
                            <View style={styles.statusChangeContent}>
                              <Check size={16} color="#74f787" />
                              <Text style={styles.statusChangeText}>
                                {item.content || 'Status alterado'}
                              </Text>
                            </View>
                          ) : (
                            <>
                              {item.content && (
                                <Text style={styles.messageText}>{item.content}</Text>
                              )}
                              
                              {item.audio_url && 
                                <TouchableOpacity 
                                  style={styles.audioMessage}
                                  onPress={() => handlePlayAudio(item.audio_url!)}
                                >
                                  <View style={styles.audioIcon}>
                                    <Play size={16} color="#fff" fill="#fff" />
                                  </View>
                                  <View style={styles.audioWaveform}>
                                    {Array.from({ length: 12 }).map((_, i) => (
                                      <View 
                                        key={i} 
                                        style={[
                                          styles.audioBar,
                                          { height: Math.random() * 20 + 8 }
                                        ]} 
                                      />
                                    ))}
                                  </View>
                                  {item.audio_duration && (
                                    <Text style={styles.audioDuration}>
                                      {formatAudioDuration(item.audio_duration)}
                                    </Text>
                                  )}
                                </TouchableOpacity>
                              }
                            </>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  downloadButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  mediaContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  noMediaContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMediaText: {
    color: '#666',
    fontSize: 16,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -30 },
      { translateY: -30 }
    ],
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 20,
    borderRightWidth: 0,
    borderBottomWidth: 15,
    borderTopWidth: 15,
    borderLeftColor: '#fff',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
    marginLeft: 5,
  },
  carouselButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevButton: {
    left: 16,
  },
  nextButton: {
    right: 16,
  },
  paginationDots: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  paginationDotActive: {
    backgroundColor: '#000',
  },
  details: {
    padding: 16,
  },
  statusContainer: {
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scheduledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  scheduledDate: {
    color: '#666', // Mudança: de verde para cinza escuro
    fontSize: 14,
  },
  title: {
    color: '#000',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  caption: {
    color: '#666',
    fontSize: 16,
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#74f787',
  },
  rejectButton: {
    backgroundColor: '#FF9500',
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalBody: {
    padding: 16,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    lineHeight: 20,
  },
  chatContainer: {
    gap: 16,
  },
  messageContainer: {
    gap: 8,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  messageBubble: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 16,
    borderTopLeftRadius: 4,
  },
  statusChangeBubble: {
    backgroundColor: 'rgba(116, 247, 135, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(116, 247, 135, 0.3)',
  },
  statusChangeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusChangeText: {
    color: '#74f787',
    fontSize: 14,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  audioMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#74f787',
    padding: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  audioIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 24,
  },
  audioBar: {
    width: 3,
    backgroundColor: '#fff',
    borderRadius: 1.5,
    opacity: 0.8,
  },
  audioDuration: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    minWidth: 35,
    textAlign: 'right',
  }
});