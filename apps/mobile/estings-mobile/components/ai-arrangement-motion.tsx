import type { ComponentProps, PropsWithChildren } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export const AI_MOTION = {
  buttonPress: 100,
  composerFocus: 160,
  contentEntrance: 220,
  disclosure: 200,
  introEntrance: 180,
  statusEntrance: 200,
} as const;

export const AI_EASE_OUT = Easing.out(Easing.cubic);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type MotionPressableProps = PropsWithChildren<ComponentProps<typeof Pressable>>;

/** Gives direct controls lightweight feedback without introducing idle animation. */
export function MotionPressable({ children, disabled, onPressIn, onPressOut, style, ...props }: MotionPressableProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reduceMotion ? 1 : scale.value }],
  }));

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onPressIn={(event) => {
        if (!disabled && !reduceMotion) {
          scale.value = withTiming(0.97, { duration: AI_MOTION.buttonPress });
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        if (!disabled && !reduceMotion) {
          scale.value = withSpring(1, { damping: 18, mass: 0.55, stiffness: 260 });
        }
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}>
      {children}
    </AnimatedPressable>
  );
}
