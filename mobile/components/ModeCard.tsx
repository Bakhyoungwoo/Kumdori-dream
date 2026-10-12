import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { colors, fonts, radius } from '@/theme/tokens';

type Mode = 'photo' | 'video';

type Props = { mode: Mode; onPress?: () => void; disabled?: boolean };

const COPY: Record<Mode, { title: string; sub: string; tag?: string }> = {
  photo: { title: '사진 만들기', sub: '프레임에 사진으로 합성' },
  video: { title: '영상 만들기', sub: '춤 영상으로 생성', tag: '참고 춤 영상 필요' },
};

/** 홈의 사진/영상 진입 카드. 일러스트가 카드 위로 튀어나오는 PlayMo 구성 */
export function ModeCard({ mode, onPress, disabled }: Props) {
  const c = COPY[mode];
  const photo = mode === 'photo';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${c.title}, ${c.sub}${c.tag ? `, ${c.tag}` : ''}`}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: photo ? colors.cardPhoto : colors.cardVideo },
        pressed && { transform: [{ scale: 0.98 }] },
        disabled && { opacity: 0.5 },
      ]}
    >
      <View style={styles.art} pointerEvents="none">
        {photo ? <PhotoArt /> : <VideoArt />}
      </View>
      <Text style={styles.title}>{c.title}</Text>
      <Text style={[styles.sub, { color: photo ? colors.cardPhotoInk : colors.cardVideoInk }]}>{c.sub}</Text>
      {c.tag && (
        <View style={styles.tag}>
          <Text style={styles.tagText}>{c.tag}</Text>
        </View>
      )}
    </Pressable>
  );
}

function PhotoArt() {
  return (
    <Svg width={118} height={98} viewBox="0 0 120 100">
      <G rotation={-8} origin="60, 50">
        <Rect x={34} y={4} width={40} height={94} rx={6} fill={colors.primary} stroke={colors.ink} strokeWidth={3} />
        <Rect x={40} y={11} width={28} height={18} rx={3} fill={colors.cream} />
        <Rect x={40} y={33} width={28} height={18} rx={3} fill="#B9C3F7" />
        <Rect x={40} y={55} width={28} height={18} rx={3} fill={colors.cream} />
        <Rect x={40} y={77} width={28} height={14} rx={3} fill="#F9D68A" />
      </G>
      <Path d="M92 18 Q94 26 102 28 Q94 30 92 38 Q90 30 82 28 Q90 26 92 18 Z" fill={colors.star} stroke={colors.ink} strokeWidth={2} />
      <Circle cx={18} cy={70} r={5} fill={colors.pop} />
    </Svg>
  );
}

function VideoArt() {
  return (
    <Svg width={118} height={98} viewBox="0 0 120 100">
      <G rotation={6} origin="55, 52">
        <Rect x={18} y={22} width={74} height={60} rx={12} fill={colors.pop} stroke={colors.ink} strokeWidth={3} />
      </G>
      <Path d="M48 40 L72 54 L48 68 Z" fill="#FFFDF8" stroke={colors.ink} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M96 30 q6 -8 12 0 t12 0" fill="none" stroke={colors.primary} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={102} cy={78} r={5} fill="#FF8FA3" />
      <Path d="M14 12 Q16 18 22 20 Q16 22 14 28 Q12 22 6 20 Q12 18 14 12 Z" fill={colors.star} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    height: 196,
    borderRadius: radius.xl,
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: 'flex-end',
    gap: 4,
  },
  art: { position: 'absolute', top: -34, left: 22 },
  title: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink },
  sub: { fontFamily: fonts.regular, fontSize: 13 },
  tag: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: colors.white,
  },
  tagText: { fontFamily: fonts.semibold, fontSize: 11, color: colors.cardVideoInk },
});
