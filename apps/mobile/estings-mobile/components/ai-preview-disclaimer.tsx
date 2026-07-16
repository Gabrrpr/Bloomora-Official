import { Info } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts, theme } from '@/constants/theme';

export const AI_PREVIEW_DISCLAIMER =
  'AI images are visual previews and small details may vary. Your florist will use the exact confirmed products and quantities in the price breakdown, so your order and total stay accurate.';

export function AiPreviewDisclaimer() {
  return (
    <View accessibilityRole="text" style={styles.container}>
      <Info color={theme.colors.textMuted} size={14} strokeWidth={2.1} />
      <Text style={styles.text}>{AI_PREVIEW_DISCLAIMER}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'flex-start', flexDirection: 'row', gap: 7, paddingHorizontal: 6 },
  text: { color: theme.colors.textMuted, flex: 1, fontFamily: Fonts.sans, fontSize: 10, lineHeight: 15 },
});
