import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { colors, layout, type } from '@/theme/tokens';

// TODO: 프로필, 생성량, 등록 대상 관리, 알림, 동의 내역, 약관
export default function MyScreen() {
  const { signOut } = useAuth();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <Text style={type.h2} accessibilityRole="header">마이</Text>
        <Button variant="secondary" title="로그아웃" onPress={signOut} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', padding: 20, gap: 16 },
});
