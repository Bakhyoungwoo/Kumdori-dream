import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { Button } from '@/components/Button';
import { Mascot } from '@/components/Mascot';
import { ScreenHeader } from '@/components/ScreenHeader';
import { failureText, isFinished } from '@/api/gallery';
import { composeDraft } from '@/hooks/useComposeDraft';
import { useJobProgress } from '@/hooks/useJobProgress';
import { colors, fonts, layout, radius, type } from '@/theme/tokens';

// 사진(CV) 파이프라인 단계 — docs/DEVELOPMENT_PLAN.md 의 진행률 단계와 맞춘다
const STEPS = ['업로드', '인물 분리', '위치 정렬', '색감 보정', '프레임 조립'] as const;

export default function JobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { job, error } = useJobProgress(id);
  const progress = job?.status === 'DONE' ? 100 : (job?.progress ?? 0);
  useEffect(() => {
    // 요청이 접수됐으니 작성 중이던 입력은 비운다
    composeDraft.reset();
  }, []);
  const done = job?.status === 'DONE';
  const failed = job != null && isFinished(job.status) && !done;
  const current = Math.min(STEPS.length - 1, Math.floor((progress / 100) * STEPS.length));

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title={done ? '완성' : failed ? '생성 실패' : '사진 생성 중'} onBack={() => router.replace('/')} />
      <View style={styles.content}>
        <Mascot pose={done ? 'cheer' : 'think'} size={190} decor label={done ? '완성을 축하하는 마스코트' : '집중하는 마스코트'} />
        <Text style={styles.title} accessibilityLiveRegion="polite">
          {done ? '완성됐어요!' : failed ? '만들지 못했어요' : '열심히 만들고 있어요'}
        </Text>
        {failed && <Text style={type.caption}>{failureText(job)}</Text>}
        {error && !failed && <Text style={type.caption}>{error}</Text>}
        {!done && !failed && (
          <Text style={type.caption}>
            현재 단계: <Text style={{ fontFamily: fonts.bold, color: colors.ink }}>{STEPS[current]} 중</Text>
          </Text>
        )}

        <View
          style={styles.bar}
          accessibilityRole="progressbar"
          accessibilityLabel="전체 진행률"
          accessibilityValue={{ min: 0, max: 100, now: progress }}
        >
          <View style={[styles.fill, { width: `${progress}%` }]} />
        </View>
        <Text style={[type.caption, { alignSelf: 'flex-end' }]}>{progress}%</Text>

        <View style={styles.steps}>
          {STEPS.map((s, i) => {
            const state = done || i < current ? 'done' : i === current && !failed ? 'active' : 'wait';
            return (
              <View key={s} style={styles.step}>
                <StepIcon state={state} />
                <Text style={[styles.stepText, state === 'active' && styles.stepActive, state === 'wait' && styles.stepWait]}>
                  {s} {state === 'done' ? '완료' : state === 'active' ? '중' : '대기'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.bottom}>
        {done ? (
          <Button title="결과 보기" onPress={() => router.replace(`/results/${id}`)} />
        ) : failed ? (
          <>
            <Button title="다시 만들기" onPress={() => router.replace('/frames')} />
            <Button variant="secondary" title="갤러리로 이동" onPress={() => router.replace('/gallery')} />
          </>
        ) : (
          <>
            <Text style={[type.caption, { textAlign: 'center' }]}>앱을 닫아도 작업은 계속돼요. 완료되면 알려드릴게요.</Text>
            <Button variant="secondary" title="갤러리로 이동" onPress={() => router.replace('/gallery')} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function StepIcon({ state }: { state: 'done' | 'active' | 'wait' }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      {state === 'done' && (
        <>
          <Circle cx={12} cy={12} r={11} fill={colors.success} />
          <Path d="M7 12.5l3.2 3L17 9" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {state === 'active' && (
        <>
          <Circle cx={12} cy={12} r={10} fill={colors.primarySoft} stroke={colors.primary} strokeWidth={2} />
          <Circle cx={8} cy={12} r={1.6} fill={colors.primaryText} />
          <Circle cx={12} cy={12} r={1.6} fill={colors.primaryText} />
          <Circle cx={16} cy={12} r={1.6} fill={colors.primaryText} />
        </>
      )}
      {state === 'wait' && <Circle cx={12} cy={12} r={10} fill="none" stroke="#CFC4BB" strokeWidth={2} />}
    </Svg>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { flex: 1, width: '100%', maxWidth: layout.maxFormWidth, alignSelf: 'center', alignItems: 'center', paddingHorizontal: 24, gap: 8 },
  title: { ...type.display, fontSize: 26, marginTop: 8 },
  bar: { alignSelf: 'stretch', height: 12, marginTop: 12, borderRadius: radius.pill, backgroundColor: '#F3DDCB', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.primary },
  steps: { alignSelf: 'stretch', marginTop: 8, padding: 18, gap: 12, borderRadius: radius.lg, backgroundColor: colors.white },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepText: { fontFamily: fonts.regular, fontSize: 15, color: colors.ink },
  stepActive: { fontFamily: fonts.bold },
  stepWait: { color: colors.inkSub },
  bottom: { width: '100%', maxWidth: layout.maxFormWidth, alignSelf: 'center', padding: 24, paddingTop: 8, gap: 10 },
});
