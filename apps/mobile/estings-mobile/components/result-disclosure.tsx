import { ChevronDown } from 'lucide-react-native';
import { type ReactNode, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AI_EASE_OUT, AI_MOTION, MotionPressable } from '@/components/ai-arrangement-motion';
import { Fonts, theme } from '@/constants/theme';

type ResultDisclosureProps = {
  children: ReactNode;
  defaultOpen?: boolean;
  description: string;
  title: string;
};

export function ResultDisclosure({ children, defaultOpen = false, description, title }: ResultDisclosureProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const reduceMotion = useReducedMotion();
  const openProgress = useSharedValue(defaultOpen ? 1 : 0);

  useEffect(() => {
    openProgress.value = withTiming(isOpen ? 1 : 0, {
      duration: reduceMotion ? 80 : AI_MOTION.disclosure,
      easing: AI_EASE_OUT,
    });
  }, [isOpen, openProgress, reduceMotion]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${openProgress.value * 180}deg` }],
  }));

  const layout = LinearTransition
    .duration(reduceMotion ? 80 : AI_MOTION.disclosure)
    .easing(AI_EASE_OUT)
    .reduceMotion(ReduceMotion.System);

  return (
    <Animated.View layout={layout} style={styles.container}>
      <MotionPressable
        accessibilityHint={description}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        onPress={() => setIsOpen((current) => !current)}
        style={styles.header}>
        <View style={styles.headingGroup}>
          <Text style={styles.title}>{title}</Text>
          <Text numberOfLines={1} style={styles.description}>{description}</Text>
        </View>
        <Animated.View style={chevronStyle}>
          <ChevronDown color={theme.colors.textMuted} size={20} strokeWidth={2.2} />
        </Animated.View>
      </MotionPressable>

      {isOpen ? (
        <Animated.View
          entering={FadeIn.duration(reduceMotion ? 80 : AI_MOTION.disclosure).reduceMotion(ReduceMotion.System)}
          exiting={FadeOut.duration(reduceMotion ? 60 : 140).reduceMotion(ReduceMotion.System)}
          style={styles.content}>
          {children}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 68,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
  },
  headingGroup: { flex: 1, gap: 2 },
  title: { color: theme.colors.text, fontFamily: Fonts.sansBold, fontSize: 14, lineHeight: 19 },
  description: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 11, lineHeight: 16 },
  content: {
    borderTopColor: theme.colors.subtleBorder,
    borderTopWidth: 1,
    padding: theme.spacing.lg,
  },
});
