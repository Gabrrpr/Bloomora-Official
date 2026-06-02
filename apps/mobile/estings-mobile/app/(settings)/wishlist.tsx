import { router } from 'expo-router';
import { ArrowRight, ChevronLeft, Heart } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, theme } from '@/constants/theme';

const outlineColor = 'rgba(31, 42, 36, 0.11)';

export default function WishlistScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom + theme.spacing.xl, paddingTop: insets.top + theme.spacing.lg }]}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="Go back" style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={28} color={theme.colors.primary} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.title}>Wishlist</Text>
      </View>

      <View style={styles.emptyPanel}>
        <View style={styles.emptyIconRing}>
          <View style={styles.emptyIcon}>
            <Heart size={34} color={theme.colors.primary} strokeWidth={2} />
          </View>
        </View>
        <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
        <Text style={styles.emptyText}>
          Bouquets and arrangements you save from the feed will appear here.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/')}
          style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}>
          <Text style={styles.primaryActionText}>Explore bouquets</Text>
          <ArrowRight size={17} color={theme.colors.white} strokeWidth={2.3} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.surfaceAlt,
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    minHeight: 44,
  },
  backButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    marginLeft: -6,
    width: 42,
  },
  title: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 26,
    lineHeight: 32,
  },
  emptyPanel: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: outlineColor,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
  },
  emptyIconRing: {
    alignItems: 'center',
    borderColor: 'rgba(46, 139, 52, 0.16)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 86,
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
    width: 86,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderColor: 'rgba(46, 139, 52, 0.12)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
  },
  primaryActionText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
