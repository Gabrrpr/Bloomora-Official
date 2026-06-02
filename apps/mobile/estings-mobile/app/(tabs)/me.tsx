import { router } from 'expo-router';
import {
  Bell,
  ChevronRight,
  Heart,
  HelpCircle,
  Info,
  MapPin,
  MessageCircle,
  PackageCheck,
  Settings,
  ShieldCheck,
  Sparkles,
  Truck,
  UserRound,
} from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, theme } from '@/constants/theme';

type RowIcon = typeof UserRound;

const outlineColor = 'rgba(31, 42, 36, 0.11)';
const hairlineColor = 'rgba(31, 42, 36, 0.09)';

const accountBenefits = [
  { icon: PackageCheck, label: 'Track orders' },
  { icon: MapPin, label: 'Save addresses' },
  { icon: Heart, label: 'Keep favorites' },
  { icon: Bell, label: 'Get updates' },
];

export default function MeScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + theme.spacing.lg;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: insets.bottom + 104,
          paddingTop: topPadding,
        },
      ]}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Account</Text>
        <Pressable
          accessibilityLabel="Open settings"
          accessibilityRole="button"
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}>
          <Settings size={22} color={theme.colors.text} strokeWidth={2.2} />
        </Pressable>
      </View>

      <View style={styles.signInPanel}>
        <AnimatedAccountPreview />
        <View style={styles.signInCopy}>
          <Text style={styles.signInTitle}>Sign in to track orders</Text>
          <Text style={styles.signInText}>Save delivery details, keep favorite arrangements, and checkout faster next time.</Text>
        </View>
        <View style={styles.authActions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(auth)/login')}
            style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}>
            <Text style={styles.primaryActionText}>Sign in</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(auth)/sign-up')}
            style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}>
            <Text style={styles.secondaryActionText}>Create account</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.benefitGrid}>
        {accountBenefits.map((benefit) => (
          <View key={benefit.label} style={styles.benefitCell}>
            <View style={styles.benefitIcon}>
              <benefit.icon size={20} color={theme.colors.primary} strokeWidth={2.1} />
            </View>
            <Text style={styles.benefitText}>{benefit.label}</Text>
          </View>
        ))}
      </View>

      <SectionHeader title="Support" />
      <View style={styles.menuGroup}>
        <AccountRow icon={MessageCircle} title="Live chat" detail="Ask about flowers or deliveries" onPress={() => router.push('/live-chat')} />
        <Divider />
        <AccountRow icon={HelpCircle} title="Contact us" detail="Branches and support" onPress={() => router.push('/contact')} />
        <Divider />
        <AccountRow icon={Info} title="About Esting's" detail="Our story" onPress={() => router.push('/about')} />
      </View>

      <SectionHeader title="Information" />
      <View style={styles.menuGroup}>
        <AccountRow icon={ShieldCheck} title="Terms and Conditions" onPress={() => router.push('/terms-and-condition')} />
        <Divider />
        <AccountRow icon={PackageCheck} title="Return Policy" onPress={() => router.push('/return-policy')} />
      </View>
    </ScrollView>
  );
}

function AnimatedAccountPreview() {
  const progress = useSharedValue(0);
  const sparkleProgress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.cubic) }),
      ),
      -1,
      false,
    );
    sparkleProgress.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [progress, sparkleProgress]);

  const bloomStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -8]) },
      { scale: interpolate(progress.value, [0, 1], [1, 1.04]) },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.38, 0.12]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.92, 1.16]) }],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sparkleProgress.value, [0, 0.5, 1], [0.45, 1, 0.45]),
    transform: [
      { rotate: `${interpolate(sparkleProgress.value, [0, 1], [-10, 10])}deg` },
      { scale: interpolate(sparkleProgress.value, [0, 1], [0.92, 1.08]) },
    ],
  }));

  return (
    <View style={styles.animationStage}>
      <Animated.View style={[styles.pulseRing, ringStyle]} />
      <Animated.View style={[styles.accountBadge, bloomStyle]}>
        <UserRound size={36} color={theme.colors.white} strokeWidth={2} />
      </Animated.View>
      <Animated.View style={[styles.sparkleBadge, sparkleStyle]}>
        <Sparkles size={19} color={theme.colors.primary} strokeWidth={2.2} />
      </Animated.View>
      <View style={styles.userBadge}>
        <Truck size={18} color={theme.colors.primaryDark} strokeWidth={2.2} />
      </View>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

function AccountRow({
  detail,
  icon: Icon,
  onPress,
  title,
}: {
  detail?: string;
  icon: RowIcon;
  onPress?: () => void;
  title: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.accountRow, pressed && styles.pressed]}
      onPress={onPress}>
      <View style={styles.rowIcon}>
        <Icon size={20} color={theme.colors.textMuted} strokeWidth={2} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      </View>
      <ChevronRight size={18} color={theme.colors.textMuted} strokeWidth={2} />
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.surfaceAlt,
    flex: 1,
  },
  content: {
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  headerIconButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: outlineColor,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  title: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 30,
    letterSpacing: 0,
    lineHeight: 36,
  },
  signInPanel: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: outlineColor,
    borderRadius: 20,
    borderWidth: 1,
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  animationStage: {
    alignItems: 'center',
    height: 136,
    justifyContent: 'center',
    position: 'relative',
    width: 170,
  },
  pulseRing: {
    backgroundColor: theme.colors.greenSoft,
    borderColor: 'rgba(46, 139, 52, 0.16)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 118,
    position: 'absolute',
    width: 118,
  },
  accountBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderColor: 'rgba(255, 255, 255, 0.86)',
    borderRadius: theme.radius.pill,
    borderWidth: 3,
    height: 88,
    justifyContent: 'center',
    shadowColor: theme.colors.primaryDark,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    width: 88,
  },
  sparkleBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderColor: outlineColor,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    position: 'absolute',
    right: 30,
    top: 20,
    width: 42,
  },
  userBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderColor: 'rgba(46, 139, 52, 0.2)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    bottom: 18,
    height: 38,
    justifyContent: 'center',
    left: 36,
    position: 'absolute',
    width: 38,
  },
  signInCopy: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  signInTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 22,
    letterSpacing: 0,
    lineHeight: 28,
    textAlign: 'center',
  },
  signInText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 300,
    textAlign: 'center',
  },
  authActions: {
    gap: theme.spacing.sm,
    width: '100%',
  },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  primaryActionText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 19,
  },
  secondaryAction: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: outlineColor,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  secondaryActionText: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 19,
  },
  benefitGrid: {
    backgroundColor: theme.colors.surface,
    borderColor: outlineColor,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  benefitCell: {
    alignItems: 'center',
    borderColor: hairlineColor,
    gap: theme.spacing.xs,
    minHeight: 98,
    padding: theme.spacing.md,
    width: '50%',
  },
  benefitIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  benefitText: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  sectionTitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 15,
    lineHeight: 20,
  },
  sectionLine: {
    backgroundColor: hairlineColor,
    flex: 1,
    height: 1,
  },
  menuGroup: {
    backgroundColor: theme.colors.surface,
    borderColor: outlineColor,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accountRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 66,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  rowIcon: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  rowDetail: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
  },
  divider: {
    backgroundColor: hairlineColor,
    height: 1,
    marginLeft: 72,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
