import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { ConsentCheckbox } from '@/components/ConsentCheckbox';
import { FormAlert } from '@/components/FormAlert';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/hooks/useAuth';
import { NICKNAME_MAX, PASSWORD_MIN, validateEmail, validateNickname, validatePassword } from '@/lib/validation';
import { colors, fonts, layout } from '@/theme/tokens';

// TODO: 약관 동의 내역은 아직 API에 필드가 없어 화면에서만 확인한다
const TERMS = [
  { key: 'service', label: '(필수) 이용약관 동의' },
  { key: 'privacy', label: '(필수) 개인정보 수집·이용 동의' },
] as const;
type TermKey = (typeof TERMS)[number]['key'];

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [agreed, setAgreed] = useState<Record<TermKey, boolean>>({ service: false, privacy: false });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [duplicateEmail, setDuplicateEmail] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const refs = { password: useRef<TextInput>(null), confirm: useRef<TextInput>(null), nickname: useRef<TextInput>(null) };

  const allAgreed = TERMS.every((t) => agreed[t.key]);

  // 입력을 시작한 칸은 바로, 나머지는 가입하기를 누른 뒤에 오류를 보여준다
  const show = (value: string) => submitted || value.length > 0;
  const emailError =
    duplicateEmail && duplicateEmail === email.trim() ? '이미 가입된 이메일입니다.' : submitted ? validateEmail(email) : null;
  const passwordError = show(password) ? validatePassword(password) : null;
  const confirmError = show(confirm) && confirm !== password ? '비밀번호가 일치하지 않아요.' : null;
  const nicknameError = submitted ? validateNickname(nickname) : null;
  const termsError = submitted && !allAgreed ? '필수 약관에 동의해 주세요.' : null;

  async function submit() {
    setSubmitted(true);
    setFormError(null);
    const invalid =
      validateEmail(email) || validatePassword(password) || confirm !== password || validateNickname(nickname) || !allAgreed;
    if (invalid) return;
    setLoading(true);
    try {
      await signUp(email.trim(), password, nickname.trim());
      // 성공하면 루트 라우터가 환영 화면으로 전환한다
    } catch (e) {
      if (e instanceof ApiError && e.code === 'AUTH_003') setDuplicateEmail(email.trim());
      else setFormError(e instanceof ApiError ? e.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="회원가입" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TextField
            label="이메일"
            value={email}
            onChangeText={setEmail}
            error={emailError}
            errorAction={
              emailError === '이미 가입된 이메일입니다.' ? (
                <Pressable accessibilityRole="link" hitSlop={8} onPress={() => router.replace('/login')}>
                  <Text style={styles.inlineLink}>로그인하기</Text>
                </Pressable>
              ) : undefined
            }
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => refs.password.current?.focus()}
          />
          <TextField
            ref={refs.password}
            label="비밀번호"
            value={password}
            onChangeText={setPassword}
            error={passwordError}
            success={password.length >= PASSWORD_MIN && !passwordError ? `${PASSWORD_MIN}자 이상` : null}
            password
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            onSubmitEditing={() => refs.confirm.current?.focus()}
          />
          <TextField
            ref={refs.confirm}
            label="비밀번호 확인"
            value={confirm}
            onChangeText={setConfirm}
            error={confirmError}
            success={confirm.length > 0 && !confirmError ? '비밀번호가 일치해요' : null}
            password
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            onSubmitEditing={() => refs.nickname.current?.focus()}
          />
          <TextField
            ref={refs.nickname}
            label="닉네임"
            value={nickname}
            onChangeText={(t) => setNickname(t.slice(0, NICKNAME_MAX))}
            error={nicknameError}
            counter={{ value: nickname.length, max: NICKNAME_MAX }}
            autoCapitalize="none"
            returnKeyType="done"
          />

          <View style={styles.terms}>
            <ConsentCheckbox
              checked={allAgreed}
              onChange={(v) => setAgreed({ service: v, privacy: v })}
              label="전체 동의"
            />
            <View style={styles.divider} />
            {TERMS.map((t) => (
              <View key={t.key} style={styles.termRow}>
                <View style={{ flex: 1 }}>
                  <ConsentCheckbox
                    checked={agreed[t.key]}
                    onChange={(v) => setAgreed((a) => ({ ...a, [t.key]: v }))}
                    label={t.label}
                  />
                </View>
                {/* TODO: 약관 본문 화면 연결 */}
                <Text style={styles.view}>보기</Text>
              </View>
            ))}
            {termsError && <Text style={styles.termsError}>{termsError}</Text>}
          </View>

          {formError && <FormAlert message={formError} />}
        </ScrollView>

        <View style={styles.bottom}>
          <Button title="가입하기" loading={loading} onPress={submit} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { width: '100%', maxWidth: layout.maxFormWidth, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 4, paddingBottom: 16, gap: 14 },
  inlineLink: { fontFamily: fonts.bold, fontSize: 12, color: colors.primaryText, textDecorationLine: 'underline' },
  terms: { marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 2 },
  termRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  view: { fontFamily: fonts.regular, fontSize: 13, color: colors.inkSub, textDecorationLine: 'underline' },
  termsError: { fontFamily: fonts.regular, fontSize: 12, color: '#A12A2F', marginTop: 4 },
  bottom: { width: '100%', maxWidth: layout.maxFormWidth, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
});
