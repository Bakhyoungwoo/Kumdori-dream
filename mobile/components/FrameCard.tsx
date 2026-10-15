import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { FrameSummary } from '@/api/types';
import { colors, fonts, radius } from '@/theme/tokens';

type Props = { frame: FrameSummary; onPress: () => void };

const formatCount = (count: number) => count >= 10000
  ? `${(count / 10000).toFixed(1).replace(/\.0$/, '')}만`
  : count.toLocaleString('ko-KR');

export function FrameCard({ frame, onPress }: Props) {
  const meta = [frame.characterName, `${formatCount(frame.usageCount)}회 사용`].filter(Boolean).join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${frame.title}, ${frame.slotCount}컷${meta}${frame.recommended ? ', 추천' : ''}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.thumb}>
        {frame.previewUrl ? (
          <Image source={{ uri: frame.previewUrl }} style={styles.previewImage} resizeMode="contain" accessibilityIgnoresInvertColors />
        ) : (
          <View style={styles.strip}>
            {frame.tints.map((tint, index) => <View key={index} style={[styles.cut, { backgroundColor: tint }]} />)}
          </View>
        )}
        {frame.recommended && <View style={[styles.badge, styles.badgeLeft]}><Text style={styles.badgeHot}>추천</Text></View>}
        <View style={[styles.badge, styles.badgeRight]}><Text style={styles.badgeText}>{frame.slotCount}컷</Text></View>
      </View>
      <View style={styles.info}><Text style={styles.title} numberOfLines={1}>{frame.title}</Text><Text style={styles.meta} numberOfLines={1}>{meta}</Text></View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, gap: 8 },
  thumb: { aspectRatio: 0.98, borderRadius: radius.lg - 2, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  previewImage: { width: '90%', height: '90%' },
  strip: { height: '82%', aspectRatio: 0.37, padding: 4, gap: 3, borderRadius: 6, backgroundColor: colors.ink, transform: [{ rotate: '-4deg' }] },
  cut: { flex: 1, borderRadius: 2 },
  badge: { position: 'absolute', paddingVertical: 3, paddingHorizontal: 8, borderRadius: radius.pill },
  badgeLeft: { top: 10, left: 10, backgroundColor: colors.primary },
  badgeRight: { bottom: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.9)' },
  badgeHot: { fontFamily: fonts.bold, fontSize: 11, color: colors.ink },
  badgeText: { fontFamily: fonts.semibold, fontSize: 11, color: colors.ink },
  info: { gap: 2, paddingHorizontal: 2 },
  title: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.inkSub },
});
