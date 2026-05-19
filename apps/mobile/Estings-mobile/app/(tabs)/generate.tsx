import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Layers3, Sparkles, WandSparkles } from 'lucide-react-native';

import { AppBrandHeader } from '@/components/app-brand-header';
import { AiDisclaimer } from '@/components/make-personal-ui';
import { theme } from '@/constants/theme';

type PersonalPath = {
  description: string;
  href: '/create/describe' | '/create/mix-and-match' | '/create/examples';
  icon: 'describe' | 'mix';
  gradient: 'purple' | 'pink';
  action: string;
  tint: string;
  title: string;
};

const personalPaths: PersonalPath[] = [
  {
    description: 'Pick your flowers and build your own bouquet your way.',
    href: '/create/mix-and-match',
    icon: 'mix',
    gradient: 'purple',
    action: 'Start building',
    tint: '#7C3AED',
    title: 'Mix & Match',
  },
  {
    description: 'Tell us the occasion, colors, and style. AI will shape the bouquet concept.',
    href: '/create/describe',
    icon: 'describe',
    gradient: 'pink',
    action: 'Describe it',
    tint: '#EC4899',
    title: 'Describe Your Arrangement',
  },
];

export default function GenerateScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 104 }]}>
      <AppBrandHeader />

      <View style={styles.body}>
        <View style={styles.pageIntro}>
          <View style={styles.kickerRow}>
            <Sparkles size={theme.icon.sm} color={theme.colors.primary} />
            <Text style={styles.kicker}>Make it personal</Text>
          </View>
          <Text style={styles.title}>Create your perfect bouquet</Text>
          <Text style={styles.subtitle}>Choose how you would like to build your arrangement.</Text>
        </View>

        <View style={styles.cardGrid}>
          {personalPaths.map((path) => (
            <SelectionCard key={path.href} path={path} />
          ))}
        </View>

        <AiDisclaimer />
      </View>
    </ScrollView>
  );
}

function SelectionCard({ path }: { path: PersonalPath }) {
  const Icon = path.icon === 'describe' ? WandSparkles : Layers3;

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.selectionCard, pressed && styles.pressed]}
      onPress={() => router.push(path.href)}>
      <View style={styles.cardImageFrame}>
        <AnimatedGradientPreview variant={path.gradient} />
        <View style={[styles.cardIcon, { backgroundColor: `${path.tint}18` }]}>
          <Icon size={theme.icon.md} color={path.tint} />
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{path.title}</Text>
        <Text style={styles.cardDescription}>{path.description}</Text>
        <View style={styles.cardActionRow}>
          <Text style={[styles.cardActionText, { color: path.tint }]}>{path.action}</Text>
          <ChevronRight size={theme.icon.sm} color={path.tint} />
        </View>
      </View>
    </Pressable>
  );
}

function AnimatedGradientPreview({ variant }: { variant: PersonalPath['gradient'] }) {
  const progress = useRef(new Animated.Value(0)).current;
  const palette =
    variant === 'purple'
      ? {
          base: '#7357F2',
          glowA: '#A855F7',
          glowB: '#5B6FF7',
          glowC: '#C084FC',
        }
      : {
          base: '#F47B9D',
          glowA: '#FDB4C7',
          glowB: '#EC4899',
          glowC: '#FB7185',
        };

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(progress, {
        duration: 5200,
        easing: Easing.inOut(Easing.sin),
        toValue: 1,
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => animation.stop();
  }, [progress]);

  const driftForward = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-18, 20, -18],
  });
  const driftBack = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [20, -22, 20],
  });
  const pulse = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 0.82, 0.5],
  });

  return (
    <View style={[styles.gradientPreview, { backgroundColor: palette.base }]}>
      <Animated.View
        style={[
          styles.gradientGlow,
          styles.gradientGlowTop,
          {
            backgroundColor: palette.glowA,
            opacity: pulse,
            transform: [{ translateX: driftForward }, { translateY: driftBack }, { rotate: '8deg' }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.gradientGlow,
          styles.gradientGlowBottom,
          {
            backgroundColor: palette.glowB,
            opacity: 0.58,
            transform: [{ translateX: driftBack }, { translateY: driftForward }, { rotate: '-10deg' }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.gradientSheen,
          {
            backgroundColor: palette.glowC,
            opacity: progress.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.16, 0.34, 0.16],
            }),
            transform: [{ translateX: driftForward }, { rotate: '-26deg' }],
          },
        ]}
      />
    </View>
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
    gap: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  pageIntro: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  kickerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
  },
  kicker: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text,
    fontSize: 27,
    fontWeight: '800',
    lineHeight: 34,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 310,
    textAlign: 'center',
  },
  cardGrid: {
    gap: theme.spacing.lg,
  },
  selectionCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    overflow: 'hidden',
  },
  cardImageFrame: {
    backgroundColor: theme.colors.surfaceAlt,
    height: 210,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  gradientPreview: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientGlow: {
    borderRadius: 999,
    height: 210,
    position: 'absolute',
    width: 260,
  },
  gradientGlowTop: {
    left: -56,
    top: -88,
  },
  gradientGlowBottom: {
    bottom: -96,
    right: -64,
  },
  gradientSheen: {
    height: 320,
    left: 18,
    position: 'absolute',
    top: -70,
    width: 90,
  },
  cardIcon: {
    alignItems: 'center',
    borderRadius: theme.radius.pill,
    bottom: theme.spacing.md,
    height: 46,
    justifyContent: 'center',
    position: 'absolute',
    right: theme.spacing.md,
    width: 46,
  },
  cardBody: {
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  cardDescription: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  cardActionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  cardActionText: {
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.84,
  },
});
