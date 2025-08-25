// lib/supabase.ts
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Leia as variáveis (defina no EAS: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (__DEV__) {
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no EAS (profile que você usa).'
  );
}

if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  throw new Error('Invalid Supabase URL format. Ex.: https://SEU-PROJETO.supabase.co');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,      // ESSENCIAL pra sessão no iOS/Android
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,  // RN/Expo não usa URL hash
  },
});

// (Opcional) Teste rápido do serviço de Auth
export async function testSupabaseAuthHealth() {
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/health`);
  return res.ok; // true = 200
  } catch {
    return false;
  }
}

if (__DEV__) {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event, session?.user?.email);
  });
}
