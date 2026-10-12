import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout } from '@/theme/tokens';

/** 화면 하단 고정 CTA 영역. 콘텐츠를 가리지 않도록 화면에서 ScrollView 아래에 둔다 */
export function BottomBar({ children }: { children: ReactNode }) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(bottom, 12) }]}>
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingTop: 12, paddingHorizontal: 20, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border },
  inner: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', gap: 8 },
});
