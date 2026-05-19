import { router } from 'expo-router';
import { ArrowRight, Clock3, PackageCheck, ShoppingBag, Sparkles, Truck } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBrandHeader } from '@/components/app-brand-header';
import { Fonts, theme } from '@/constants/theme';

const outlineColor = 'rgba(31, 42, 36, 0.11)';
const hairlineColor = 'rgba(31, 42, 36, 0.09)';

const orderStates = [
  { icon: Clock3, label: 'Pending', value: '0' },
  { icon: Truck, label: 'Delivery', value: '0' },
  { icon: PackageCheck, label: 'Completed', value: '0' },
];

export default function CartScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 104 }]}>
      <AppBrandHeader />

      <View style={styles.body}>
        <View>
          <Text style={styles.eyebrow}>ORDERS</Text>
          <Text style={styles.title}>Your Cart</Text>
        </View>

        <View style={styles.emptyPanel}>
          <View style={styles.emptyIconRing}>
            <View style={styles.emptyIcon}>
              <ShoppingBag size={34} color={theme.colors.primary} strokeWidth={2} />
            </View>
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>
            Saved bouquets and checkout details will appear here once you add something from the feed.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/')}
            style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}>
            <Text style={styles.primaryActionText}>Explore bouquets</Text>
            <ArrowRight size={17} color={theme.colors.white} strokeWidth={2.3} />
          </Pressable>
        </View>

        <View style={styles.statusPanel}>
          {orderStates.map((state, index) => (
            <View key={state.label} style={[styles.statusCell, index < orderStates.length - 1 && styles.statusDivider]}>
              <state.icon size={21} color={theme.colors.primary} strokeWidth={2} />
              <Text style={styles.statusValue}>{state.value}</Text>
              <Text style={styles.statusLabel}>{state.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.readyPanel}>
          <View style={styles.readyIcon}>
            <Sparkles size={20} color={theme.colors.primary} strokeWidth={2.2} />
          </View>
          <View style={styles.readyCopy}>
            <Text style={styles.readyTitle}>Checkout is ready</Text>
            <Text style={styles.readyText}>Delivery notes, payment, and order tracking will unlock when your cart has items.</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  content: {
    gap: theme.spacing.lg,
  },
  body: {
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontFamily: Fonts.condensedMedium,
    fontSize: 13,
    lineHeight: 16,
  },
  title: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 28,
    lineHeight: 34,
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
  statusPanel: {
    backgroundColor: theme.colors.surface,
    borderColor: outlineColor,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  statusCell: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
    paddingVertical: theme.spacing.lg,
  },
  statusDivider: {
    borderRightColor: hairlineColor,
    borderRightWidth: 1,
  },
  statusValue: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 17,
    lineHeight: 22,
  },
  statusLabel: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 15,
  },
  readyPanel: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: outlineColor,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  readyIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderColor: 'rgba(46, 139, 52, 0.11)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  readyCopy: {
    flex: 1,
    gap: 3,
  },
  readyTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
  },
  readyText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
});
