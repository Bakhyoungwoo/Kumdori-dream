import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Mascot } from '@/components/Mascot';
import { Button } from '@/components/Button';
import { colors, fonts, layout, type } from '@/theme/tokens';

/** 첫 화면(온보딩). 소셜 로그인은 백엔드 지원 후 추가한다 */
export default function StartScreen() {
  const { height } = useWindowDimensions();
  const mascotSize = Math.round(Math.min(270, Math.max(150, height * 0.3)));
  const compact = height < 700;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        <View style={styles.inner}>
          <View style={[styles.top, compact && { gap: 4 }]}>
            <Text style={[styles.logo, compact && { marginBottom: 4 }]} accessibilityRole="header">
              OURCUT<Text style={{ color: colors.primary }}>.</Text>
            </Text>
            <Mascot pose="strip" size={mascotSize} decor label="네컷 사진 스트립을 든 OURCUT 마스코트" />
            <Text style={[styles.headline, compact && styles.headlineCompact]}>좋아하는 사람과{'\n'}한 컷에 담아요</Text>
            <Text style={styles.sub}>사진 한 장이면 네컷도, 춤 영상도 만들 수 있어요.</Text>
          </View>

          <View style={styles.actions}>
            <Button title="이메일로 로그인" onPress={() => router.push('/login')} />
            <Button variant="secondary" title="회원가입" onPress={() => router.push('/signup')} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  inner: { flex: 1, width: '100%', maxWidth: layout.maxFormWidth, alignSelf: 'center', gap: 24 },
  top: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 16 },
  logo: { fontFamily: fonts.display, fontSize: 26, color: colors.ink, marginBottom: 12 },
  headline: { ...type.display, fontSize: 32, lineHeight: 40, textAlign: 'center', marginTop: 16 },
  headlineCompact: { fontSize: 26, lineHeight: 33, marginTop: 8 },
  sub: { ...type.body, color: colors.inkSub, textAlign: 'center' },
  actions: { gap: 12, paddingBottom: 12 },
});
