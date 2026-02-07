import { useEffect } from 'react';
import { router, useSegments } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(roots)';

    if (!user && inAuthGroup) {
      router.replace('/sign-in');
    } else if (user && !inAuthGroup) {
      router.replace('/(roots)/(tabs)/map');
    }
  }, [user, loading, segments]);

  if (loading) {
    return null;
  }

  return <>{children}</>;
}