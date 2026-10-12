import { StyleSheet, Text, View } from 'react-native';
import { Mascot, MascotPose } from './Mascot';
import { Button } from './Button';
import { colors, fonts, layout, type } from '@/theme/tokens';

type Props = {
  title: string;
  description?: string;
  pose?: MascotPose;
  actionLabel?: string;
  onAction?: () => void;
};

/** 빈 갤러리·한도 초과·오류처럼 사진이 없는 화면 — 크림 배경 + 마스코트 */
export function EmptyState({ title, description, pose = 'hello', actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.inner}>
        <Mascot pose={pose} size={180} decor />
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.desc}>{description}</Text>}
        {actionLabel && <Button title={actionLabel} onPress={onAction} style={styles.btn} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  title: { ...type.display, fontSize: 24, textAlign: 'center', marginTop: 8 },
  desc: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.inkSub, textAlign: 'center' },
  btn: { marginTop: 12, alignSelf: 'stretch' },
  // 태블릿에서 버튼이 화면 끝까지 늘어나지 않도록
  inner: { width: '100%', maxWidth: layout.maxFormWidth, alignItems: 'center', gap: 10 },
});
