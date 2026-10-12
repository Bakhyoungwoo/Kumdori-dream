import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fonts, radius, shadow } from '@/theme/tokens';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function Button({ title, onPress, variant = 'primary', icon, disabled, loading = false, style }: Props) {
  const primary = variant === 'primary';
  const danger = variant === 'danger';
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        primary ? styles.primary : danger ? styles.danger : styles.secondary,
        primary && !disabled && shadow.cta,
        pressed && (primary ? styles.primaryPressed : danger ? styles.dangerPressed : styles.secondaryPressed),
        off && !(danger && loading) && styles.disabled,
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? <ActivityIndicator color={danger ? colors.white : colors.ink} /> : icon}
        {!loading && (
          <Text style={[styles.text, primary ? styles.primaryText : danger && !off ? styles.dangerText : styles.secondaryText]}>{title}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { height: 54, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  primary: { backgroundColor: colors.primary },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  secondary: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.borderWarm },
  secondaryPressed: { backgroundColor: colors.surface },
  // 삭제 등 되돌릴 수 없는 행동. 흰 글씨 대비 약 5.4:1
  danger: { backgroundColor: '#C0353A' },
  dangerPressed: { backgroundColor: '#A12A2F' },
  dangerText: { fontFamily: fonts.bold, color: colors.white },
  disabled: { backgroundColor: colors.border, borderColor: colors.border },
  text: { fontSize: 16 },
  // 주황 면 위에는 흰 글씨 대신 ink (대비 약 5.3:1)
  primaryText: { fontFamily: fonts.bold, color: colors.ink },
  secondaryText: { fontFamily: fonts.semibold, color: colors.ink },
});
