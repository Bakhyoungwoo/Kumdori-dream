import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ModeCard } from '@/components/ModeCard';
import { QuotaBadge } from '@/components/QuotaBadge';
import { BellIcon } from '@/components/icons';
import { colors, fonts, layout, radius, type } from '@/theme/tokens';

// TODO: GET /api/v1/me/quota, 최근 결과 API로 교체
const quota = { remaining: 3, limit: 5 };
const recent = [
  ['#F7B9A6', '#B9C3F7', '#F9D68A', '#A8DCC6'],
  ['#FDE3D6', '#E4E2FB', '#FDE3D6', '#E4E2FB'],
  ['#A8DCC6', '#F9D68A', '#B9C3F7', '#F7B9A6'],
];

export default function HomeScreen() {
  const blocked = quota.remaining <= 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={{ gap: 6 }}>
            <Text style={styles.hello}>안녕하세요!</Text>
            <Text style={type.display} accessibilityRole="header">
              오늘은 누구와{'\n'}찍어볼까요?
            </Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="알림" style={styles.bell}>
            <BellIcon />
          </Pressable>
        </View>

        <QuotaBadge remaining={quota.remaining} limit={quota.limit} />

        <View style={styles.modes}>
          <ModeCard mode="photo" disabled={blocked} onPress={() => router.push('/frames')} />
          <ModeCard mode="video" disabled={blocked} />
        </View>

        <View style={styles.sectionHead}>
          <Text style={type.h2}>최근 결과물</Text>
          <Pressable accessibilityRole="link" onPress={() => router.push('/gallery')} hitSlop={12}>
            <Text style={styles.more}>전체보기</Text>
          </Pressable>
        </View>
        <View style={styles.recent}>
          {recent.map((strip, i) => (
            <View key={i} style={[styles.strip, i === 0 && { backgroundColor: colors.ink }]}>
              {strip.map((c, j) => (
                <View key={j} style={[styles.cut, { backgroundColor: c }]} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 22,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  hello: { fontFamily: fonts.regular, fontSize: 14, color: colors.inkSub },
  bell: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modes: { flexDirection: 'row', gap: 12, marginTop: 18 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 },
  more: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primaryText },
  recent: { flexDirection: 'row', gap: 10 },
  strip: {
    flex: 1,
    aspectRatio: 0.64, // 네컷 스트립 비율 유지
    padding: 6,
    gap: 4,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cut: { flex: 1, borderRadius: 4 },
});
