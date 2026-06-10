import { useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { Fonts, theme } from '@/constants/theme';

const AnimatedSvgG = Animated.createAnimatedComponent(G);

// ─── Petal SVG (a single teardrop petal) ───────────────────────────────────────
function PetalShape({ color, opacity = 1 }: { color: string; opacity?: number }) {
  return (
    <Path
      d="M0,-38 C12,-28 18,-12 18,0 C18,10 10,18 0,18 C-10,18 -18,10 -18,0 C-18,-12 -12,-28 0,-38Z"
      fill={color}
      opacity={opacity}
    />
  );
}

// ─── Leaf SVG (curved leaf shape) ──────────────────────────────────────────────
function LeafShape({ color }: { color: string }) {
  return (
    <Path
      d="M0,0 C8,-18 22,-28 32,-22 C42,-16 38,2 24,14 C14,22 4,24 0,24 C-2,18 -4,8 0,0Z"
      fill={color}
    />
  );
}

// ─── Individual animated petal ─────────────────────────────────────────────────
function AnimatedPetal({
  angle,
  color,
  delay,
  distance,
  size,
}: {
  angle: number;
  color: string;
  delay: number;
  distance: number;
  size: number;
}) {
  const progress = useSharedValue(0);
  const floatY = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 3200, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
    floatY.value = withDelay(
      delay + 200,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
          withTiming(6, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );

    return () => {
      cancelAnimation(progress);
      cancelAnimation(floatY);
    };
  }, [delay, floatY, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 0.5, 1], [0.88, 1.08, 0.88]);
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0.55, 1, 0.55]);
    const rad = (angle * Math.PI) / 180;
    const x = Math.cos(rad) * distance;
    const y = Math.sin(rad) * distance;
    return {
      opacity,
      transform: [
        { translateX: x },
        { translateY: y + floatY.value },
        { rotate: `${angle + 90}deg` },
        { scale: scale * size },
      ],
    };
  });

  return (
    <Animated.View style={[styles.petalContainer, animatedStyle]}>
      <Svg width={36} height={56} viewBox="-18 -38 36 56">
        <PetalShape color={color} />
      </Svg>
    </Animated.View>
  );
}

// ─── Floating sparkle dot ──────────────────────────────────────────────────────
function FloatingSparkle({
  delay,
  left,
  top,
  size,
}: {
  delay: number;
  left: number;
  top: number;
  size: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(progress);
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0.85, 0]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -12]) },
      { scale: interpolate(progress.value, [0, 0.5, 1], [0.3, 1, 0.3]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          backgroundColor: theme.colors.primary,
          borderRadius: size / 2,
          height: size,
          left,
          position: 'absolute',
          top,
          width: size,
        },
        animatedStyle,
      ]}
    />
  );
}

// ─── Animated leaf ─────────────────────────────────────────────────────────────
function AnimatedLeaf({
  delay,
  offsetX,
  offsetY,
  rotation,
  color,
  scale: leafScale,
}: {
  delay: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  color: string;
  scale: number;
}) {
  const sway = useSharedValue(0);

  useEffect(() => {
    sway.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 3600, easing: Easing.inOut(Easing.sin) }),
          withTiming(-1, { duration: 3600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(sway);
  }, [delay, sway]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX },
      { translateY: offsetY },
      { rotate: `${rotation + sway.value * 8}deg` },
      { scale: leafScale },
    ],
  }));

  return (
    <Animated.View style={[styles.leafContainer, animatedStyle]}>
      <Svg width={42} height={32} viewBox="-4 -4 46 32">
        <LeafShape color={color} />
      </Svg>
    </Animated.View>
  );
}

// ─── Center bloom (pulsing circle) ─────────────────────────────────────────────
function CenterBloom() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.92, 1.1]) }],
    opacity: interpolate(pulse.value, [0, 1], [0.8, 1]),
  }));

  return (
    <Animated.View style={[styles.bloomCenter, animatedStyle]}>
      <Svg width={44} height={44} viewBox="-22 -22 44 44">
        <Circle r={18} fill={theme.colors.primary} opacity={0.2} />
        <Circle r={12} fill={theme.colors.primary} opacity={0.35} />
        <Circle r={6} fill={theme.colors.primary} opacity={0.7} />
        <Ellipse rx={3} ry={2} fill={theme.colors.amber} opacity={0.9} />
      </Svg>
    </Animated.View>
  );
}

// ─── Ring pulse (expanding ring around the flower) ─────────────────────────────
function RingPulse() {
  const ring = useSharedValue(0);

  useEffect(() => {
    ring.value = withDelay(
      800,
      withRepeat(
        withTiming(1, { duration: 3600, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(ring);
  }, [ring]);

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
    borderRadius: 999,
    height: 200,
    width: 200,
    position: 'absolute' as const,
    opacity: interpolate(ring.value, [0, 0.4, 1], [0.28, 0.12, 0]),
    transform: [{ scale: interpolate(ring.value, [0, 1], [0.6, 1.6]) }],
  }));

  return <Animated.View style={animatedStyle} />;
}

// ─── Petal ring config ─────────────────────────────────────────────────────────
const PETAL_CONFIGS = [
  // Inner ring – 5 petals, tight
  { angle: 0, distance: 40, size: 0.75, delay: 0, color: '#4CAF50' },
  { angle: 72, distance: 40, size: 0.75, delay: 200, color: '#66BB6A' },
  { angle: 144, distance: 40, size: 0.75, delay: 400, color: '#4CAF50' },
  { angle: 216, distance: 40, size: 0.75, delay: 600, color: '#66BB6A' },
  { angle: 288, distance: 40, size: 0.75, delay: 800, color: '#4CAF50' },
  // Outer ring – 5 petals, wider & offset
  { angle: 36, distance: 66, size: 0.6, delay: 300, color: '#81C784' },
  { angle: 108, distance: 66, size: 0.6, delay: 500, color: '#A5D6A7' },
  { angle: 180, distance: 66, size: 0.6, delay: 700, color: '#81C784' },
  { angle: 252, distance: 66, size: 0.6, delay: 900, color: '#A5D6A7' },
  { angle: 324, distance: 66, size: 0.6, delay: 1100, color: '#81C784' },
];

const SPARKLE_CONFIGS = [
  { left: 20, top: 30, size: 5, delay: 0 },
  { left: 180, top: 20, size: 4, delay: 600 },
  { left: 40, top: 160, size: 6, delay: 1200 },
  { left: 190, top: 150, size: 4, delay: 400 },
  { left: 110, top: 10, size: 5, delay: 800 },
  { left: 10, top: 100, size: 3, delay: 1000 },
  { left: 200, top: 90, size: 5, delay: 200 },
];

const LEAF_CONFIGS = [
  { offsetX: -86, offsetY: 50, rotation: -30, delay: 0, color: '#388E3C', scale: 0.9 },
  { offsetX: 62, offsetY: 56, rotation: 40, delay: 400, color: '#2E7D32', scale: 0.85 },
  { offsetX: -60, offsetY: -54, rotation: -140, delay: 800, color: '#43A047', scale: 0.7 },
  { offsetX: 72, offsetY: -42, rotation: 140, delay: 600, color: '#388E3C', scale: 0.75 },
];

// ─── Main Component ────────────────────────────────────────────────────────────
export function GenerateComingSoon() {
  const { width } = useWindowDimensions();
  const flowerSize = Math.min(width * 0.56, 220);

  return (
    <View style={styles.container}>
      {/* Flower illustration area */}
      <Animated.View
        entering={FadeIn.duration(1000)}
        style={[styles.flowerArea, { width: flowerSize + 60, height: flowerSize + 60 }]}>
        {/* Expanding ring */}
        <RingPulse />

        {/* Sparkles */}
        {SPARKLE_CONFIGS.map((sparkle, i) => (
          <FloatingSparkle
            key={`sparkle-${i}`}
            delay={sparkle.delay}
            left={sparkle.left * ((flowerSize + 60) / 220)}
            top={sparkle.top * ((flowerSize + 60) / 220)}
            size={sparkle.size}
          />
        ))}

        {/* Leaves */}
        {LEAF_CONFIGS.map((leaf, i) => (
          <AnimatedLeaf
            key={`leaf-${i}`}
            delay={leaf.delay}
            offsetX={leaf.offsetX * (flowerSize / 200)}
            offsetY={leaf.offsetY * (flowerSize / 200)}
            rotation={leaf.rotation}
            color={leaf.color}
            scale={leaf.scale * (flowerSize / 200)}
          />
        ))}

        {/* Petals */}
        {PETAL_CONFIGS.map((petal, i) => (
          <AnimatedPetal
            key={`petal-${i}`}
            angle={petal.angle}
            color={petal.color}
            delay={petal.delay}
            distance={petal.distance * (flowerSize / 200)}
            size={petal.size}
          />
        ))}

        {/* Center */}
        <CenterBloom />
      </Animated.View>

      {/* Text content */}
      <Animated.View entering={FadeInUp.delay(400).duration(800)} style={styles.badge}>
        <View style={styles.badgeDot} />
        <Text style={styles.badgeText}>Coming Soon</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.textBlock}>
        <Text style={styles.heading}>Stay Tuned!</Text>
        <Text style={styles.subheading}>
          Our flower customization feature is being carefully crafted. You'll be able to create your
          own personalized arrangements soon.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(900).duration(700)} style={styles.featureRow}>
        <FeatureChip label="AI Bouquet Builder" emoji="✨" />
        <FeatureChip label="Mix & Match" emoji="🌸" />
        <FeatureChip label="Custom Wraps" emoji="🎀" />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(1100).duration(600)}>
        <Text style={styles.footerNote}>
          We'll notify you when this feature goes live.
        </Text>
      </Animated.View>
    </View>
  );
}

// ─── Feature chip ──────────────────────────────────────────────────────────────
function FeatureChip({ label, emoji }: { label: string; emoji: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipEmoji}>{emoji}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.lg,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
  },
  flowerArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  petalContainer: {
    position: 'absolute',
  },
  leafContainer: {
    position: 'absolute',
  },
  bloomCenter: {
    position: 'absolute',
  },

  // Badge
  badge: {
    alignItems: 'center',
    backgroundColor: 'rgba(46, 139, 52, 0.08)',
    borderColor: 'rgba(46, 139, 52, 0.18)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  badgeDot: {
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  badgeText: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Text block
  textBlock: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    maxWidth: 310,
  },
  heading: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
    textAlign: 'center',
  },
  subheading: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },

  // Feature chips
  featureRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipLabel: {
    color: theme.colors.text,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    fontWeight: '600',
  },

  // Footer
  footerNote: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    marginTop: theme.spacing.sm,
    opacity: 0.7,
    textAlign: 'center',
  },
});
