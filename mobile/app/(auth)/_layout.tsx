import { Stack } from 'expo-router';
import { colors } from '@/theme/tokens';

export const unstable_settings = { initialRouteName: 'start' };

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}
