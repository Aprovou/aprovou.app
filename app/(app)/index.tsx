import { View, StyleSheet, Image, TouchableOpacity, Modal, ScrollView, Text, RefreshControl } from 'react-native';
import { useAllPosts } from '@/hooks/usePosts';
import { PostDetailView } from '@/components/PostDetailView';
import { AdjustmentRequestModal } from '@/components/AdjustmentRequestModal';
import { useState } from 'react';
import { Post, SupabaseMediaObject } from '@/types/post';
import { Check, CircleAlert as AlertCircle, Clock } from 'lucide-react-native';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export default function PostsScreen() {
  const { posts, loading, error, approvePost, rejectPost, refetch } = useAllPosts();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filteredPosts = posts.filter(post => {
    return selectedStatus === 'all' || post.status === selectedStatus;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const renderStatusBadge = (status: 'pending' | 'approved' | 'rejected') => {
    const getStatusConfig = (status: string) => {
      switch (status) {
        case 'approved':
          return { color: '#74f787', icon: Check };
        case 'rejected':
          return { color: '#FF9500', icon: AlertCircle };
        case 'pending':
          return { color: '#8E8E93', icon: Clock }; // Mudança: de azul para cinza
        default:
          return { color: '#666', icon: Clock };
      }
    };

    const config = getStatusConfig(status);
    const IconComponent = config.icon;

    return (
      <View style={[styles.statusBadge, { backgroundColor: config.color }]}>
        <IconComponent size={16} color="#fff" />
      </View>
    );
  };

  const handleReject = (comment?: string, audioUri?: string) => {
    if (selectedPost) {
      rejectPost(selectedPost.id, comment, audioUri);
      setSelectedPost(null);
    }
  };

  const getImageUrl = (post: Post) => {
    // Debug: log do post para verificar estrutura
    console.log('🖼️ Post data:', post);
    console.log('🖼️ Media data:', post.media);
    console.log('🖼️ Thumbnail:', post.thumbnail);

    // Se é vídeo e tem thumbnail
    if (post.type === 'video' && post.thumbnail) {
      console.log('📹 Using video thumbnail:', post.thumbnail);
      return post.thumbnail;
    }

    // Verificar se media é um objeto com estrutura Supabase {urls: [...], count: ..., files: [...]}
    if (post.media && typeof post.media === 'object' && !Array.isArray(post.media)) {
      const mediaObj = post.media as SupabaseMediaObject;
      console.log('🔍 Checking Supabase media object:', mediaObj);
      
      if (mediaObj.urls && Array.isArray(mediaObj.urls) && mediaObj.urls.length > 0) {
        console.log('🔗 Using Supabase media URL:', mediaObj.urls[0]);
        return mediaObj.urls[0];
      }
    }

    // Se tem media array
    if (post.media && Array.isArray(post.media) && post.media.length > 0) {
      const firstMedia = post.media[0];
      console.log('📱 First media item:', firstMedia);
      
      if (typeof firstMedia === 'object' && firstMedia.url) {
        console.log('🔗 Using media URL:', firstMedia.url);
        return firstMedia.url;
      }
    }

    // Se media é string (JSON string)
    if (typeof post.media === 'string') {
      try {
        const parsedMedia = JSON.parse(post.media);
        console.log('📝 Parsed media:', parsedMedia);
        
        // Verificar se o JSON parseado tem a estrutura Supabase
        if (parsedMedia.urls && Array.isArray(parsedMedia.urls) && parsedMedia.urls.length > 0) {
          console.log('🔗 Using parsed Supabase media URL:', parsedMedia.urls[0]);
          return parsedMedia.urls[0];
        }
        
        // Verificar se é array de MediaItem
        if (Array.isArray(parsedMedia) && parsedMedia.length > 0 && parsedMedia[0].url) {
          console.log('🔗 Using parsed media URL:', parsedMedia[0].url);
          return parsedMedia[0].url;
        }
      } catch (e) {
        console.error('❌ Error parsing media JSON:', e);
      }
    }

    console.log('❌ No image URL found for post:', post.id);
    return null;
  };

  const renderThumbnail = (post: Post) => {
    const imageUrl = getImageUrl(post);

    if (!imageUrl) {
      return (
        <View style={[styles.thumbnailWrapper, styles.noImageContainer]}>
          <Text style={styles.noImageText}>Sem imagem</Text>
          {renderStatusBadge(post.status)}
          {renderPostTypeBadge(post)}
          {renderCarouselIndicator(post)}
        </View>
      );
    }

    return (
      <View style={styles.thumbnailWrapper}>
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.thumbnail}
          resizeMode="cover"
          onError={(error) => {
            console.error('❌ Image load error:', error.nativeEvent.error);
          }}
          onLoad={() => {
            console.log('✅ Image loaded successfully:', imageUrl);
          }}
        />
        {renderStatusBadge(post.status)}
        {renderPostTypeBadge(post)}
        {renderCarouselIndicator(post)}
        {post.type === 'video' && <View style={styles.playIcon} />}
      </View>
    );
  };

  const renderPostTypeBadge = (post: Post) => (
    <View style={styles.postTypeBadge}>
      <Text style={styles.postTypeText}>
        {post.type === 'image' ? 'Feed' : 
         post.type === 'carousel' ? 'Carrossel' : 'Reel'}
      </Text>
    </View>
  );

  const getMediaCount = (post: Post) => {
    // Verificar se media é um objeto com estrutura Supabase
    if (post.media && typeof post.media === 'object' && !Array.isArray(post.media)) {
      const mediaObj = post.media as SupabaseMediaObject;
      if (mediaObj.count && typeof mediaObj.count === 'number') {
        return mediaObj.count;
      }
      if (mediaObj.urls && Array.isArray(mediaObj.urls)) {
        return mediaObj.urls.length;
      }
    }

    // Se tem media array
    if (post.media && Array.isArray(post.media)) {
      return post.media.length;
    }

    // Se media é string (JSON string)
    if (typeof post.media === 'string') {
      try {
        const parsedMedia = JSON.parse(post.media);
        
        // Verificar se o JSON parseado tem a estrutura Supabase
        if (parsedMedia.count && typeof parsedMedia.count === 'number') {
          return parsedMedia.count;
        }
        if (parsedMedia.urls && Array.isArray(parsedMedia.urls)) {
          return parsedMedia.urls.length;
        }
        
        // Verificar se é array de MediaItem
        if (Array.isArray(parsedMedia)) {
          return parsedMedia.length;
        }
      } catch (e) {
        console.error('Error parsing media for count:', e);
      }
    }

    return 0;
  };

  const renderCarouselIndicator = (post: Post) => {
    if (post.type !== 'carousel') return null;
    
    const mediaCount = getMediaCount(post);

    if (mediaCount <= 1) return null;
    
    return (
      <View style={styles.carouselIndicator}>
        <View style={styles.dotsContainer}>
          {Array.from({ length: Math.min(mediaCount, 3) }).map((_, index) => (
            <View key={index} style={styles.dot} />
          ))}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterTabs}>
        {(['all', 'pending', 'approved', 'rejected'] as StatusFilter[]).map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterTab, selectedStatus === status && styles.filterTabActive]}
            onPress={() => setSelectedStatus(status)}
          >
            <Text style={[
              styles.filterTabText,
              selectedStatus === status && styles.filterTabTextActive
            ]}>
              {status === 'all' ? 'Todos' :
               status === 'pending' ? 'Pendentes' :
               status === 'approved' ? 'Aprovados' : 'Ajustes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#74f787']}
            tintColor="#74f787"
          />
        }
      >
        {filteredPosts.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={styles.thumbnailContainer}
            onPress={() => setSelectedPost(post)}
          >
            {renderThumbnail(post)}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={selectedPost !== null}
        animationType="fade"
        onRequestClose={() => setSelectedPost(null)}
      >
        {selectedPost && (
          <PostDetailView
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            onApprove={() => {
              approvePost(selectedPost.id);
              setSelectedPost(null);
            }}
            onReject={() => setShowAdjustmentModal(true)}
          />
        )}
      </Modal>

      <AdjustmentRequestModal
        visible={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
        onSubmit={(comment, audioUri) => {
          handleReject(comment, audioUri);
          setShowAdjustmentModal(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Mudança: fundo cinza claro
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
    padding: 20,
  },
  filterTabs: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#fff', // Fundo branco para os filtros
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#74f787',
  },
  filterTabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#000',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 1,
  },
  thumbnailContainer: {
    width: '33.333%',
    aspectRatio: 1,
    padding: 1,
  },
  thumbnailWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#f5f5f5',
  },
  noImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    color: '#666',
    fontSize: 14,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  postTypeBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  postTypeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  carouselIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 12,
    padding: 4,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  playIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
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
    transform: [
      { translateX: -10 },
      { translateY: -15 }
    ],
  },
});