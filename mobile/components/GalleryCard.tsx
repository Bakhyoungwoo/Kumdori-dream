import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { GalleryItem } from '@/api/types';
import { AlertIcon, CheckIcon } from './icons';
import { Mascot } from './Mascot';
import { formatDuration, formatRelative } from '@/lib/format';
import { colors, fonts, radius } from '@/theme/tokens';

type Props = {
  item: GalleryItem;
  onPress: () => void;
  onLongPress?: () => void;
  onRetry?: () => void;
  selectable?: boolean;
  selected?: boolean;
};

const pipelineLabel = (i: GalleryItem) =>
  i.kind === 'VIDEO' ? '영상' : i.pipeline === 'GENERATIVE' ? `생성형${i.status === 'PROCESSING' ? ` ${i.imageCount}장` : ''}` : '기본 합성';

export function GalleryCard({ item, onPress, onLongPress, onRetry, selectable, selected }: Props) {
  const processing = item.status === 'PROCESSING';
  const disabled = selectable && processing; // 생성 중인 항목은 선택할 수 없다
  const meta = `${formatRelative(item.createdAt)} · ${pipelineLabel(item)}`;

  return (
    <Pressable
      accessibilityRole={selectable ? 'checkbox' : 'button'}
      accessibilityState={selectable ? { checked: !!selected, disabled } : undefined}
      accessibilityLabel={`${item.title}, ${meta}, ${statusText(item)}`}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }, disabled && { opacity: 0.45 }]}
    >
      <View style={[styles.thumb, selected && styles.thumbSelected, { backgroundColor: thumbBg(item) }]}>
        <Thumb item={item} onRetry={selectable ? undefined : onRetry} />
        {selectable && !processing && (
          <View style={[styles.check, selected ? styles.checkOn : styles.checkOff]}>{selected && <CheckIcon size={16} />}</View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {meta}
      </Text>
    </Pressable>
  );
}

function statusText(i: GalleryItem) {
  if (i.status === 'PROCESSING') return `생성 중 ${i.progress}%`;
  if (i.status === 'FAILED') return `생성 실패, ${i.failureReason ?? ''}`;
  return '완료';
}

function thumbBg(i: GalleryItem) {
  if (i.status === 'PROCESSING') return colors.cream;
  if (i.status === 'FAILED') return colors.surface;
  if (i.kind === 'VIDEO' || i.pipeline === 'GENERATIVE') return i.tints[0];
  return colors.cream;
}

function Thumb({ item, onRetry }: { item: GalleryItem; onRetry?: () => void }) {
  if (item.status === 'PROCESSING') {
    return (
      <View style={styles.center}>
        <Mascot pose="think" size={76} decor />
        <View style={styles.bar}>
          <View style={[styles.fill, { width: `${item.progress}%` }]} />
        </View>
        <Text style={styles.processing}>생성 중 {item.progress}%</Text>
      </View>
    );
  }
  if (item.status === 'FAILED') {
    return (
      <View style={styles.center}>
        <AlertIcon size={32} />
        <Text style={styles.failed}>생성 실패</Text>
        {item.failureReason && <Text style={styles.reason}>{item.failureReason}</Text>}
        {onRetry && (
          <Pressable accessibilityRole="button" accessibilityLabel={`${item.title} 다시 시도`} onPress={onRetry} style={styles.retry} hitSlop={6}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        )}
      </View>
    );
  }
  if (item.kind === 'VIDEO') {
    return (
      <>
        <Svg width={40} height={40} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={11} fill="#fff" opacity={0.92} />
          <Path d="M10 8l6 4-6 4z" fill={colors.ink} />
        </Svg>
        {item.durationSec != null && (
          <View style={[styles.pill, { right: 8, bottom: 8 }]}>
            <Text style={styles.pillText}>{formatDuration(item.durationSec)}</Text>
          </View>
        )}
      </>
    );
  }
  if (item.pipeline === 'GENERATIVE') {
    return (
      <>
        <Svg width="100%" height="70%" viewBox="0 0 100 70" preserveAspectRatio="xMidYMax meet" style={styles.people}>
          <Circle cx={36} cy={30} r={11} fill="#fff" opacity={0.7} />
          <Path d="M16 70 C16 54 26 46 36 46 C46 46 56 54 56 70Z" fill="#fff" opacity={0.7} />
          <Circle cx={66} cy={27} r={12} fill="#fff" opacity={0.95} />
          <Path d="M44 70 C44 52 54 43 66 43 C78 43 88 52 88 70Z" fill="#fff" opacity={0.95} />
        </Svg>
        {item.imageCount > 1 && (
          <View style={[styles.pill, { right: 8, top: 8 }]}>
            <Svg width={12} height={12} viewBox="0 0 24 24">
              <Rect x={7} y={7} width={13} height={13} rx={2} fill="none" stroke="#fff" strokeWidth={2} />
              <Path d="M4 16V5a1 1 0 0 1 1-1h11" fill="none" stroke="#fff" strokeWidth={2} />
            </Svg>
            <Text style={styles.pillText}>{item.imageCount}장</Text>
          </View>
        )}
      </>
    );
  }
  return (
    <View style={[styles.strip, { height: `${Math.min(86, 22 + item.tints.length * 16)}%` }]}>
      {item.tints.map((t, i) => (
        <View key={i} style={[styles.cut, { backgroundColor: t }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, gap: 4 },
  thumb: { aspectRatio: 0.84, borderRadius: radius.lg - 4, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  thumbSelected: { borderWidth: 3, borderColor: colors.primary },
  center: { alignItems: 'center', gap: 8, paddingHorizontal: 14, alignSelf: 'stretch' },
  bar: { alignSelf: 'stretch', height: 6, borderRadius: 3, backgroundColor: '#F3DDCB', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary },
  processing: { fontFamily: fonts.bold, fontSize: 12, color: '#9E3712' },
  failed: { fontFamily: fonts.bold, fontSize: 13, color: '#A12A2F' },
  reason: { fontFamily: fonts.regular, fontSize: 12, color: colors.inkSub, textAlign: 'center' },
  retry: { marginTop: 2, height: 36, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, borderColor: colors.borderWarm, backgroundColor: colors.white, justifyContent: 'center' },
  retryText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  people: { position: 'absolute', bottom: 0 },
  pill: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2, paddingHorizontal: 7, borderRadius: radius.pill, backgroundColor: 'rgba(28,28,30,0.75)' },
  pillText: { fontFamily: fonts.semibold, fontSize: 11, color: colors.white },
  strip: { aspectRatio: 0.37, padding: 4, gap: 3, borderRadius: 6, backgroundColor: colors.ink },
  cut: { flex: 1, borderRadius: 2 },
  check: { position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.primaryText },
  checkOff: { borderWidth: 2, borderColor: colors.white, backgroundColor: 'rgba(28,28,30,0.25)' },
  title: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink, marginTop: 4 },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.inkSub },
});
