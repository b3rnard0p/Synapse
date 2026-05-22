import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';

export default function Index() {
  const { isAuthenticated } = useAuthStore();
  
  if (typeof window !== 'undefined') {
    console.log('[AUTH_FLOW] Index.tsx avaliado. URL:', window.location.href, ' | isAuthenticated:', isAuthenticated);
  }

  // Na Web, o Google redireciona para a raiz. Se a URL contiver os dados do login (token),
  // mandamos o usuário para a tela de login para que o Expo Auth Session possa processar.
  if (typeof window !== 'undefined' && (window.location.hash.includes('token') || window.location.hash.includes('state'))) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }
  
  return <Redirect href="/(auth)/welcome" />;
}
