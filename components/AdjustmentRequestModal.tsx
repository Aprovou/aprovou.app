import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, Platform, Alert, Image } from 'react-native';
import { Mic, CircleStop as StopCircle, Send, Camera, X } from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

interface AdjustmentRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (comment: string, audioUri?: string, imageUri?: string) => void;
}

export function AdjustmentRequestModal({ visible, onClose, onSubmit }: AdjustmentRequestModalProps) {
  const [comment, setComment] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  async function startRecording() {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Aviso', 'Gravação de áudio não está disponível na versão web. Use a versão mobile do app.');
        return;
      }

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erro', 'Permissão de microfone necessária para gravar áudio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Erro', 'Erro ao iniciar gravação. Verifique as permissões de microfone.');
    }
  }

  async function stopRecording() {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      
      if (status.isLoaded) {
        setAudioDuration(Math.floor((status.durationMillis || 0) / 1000));
      }
      
      setAudioUri(uri || null);
      setRecording(null);
      setIsRecording(false);
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Erro', 'Erro ao parar gravação.');
    }
  }

  async function pickImage() {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Erro', 'Permissão necessária para acessar a galeria.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Erro', 'Erro ao selecionar imagem.');
    }
  }

  async function uploadFile(uri: string, type: 'audio' | 'image'): Promise<string | null> {
    try {
      setIsUploading(true);
      
      const fileExt = type === 'audio' ? 'm4a' : 'jpg';
      const fileName = `${type}_${Date.now()}.${fileExt}`;
      const bucket = type === 'audio' ? 'feedback_audio' : 'feedback_images';
      const filePath = `${bucket}/${fileName}`;

      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Falha ao processar o ${type === 'audio' ? 'áudio' : 'imagem'} selecionado`);
      }
      const fileData = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileData, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Erro ao fazer upload do ${type === 'audio' ? 'áudio' : 'imagem'}: ` + uploadError.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err: any) {
      console.error(`Error uploading ${type}:`, err);
      Alert.alert('Erro', `Erro ao fazer upload do ${type === 'audio' ? 'áudio' : 'imagem'}: ` + err.message);
      return null;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit() {
    if (!comment.trim() && !audioUri && !imageUri) {
      Alert.alert('Aviso', 'Adicione pelo menos um comentário, áudio ou imagem.');
      return;
    }

    try {
      let audioUrl: string | undefined;
      let imageUrl: string | undefined;
      
      if (audioUri) {
        audioUrl = await uploadFile(audioUri, 'audio') || undefined;
      }

      if (imageUri) {
        imageUrl = await uploadFile(imageUri, 'image') || undefined;
      }
      
      onSubmit(comment, audioUrl, imageUrl);
      
      // Reset form
      setComment('');
      setAudioUri(null);
      setImageUri(null);
      setAudioDuration(null);
      onClose();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      Alert.alert('Erro', 'Erro ao enviar feedback.');
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const removeAudio = () => {
    setAudioUri(null);
    setAudioDuration(null);
  };

  const removeImage = () => {
    setImageUri(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Solicitar Ajustes</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color="#666" size={24} />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Descreva os ajustes necessários..."
            placeholderTextColor="#999"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
          />

          {/* Seção de Mídia */}
          <View style={styles.mediaSection}>
            <Text style={styles.sectionTitle}>Anexos (opcional)</Text>
            
            {/* Botões de anexo */}
            <View style={styles.attachmentButtons}>
              {Platform.OS !== 'web' && (
                <TouchableOpacity
                  style={[styles.attachButton, isRecording && styles.recordingButton]}
                  onPress={isRecording ? stopRecording : startRecording}
                  disabled={isUploading}
                >
                  {isRecording ? (
                    <StopCircle color="#fff" size={20} />
                  ) : (
                    <Mic color="#fff" size={20} />
                  )}
                  <Text style={styles.attachButtonText}>
                    {isRecording ? 'Parar' : 'Áudio'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.attachButton}
                onPress={pickImage}
                disabled={isUploading}
              >
                <Camera color="#fff" size={20} />
                <Text style={styles.attachButtonText}>Imagem</Text>
              </TouchableOpacity>
            </View>

            {/* Preview do áudio */}
            {audioUri && (
              <View style={styles.attachmentPreview}>
                <View style={styles.audioPreview}>
                  <Mic color="#74f787" size={16} />
                  <Text style={styles.attachmentText}>
                    Áudio gravado {audioDuration ? `(${formatDuration(audioDuration)})` : ''}
                  </Text>
                  <TouchableOpacity onPress={removeAudio} style={styles.removeButton}>
                    <X color="#ff4444" size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Preview da imagem */}
            {imageUri && (
              <View style={styles.attachmentPreview}>
                <View style={styles.imagePreview}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  <View style={styles.imageInfo}>
                    <Text style={styles.attachmentText}>Imagem anexada</Text>
                    <TouchableOpacity onPress={removeImage} style={styles.removeButton}>
                      <X color="#ff4444" size={16} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
              disabled={isUploading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.submitButton, isUploading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isUploading}
            >
              <Send color="#fff" size={20} />
              <Text style={styles.submitButtonText}>
                {isUploading ? 'Enviando...' : 'Enviar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 0,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    color: '#000',
    fontSize: 16,
    minHeight: 120,
    margin: 20,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: '#e9ecef',
    textAlignVertical: 'top',
  },
  mediaSection: {
    padding: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  attachmentButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  attachButton: {
    backgroundColor: '#74f787',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    flex: 1,
  },
  recordingButton: {
    backgroundColor: '#FF3B30',
  },
  attachButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  attachmentPreview: {
    marginBottom: 12,
  },
  audioPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  imagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  previewImage: {
    width: 60,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
  },
  imageInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attachmentText: {
    color: '#000',
    fontSize: 14,
    flex: 1,
    marginLeft: 8,
  },
  removeButton: {
    padding: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 0,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  submitButton: {
    backgroundColor: '#74f787',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});