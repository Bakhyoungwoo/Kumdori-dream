import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { createJob, getQuota } from '@/api/frames';
import { deleteResults, getResult } from '@/api/gallery';
import type { ResultDetail } from '@/api/types';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { useToast } from '@/components/Toast';
import { useAsync } from '@/hooks/useAsync';
import { formatBytes } from '@/lib/format';
import { colors, fonts, layout, radius, type } from '@/theme/tokens';

type Sheet = null | 'delete' | 'regenerate' | 'report';

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: result, loading } = useAsync(() => getResult(id), [id]);
  const { data: quota } = useAsync(getQuota, []);
  const [index, setIndex] = useState(0);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [busy, setBusy] = useState(false);
  const { toast, show } = useToast();
  const { bottom } = useSafeAreaInsets();

  const close = () => (router.canGoBack() ? router.back() : router.replace('/gallery'));

  if (loading || !result) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <TopBar onClose={close} />
        {loading ? (
          <ActivityIndicator color={colors.white} style={{ marginTop: 60 }} />
        ) : (
          <Text style={[type.body, { color: colors.white, textAlign: 'center', marginTop: 60 }]}>결과를 찾을 수 없어요.</Text>
        )}
      </SafeAreaView>
    );
  }

  const count = result.images.length;
  const image = result.images[index];
  const video = result.kind === 'VIDEO';
  const generative = result.pipeline === 'GENERATIVE';

  // TODO: 결과 이미지 URL 연동 후 expo-media-library 저장, expo-sharing 공유로 구현
  const notReady = () => show('결과 이미지 연동 후 사용할 수 있어요');

  async function remove() {
    setBusy(true);
    try {
      await deleteResults([result!.id]);
      setSheet(null);
      // 갤러리 위에 쌓인 화면이면 돌아가고(포커스 시 목록 갱신), 아니면 갤러리 탭으로 이동
      if (router.canGoBack()) router.back();
      else router.replace('/gallery');
    } finally {
      setBusy(false);
    }
  }

  async function regenerate() {
    setBusy(true);
    try {
      // TODO: 원래 잡의 입력(슬롯별 이미지 key)을 서버가 재사용하는 API로 교체
      const res = await createJob({
        frameId: result!.frameId ?? 0,
        inputs: [],
        ...(generative ? { requirementText: result!.requirementText, imageCount: result!.imageCount } : {}),
      });
      setSheet(null);
      router.replace(`/jobs/${res.jobId}`);
    } finally {
      setBusy(false);
    }
  }

  const overQuota = generative && quota != null && result.imageCount > quota.remaining;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="light" />
      <TopBar onClose={close} title={count > 1 ? `${index + 1} / ${count}` : undefined} />

      <View style={styles.stage}>
        <View style={styles.viewer}>
          <Preview result={result} index={index} />
          {count > 1 && (
            <>
              <NavButton dir="prev" disabled={index === 0} onPress={() => setIndex((i) => Math.max(0, i - 1))} />
              <NavButton dir="next" disabled={index === count - 1} onPress={() => setIndex((i) => Math.min(count - 1, i + 1))} />
            </>
          )}
        </View>
        {count > 1 && (
          <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {result.images.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotOn]} />
            ))}
          </View>
        )}
        <View style={styles.caption}>
          <Text style={styles.title}>
            {result.title} · {video ? '영상' : generative ? '생성형' : '기본 합성'}
          </Text>
          {result.requirementText && <Text style={styles.req}>“{result.requirementText}”</Text>}
        </View>
      </View>

      <View style={[styles.sheet, { paddingBottom: Math.max(bottom, 16) + 8 }]}>
        <View style={styles.inner}>
          <View style={styles.actions}>
            <Action label="공유" icon="share" onPress={notReady} />
            <Action label="다시 생성" icon="redo" onPress={() => setSheet('regenerate')} disabled={video} />
            <Action label="삭제" icon="trash" onPress={() => setSheet('delete')} />
            <Action label="신고" icon="flag" onPress={() => setSheet('report')} />
          </View>
          <Button
            title={`${video ? '영상' : count > 1 ? '이 사진' : '기기에'} 저장 · ${image?.format ?? 'PNG'} ${image ? formatBytes(image.sizeBytes) : ''}`}
            onPress={notReady}
          />
          {count > 1 && (
            <Pressable accessibilityRole="button" onPress={notReady} style={styles.saveAll}>
              <Text style={styles.saveAllText}>{count}장 모두 저장</Text>
            </Pressable>
          )}
        </View>
      </View>

      <BottomSheet visible={sheet === 'delete'} onClose={() => setSheet(null)} label="삭제 확인">
        <Text style={[type.h2, styles.center]}>{count > 1 ? `${count}장을 모두 삭제할까요?` : '이 결과를 삭제할까요?'}</Text>
        <Text style={[type.body, styles.sub]}>삭제하면 되돌릴 수 없어요.{'\n'}공유한 링크에서도 더 이상 볼 수 없어요.</Text>
        <View style={styles.row}>
          <Button variant="secondary" title="취소" onPress={() => setSheet(null)} style={{ flex: 1 }} />
          <Button variant="danger" title="삭제" loading={busy} onPress={remove} style={{ flex: 1 }} />
        </View>
      </BottomSheet>

      <BottomSheet visible={sheet === 'regenerate'} onClose={() => setSheet(null)} label="다시 생성 확인">
        <Text style={[type.h2, styles.center]}>같은 설정으로 다시 만들까요?</Text>
        <Text style={[type.body, styles.sub]}>
          {generative
            ? overQuota
              ? `오늘 남은 장수(${quota?.remaining ?? 0}장)가 부족해요.`
              : `이번에 ${result.imageCount}장 차감돼요 · 오늘 남은 ${quota?.remaining ?? '-'}장`
            : '기본 합성은 무료예요.'}
        </Text>
        <View style={styles.row}>
          <Button variant="secondary" title="취소" onPress={() => setSheet(null)} style={{ flex: 1 }} />
          <Button title="다시 만들기" loading={busy} disabled={overQuota} onPress={regenerate} style={{ flex: 1 }} />
        </View>
      </BottomSheet>

      <BottomSheet visible={sheet === 'report'} onClose={() => setSheet(null)} label="신고">
        <Text style={[type.h2, styles.center]}>이 결과를 신고할까요?</Text>
        <Text style={[type.body, styles.sub]}>부적절하거나 동의 없이 만들어진 결과라면 알려 주세요. 검토 후 조치할게요.</Text>
        <View style={styles.row}>
          <Button variant="secondary" title="취소" onPress={() => setSheet(null)} style={{ flex: 1 }} />
          <Button
            title="신고하기"
            onPress={() => {
              // TODO: 신고 API
              setSheet(null);
              show('신고가 접수됐어요');
            }}
            style={{ flex: 1 }}
          />
        </View>
      </BottomSheet>
      {toast}
    </SafeAreaView>
  );
}

function TopBar({ onClose, title }: { onClose: () => void; title?: string }) {
  return (
    <View style={styles.top}>
      <Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={onClose} style={styles.iconBtn}>
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Path d="M6 6l12 12M18 6L6 18" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
        </Svg>
      </Pressable>
      <Text style={styles.topTitle}>{title ?? ''}</Text>
      <View style={styles.iconBtn} />
    </View>
  );
}

function Preview({ result, index }: { result: ResultDetail; index: number }) {
  const img = result.images[index];
  if (img?.url) return <Image source={{ uri: img.url }} style={StyleSheet.absoluteFill} resizeMode="contain" accessibilityLabel={`${result.title} 결과 ${index + 1}`} />;
  // 목업: 이미지 URL이 없으면 기본 합성은 네컷 스트립, 생성형·영상은 단색 + 인물 실루엣
  if (result.pipeline === 'CV' && result.kind === 'PHOTO') {
    return (
      <View style={styles.stripWrap} accessibilityRole="image" accessibilityLabel={`${result.title} 네컷 결과`}>
        <View style={styles.strip}>
          {result.tints.map((t, i) => (
            <View key={i} style={[styles.cut, { backgroundColor: t }]} />
          ))}
          <Text style={styles.brand}>OURCUT</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: img?.tint ?? result.tints[0] }]} accessibilityRole="image" accessibilityLabel={`${result.title} 결과 ${index + 1}`}>
      <Svg width="100%" height="60%" viewBox="0 0 100 70" preserveAspectRatio="xMidYMax meet" style={{ position: 'absolute', bottom: 0 }}>
        <Circle cx={36} cy={30} r={11} fill="#fff" opacity={0.75} />
        <Path d="M16 70 C16 54 26 46 36 46 C46 46 56 54 56 70Z" fill="#fff" opacity={0.75} />
        <Circle cx={66} cy={27} r={12} fill="#fff" opacity={0.95} />
        <Path d="M44 70 C44 52 54 43 66 43 C78 43 88 52 88 70Z" fill="#fff" opacity={0.95} />
      </Svg>
      {result.kind === 'VIDEO' && (
        <View style={styles.play}>
          {/* TODO: 영상 플레이어 (2단계) */}
          <Svg width={64} height={64} viewBox="0 0 24 24">
            <Circle cx={12} cy={12} r={11} fill="#fff" opacity={0.92} />
            <Path d="M10 8l6 4-6 4z" fill={colors.ink} />
          </Svg>
        </View>
      )}
    </View>
  );
}

function NavButton({ dir, disabled, onPress }: { dir: 'prev' | 'next'; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={dir === 'prev' ? '이전 결과' : '다음 결과'}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.nav, dir === 'prev' ? { left: 6 } : { right: 6 }, disabled && { opacity: 0.3 }]}
    >
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path d={dir === 'prev' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Pressable>
  );
}

const ICONS = {
  share: ['M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6', 'M16 7l-4-4-4 4M12 3v13'],
  redo: ['M20 11a8 8 0 1 0-2.3 5.7', 'M20 4v7h-7'],
  trash: ['M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3'],
  flag: ['M5 21V4h11l-2 4 2 4H5'],
};

function Action({ label, icon, onPress, disabled }: { label: string; icon: keyof typeof ICONS; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} style={[styles.action, disabled && { opacity: 0.35 }]}>
      <Svg width={22} height={22} viewBox="0 0 24 24">
        {ICONS[icon].map((d) => (
          <Path key={d} d={d} fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </Svg>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgDark },
  top: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.white },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 24 },
  viewer: { width: '100%', maxWidth: 320, aspectRatio: 0.75, borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#2A2A2D' },
  stripWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgDark },
  strip: { height: '100%', aspectRatio: 0.37, padding: 8, gap: 6, borderRadius: 8, backgroundColor: colors.white },
  cut: { flex: 1, borderRadius: 3 },
  brand: { fontFamily: fonts.display, fontSize: 12, color: colors.ink, textAlign: 'center' },
  play: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  nav: { position: 'absolute', top: '50%', marginTop: -22, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(28,28,30,0.45)', alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#6B6B70' },
  dotOn: { width: 18, backgroundColor: colors.primary },
  caption: { width: '100%', maxWidth: 320, gap: 4 },
  title: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },
  req: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: '#C9C9CF' },
  sheet: { backgroundColor: colors.surfaceDark, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 16, paddingHorizontal: 20 },
  inner: { width: '100%', maxWidth: layout.maxFormWidth, alignSelf: 'center', gap: 12 },
  actions: { flexDirection: 'row' },
  action: { flex: 1, height: 64, alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionText: { fontFamily: fonts.regular, fontSize: 12, color: '#E6E6EA' },
  saveAll: { height: 40, alignItems: 'center', justifyContent: 'center' },
  saveAllText: { fontFamily: fonts.semibold, fontSize: 14, color: '#FFB08A' },
  center: { textAlign: 'center' },
  sub: { color: colors.inkSub, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 10, marginTop: 6 },
});
