import { router } from 'expo-router';
import { ShoppingBag, XCircle } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, theme } from '@/constants/theme';

export default function PaymentCancelScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.spacing.xxl }]}
      style={styles.screen}>
      <View style={styles.panel}>
        <View style={styles.iconRing}>
          <XCircle color={theme.colors.danger} size={42} strokeWidth={2.1} />
        </View>
        <Text style={styles.title}>Payment cancelled</Text>
        <Text style={styles.body}>No payment was completed. Your cart is still available if you want to try again.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/(tabs)/cart')}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <ShoppingBag color={theme.colors.white} size={18} strokeWidth={2.2} />
          <Text style={styles.primaryButtonText}>Return to cart</Text>
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
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
