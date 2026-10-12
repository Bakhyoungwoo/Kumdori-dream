import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { deleteResults, getGallery, retryJob } from '@/api/gallery';
import type { GalleryItem, GalleryKind, GalleryStatus } from '@/api/types';
import { BottomSheet } from '@/components/BottomSheet';
import { BottomBar } from '@/components/BottomBar';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { GalleryCard } from '@/components/GalleryCard';
import { useToast } from '@/components/Toast';
import { colors, fonts, layout, radius, type } from '@/theme/tokens';

const KINDS: { value: GalleryKind | null; label: string }[] = [
  { value: null, label: '전체' },
  { value: 'PHOTO', label: '사진' },
  { value: 'VIDEO', label: '영상' },
];
const STATUSES: { value: GalleryStatus | null; label: string }[] = [
  { value: null, label: '모든 상태' },
  { value: 'PROCESSING', label: '생성 중' },
  { value: 'DONE', label: '완료' },
  { value: 'FAILED', label: '실패' },
];

export default function GalleryScreen() {
  const [all, setAll] = useState<GalleryItem[] | null>(null);
  const [kind, setKind] = useState<GalleryKind | null>(null);
  const [status, setStatus] = useState<GalleryStatus | null>(null);
  const [statusSheet, setStatusSheet] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast, show } = useToast();

  const load = useCallback(() => {
    getGallery().then(setAll);
  }, []);
  // 탭으로 돌아올 때마다 새로 불러온다 (생성 완료·삭제 반영)
  useFocusEffect(load);

  const counts = useMemo(
    () => ({ all: all?.length ?? 0, PHOTO: all?.filter((i) => i.kind === 'PHOTO').length ?? 0, VIDEO: all?.filter((i) => i.kind === 'VIDEO').length ?? 0 }),
    [all],
  );
  const list = useMemo(() => (all ?? []).filter((i) => (!kind || i.kind === kind) && (!status || i.status === status)), [all, kind, status]);
  const selectable = list.filter((i) => i.status !== 'PROCESSING');

  function exitSelect() {
    setSelecting(false);
    setSelected(new Set());
  }

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function open(item: GalleryItem) {
    if (selecting) return toggle(item.id);
    if (item.status === 'DONE') router.push(`/results/${item.id}`);
    else if (item.status === 'PROCESSING') router.push(`/jobs/${item.id}`);
  }

  async function retry(item: GalleryItem) {
    await retryJob(item.id);
    show('다시 만들기 시작했어요');
    router.push(`/jobs/${item.id}`);
  }

  async function removeSelected() {
    setDeleting(true);
    try {
      await deleteResults([...selected]);
      show(`${selected.size}개를 삭제했어요`);
      setConfirmDelete(false);
      exitSelect();
      load();
    } finally {
      setDeleting(false);
    }
  }

  if (all && all.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top']}>
        <EmptyState
          pose="hello"
          title="아직 만든 결과물이 없어요"
          description="첫 네컷을 만들어 보세요."
          actionLabel="사진 만들기"
          onAction={() => router.push('/frames')}
        />
      </SafeAreaView>
    );
  }

  const header = (
    <View style={styles.header}>
      {selecting ? (
        <View style={styles.titleRow}>
          <Pressable accessibilityRole="button" onPress={exitSelect} hitSlop={10}>
            <Text style={styles.action}>취소</Text>
          </Pressable>
          <Text style={styles.selTitle} accessibilityLiveRegion="polite">
            {selected.size > 0 ? `${selected.size}개 선택됨` : '항목 선택'}
          </Text>
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={() =>
              setSelected(selected.size === selectable.length ? new Set() : new Set(selectable.map((i) => i.id)))
            }
          >
            <Text style={[styles.action, { color: colors.primaryText }]}>{selected.size === selectable.length && selectable.length > 0 ? '선택 해제' : '전체 선택'}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.titleRow}>
          <Text style={styles.h1} accessibilityRole="header">
            갤러리
          </Text>
          <Pressable accessibilityRole="button" onPress={() => setSelecting(true)} hitSlop={10}>
            <Text style={[styles.action, { color: colors.primaryText }]}>선택</Text>
          </Pressable>
        </View>
      )}

      {selecting ? (
        <Text style={type.caption}>생성 중인 항목은 끝난 뒤에 지울 수 있어요.</Text>
      ) : (
        <View style={styles.filters}>
          <View style={styles.chips} accessibilityRole="tablist">
            {KINDS.map((k) => {
              const active = kind === k.value;
              const n = k.value ? counts[k.value] : counts.all;
              return (
                <Pressable
                  key={k.label}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => setKind(k.value)}
                  style={[styles.chip, active && styles.chipOn]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextOn]}>
                    {k.label} {n}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`상태 필터, ${STATUSES.find((s) => s.value === status)?.label}`} onPress={() => setStatusSheet(true)} hitSlop={8}>
            <Text style={styles.statusBtn}>{STATUSES.find((s) => s.value === status)?.label} ▾</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={list.length % 2 === 1 ? [...list, null] : list}
        numColumns={2}
        keyExtractor={(i, idx) => (i ? i.id : `ghost-${idx}`)}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) =>
          item ? (
            <View style={styles.cell}>
              <GalleryCard
                item={item}
                selectable={selecting}
                selected={selected.has(item.id)}
                onPress={() => open(item)}
                onLongPress={() => {
                  if (item.status === 'PROCESSING') return;
                  setSelecting(true);
                  setSelected(new Set([item.id]));
                }}
                onRetry={() => retry(item)}
              />
            </View>
          ) : (
            <View style={styles.cell} />
          )
        }
        ListEmptyComponent={
          all == null ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <Text style={[type.body, styles.empty]}>조건에 맞는 결과가 없어요.</Text>
          )
        }
      />

      {selecting && (
        <BottomBar>
          <Button
            variant="danger"
            title={selected.size > 0 ? `${selected.size}개 삭제` : '삭제할 항목을 고르세요'}
            disabled={selected.size === 0}
            onPress={() => setConfirmDelete(true)}
          />
        </BottomBar>
      )}

      <BottomSheet visible={statusSheet} onClose={() => setStatusSheet(false)} label="상태 필터">
        <Text style={type.h2}>상태</Text>
        {STATUSES.map((s) => (
          <Pressable
            key={s.label}
            accessibilityRole="radio"
            accessibilityState={{ checked: status === s.value }}
            onPress={() => {
              setStatus(s.value);
              setStatusSheet(false);
            }}
            style={styles.option}
          >
            <Text style={[styles.optionText, status === s.value && { fontFamily: fonts.bold, color: colors.primaryText }]}>{s.label}</Text>
          </Pressable>
        ))}
      </BottomSheet>

      <BottomSheet visible={confirmDelete} onClose={() => setConfirmDelete(false)} label="삭제 확인">
        <Text style={[type.h2, { textAlign: 'center' }]}>{selected.size}개를 삭제할까요?</Text>
        <Text style={[type.body, { color: colors.inkSub, textAlign: 'center' }]}>삭제하면 되돌릴 수 없어요.</Text>
        <View style={styles.sheetRow}>
          <Button variant="secondary" title="취소" onPress={() => setConfirmDelete(false)} style={{ flex: 1 }} />
          <Button variant="danger" title="삭제" loading={deleting} onPress={removeSelected} style={{ flex: 1 }} />
        </View>
      </BottomSheet>
      {toast}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 24 },
  header: { gap: 14, paddingTop: 12, paddingBottom: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 },
  h1: { fontFamily: fonts.bold, fontSize: 22, color: colors.ink },
  selTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  action: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  filters: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { height: 36, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.border, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  chipTextOn: { fontFamily: fonts.bold, color: colors.white },
  statusBtn: { fontFamily: fonts.regular, fontSize: 13, color: colors.inkSub },
  row: { gap: 12, marginBottom: 18 },
  cell: { flex: 1 },
  empty: { textAlign: 'center', color: colors.inkSub, marginTop: 40 },
  option: { minHeight: 48, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  optionText: { fontFamily: fonts.regular, fontSize: 15, color: colors.ink },
  sheetRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
});
