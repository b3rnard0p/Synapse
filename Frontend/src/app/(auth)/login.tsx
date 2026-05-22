import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { Colors } from '@/constants/theme';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithGoogle, isLoading } = useAuthStore();
  const { theme } = useThemeStore();
  const c = Colors[theme];

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    responseType: AuthSession.ResponseType.IdToken,
    redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/login` : AuthSession.makeRedirectUri({ path: 'login' }),
  });

  React.useEffect(() => {
    console.log('[AUTH_FLOW] useEffect do login.tsx. response:', response?.type);
    if (response?.type === 'success') {
      const { authentication } = response;
      console.log('[AUTH_FLOW] Sucesso! Tokens recebidos:', !!authentication?.idToken, !!authentication?.accessToken);
      const idToken = response.params?.id_token || authentication?.idToken;
      const accessToken = response.params?.access_token || authentication?.accessToken;
      
      console.log('[AUTH_FLOW] Tokens encontrados nos params:', !!response.params?.id_token, !!response.params?.access_token);
      
      if (idToken) {
        handleGoogleLogin(idToken);
      } else if (accessToken) {
        // Fallback para access token
        handleGoogleLogin(accessToken);
      } else {
        Alert.alert('Erro', 'Nenhum token retornado pelo Google.');
      }
    } else if (response?.type === 'error') {
      Alert.alert('Erro no Google OAuth', response.error?.message || 'Tente novamente');
    }
  }, [response]);

  const handleGoogleLogin = async (token: string) => {
    console.log('[AUTH_FLOW] handleGoogleLogin acionado.');
    try {
      await loginWithGoogle(token);
      console.log('[AUTH_FLOW] loginWithGoogle terminou com sucesso.');
      // O _layout.tsx automaticamente troca para a tela Home (tabs)
    } catch (error: any) {
      console.error('[AUTH_FLOW] Erro no catch do handleGoogleLogin:', error);
      Alert.alert('Erro', 'Não foi possível fazer login. Tente novamente.');
    }
  };

  return (
    <LinearGradient colors={[c.backgroundSecondary, c.background, c.backgroundSecondary]} style={styles.container}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      <View style={styles.header}>
        <Image source={require('../../../assets/LogoSynapse.png')} style={styles.logoImage} resizeMode="contain" />
      </View>

      <View style={styles.content}>
        <Text style={[styles.welcomeTitle, { color: c.text }]}>Bem-vindo de volta</Text>
        <Text style={[styles.welcomeSubtitle, { color: c.textSecondary }]}>
          Faça login para acessar seus ingressos,{'\n'}pontos e filmes favoritos.
        </Text>

        <TouchableOpacity
          style={[styles.googleButton, (!request || isLoading) && styles.disabled]}
          onPress={() => promptAsync()}
          disabled={!request || isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color={c.text} />
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleButtonText}>Continuar com Google</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.terms, { color: c.textSecondary }]}>
          Ao continuar, você concorda com nossos{'\n'}
          <Text style={styles.termsLink}>Termos de Uso</Text> e{' '}
          <Text style={styles.termsLink}>Política de Privacidade</Text>
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  logoImage: { width: 220, height: 220, marginBottom: 16 },
  content: {
    paddingHorizontal: 32,
    paddingBottom: 60,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    width: '100%',
    gap: 12,
    shadowColor: '#be123c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  disabled: { opacity: 0.6 },
  googleIcon: {
    fontSize: 20,
    fontWeight: '900',
    color: '#be123c',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#27272a',
  },
  terms: {
    marginTop: 24,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: { color: '#be123c', fontWeight: '600' },
});
