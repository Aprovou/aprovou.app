export interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

// Nova interface para representar a estrutura que está vindo do Supabase
export interface SupabaseMediaObject {
  urls: string[];
  count: number;
  files: any[];
}

export interface Post {
  id: string;
  title: string;
  content: string;
  type: 'image' | 'carousel' | 'video';
  media: MediaItem[] | string | SupabaseMediaObject; // Adicionado SupabaseMediaObject
  thumbnail?: string; // For videos
  platform: 'instagram' | 'facebook' | 'linkedin';
  scheduledFor: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_id: string;
}