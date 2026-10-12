import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, layout, type } from '@/theme/tokens';

// TODO: 검색·카테고리 필터, 공식/내 프레임 탭, 2열 프레임 카드
export default function FramesScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <Text style={type.h2} accessibilityRole="header">프레임</Text>
        <Text style={type.caption}>프레임 목록은 다음 단계에서 구현합니다.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', padding: 20, gap: 8 },
});
