import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Platform } from 'react-native';
import { Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { LogOut, User, Camera, Lock, Building2, Trash2 } from 'lucide-react-native';
import { TextInput } from '@/components/TextInput';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/constants/colors';

interface Profile {
  id: string;
  full_name: string;
  role: string;
  email: string;
  avatar_url?: string | null;
  phone?: string | null;
}

interface Company {
  id: string;
  name: string;
  logo_url?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
}

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    fetchProfileAndCompany();
  }, []);

  async function fetchProfileAndCompany() {
    try {
      setIsLoading(true);
      setError(null);
  
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
  
      // Buscar dados do perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          avatar_url,
          phone,
          role,
          email
        `)
        .eq('id', user.id)
        .single();
  
      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error('Erro ao carregar perfil: ' + profileError.message);
      }
  
      if (!profileData) {
        throw new Error('Perfil não encontrado');
      }
  
      const profile: Profile = {
        id: profileData.id,
        full_name: profileData.full_name,
        role: profileData.role,
        email: profileData.email,
        avatar_url: profileData.avatar_url,
        phone: profileData.phone,
      };
  
      setProfile(profile);

      // Buscar empresa vinculada ao usuário
      const { data: representatives, error: representativeError } = await supabase
        .from('company_representatives')
        .select(`
          company_id,
          companies (
            id,
            name,
            logo_url,
            email,
            phone,
            website
          )
        `)
        .eq('profile_id', user.id)
        .limit(1);

      if (representativeError) {
        console.warn('Erro ao buscar empresa:', representativeError);
      } else if (representatives && representatives.length > 0) {
        const companyData = representatives[0].companies;
        if (companyData) {
          setCompany({
            id: companyData.id,
            name: companyData.name,
            logo_url: companyData.logo_url,
            email: companyData.email,
            phone: companyData.phone,
            website: companyData.website
          });
        }
      }

    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching profile and company:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePasswordChange() {
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    try {
      setError(null);
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw new Error('Erro ao atualizar senha: ' + updateError.message);

      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleAvatarUpload() {
    try {
      setError(null);
      
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Precisamos de permissão para acessar suas fotos');
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        
        const fileExt = file.uri.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Unificar a obtenção do fileData para todas as plataformas
        const response = await fetch(file.uri);
        if (!response.ok) {
          throw new Error('Falha ao processar a imagem selecionada');
        }
        const fileData = await response.blob();

        const { error: uploadError, data } = await supabase.storage
          .from('avatars')
          .upload(filePath, fileData, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error('Erro ao fazer upload da imagem: ' + uploadError.message);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', profile?.id);

        if (updateError) {
          console.error('Avatar update error:', updateError);
          throw new Error('Erro ao atualizar avatar no banco de dados: ' + updateError.message);
        }

        await fetchProfileAndCompany();
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error uploading avatar:', err);
    }
  }

  async function handleDeleteAccount() {
    Alert.alert(
      'Excluir Conta',
      'Esta ação é IRREVERSÍVEL e excluirá permanentemente:\n\n• Seu perfil e dados pessoais\n• Todas as postagens e conteúdos\n• Histórico de aprovações\n• Conversas e feedbacks\n• Todos os dados associados à sua conta\n\nTem certeza de que deseja continuar?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir Conta',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeletingAccount(true);
              setError(null);

              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                throw new Error('Usuário não encontrado');
              }

              // Excluir o perfil do usuário (isso acionará a exclusão em cascata)
              const { error: deleteError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', user.id);

              if (deleteError) {
                throw new Error('Erro ao excluir conta: ' + deleteError.message);
              }

              // Fazer logout após exclusão bem-sucedida
              await signOut();
              
              Alert.alert(
                'Conta Excluída',
                'Sua conta foi excluída permanentemente. Todos os seus dados foram removidos.',
                [{ text: 'OK' }]
              );
            } catch (err: any) {
              console.error('Error deleting account:', err);
              setError('Erro ao excluir conta: ' + err.message);
            } finally {
              setIsDeletingAccount(false);
            }
          },
        },
      ]
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Informações da Empresa */}
      {company && (
        <View style={styles.companyCard}>
          <View style={styles.cardHeader}>
            <Building2 size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Empresa</Text>
          </View>
          
          <View style={styles.companyInfo}>
            <View style={styles.companyLogoContainer}>
              {company.logo_url ? (
                <Image 
                  source={{ uri: company.logo_url }}
                  style={styles.companyLogo}
                />
              ) : (
                <View style={styles.companyLogoPlaceholder}>
                  <Building2 size={32} color={colors.text.secondary} />
                </View>
              )}
            </View>
            
            <View style={styles.companyDetails}>
              <Text style={styles.companyName}>{company.name}</Text>
              {company.email && (
                <Text style={styles.companyContact}>{company.email}</Text>
              )}
              {company.phone && (
                <Text style={styles.companyContact}>{company.phone}</Text>
              )}
              {company.website && (
                <Text style={styles.companyContact}>{company.website}</Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Informações do Perfil */}
      <View style={styles.profileCard}>
        <View style={styles.cardHeader}>
          <User size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>Perfil</Text>
        </View>
        
        <View style={styles.profileContent}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity 
              style={styles.avatarButton}
              onPress={handleAvatarUpload}
            >
              {profile?.avatar_url ? (
                <Image 
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <User size={40} color={colors.primary} />
              )}
              <View style={styles.cameraButton}>
                <Camera size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Nome</Text>
              <Text style={styles.value}>{profile?.full_name}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>E-mail</Text>
              <Text style={styles.value}>{profile?.email}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Função</Text>
              <Text style={styles.value}>
                {profile?.role === 'admin' ? 'Administrador' : 'Usuário'}
              </Text>
            </View>

            {profile?.phone && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Telefone</Text>
                <Text style={styles.value}>{profile.phone}</Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.passwordButton}
              onPress={() => setIsChangingPassword(true)}
            >
              <Lock size={16} color={colors.primary} />
              <Text style={styles.passwordButtonText}>Alterar Senha</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Alterar Senha */}
      {isChangingPassword && (
        <View style={styles.passwordCard}>
          <View style={styles.cardHeader}>
            <Lock size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Alterar Senha</Text>
          </View>
          
          <View style={styles.passwordInputContainer}>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Senha atual"
              secureTextEntry
              style={styles.input}
            />
            
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Nova senha"
              secureTextEntry
              style={styles.input}
            />
            
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirmar nova senha"
              secureTextEntry
              style={styles.input}
            />
          </View>

          <View style={styles.passwordActions}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setIsChangingPassword(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]}
              onPress={handlePasswordChange}
            >
              <Text style={styles.buttonText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Botão de Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <LogOut size={20} color={colors.status.error} />
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>

      {/* Botão de Excluir Conta */}
      <TouchableOpacity 
        style={[styles.deleteAccountButton, isDeletingAccount && styles.buttonDisabled]} 
        onPress={handleDeleteAccount}
        disabled={isDeletingAccount}
      >
        <Trash2 size={20} color={colors.white} />
        <Text style={styles.deleteAccountText}>
          {isDeletingAccount ? 'Excluindo...' : 'Excluir Conta'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa', // Fundo claro
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text.primary,
    fontSize: 16,
  },
  
  // Cards
  companyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.ui.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.ui.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  passwordCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.ui.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Card Headers
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  
  // Company Info
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  companyLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  companyLogo: {
    width: '100%',
    height: '100%',
  },
  companyLogoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(116, 247, 135, 0.1)',
  },
  companyDetails: {
    flex: 1,
    gap: 4,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  companyContact: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  
  // Profile Content
  profileContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(116, 247, 135, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 4,
  },
  profileInfo: {
    flex: 1,
    gap: 12,
  },
  infoRow: {
    gap: 4,
  },
  label: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  value: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  passwordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    marginTop: 8,
  },
  passwordButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Password Form
  passwordInputContainer: {
    gap: 12,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#f5f5f5',
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  passwordActions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  cancelButton: {
    backgroundColor: colors.status.error,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.status.error,
    shadowColor: colors.ui.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    color: colors.status.error,
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Delete Account Button
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.status.error,
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: colors.ui.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteAccountText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  
  // Error
  errorContainer: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.status.error,
  },
  errorText: {
    color: colors.status.error,
    fontSize: 16,
    textAlign: 'center',
  },
});