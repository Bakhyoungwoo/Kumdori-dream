import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fonts, radius, shadow } from '@/theme/tokens';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function Button({ title, onPress, variant = 'primary', icon, disabled, loading = false, style }: Props) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        primary ? styles.primary : styles.secondary,
        primary && !disabled && shadow.cta,
        pressed && (primary ? styles.primaryPressed : styles.secondaryPressed),
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? <ActivityIndicator color={colors.ink} /> : icon}
        {!loading && <Text style={[styles.text, primary ? styles.primaryText : styles.secondaryText]}>{title}</Text>}
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
  disabled: { backgroundColor: colors.border, borderColor: colors.border },
  text: { fontSize: 16 },
  // 주황 면 위에는 흰 글씨 대신 ink (대비 약 5.3:1)
  primaryText: { fontFamily: fonts.bold, color: colors.ink },
  secondaryText: { fontFamily: fonts.semibold, color: colors.ink },
});
