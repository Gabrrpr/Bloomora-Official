import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBrandHeader } from '@/components/app-brand-header';
import { GenerateComingSoon } from '@/components/generate-coming-soon';
import { theme } from '@/constants/theme';

// ─── Feature flag ──────────────────────────────────────────────────────────────
// Toggle this to `true` when the admin enables the "Make It Personal" feature.
// In production this value should come from your remote config / feature-flag
// service (e.g. Firebase Remote Config, LaunchDarkly, or your own API).
const IS_GENERATE_ENABLED = false;

export default function GenerateScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 96 },
        !IS_GENERATE_ENABLED && styles.contentDisabled,
      ]}>
      <AppBrandHeader />

      <View style={styles.header}>
        <Text style={styles.title}>Make It Personal</Text>
      </View>

      {IS_GENERATE_ENABLED ? (
        // The actual customization UI goes here when the feature is enabled.
        // Replace this placeholder with the real <MakePersonalUI /> component.
        <View />
      ) : (
        <GenerateComingSoon />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  content: {
    gap: theme.spacing.md,
  },
  contentDisabled: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  title: {
    color: theme.colors.text,
    fontSize: 25,
    fontWeight: '800',
    lineHeight: 31,
    textAlign: 'center',
  },
});
