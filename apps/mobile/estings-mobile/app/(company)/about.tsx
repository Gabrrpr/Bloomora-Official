import { router } from 'expo-router';
import { ChevronLeft, Heart, Sparkles, Sprout, UsersRound } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { BloomScreen } from '@/components/bloom-ui';
import { theme } from '@/constants/theme';

const stats = [
  { value: '67', label: 'Years in Business' },
  { value: '50K+', label: 'Happy Customers' },
  { value: '2', label: 'Branch Locations' },
  { value: '1,000+', label: 'Arrangements / Month' },
];

const values = [
  {
    icon: Sprout,
    title: 'Freshness First',
    body: 'We work closely with local growers and trusted suppliers to make sure our flowers are fresh and long-lasting.',
  },
  {
    icon: Heart,
    title: 'Personal Touch',
    body: "Every arrangement is made by hand by our florists, with care and attention to every detail, whether it's a small order or something grand.",
  },
  {
    icon: Sparkles,
    title: 'Made with Care',
    body: 'Each order is prepared thoughtfully by our team to ensure it meets our standards before it reaches you.',
  },
  {
    icon: UsersRound,
    title: 'Community Love',
    body: 'Proudly Filipino, we continue to support local growers and give back in our own way.',
  },
];

export default function AboutScreen() {
  const [activeStatIndex, setActiveStatIndex] = useState(0);
  const activeStat = stats[activeStatIndex];
  const cardAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStatIndex((current) => (current + 1) % stats.length);
    }, 6500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    cardAnimation.setValue(0);
    Animated.timing(cardAnimation, {
      duration: 720,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [activeStatIndex, cardAnimation]);

  const activeCardStyle = {
    opacity: cardAnimation,
    transform: [
      {
        translateX: cardAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [28, 0],
        }),
      },
      {
        scale: cardAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.96, 1],
        }),
      },
    ],
  };

  const shadowCardStyle = {
    opacity: cardAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.32, 0.72],
    }),
    transform: [
      {
        translateX: cardAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [-10, 0],
        }),
      },
      { rotate: '4deg' },
    ],
  };

  return (
    <BloomScreen
      eyebrow="About Esting's"
      headerAction={
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={theme.icon.sm} color={theme.colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      }
      title="Where every bloom tells a story"
      subtitle="We create floral arrangements that help you say what words sometimes can't. Simple, thoughtful, and made with care.">
      <View style={styles.statCarousel}>
        <View style={styles.carouselBackdrop} />
        <Animated.View style={[styles.statCardShadow, shadowCardStyle]}>
          <Text style={styles.shadowValue}>{stats[(activeStatIndex + 1) % stats.length].value}</Text>
        </Animated.View>
        <Animated.View style={[styles.activeStatCard, activeCardStyle]}>
          <Text style={styles.carouselKicker}>{"Esting's by the numbers"}</Text>
          <Text style={styles.carouselValue}>{activeStat.value}</Text>
          <Text style={styles.carouselLabel}>{activeStat.label}</Text>
        </Animated.View>
        <View style={styles.carouselDots}>
          {stats.map((stat, index) => (
            <Pressable
              key={stat.label}
              style={[styles.carouselDot, activeStatIndex === index && styles.carouselDotActive]}
              onPress={() => setActiveStatIndex(index)}
            />
          ))}
        </View>
      </View>

      <View style={styles.storyCard}>
        <Text style={styles.kicker}>Our Story</Text>
        <Text style={styles.sectionTitle}>From a small flower shop to a name people trust</Text>
        <Text style={styles.paragraph}>
          {
            "Esting's Flower International Inc. started in 1959 in San Fernando, Pampanga, with a simple goal of bringing fresh, meaningful flowers to life's everyday moments."
          }
        </Text>
        <Text style={styles.paragraph}>
          Over the years, we were able to serve as concessionaires at the US bases in Clark and
          Subic, which helped us grow and reach more people. As the business expanded, we also had
          branches in Angeles and Dolores, along with San Fernando and Manila, each one carrying the
          same care and dedication that started in our very first shop.
        </Text>
        <Text style={styles.paragraph}>
          Today, the business is being carried forward by the children of the original owners,
          continuing what was built with love and consistency through the years. Every arrangement
          is still made by our team with the same attention and care {"we've"} always had - fresh
          flowers, honest craftsmanship, and service people can rely on.
        </Text>
        <View style={styles.memoryBox}>
          <Text style={styles.memoryText}>
            {"Look closely and you'll spot Esting's long before color."}
          </Text>
        </View>
      </View>

      <View style={styles.valuesSection}>
        <Text style={styles.kicker}>What We Stand For</Text>
        <Text style={styles.sectionTitle}>Our values</Text>
        <View style={styles.valueStack}>
          {values.map((value) => (
            <View key={value.title} style={styles.valueCard}>
              <View style={styles.valueIcon}>
                <value.icon size={theme.icon.sm} color={theme.colors.primary} />
              </View>
              <View style={styles.valueBody}>
                <Text style={styles.valueTitle}>{value.title}</Text>
                <Text style={styles.valueText}>{value.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </BloomScreen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.xs,
    minHeight: 36,
  },
  backText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  statCarousel: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderColor: theme.colors.subtleBorder,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 220,
    overflow: 'hidden',
    padding: theme.spacing.lg,
  },
  carouselBackdrop: {
    backgroundColor: 'rgba(46, 139, 52, 0.08)',
    borderRadius: theme.radius.pill,
    height: 148,
    position: 'absolute',
    right: -34,
    top: -42,
    width: 148,
  },
  statCardShadow: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    height: 132,
    justifyContent: 'center',
    opacity: 0.72,
    position: 'absolute',
    right: theme.spacing.lg,
    top: 40,
    transform: [{ rotate: '4deg' }],
    width: '82%',
  },
  shadowValue: {
    color: theme.colors.primary,
    fontSize: 38,
    fontWeight: '800',
    opacity: 0.24,
  },
  activeStatCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryDark,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 142,
    padding: theme.spacing.xl,
    width: '92%',
  },
  carouselKicker: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '800',
    opacity: 0.8,
    textTransform: 'uppercase',
  },
  carouselValue: {
    color: theme.colors.white,
    fontSize: 44,
    fontWeight: '800',
    lineHeight: 52,
  },
  carouselLabel: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: '700',
    opacity: 0.9,
    textAlign: 'center',
  },
  carouselDots: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
  carouselDot: {
    backgroundColor: 'rgba(46, 139, 52, 0.25)',
    borderRadius: theme.radius.pill,
    height: 7,
    width: 7,
  },
  carouselDotActive: {
    backgroundColor: theme.colors.primary,
    width: 22,
  },
  storyCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  kicker: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 27,
  },
  paragraph: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  memoryBox: {
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  memoryText: {
    color: theme.colors.primaryDark,
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '600',
    textAlign: 'center',
  },
  valuesSection: {
    gap: theme.spacing.md,
  },
  valueStack: {
    gap: theme.spacing.md,
  },
  valueCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  valueIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  valueBody: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  valueTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  valueText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
});
