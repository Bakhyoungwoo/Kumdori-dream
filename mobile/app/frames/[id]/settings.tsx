import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ApiError } from '@/api/client';
import { createJob, getFrame, getQuota } from '@/api/frames';
import { uploadImage } from '@/api/uploads';
import { BottomBar } from '@/components/BottomBar';
import { Button } from '@/components/Button';
import { ConsentCheckbox } from '@/components/ConsentCheckbox';
import { FormAlert } from '@/components/FormAlert';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAsync } from '@/hooks/useAsync';
import { composeDraft, useComposeDraft } from '@/hooks/useComposeDraft';
import { colors, fonts, layout, radius, type } from '@/theme/tokens';

const MAX_REQUIREMENT = 200;
/** 프레임 슬롯 수에 맞춘 결과 1장을 AI가 생성한다 */
const IMAGE_COUNT = 1;

type Stage = 'idle' | 'uploading' | 'requesting';

export default function SettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const frameId = id;
  const { data: frame } = useAsync(() => getFrame(frameId), [frameId]);
  const { data: quota } = useAsync(getQuota, []);
  const draft = useComposeDraft();

  const [requirement, setRequirement] = useState('');
  const [consent, setConsent] = useState(false);
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const submitted = useRef(false);

  const photo = draft.frameId === frameId ? draft.photo : null;

  // 사진 없이 들어오면(새로고침 등) 입력 화면으로 돌려보낸다
  useEffect(() => {
    if (!submitted.current && frame && !photo) router.replace(`/frames/${frameId}/shoot`);
  }, [frame, photo, frameId]);

  if (!frame || !photo) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="생성 설정" />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const characterKey = frame.characterProfileImageKey;
  const characterName = frame.characterName ?? '캐릭터';
  // 쿼터 API가 응답하지 않으면 서버 검증(429)에 맡기고 막지 않는다
  const noQuota = quota != null && quota.remaining < IMAGE_COUNT;
  const needsText = requirement.trim().length === 0;
  const busy = stage !== 'idle';
  const canSubmit = consent && !needsText && !noQuota && !!characterKey && !busy;

  async function submit() {
    if (!frame || !photo || !characterKey) return;
    setError(null);
    try {
      // 1) 로컬 URI는 서버가 읽을 수 없으므로 presigned URL로 먼저 올리고 objectKey를 받는다
      let userImageKey = photo.objectKey;
      if (!userImageKey) {
        setStage('uploading');
        userImageKey = await uploadImage(photo);
        composeDraft.setUploadedKey(userImageKey);
      }
      // 2) 생성형 작업 요청: [사용자 사진, 프레임 캐릭터 이미지]
      setStage('requesting');
      const job = await createJob({
        frameId: frame.id,
        pipelineType: 'GENERATIVE',
        requirementText: requirement.trim(),
        imageCount: IMAGE_COUNT,
        inputs: [
          { slotIndex: 0, userImageKey },
          { slotIndex: 1, userImageKey: characterKey },
        ],
      });
      submitted.current = true;
      // 프레임 선택~설정 화면을 스택에서 걷어내고 진행 화면만 남긴다. 입력 초기화는 진행 화면에서 한다
      router.dismissAll();
      router.push(`/jobs/${job.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요.');
      if (e instanceof ApiError && e.status === 401) setError('로그인이 만료됐어요. 다시 로그인해 주세요.');
      setStage('idle');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="생성 설정" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.summary}>
            <View style={styles.thumbRow}>
              <Image source={{ uri: photo.uri }} style={styles.thumb} accessibilityLabel="내 사진" />
              {frame.characterProfileImageUrl ? (
                <Image source={{ uri: frame.characterProfileImageUrl }} style={styles.thumb} accessibilityLabel={`${characterName} 이미지`} />
              ) : (
                <View style={[styles.thumb, styles.thumbFallback]}>
                  <Text style={styles.thumbInitial}>{characterName.slice(0, 1)}</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.summaryTitle} numberOfLines={1}>
                {frame.title} · {frame.slotCount}컷
              </Text>
              <Text style={styles.summarySub} numberOfLines={1}>
                내 사진 + {characterName}
              </Text>
            </View>
            <Pressable accessibilityRole="link" hitSlop={10} onPress={() => router.navigate(`/frames/${frameId}/shoot`)}>
              <Text style={styles.edit}>수정</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={type.h2} nativeID="req-label">
              원하는 분위기 <Text style={styles.required}>(필수)</Text>
            </Text>
            <TextInput
              value={requirement}
              onChangeText={(t) => setRequirement(t.slice(0, MAX_REQUIREMENT))}
              placeholder="벚꽃이 흩날리는 봄 공원에서 같이 웃고 있는 느낌으로"
              placeholderTextColor={colors.inkSub}
              multiline
              accessibilityLabelledBy="req-label"
              accessibilityLabel="원하는 분위기, 필수"
              style={styles.textarea}
            />
            <View style={styles.helperRow}>
              <Text style={type.caption}>예: 장소, 계절, 색감, 표정</Text>
              <Text style={type.caption}>
                {requirement.length} / {MAX_REQUIREMENT}
              </Text>
            </View>
          </View>

          <View style={styles.info}>
            <Text style={styles.infoText}>
              AI가 두 사진과 분위기를 바탕으로 <Text style={styles.infoStrong}>{frame.slotCount}컷 프레임</Text>을 채워 결과
              1장을 만들어요.
            </Text>
          </View>

          <View style={styles.consent}>
            <ConsentCheckbox
              checked={consent}
              onChange={setConsent}
              label="사진 속 인물에게 사용 동의를 받았어요"
              description="본인이 아니거나 동의 없는 사진은 합성할 수 없어요."
            />
          </View>

          {error && <FormAlert message={error} />}
        </ScrollView>

        <BottomBar>
          <Text style={styles.estimate}>
            {noQuota ? (
              '오늘 생성 한도를 모두 썼어요.'
            ) : (
              <>
                예상 약 40초 · 이번에 <Text style={styles.estimateStrong}>{IMAGE_COUNT}장</Text> 차감
                {quota ? (
                  <>
                    {' '}
                    · 오늘 남은 <Text style={styles.estimateStrong}>{quota.remaining}장</Text>
                  </>
                ) : null}
              </>
            )}
          </Text>
          <Button
            title={stage === 'uploading' ? '사진 올리는 중…' : stage === 'requesting' ? '요청 중…' : '만들기'}
            disabled={!canSubmit}
            onPress={submit}
          />
          {!busy && !consent && <Text style={styles.hint}>동의 항목을 확인하면 만들 수 있어요.</Text>}
          {!busy && consent && needsText && <Text style={styles.hint}>원하는 분위기를 적어 주세요.</Text>}
        </BottomBar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', padding: 20, paddingTop: 8, gap: 22 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg - 2, backgroundColor: colors.surface },
  thumbRow: { flexDirection: 'row', gap: 6 },
  thumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.border },
  thumbFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardVideo },
  thumbInitial: { fontFamily: fonts.display, fontSize: 20, color: 'rgba(43,29,22,0.5)' },
  summaryTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  summarySub: { fontFamily: fonts.regular, fontSize: 12, color: colors.inkSub },
  edit: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primaryText },
  section: { gap: 10 },
  required: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primaryText },
  textarea: {
    minHeight: 120,
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
  info: { padding: 14, borderRadius: radius.md, backgroundColor: colors.cream },
  infoText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: '#4A3A31' },
  infoStrong: { fontFamily: fonts.bold, color: colors.ink },
  consent: { paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  estimate: { ...type.caption, fontSize: 13, textAlign: 'center' },
  estimateStrong: { fontFamily: fonts.bold, color: colors.ink },
  hint: { ...type.caption, textAlign: 'center' },
});
