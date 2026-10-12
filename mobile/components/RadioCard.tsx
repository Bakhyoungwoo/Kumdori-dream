import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@/theme/tokens';

type Props = {
  title: string;
  description: string;
  badge?: { label: string; tone: 'free' | 'quota' };
  selected: boolean;
  compact?: boolean;
  onPress: () => void;
};

/** 합성 방식처럼 설명이 붙는 단일 선택 카드 */
export function RadioCard({ title, description, badge, selected, compact, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${title}, ${description}${badge ? `, ${badge.label}` : ''}`}
      onPress={onPress}
      style={[styles.card, compact && styles.compact, selected ? styles.on : styles.off]}
    >
      {!compact && (
        <View style={[styles.dot, selected ? styles.dotOn : styles.dotOff]}>{selected && <View style={styles.dotInner} />}</View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.desc, compact && selected && { color: '#9E3712' }]}>{description}</Text>
      </View>
      {!compact && badge && (
        <View style={[styles.badge, badge.tone === 'free' ? styles.badgeFree : styles.badgeQuota]}>
          <Text style={[styles.badgeText, { color: badge.tone === 'free' ? '#1F7A4E' : '#9E3712' }]}>{badge.label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: radius.lg - 4 },
  compact: { flex: 1, paddingVertical: 12, paddingHorizontal: 14 },
  on: { backgroundColor: colors.primarySoft, borderWidth: 2, borderColor: colors.primary },
  off: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border },
  dot: { width: 22, height: 22, marginTop: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  dotOn: { backgroundColor: colors.primaryText },
  dotOff: { borderWidth: 1.5, borderColor: '#CFC4BB' },
  dotInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.white },
  title: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  desc: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.inkSub },
  badge: { alignSelf: 'flex-start', paddingVertical: 3, paddingHorizontal: 8, borderRadius: radius.pill },
  badgeFree: { backgroundColor: colors.white },
  badgeQuota: { backgroundColor: colors.white },
  badgeText: { fontFamily: fonts.bold, fontSize: 11 },
});
