import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FrameIcon, GalleryIcon, HomeIcon, UserIcon } from '@/components/icons';
import { colors, fonts } from '@/theme/tokens';

export default function TabsLayout() {
  const { bottom } = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryText,
        tabBarInactiveTintColor: colors.inkSub,
        // 한글 폰트는 위아래 여백이 커서 lineHeight·높이를 명시하지 않으면 라벨이 잘린다
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 16, marginTop: 2 },
        tabBarStyle: {
          height: 72 + bottom,
          paddingTop: 6,
          paddingBottom: bottom || 10,
          borderTopColor: colors.border,
          backgroundColor: colors.bg,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: '홈', tabBarIcon: ({ color, focused }) => <HomeIcon color={color} filled={focused} /> }}
      />
      <Tabs.Screen
        name="frames"
        options={{ title: '프레임', tabBarIcon: ({ color, focused }) => <FrameIcon color={color} filled={focused} /> }}
      />
      <Tabs.Screen
        name="gallery"
        options={{ title: '갤러리', tabBarIcon: ({ color, focused }) => <GalleryIcon color={color} filled={focused} /> }}
      />
      <Tabs.Screen
        name="my"
        options={{ title: '마이', tabBarIcon: ({ color, focused }) => <UserIcon color={color} filled={focused} /> }}
      />
    </Tabs>
  );
}
