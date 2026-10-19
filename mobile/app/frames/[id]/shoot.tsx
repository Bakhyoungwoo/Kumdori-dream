import { useEffect } from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { getFrame } from '@/api/frames';
import { BottomBar } from '@/components/BottomBar';
import { Button } from '@/components/Button';
import { FormAlert } from '@/components/FormAlert';
import { Mascot } from '@/components/Mascot';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AlbumIcon, CameraIcon, CloseIcon } from '@/components/icons';
import { useAsync } from '@/hooks/useAsync';
import { composeDraft, useComposeDraft } from '@/hooks/useComposeDraft';
import { withParticle } from '@/lib/format';
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

  const photo = draft.frameId === frameId ? draft.photo : null;
  const characterName = frame.characterName ?? '캐릭터';
  // 생성형 프레임 합성은 [내 사진, 캐릭터 이미지] 2장을 서로 다른 슬롯에 넣으므로 2컷 이상 + 캐릭터 이미지가 필요하다
  const unavailable = !frame.characterProfileImageKey || frame.slotCount < 2;

  async function pick(from: 'camera' | 'album') {
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
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;
    composeDraft.setPhoto({ uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="사진 입력" />
      <Text style={styles.subtitle}>
        {frame.title} · {frame.slotCount}컷
      </Text>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lead}>
          {withParticle(characterName)} 함께할 <Text style={styles.leadStrong}>내 사진 1장</Text>을 골라 주세요.
        </Text>

        <View style={styles.pair}>
          <View style={styles.pairItem}>
            <View
              style={[styles.tile, !photo && styles.tileEmpty]}
              accessible
              accessibilityRole="image"
              accessibilityLabel={photo ? '선택한 내 사진' : '내 사진, 아직 선택하지 않음'}
            >
              {photo ? (
                <>
                  <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="내 사진 삭제"
                    hitSlop={10}
                    onPress={() => composeDraft.removePhoto()}
                    style={styles.remove}
                  >
                    <CloseIcon size={12} />
                  </Pressable>
                </>
              ) : (
                <>
                  <CameraIcon size={28} color={colors.primaryText} />
                  <Text style={styles.tileHint}>사진을 넣어 주세요</Text>
                </>
              )}
            </View>
            <Text style={styles.pairLabel}>내 사진</Text>
            <Text style={[styles.pairStatus, photo && { color: '#1F7A4E' }]}>{photo ? '선택 완료' : '필수'}</Text>
          </View>

          <Text style={styles.plus} accessibilityElementsHidden importantForAccessibility="no">
            +
          </Text>

          <View style={styles.pairItem}>
            <View
              style={[styles.tile, { backgroundColor: frame.tints[1] ?? colors.cardVideo }]}
              accessible
              accessibilityRole="image"
              accessibilityLabel={`${characterName} 이미지, 프레임에서 자동으로 사용`}
            >
              {frame.characterProfileImageUrl ? (
                <Image source={{ uri: frame.characterProfileImageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <Text style={styles.characterInitial}>{characterName.slice(0, 1)}</Text>
              )}
              <View style={styles.autoBadge}>
                <Text style={styles.autoText}>자동</Text>
              </View>
            </View>
            <Text style={styles.pairLabel} numberOfLines={1}>
              {characterName}
            </Text>
            <Text style={styles.pairStatus}>프레임 캐릭터</Text>
          </View>
        </View>

        <Text style={styles.note}>
          {frame.slotCount}컷 프레임은 두 사진을 바탕으로 AI가 채워요. 사진은 더 넣지 않아도 돼요.
        </Text>

        {unavailable && (
          <FormAlert message="이 프레임은 캐릭터 이미지가 없어 지금 사용할 수 없어요. 다른 프레임을 골라 주세요." />
        )}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            disabled={unavailable}
            onPress={() => pick('camera')}
            style={({ pressed }) => [styles.action, styles.actionDark, (pressed || unavailable) && { opacity: 0.6 }]}
          >
            <CameraIcon color={colors.white} />
            <Text style={[styles.actionText, { color: colors.white }]}>{photo ? '다시 촬영' : '사진 촬영'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={unavailable}
            onPress={() => pick('album')}
            style={({ pressed }) => [styles.action, styles.actionLight, (pressed || unavailable) && { opacity: 0.6 }]}
          >
            <AlbumIcon />
            <Text style={styles.actionText}>{photo ? '다른 사진 선택' : '앨범에서 선택'}</Text>
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
            내 사진 <Text style={{ fontFamily: fonts.bold, color: colors.ink }}>{photo ? 1 : 0}</Text> / 1
          </Text>
          <Button
            title="다음"
            disabled={!photo || unavailable}
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
  lead: { ...type.body, color: colors.ink },
  leadStrong: { fontFamily: fonts.bold },
  pair: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  pairItem: { flex: 1, gap: 4 },
  tile: {
    aspectRatio: 0.78,
    borderRadius: radius.lg - 4,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
  },
  tileEmpty: { backgroundColor: colors.primarySoft, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primaryText },
  tileHint: { fontFamily: fonts.semibold, fontSize: 13, color: '#9E3712' },
  plus: { marginTop: 70, fontFamily: fonts.bold, fontSize: 20, color: colors.inkSub },
  characterInitial: { fontFamily: fonts.display, fontSize: 44, color: 'rgba(43,29,22,0.45)' },
  autoBadge: { position: 'absolute', top: 8, left: 8, paddingVertical: 3, paddingHorizontal: 8, borderRadius: radius.pill, backgroundColor: colors.white },
  autoText: { fontFamily: fonts.bold, fontSize: 11, color: colors.ink },
  remove: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(28,28,30,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pairLabel: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink, marginTop: 4 },
  pairStatus: { fontFamily: fonts.semibold, fontSize: 12, color: colors.inkSub },
  note: { ...type.caption, fontSize: 13, lineHeight: 19 },
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
