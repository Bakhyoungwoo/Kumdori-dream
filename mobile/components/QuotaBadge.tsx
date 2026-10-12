import { StyleSheet, Text, View } from 'react-native';
import { StarIcon } from './icons';
import { colors, fonts, radius } from '@/theme/tokens';

type Props = { remaining: number; limit: number };

export function QuotaBadge({ remaining, limit }: Props) {
  const empty = remaining <= 0;
  return (
    <View
      accessible
      accessibilityLabel={`오늘 생성 가능 횟수 ${limit}회 중 ${remaining}회 남음`}
      style={[styles.badge, empty && styles.empty]}
    >
      <StarIcon color={empty ? colors.inkSub : colors.primaryText} />
      <Text style={styles.text}>{empty ? '오늘 생성 한도를 모두 썼어요' : `오늘 ${remaining} / ${limit}회 남음`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  empty: { backgroundColor: colors.surface },
  text: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
});
