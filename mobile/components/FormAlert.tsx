import { StyleSheet, Text, View } from 'react-native';
import { AlertIcon } from './icons';
import { ERROR_TEXT } from './TextField';
import { fonts, radius } from '@/theme/tokens';

/** 폼 전체에 대한 오류(로그인 실패, 네트워크 오류 등) */
export function FormAlert({ message }: { message: string }) {
  return (
    <View style={styles.box} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      <AlertIcon size={20} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.sm + 2, backgroundColor: '#FDECEC' },
  text: { flex: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: ERROR_TEXT },
});
