import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { ApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { FormAlert } from '@/components/FormAlert';
import { Mascot } from '@/components/Mascot';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/hooks/useAuth';
import { validateEmail } from '@/lib/validation';
import { colors, fonts, layout, type } from '@/theme/tokens';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);

  const emailError = submitted ? validateEmail(email) : null;
  const passwordError = submitted && !password ? '비밀번호를 입력해 주세요.' : null;

  async function submit() {
    setSubmitted(true);
    setFormError(null);
    if (validateEmail(email) || !password) return;
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      // AUTH_001(이메일·비밀번호 불일치), AUTH_004(비활성 계정), 네트워크 오류 모두 서버 문구를 그대로 보여준다
      setFormError(e instanceof ApiError ? e.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Mascot pose="hello" size={68} />
            <Text style={styles.title} accessibilityRole="header">
              다시 만나서{'\n'}반가워요
            </Text>
          </View>

          <TextField
            label="이메일"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setFormError(null);
            }}
            error={emailError}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          <TextField
            ref={passwordRef}
            label="비밀번호"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setFormError(null);
            }}
            error={passwordError}
            password
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={submit}
          />
          {formError && <FormAlert message={formError} />}
        </ScrollView>

        <View style={styles.bottom}>
          <Button title="로그인" loading={loading} onPress={submit} />
          <Text style={styles.footer}>
            처음이신가요?{' '}
            <Link href="/signup" replace style={styles.link}>
              회원가입
            </Link>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { width: '100%', maxWidth: layout.maxFormWidth, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 8, gap: 16 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  title: { ...type.display, fontSize: 28 },
  bottom: { width: '100%', maxWidth: layout.maxFormWidth, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16, gap: 14 },
  footer: { ...type.body, fontSize: 14, color: colors.inkSub, textAlign: 'center' },
  link: { fontFamily: fonts.bold, color: colors.primaryText },
});
