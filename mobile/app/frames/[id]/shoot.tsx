import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { getFrame } from '@/api/frames';
import { BottomBar } from '@/components/BottomBar';
import { Button } from '@/components/Button';
import { FramePreview } from '@/components/FramePreview';
import { Mascot } from '@/components/Mascot';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AlbumIcon, CameraIcon, CloseIcon } from '@/components/icons';
import { useAsync } from '@/hooks/useAsync';
import { composeDraft, useComposeDraft } from '@/hooks/useComposeDraft';
import { colors, fonts, layout, radius, type } from '@/theme/tokens';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: false,
  quality: 0.9,
  exif: false,
};

function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n${message}`);
  else Alert.alert(title, message);
}

export default function ShootScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const frameId = id;
  const { data: frame, loading } = useAsync(() => getFrame(frameId), [frameId]);
  const draft = useComposeDraft();
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    composeDraft.start(frameId);
  }, [frameId]);

  if (loading || !frame) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="사진 입력" />
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <Text style={[type.body, { textAlign: 'center', marginTop: 40 }]}>프레임을 찾을 수 없어요.</Text>
        )}
      </SafeAreaView>
    );
  }

  const photos = draft.frameId === frameId ? draft.photos : {};
  const filled = frame.slots.filter((s) => photos[s.slotIndex]).length;
  const firstEmpty = frame.slots.find((s) => !photos[s.slotIndex])?.slotIndex ?? null;
  const target = selected ?? firstEmpty;
  const done = filled === frame.slotCount;

  async function pick(from: 'camera' | 'album') {
    if (target == null) return;
    const perm =
      from === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      notify(
        from === 'camera' ? '카메라 권한이 필요해요' : '앨범 권한이 필요해요',
        '설정에서 권한을 허용한 뒤 다시 시도해 주세요.',
      );
      return;
    }
    const result =
      from === 'camera'
        ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
        : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (result.canceled || !result.assets[0]) return;
    composeDraft.setPhoto(target, result.assets[0].uri);
    setSelected(null); // 다음 빈 슬롯으로 자동 이동
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="사진 입력" />
      <Text style={styles.subtitle}>
        {frame.title} · {frame.slotCount}컷
      </Text>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.top}>
          <FramePreview
            tints={frame.tints}
            photos={photos}
            slotPreviews={Object.fromEntries(frame.slots.filter((slot) => slot.targetPreviewUrl).map((slot) => [slot.slotIndex, slot.targetPreviewUrl!]))}
            activeSlot={target}
            showNumbers
            style={styles.preview}
          />

          <View style={styles.slots} accessibilityRole="list">
            {frame.slots.map(({ slotIndex }) => {
              const uri = photos[slotIndex];
              const isTarget = target === slotIndex;
              return (
                <Pressable
                  key={slotIndex}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isTarget }}
                  accessibilityLabel={`${slotIndex + 1}컷, ${uri ? '입력 완료' : '비어 있음'}${isTarget ? ', 지금 입력할 차례' : ''}`}
                  onPress={() => setSelected(slotIndex)}
                  style={[styles.slot, isTarget && styles.slotActive]}
                >
                  <View style={[styles.slotThumb, !uri && (isTarget ? styles.thumbDashedOn : styles.thumbDashed)]}>
                    {uri ? (
                      <>
                        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`${slotIndex + 1}컷 사진 삭제`}
                          hitSlop={10}
                          onPress={() => composeDraft.removePhoto(slotIndex)}
                          style={styles.remove}
                        >
                          <CloseIcon size={10} />
                        </Pressable>
                      </>
                    ) : (
                      <Text style={[styles.slotNum, isTarget && { color: colors.primaryText }]}>{slotIndex + 1}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.slotTitle}>{slotIndex + 1}컷</Text>
                    <Text
                      style={[
                        styles.slotStatus,
                        uri ? { color: '#1F7A4E' } : isTarget ? { color: '#9E3712' } : null,
                      ]}
                    >
                      {isTarget ? (uri ? '교체할 사진 선택' : '지금 입력할 차례') : uri ? '입력 완료' : '대기'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            disabled={target == null}
            onPress={() => pick('camera')}
            style={({ pressed }) => [styles.action, styles.actionDark, (pressed || target == null) && { opacity: 0.6 }]}
          >
            <CameraIcon color={colors.white} />
            <Text style={[styles.actionText, { color: colors.white }]}>사진 촬영</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={target == null}
            onPress={() => pick('album')}
            style={({ pressed }) => [styles.action, styles.actionLight, (pressed || target == null) && { opacity: 0.6 }]}
          >
            <AlbumIcon />
            <Text style={styles.actionText}>앨범에서 선택</Text>
          </Pressable>
        </View>

        <View style={styles.tip}>
          <Mascot pose="hello" size={56} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.tipTitle}>잘 나오는 사진 팁</Text>
            <Text style={styles.tipItem}>✓ 얼굴이 정면으로 잘 보이게</Text>
            <Text style={styles.tipItem}>✓ 머리부터 어깨까지 잘리지 않게</Text>
            <Text style={styles.tipItem}>✓ 밝은 곳에서, 역광은 피해서</Text>
          </View>
        </View>
      </ScrollView>

      <BottomBar>
        <View style={styles.bottomRow}>
          <Text style={styles.progress} accessibilityLiveRegion="polite">
            <Text style={{ fontFamily: fonts.bold, color: colors.ink }}>{filled}</Text> / {frame.slotCount} 입력
          </Text>
          <Button
            title="다음"
            disabled={!done}
            onPress={() => router.push(`/frames/${frameId}/settings`)}
            style={{ flex: 1 }}
          />
        </View>
      </BottomBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  subtitle: { ...type.caption, textAlign: 'center', marginTop: -10, marginBottom: 6 },
  content: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', padding: 20, paddingTop: 8, gap: 16 },
  top: { flexDirection: 'row', gap: 16 },
  preview: { width: 112 },
  slots: { flex: 1, gap: 8 },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 66,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  slotActive: { backgroundColor: colors.primarySoft, borderWidth: 1.5, borderColor: colors.primary },
  slotThumb: { width: 44, height: 44, borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  thumbDashed: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#CFC4BB' },
  thumbDashedOn: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primaryText },
  slotNum: { fontFamily: fonts.bold, fontSize: 15, color: colors.inkSub },
  remove: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(28,28,30,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  slotStatus: { fontFamily: fonts.semibold, fontSize: 12, color: colors.inkSub },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1, height: 54, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionDark: { backgroundColor: colors.ink },
  actionLight: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.borderWarm },
  actionText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  tip: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: radius.lg - 2, backgroundColor: colors.cream },
  tipTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  tipItem: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: '#4A3A31' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progress: { fontFamily: fonts.regular, fontSize: 14, color: colors.inkSub },
});
