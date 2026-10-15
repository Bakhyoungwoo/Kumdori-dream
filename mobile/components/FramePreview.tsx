import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fonts, radius } from '@/theme/tokens';

type Props = {
  tints: string[];
  /** slotIndex → 이미지 URI */
  photos?: Record<number, string>;
  slotPreviews?: Record<number, string>;
  activeSlot?: number | null;
  showNumbers?: boolean;
  style?: ViewStyle;
};

/** 네컷 스트립 형태의 프레임 미리보기. 슬롯 수(1~4)에 맞춰 세로로 나눈다 */
export function FramePreview({ tints, photos = {}, slotPreviews = {}, activeSlot = null, showNumbers, style }: Props) {
  return (
    <View style={[styles.strip, style]}>
      {tints.map((tint, i) => {
        const uri = photos[i];
        const active = activeSlot === i;
        return (
          <View key={i} style={[styles.cut, { backgroundColor: tint }, active && styles.active]}>
            {uri ? (
              <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
            ) : slotPreviews[i] ? (
              <Image source={{ uri: slotPreviews[i] }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
            ) : (
              showNumbers && <Text style={styles.num}>{i + 1}</Text>
            )}
          </View>
        );
      })}
      <Text style={styles.brand}>OURCUT</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { aspectRatio: 0.36, padding: 6, gap: 5, borderRadius: radius.sm, backgroundColor: colors.ink },
  cut: { flex: 1, borderRadius: 4, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  active: { borderWidth: 3, borderColor: colors.primary },
  num: { fontFamily: fonts.bold, fontSize: 18, color: 'rgba(43,29,22,0.45)' },
  brand: { fontFamily: fonts.display, fontSize: 11, color: colors.cream, textAlign: 'center', paddingTop: 2 },
});
