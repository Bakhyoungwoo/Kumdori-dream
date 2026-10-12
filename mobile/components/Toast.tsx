import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@/theme/tokens';

/** 잠깐 보였다 사라지는 안내. const { toast, show } = useToast() */
export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((m: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(m);
    timer.current = setTimeout(() => setMessage(null), 2400);
  }, []);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const toast = message ? (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.toast} accessibilityLiveRegion="polite" accessibilityRole="alert">
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  ) : null;
  return { toast, show };
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 120, alignItems: 'center', paddingHorizontal: 24 },
  toast: { maxWidth: 400, paddingVertical: 12, paddingHorizontal: 18, borderRadius: radius.pill, backgroundColor: 'rgba(43,29,22,0.92)' },
  text: { fontFamily: fonts.semibold, fontSize: 14, color: colors.white, textAlign: 'center' },
});
