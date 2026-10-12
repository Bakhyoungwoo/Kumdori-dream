import { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout } from '@/theme/tokens';

type Props = { visible: boolean; onClose: () => void; children: ReactNode; label: string };

/** 확인·선택용 하단 시트. 바깥을 누르거나 뒤로 가기로 닫힌다 */
export function BottomSheet({ visible, onClose, children, label }: Props) {
  const { bottom } = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="닫기" accessibilityRole="button" />
      <View
        style={[styles.sheet, { paddingBottom: Math.max(bottom, 16) + 8 }]}
        accessibilityViewIsModal
        accessibilityLabel={label}
      >
        <View style={styles.handle} />
        <View style={styles.inner}>{children}</View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingHorizontal: 24 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  inner: { width: '100%', maxWidth: layout.maxFormWidth, alignSelf: 'center', gap: 14 },
});
