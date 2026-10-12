import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Jua_400Regular } from '@expo-google-fonts/jua';
import {
  IBMPlexSansKR_400Regular,
  IBMPlexSansKR_500Medium,
  IBMPlexSansKR_600SemiBold,
  IBMPlexSansKR_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-kr';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Jua_400Regular,
    IBMPlexSansKR_400Regular,
    IBMPlexSansKR_500Medium,
    IBMPlexSansKR_600SemiBold,
    IBMPlexSansKR_700Bold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootStack />
    </AuthProvider>
  );
}

function RootStack() {
  const { isSignedIn, initializing, welcomeNickname } = useAuth();
  if (initializing) return null;
  const welcoming = isSignedIn && !!welcomeNickname;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Protected guard={isSignedIn && !welcoming}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="frames/[id]/shoot" />
        <Stack.Screen name="frames/[id]/settings" />
        <Stack.Screen name="jobs/[id]" options={{ gestureEnabled: false }} />
        <Stack.Screen name="results/[id]" options={{ animation: 'fade', contentStyle: { backgroundColor: colors.bgDark } }} />
      </Stack.Protected>
      {/* 가입 직후에는 환영 화면만 열린다. "첫 네컷 만들러 가기"를 누르면 홈으로 전환 */}
      <Stack.Protected guard={welcoming}>
        <Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
