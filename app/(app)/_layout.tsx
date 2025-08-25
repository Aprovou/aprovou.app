import { Tabs } from 'expo-router';
import { Clock, User as User2 } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';
import { Logo } from '@/components/Logo';
import { NotificationBell } from '@/components/NotificationBell';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

interface Company {
  id: string;
  name: string;
}

export default function AppLayout() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadUserData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar dados do perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, role, email')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profile);

      // Buscar empresa vinculada ao usuário
      const { data: representatives, error: representativeError } = await supabase
        .from('company_representatives')
        .select(`
          company_id,
          companies (
            id,
            name
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
            name: companyData.name
          });
        }
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUserData();
  }, []);

  return (
    <Tabs 
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          color: colors.text.primary,
        },
        tabBarStyle: {
          borderTopColor: colors.ui.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 80, // Aumentar altura para acomodar texto
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4, // Espaço entre ícone e texto
        },
        tabBarIconStyle: {
          marginBottom: 0, // Remover margem padrão
        },
        header: () => (
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.leftSection}>
                <Logo size={60} />
                <View style={styles.userInfo}>
                  {loading ? (
                    <Text style={styles.userName}>Carregando...</Text>
                  ) : error ? (
                    <Text style={[styles.userName, styles.errorText]}>Erro ao carregar</Text>
                  ) : profile ? (
                    <>
                      <Text style={styles.userName}>{profile.full_name}</Text>
                      <Text style={styles.companyName}>
                        {company ? company.name : 'Empresa não encontrada'}
                      </Text>
                    </>
                  ) : null}
                </View>
              </View>
              <NotificationBell />
            </View>
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Aprovações',
          tabBarIcon: ({ focused, size, color }) => (
            <Clock size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused, size, color }) => (
            <User2 size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userInfo: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  companyName: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  errorText: {
    color: colors.status.error,
  },
});