import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { Logo } from '@/components/Logo';
import { PasswordInput } from '@/components/PasswordInput';
import { TextInput } from '@/components/TextInput';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { translateAuthError } from '@/lib/errorMessages';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, error } = useAuth();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return;
    }
    
    setIsLoading(true);
    try {
      await signIn(email.trim(), password);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail.trim()) {
      setResetError('Por favor, digite seu e-mail');
      return;
    }

    try {
      setResetError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: window.location.origin + '/reset-password',
      });

      if (error) throw error;

      setResetSuccess(true);
    } catch (err: any) {
      setResetError(translateAuthError(err.message));
    }
  };

  if (showResetPassword) {
    return (
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.content}>
          <Logo />
          <View style={styles.spacer} />
          <Text style={styles.subtitle}>Aprovou</Text>
          <View style={styles.form}>
            {resetError && <Text style={styles.error}>{resetError}</Text>}
            {resetSuccess && (
              <Text style={styles.success}>
                Se um usuário com esse e-mail existir, você receberá instruções para redefinir sua senha.
              </Text>
            )}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                placeholder="Digite seu e-mail"
                value={resetEmail}
                onChangeText={setResetEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <LinearGradient
              colors={['#74f787', '#f3ff7d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
                <Text style={styles.buttonText}>Enviar instruções</Text>
              </TouchableOpacity>
            </LinearGradient>

            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                setShowResetPassword(false);
                setResetSuccess(false);
                setResetError(null);
              }}
            >
              <Text style={styles.backButtonText}>Voltar ao login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
      <View style={styles.content}>
        <Logo />
        <View style={styles.spacer} />
        <Text style={styles.subtitle}>Aprovou</Text>
        <View style={styles.form}>
          {error && (
            <Text style={styles.error}>
              {error.includes('Invalid login credentials') || error.includes('invalid_credentials')
                ? 'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.'
                : error
              }
            </Text>
          )}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              placeholder="Digite seu e-mail"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Senha</Text>
            <PasswordInput
              placeholder="Digite sua senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => setShowResetPassword(true)}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
            </TouchableOpacity>
          </View>
          <LinearGradient
            colors={['#74f787', '#f3ff7d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.buttonGradient, isLoading && styles.buttonDisabled]}
          >
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleLogin}
              disabled={isLoading || !email.trim() || !password.trim()}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Text>
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Não tem uma conta? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity disabled={isLoading}>
                <Text style={styles.registerLink}>Criar Conta</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacer: {
    height: 16,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    color: '#fff',
    opacity: 0.8,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  buttonGradient: {
    borderRadius: 12,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  button: {
    padding: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: '#ff4444',
    textAlign: 'center',
    backgroundColor: 'rgba(255,0,0,0.1)',
    padding: 10,
    borderRadius: 8,
  },
  success: {
    color: '#74f787',
    textAlign: 'center',
    backgroundColor: 'rgba(116,247,135,0.1)',
    padding: 10,
    borderRadius: 8,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  registerText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  registerLink: {
    color: '#74f787',
    fontSize: 14,
    fontWeight: '600',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotPasswordText: {
    color: '#74f787',
    fontSize: 14,
  },
  backButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
});