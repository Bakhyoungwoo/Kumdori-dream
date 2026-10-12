import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getQuota } from '@/api/frames';
import { Button } from '@/components/Button';
import { Mascot } from '@/components/Mascot';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { colors, fonts, layout, type } from '@/theme/tokens';

/** 가입 직후 한 번만 보이는 환영 화면 */
export default function WelcomeScreen() {
  const { welcomeNickname, finishWelcome } = useAuth();
  const { data: quota } = useAsync(getQuota, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Mascot pose="cheer" size={230} decor label="만세하며 환영하는 마스코트" />
        <Text style={styles.title} accessibilityRole="header">
          환영해요,{'\n'}
          {welcomeNickname}님!
        </Text>
        <Text style={styles.sub}>
          {quota ? (
            <>
              생성형 합성은 하루 <Text style={styles.strong}>{quota.limit}장</Text>까지 만들 수 있어요.{'\n'}
            </>
          ) : null}
          기본 합성은 언제나 무료예요.
        </Text>
      </View>
      <View style={styles.bottom}>
        <Button title="첫 네컷 만들러 가기" onPress={finishWelcome} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { flex: 1, width: '100%', maxWidth: layout.maxFormWidth, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 10 },
  title: { ...type.display, fontSize: 30, lineHeight: 39, textAlign: 'center', marginTop: 12 },
  sub: { ...type.body, color: colors.inkSub, textAlign: 'center' },
  strong: { fontFamily: fonts.bold, color: colors.ink },
  bottom: { width: '100%', maxWidth: layout.maxFormWidth, alignSelf: 'center', padding: 24 },
});
