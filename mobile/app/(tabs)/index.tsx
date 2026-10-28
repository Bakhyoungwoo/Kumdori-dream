import { useCallback } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { getQuota } from '@/api/frames';
import { getGallery } from '@/api/gallery';
import { ModeCard } from '@/components/ModeCard';
import { useAsync } from '@/hooks/useAsync';
import { QuotaBadge } from '@/components/QuotaBadge';
import { BellIcon } from '@/components/icons';
import { colors, fonts, layout, radius, type } from '@/theme/tokens';

const RECENT_COUNT = 3;

export default function HomeScreen() {
  // 쿼터는 생성형에만 적용되므로 모드 카드는 막지 않는다 (기본 합성은 항상 무료)
  const { data: quota, reload: reloadQuota } = useAsync(getQuota, []);
  const { data: recent, reload: reloadRecent } = useAsync(() => getGallery({ status: 'DONE' }).then((l) => l.slice(0, RECENT_COUNT)), []);
  // 다른 탭에서 돌아올 때마다 새로 만든 결과와 남은 횟수를 반영한다
  useFocusEffect(
    useCallback(() => {
      reloadQuota();
      reloadRecent();
    }, [reloadQuota, reloadRecent]),
  );

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

        {quota && <QuotaBadge remaining={quota.remaining} limit={quota.limit} />}

        <View style={styles.modes}>
          <ModeCard mode="photo" onPress={() => router.push('/frames')} />
          <ModeCard mode="video" />
        </View>

        <View style={styles.sectionHead}>
          <Text style={type.h2}>최근 결과물</Text>
          <Pressable accessibilityRole="link" onPress={() => router.push('/gallery')} hitSlop={12}>
            <Text style={styles.more}>전체보기</Text>
          </Pressable>
        </View>
        <View style={styles.recent}>
          {recent && recent.length === 0 && <Text style={type.caption}>아직 만든 결과물이 없어요</Text>}
          {recent?.map((item, i) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.title} 결과 보기`}
              onPress={() => router.push(`/results/${item.id}`)}
              style={[styles.strip, i === 0 && { backgroundColor: colors.ink }]}
            >
              {item.thumbnailUrl ? (
                <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} resizeMode="cover" accessibilityIgnoresInvertColors />
              ) : (
                item.tints.map((c, j) => <View key={j} style={[styles.cut, { backgroundColor: c }]} />)
              )}
            </Pressable>
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
    maxWidth: '32%', // 결과가 1~2개여도 한 칸 크기를 유지
    aspectRatio: 0.64, // 네컷 스트립 비율 유지
    padding: 6,
    gap: 4,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cut: { flex: 1, borderRadius: 4 },
  thumb: { flex: 1, borderRadius: 4 },
});
