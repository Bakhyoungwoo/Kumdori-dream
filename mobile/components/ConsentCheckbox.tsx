import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CheckIcon } from './icons';
import { colors, fonts, radius } from '@/theme/tokens';

type Props = { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string };

/** 초상권·저작권 확인 체크박스 */
export function ConsentCheckbox({ checked, onChange, label, description }: Props) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={() => onChange(!checked)}
      style={styles.row}
    >
      <View style={[styles.box, checked && styles.boxOn]}>{checked && <CheckIcon />}</View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.label}>{label}</Text>
        {description && <Text style={styles.desc}>{description}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 4, minHeight: 44 },
  box: {
    width: 24,
    height: 24,
    marginTop: 1,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.borderWarm,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: colors.primaryText, borderColor: colors.primaryText },
  label: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 21, color: colors.ink },
  desc: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.inkSub },
});
