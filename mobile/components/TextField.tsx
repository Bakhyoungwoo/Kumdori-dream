import { forwardRef, ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { AlertIcon, EyeIcon } from './icons';
import { colors, fonts, radius } from '@/theme/tokens';

type Props = TextInputProps & {
  label: string;
  /** 오류 문구. 있으면 테두리가 빨간색이 된다 */
  error?: string | null;
  /** 통과한 조건(예: ✓ 8자 이상) */
  success?: string | null;
  /** 오류 옆에 붙는 링크 등 */
  errorAction?: ReactNode;
  counter?: { value: number; max: number };
  password?: boolean;
};

export const ERROR_TEXT = '#A12A2F';

export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, error, success, errorAction, counter, password, style, ...input },
  ref,
) {
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label} nativeID={`${label}-label`}>
        {label}
      </Text>
      <View>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={colors.inkSub}
          secureTextEntry={password && hidden}
          autoCapitalize="none"
          onFocus={(e) => {
            setFocused(true);
            input.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            input.onBlur?.(e);
          }}
          style={[
            styles.input,
            password && { paddingRight: 52 },
            focused && styles.focused,
            !!error && styles.invalid,
            style,
          ]}
          {...input}
        />
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? '비밀번호 보기' : '비밀번호 숨기기'}
            onPress={() => setHidden((h) => !h)}
            style={styles.eye}
          >
            <EyeIcon filled={!hidden} />
          </Pressable>
        )}
      </View>
      {error ? (
        <View style={styles.row} accessibilityLiveRegion="polite">
          <AlertIcon size={14} />
          <Text style={styles.error}>{error}</Text>
          {errorAction}
        </View>
      ) : success ? (
        <Text style={styles.success}>✓ {success}</Text>
      ) : null}
      {counter && (
        <Text style={styles.counter}>
          {counter.value} / {counter.max}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  input: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderWarm,
    backgroundColor: colors.white,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
  },
  focused: { borderColor: colors.primary },
  invalid: { borderColor: '#C0353A' },
  eye: { position: 'absolute', right: 3, top: 3, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  error: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: ERROR_TEXT },
  success: { fontFamily: fonts.semibold, fontSize: 12, color: '#1F7A4E' },
  counter: { fontFamily: fonts.regular, fontSize: 12, color: colors.inkSub, textAlign: 'right' },
});
