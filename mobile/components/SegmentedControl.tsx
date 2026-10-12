import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@/theme/tokens';

type Option<T extends string> = { value: T; label: string };
type Props<T extends string> = { options: Option<T>[]; value: T; onChange: (v: T) => void; label: string };

export function SegmentedControl<T extends string>({ options, value, onChange, label }: Props<T>) {
  return (
    <View style={styles.wrap} accessibilityRole="tablist" accessibilityLabel={label}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[styles.item, active && styles.active]}
          >
            <Text style={[styles.text, active && styles.activeText]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', padding: 4, borderRadius: radius.md, backgroundColor: colors.surface },
  item: { flex: 1, minHeight: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  active: { backgroundColor: colors.white, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  text: { fontFamily: fonts.medium, fontSize: 14, color: colors.inkSub },
  activeText: { fontFamily: fonts.bold, color: colors.ink },
});
