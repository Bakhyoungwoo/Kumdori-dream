import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { createJob, getFrame, getQuota } from '@/api/frames';
import type { PipelineType } from '@/api/types';
import { BottomBar } from '@/components/BottomBar';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { ConsentCheckbox } from '@/components/ConsentCheckbox';
import { RadioCard } from '@/components/RadioCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAsync } from '@/hooks/useAsync';
import { useComposeDraft } from '@/hooks/useComposeDraft';
import { colors, fonts, layout, radius, type } from '@/theme/tokens';

const MAX_REQUIREMENT = 200;
const COUNTS = [1, 2, 3, 4] as const;

export default function SettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const frameId = Number(id);
  const { data: frame } = useAsync(() => getFrame(frameId), [frameId]);
  const { data: quota } = useAsync(getQuota, []);
  const draft = useComposeDraft();

  const [mode, setMode] = useState<PipelineType>('CV');
  const [requirement, setRequirement] = useState('');
  const [imageCount, setImageCount] = useState(1);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitted = useRef(false);

  const photos = draft.frameId === frameId ? draft.photos : {};
  const filled = Object.keys(photos).length;

  // 사진이 다 채워지지 않은 상태로 들어오면(새로고침 등) 입력 화면으로 돌려보낸다
  useEffect(() => {
    if (!submitted.current && frame && filled < frame.slotCount) router.replace(`/frames/${frameId}/shoot`);
  }, [frame, filled, frameId]);

  if (!frame) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="생성 설정" />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const generative = mode === 'GENERATIVE';
  const remaining = quota?.remaining ?? 0;
  const noQuota = generative && quota != null && remaining <= 0;
  // 남은 장수를 넘는 장수는 고를 수 없다 (요청 시 imageCount만큼 선차감)
  const overQuota = generative && quota != null && imageCount > remaining;
  const needsText = generative && requirement.trim().length === 0;
  const canSubmit = consent && !needsText && !noQuota && !overQuota && !submitting;

  async function submit() {
    if (!frame) return;
    setSubmitting(true);
    try {
      // TODO: POST /api/v1/uploads/presigned 로 슬롯별 업로드 후 받은 key 사용
      const res = await createJob({
        frameId,
        inputs: frame.slots.map((s) => ({ slotIndex: s.slotIndex, userImageKey: photos[s.slotIndex] })),
        ...(generative ? { requirementText: requirement.trim(), imageCount } : {}),
      });
      submitted.current = true;
      // 프레임 선택~설정 화면을 스택에서 걷어내고 진행 화면만 남긴다. 입력 초기화는 진행 화면에서 한다
      router.dismissAll();
      router.push(`/jobs/${res.jobId}`);
    } catch {
      setSubmitting(false);
    }
  }

  const thumbs = frame.slots.map((s) => (
    <Image key={s.slotIndex} source={{ uri: photos[s.slotIndex] }} style={generative ? styles.thumbSm : styles.thumb} />
  ));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="생성 설정" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {generative ? (
            <View style={styles.summaryCompact}>
              <View style={styles.thumbRow}>{thumbs}</View>
              <Text style={styles.summaryTitleSm} numberOfLines={1}>
                {frame.title} · {frame.slotCount}컷
              </Text>
              <EditLink frameId={frameId} />
            </View>
          ) : (
            <View style={styles.summary}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={styles.summaryTitle}>{frame.title}</Text>
                <Text style={styles.summaryOk}>✓ {frame.slotCount}컷 모두 입력됨</Text>
                <View style={styles.thumbRow}>{thumbs}</View>
              </View>
              <EditLink frameId={frameId} />
            </View>
          )}

          <View style={styles.section}>
            <Text style={type.h2}>합성 방식</Text>
            <View style={generative ? styles.radioRow : styles.radioCol} accessibilityRole="radiogroup">
              <RadioCard
                title="기본 합성"
                description={generative ? '무료 · 약 10초' : '프레임에 사진을 자연스럽게 배치해요. 몇 초면 끝나요.'}
                badge={{ label: '무료', tone: 'free' }}
                selected={!generative}
                compact={generative}
                onPress={() => setMode('CV')}
              />
              <RadioCard
                title="생성형 합성"
                description={generative ? '쿼터 사용 · 약 40초' : '원하는 분위기를 글로 적으면 AI가 새로 그려요.'}
                badge={{ label: '쿼터 사용', tone: 'quota' }}
                selected={generative}
                compact={generative}
                onPress={() => setMode('GENERATIVE')}
              />
            </View>
            {!generative && <Text style={type.caption}>요구사항 없이 만들면 기본 합성으로 처리돼요.</Text>}
          </View>

          {generative && (
            <>
              <View style={styles.section}>
                <Text style={type.h2} nativeID="req-label">
                  원하는 분위기
                </Text>
                <TextInput
                  value={requirement}
                  onChangeText={(t) => setRequirement(t.slice(0, MAX_REQUIREMENT))}
                  placeholder="벚꽃이 흩날리는 봄 공원에서 같이 웃고 있는 느낌으로"
                  placeholderTextColor={colors.inkSub}
                  multiline
                  accessibilityLabelledBy="req-label"
                  accessibilityLabel="원하는 분위기"
                  style={styles.textarea}
                />
                <View style={styles.helperRow}>
                  <Text style={type.caption}>예: 장소, 계절, 색감, 표정</Text>
                  <Text style={type.caption}>
                    {requirement.length} / {MAX_REQUIREMENT}
                  </Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={type.h2}>결과 장수</Text>
                <View style={styles.counts} accessibilityRole="radiogroup">
                  {COUNTS.map((n) => (
                    <View key={n} style={{ flex: 1 }}>
                      <Chip
                        label={`${n}장`}
                        selected={imageCount === n}
                        disabled={quota != null && n > remaining}
                        onPress={() => setImageCount(n)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}

          <View style={styles.consent}>
            <ConsentCheckbox
              checked={consent}
              onChange={setConsent}
              label="사진 속 인물에게 사용 동의를 받았어요"
              description="본인이 아니거나 동의 없는 사진은 합성할 수 없어요."
            />
          </View>
        </ScrollView>

        <BottomBar>
          <Text style={styles.estimate}>
            {generative ? (
              noQuota ? (
                '오늘 생성형 한도를 모두 썼어요. 기본 합성은 계속 쓸 수 있어요.'
              ) : (
                <>
                  예상 약 40초 · 이번에 <Text style={styles.estimateStrong}>{imageCount}장</Text> 차감 · 오늘 남은{' '}
                  <Text style={styles.estimateStrong}>{quota ? `${remaining}장` : '-'}</Text>
                </>
              )
            ) : (
              '예상 약 10초 · 쿼터 차감 없음'
            )}
          </Text>
          <Button
            title={submitting ? '요청 중…' : generative ? `사진 ${imageCount}장 만들기` : '사진 만들기'}
            disabled={!canSubmit}
            onPress={submit}
          />
          {!consent && <Text style={styles.hint}>동의 항목을 확인하면 만들 수 있어요.</Text>}
          {consent && needsText && <Text style={styles.hint}>원하는 분위기를 적어 주세요.</Text>}
        </BottomBar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function EditLink({ frameId }: { frameId: number }) {
  return (
    <Pressable accessibilityRole="link" hitSlop={10} onPress={() => router.navigate(`/frames/${frameId}/shoot`)}>
      <Text style={styles.edit}>수정</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', padding: 20, paddingTop: 8, gap: 22 },
  summary: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 14, borderRadius: radius.lg - 2, backgroundColor: colors.surface },
  summaryCompact: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 14, borderRadius: radius.lg - 4, backgroundColor: colors.surface },
  summaryTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  summaryTitleSm: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  summaryOk: { fontFamily: fonts.semibold, fontSize: 12, color: '#1F7A4E' },
  thumbRow: { flexDirection: 'row', gap: 6 },
  thumb: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.border },
  thumbSm: { width: 28, height: 28, borderRadius: 6, backgroundColor: colors.border },
  edit: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primaryText },
  section: { gap: 10 },
  radioCol: { gap: 10 },
  radioRow: { flexDirection: 'row', gap: 10 },
  textarea: {
    minHeight: 104,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  helperRow: { flexDirection: 'row', justifyContent: 'space-between' },
  counts: { flexDirection: 'row', gap: 8 },
  consent: { paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  estimate: { ...type.caption, fontSize: 13, textAlign: 'center' },
  estimateStrong: { fontFamily: fonts.bold, color: colors.ink },
  hint: { ...type.caption, textAlign: 'center' },
});
