import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { colors } from '@/theme/tokens';

// TODO: 전체/사진/영상 필터, 상태 필터, 2열 결과 그리드
export default function GalleryScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top']}>
      <EmptyState
        pose="hello"
        title={'아직 만든 결과물이 없어요'}
        description="첫 네컷을 만들어 보세요."
        actionLabel="사진 만들기"
        onAction={() => router.push('/frames')}
      />
    </SafeAreaView>
  );
}
