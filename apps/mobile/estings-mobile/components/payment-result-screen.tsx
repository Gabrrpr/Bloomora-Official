import { router } from 'expo-router';
import { ReceiptText, ShoppingBag, type LucideIcon } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, theme } from '@/constants/theme';

type PaymentResultScreenProps = {
  body: string;
  icon: LucideIcon;
  iconColor: string;
  secondaryLabel?: string;
  title: string;
};

export function PaymentResultScreen({
  body,
  icon: Icon,
  iconColor,
  secondaryLabel = 'View orders',
  title,
}: PaymentResultScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.spacing.xxl }]}
      style={styles.screen}>
      <View style={styles.panel}>
        <View style={styles.iconRing}>
          <Icon color={iconColor} size={42} strokeWidth={2.1} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/(tabs)/cart')}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <ShoppingBag color={theme.colors.white} size={18} strokeWidth={2.2} />
          <Text style={styles.primaryButtonText}>Return to cart</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/(tabs)/orders')}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
          <ReceiptText color={theme.colors.text} size={18} strokeWidth={2.2} />
          <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
        </Pressable>
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  panel: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.11)',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.xxl,
  },
  iconRing: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.pill,
    height: 86,
    justifyContent: 'center',
    width: 86,
  },
  title: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
  },
  body: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    minHeight: 48,
    paddingHorizontal: theme.spacing.xl,
    width: '100%',
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: 'rgba(31, 42, 36, 0.11)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: theme.spacing.xl,
    width: '100%',
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
