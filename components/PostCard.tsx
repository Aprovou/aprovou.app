import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, X } from 'lucide-react-native';

interface Post {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  platform: 'instagram' | 'facebook' | 'linkedin';
  scheduledFor: string;
}

interface PostCardProps {
  post: Post;
  onApprove: () => void;
  onReject: () => void;
}

export function PostCard({ post, onApprove, onReject }: PostCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.platform}>{post.platform}</Text>
        <Text style={styles.date}>
          Agendado para: {new Date(post.scheduledFor).toLocaleDateString()}
        </Text>
      </View>
      
      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.content}>{post.content}</Text>
      
      {post.imageUrl && (
        <Image source={{ uri: post.imageUrl }} style={styles.image} />
      )}
      
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, styles.approveButton]} onPress={onApprove}>
          <Check color="white" size={20} />
          <Text style={styles.buttonText}>Aprovar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={onReject}>
          <X color="white" size={20} />
          <Text style={styles.buttonText}>Rejeitar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  platform: {
    textTransform: 'capitalize',
    fontWeight: '600',
    color: '#666',
  },
  date: {
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  content: {
    fontSize: 16,
    color: '#444',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});