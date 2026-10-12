import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, radius } from '@/theme/tokens';

type Props = { label: string; selected?: boolean; onPress?: () => void };

/** 결과 장수, 화면비 같은 단일 선택 옵션 */
export function Chip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.selected]}
    >
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    minWidth: 64,
    paddingHorizontal: 14,
    borderRadius: radius.sm + 2,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { borderColor: colors.primaryText, backgroundColor: colors.primarySoft },
  text: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  selectedText: { fontFamily: fonts.bold, color: '#9E3712' },
});
