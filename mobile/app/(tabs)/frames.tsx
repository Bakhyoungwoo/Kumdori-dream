import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getArtists, getFrames } from '@/api/frames';
import { FrameCard } from '@/components/FrameCard';
import { SegmentedControl } from '@/components/SegmentedControl';
import { EmptyState } from '@/components/EmptyState';
import { SearchIcon } from '@/components/icons';
import { useAsync } from '@/hooks/useAsync';
import { colors, fonts, layout, radius, type } from '@/theme/tokens';

type Source = 'ARTIST' | 'USER_UPLOADED';

export default function FramesScreen() {
  const [source, setSource] = useState<Source>('ARTIST');
  const [artistId, setArtistId] = useState<number | null>(null);
  const [query, setQuery] = useState('');

  const artists = useAsync(getArtists, []);
  const frames = useAsync(() => getFrames({ source, artistId, query }), [source, artistId, query]);
  const list = useMemo(() => [...(frames.data ?? [])].sort((a, b) => b.usageCount - a.usageCount), [frames.data]);

  const header = (
    <View style={styles.header}>
      <Text style={styles.h1} accessibilityRole="header">
        프레임
      </Text>

      <View style={styles.search}>
        <SearchIcon />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="프레임 또는 아티스트 검색"
          placeholderTextColor={colors.inkSub}
          accessibilityLabel="프레임 검색"
          returnKeyType="search"
          style={styles.searchInput}
        />
      </View>

      <SegmentedControl<Source>
        label="프레임 종류"
        value={source}
        onChange={(v) => {
          setSource(v);
          setArtistId(null);
        }}
        options={[
          { value: 'ARTIST', label: '공식 프레임' },
          { value: 'USER_UPLOADED', label: '내 프레임' },
        ]}
      />

      {source === 'ARTIST' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {[{ id: null, name: '전체' }, ...(artists.data ?? [])].map((a) => {
            const active = artistId === a.id;
            return (
              <Pressable
                key={a.id ?? 'all'}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setArtistId(a.id)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{a.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.countRow}>
        <Text style={type.caption}>
          전체 <Text style={styles.count}>{list.length}</Text>
        </Text>
        <Text style={type.caption}>인기순</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={list.length % 2 === 1 ? [...list, null] : list}
        key="grid-2"
        numColumns={2}
        keyExtractor={(f, i) => (f ? String(f.id) : `ghost-${i}`)}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        columnWrapperStyle={styles.row}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) =>
          item ? (
            <View style={styles.cell}>
              <FrameCard frame={item} onPress={() => router.push(`/frames/${item.id}/shoot`)} />
            </View>
          ) : (
            // 홀수 개일 때 마지막 카드가 두 칸으로 늘어나지 않도록 빈 칸을 채운다
            <View style={styles.cell} />
          )
        }
        ListEmptyComponent={
          frames.loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : source === 'USER_UPLOADED' ? (
            <View style={{ height: 360 }}>
              <EmptyState title="아직 만든 프레임이 없어요" description="함께 찍고 싶은 사람의 사진으로 나만의 프레임을 만들 수 있어요." />
            </View>
          ) : (
            <Text style={[type.body, styles.empty]}>검색 결과가 없어요.</Text>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 24 },
  header: { gap: 14, paddingTop: 12, paddingBottom: 14 },
  h1: { fontFamily: fonts.bold, fontSize: 22, color: colors.ink },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.ink, paddingVertical: 0 },
  chips: { gap: 8 },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  chipTextActive: { fontFamily: fonts.bold, color: colors.white },
  countRow: { flexDirection: 'row', justifyContent: 'space-between' },
  count: { fontFamily: fonts.bold, color: colors.primaryText },
  row: { gap: 12, marginBottom: 16 },
  cell: { flex: 1 },
  empty: { textAlign: 'center', color: colors.inkSub, marginTop: 40 },
});
