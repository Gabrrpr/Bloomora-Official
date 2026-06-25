import { useIsFocused } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowRight, Send, Shuffle, Sparkles } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, StyleSheet, Text, ToastAndroid, View, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  interpolateColor,
  runOnUI,
  scrollTo,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  useScrollViewOffset,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { AppBrandHeader } from '@/components/app-brand-header';
import { FloatingProductSearch } from '@/components/floating-product-search';
import { Fonts, theme } from '@/constants/theme';
import { getAuthSession } from '@/services/auth-session';

const SCENES = [
  {
    eyebrow: 'Your idea, guided by AI',
    title: 'Describe your dream bouquet.',
    body: 'Start with your words, mood, colors, and occasion.',
  },
  {
    eyebrow: 'From prompt to preview',
    title: "Esting's turns your idea into a first look.",
    body: 'Our AI helps translate your creativity into a bouquet concept.',
  },
  {
    eyebrow: 'Prefer full control?',
    title: 'Build it piece by piece.',
    body: 'Mix and Match lets you choose the arrangement, flowers, container, and accessories.',
  },
];

const METHOD_CARDS = [
  {
    accent: '#D94E78',
    background: '#FFFFFF',
    iconBackground: 'rgba(217, 78, 120, 0.1)',
    description: 'Write your idea and preview a bouquet concept.',
    icon: Sparkles,
    title: 'Describe Your Arrangement',
  },
  {
    accent: theme.colors.primaryDark,
    background: '#FFFFFF',
    iconBackground: 'rgba(46, 139, 52, 0.1)',
    description: 'Hand-pick each part of the bouquet step by step.',
    icon: Shuffle,
    title: 'Mix and Match',
  },
];

const PROMPT_SAMPLES = [
  'A romantic pink bouquet for our anniversary, soft white accents, elegant wrap',
  'A cheerful birthday arrangement with bright pink petals and fresh greenery',
  'A minimalist bridal bouquet with blush flowers, airy texture, and pearl ribbon',
];

const OBJECT_WORDS = ['bouquet', 'arrangement', 'flower box', 'gift', 'floral base'];

export default function GenerateScreen() {
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ frame?: string }>();
  const { height, width } = useWindowDimensions();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useScrollViewOffset(scrollRef);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showSwipeGuide, setShowSwipeGuide] = useState(false);
  const [hasReachedFinalFrame, setHasReachedFinalFrame] = useState(false);
  const sceneHeight = Math.max(height - insets.top, 650);
  const side = sidePadding(width);
  const swipeGuideDelayMs = 3000;

  const clearIdleTimer = useCallback(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
  }, []);

  const scheduleSwipeGuide = useCallback(
    (offsetY: number) => {
      clearIdleTimer();

      const reachedFinalFrame = offsetY >= sceneHeight * 2.68;
      setHasReachedFinalFrame(reachedFinalFrame);

      if (reachedFinalFrame) {
        setShowSwipeGuide(false);
        return;
      }

      idleTimer.current = setTimeout(() => {
        setShowSwipeGuide(offsetY < sceneHeight * 2.68);
      }, swipeGuideDelayMs);
    },
    [clearIdleTimer, sceneHeight, swipeGuideDelayMs],
  );

  useEffect(() => {
    scheduleSwipeGuide(0);
    return clearIdleTimer;
  }, [clearIdleTimer, scheduleSwipeGuide]);

  useEffect(() => {
    if (params.frame !== 'selection') {
      return;
    }

    clearIdleTimer();
    setShowSwipeGuide(false);

    const timer = setTimeout(() => {
      runOnUI(() => {
        'worklet';
        scrollTo(scrollRef, 0, sceneHeight * 3, false);
      })();
    }, 80);

    return () => clearTimeout(timer);
  }, [clearIdleTimer, params.frame, sceneHeight, scrollRef]);

  const handleScrollStart = useCallback(() => {
    clearIdleTimer();
    setShowSwipeGuide(false);
  }, [clearIdleTimer]);

  const handleScrollSettled = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scheduleSwipeGuide(event.nativeEvent.contentOffset.y);
    },
    [scheduleSwipeGuide],
  );

  const handleOpenCreationMethod = useCallback(async (route: '/create/describe' | '/create/mix-and-match') => {
    const session = await getAuthSession();

    if (!session) {
      showSignInToast();
      return;
    }

    router.push(route);
  }, []);

  const sceneFadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [sceneHeight * 2.35, sceneHeight * 2.9], [1, 0.18], Extrapolation.CLAMP),
    transform: [
      { scale: interpolate(scrollY.value, [0, sceneHeight * 3], [1, 0.92], Extrapolation.CLAMP) },
      { translateY: interpolate(scrollY.value, [0, sceneHeight * 3], [0, -34], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.background}>
        <BackgroundWash />
      </View>

      <Animated.View pointerEvents="none" style={[styles.fixedScene, sceneFadeStyle]}>
        <WindPetalScene scrollY={scrollY} sceneHeight={sceneHeight} />
        <PromptPreviewScene scrollY={scrollY} sceneHeight={sceneHeight} width={width} />
        <HandPickScene scrollY={scrollY} sceneHeight={sceneHeight} />
      </Animated.View>

      <Animated.ScrollView
        ref={scrollRef}
        bounces={false}
        contentInsetAdjustmentBehavior="never"
        onMomentumScrollEnd={handleScrollSettled}
        onScrollBeginDrag={handleScrollStart}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}>
        <View style={styles.headerLayer}>
          <AppBrandHeader onSearchPress={() => setIsSearchOpen(true)} showSearchAction />
        </View>

        {SCENES.map((scene, index) => (
          <StoryScene
            key={scene.title}
            body={scene.body}
            eyebrow={scene.eyebrow}
            index={index}
            isActive={isFocused}
            sceneHeight={sceneHeight}
            scrollY={scrollY}
            side={side}
            title={scene.title}
          />
        ))}

        <View style={[styles.selectionScene, { minHeight: sceneHeight, paddingBottom: insets.bottom + 140, paddingHorizontal: side }]}>
          <AnimatedSelectionIntro scrollY={scrollY} sceneHeight={sceneHeight} />
          <View style={styles.methodList}>
            {METHOD_CARDS.map((method) => (
              <MethodCard
                key={method.title}
                accent={method.accent}
                background={method.background}
                description={method.description}
                icon={method.icon}
                iconBackground={method.iconBackground}
                onPress={() => {
                  void handleOpenCreationMethod(method.title === 'Describe Your Arrangement' ? '/create/describe' : '/create/mix-and-match');
                }}
                title={method.title}
              />
            ))}
          </View>
        </View>
      </Animated.ScrollView>

      <TopScrollProgress scrollY={scrollY} sceneHeight={sceneHeight} />
      <FinalHeader onSearchPress={() => setIsSearchOpen(true)} scrollY={scrollY} sceneHeight={sceneHeight} />
      <FloatingProductSearch onClose={() => setIsSearchOpen(false)} visible={isSearchOpen} />

      {showSwipeGuide && !hasReachedFinalFrame ? (
        <View pointerEvents="none" style={[styles.sideSwipeGuide, { bottom: insets.bottom + 128 }]}>
          <LowFrameSwipeGuide isActive={isFocused} />
        </View>
      ) : null}
    </View>
  );
}

function showSignInToast() {
  const message = 'Please log in to create your custom arrangement.';

  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }

  Alert.alert('Log in to create', message);
}

function FinalHeader({
  onSearchPress,
  sceneHeight,
  scrollY,
}: {
  onSearchPress: () => void;
  sceneHeight: number;
  scrollY: SharedValue<number>;
}) {
  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [sceneHeight * 2.72, sceneHeight * 2.9], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [sceneHeight * 2.72, sceneHeight * 2.9], [-12, 0], Extrapolation.CLAMP) }],
  }));

  return (
    <Animated.View pointerEvents="box-none" style={[styles.finalHeaderLayer, headerStyle]}>
      <AppBrandHeader onSearchPress={onSearchPress} showSearchAction />
    </Animated.View>
  );
}

function TopScrollProgress({ sceneHeight, scrollY }: { sceneHeight: number; scrollY: SharedValue<number> }) {
  const progressStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [8, 70], [0, 1], Extrapolation.CLAMP),
  }));

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: interpolate(scrollY.value, [0, sceneHeight * 3], [0, 1], Extrapolation.CLAMP) }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.topProgressTrack, progressStyle]}>
      <Animated.View style={[styles.topProgressFill, fillStyle]} />
    </Animated.View>
  );
}

type StorySceneProps = {
  body: string;
  eyebrow: string;
  index: number;
  isActive: boolean;
  sceneHeight: number;
  scrollY: SharedValue<number>;
  side: number;
  title: string;
};

function StoryScene({ body, eyebrow, index, isActive, sceneHeight, scrollY, side, title }: StorySceneProps) {
  const rollingWordIndex = useRollingWordIndex(OBJECT_WORDS, isActive && index === 0);
  const textStyle = useAnimatedStyle(() => {
    const isPromptPreviewScene = index === 1;
    const isFirstScene = index === 0;
    const start = isFirstScene ? 0 : isPromptPreviewScene ? sceneHeight * 0.92 : (index - 0.2) * sceneHeight;
    const fullStart = isFirstScene ? 0 : isPromptPreviewScene ? sceneHeight * 1.06 : index * sceneHeight + sceneHeight * 0.04;
    const fullEnd = isFirstScene ? sceneHeight * 0.22 : isPromptPreviewScene ? sceneHeight * 1.34 : index * sceneHeight + sceneHeight * 0.34;
    const end = isPromptPreviewScene ? sceneHeight * 1.76 : (index + 0.58) * sceneHeight;
    const firstSceneOpacity = interpolate(scrollY.value, [0, sceneHeight * 0.08], [1, 0.98], Extrapolation.CLAMP);

    return {
      opacity: isFirstScene
        ? firstSceneOpacity
        : interpolate(scrollY.value, [start, fullStart, fullEnd, end], [0, 1, 1, 0], Extrapolation.CLAMP),
      transform: [
        {
          translateY: isFirstScene
            ? interpolate(scrollY.value, [0, sceneHeight * 0.22], [0, -8], Extrapolation.CLAMP)
            : interpolate(scrollY.value, [start, fullStart, end], [42, 0, -58], Extrapolation.CLAMP),
        },
        {
          scale: isFirstScene
            ? interpolate(scrollY.value, [0, sceneHeight * 0.22], [1, 0.995], Extrapolation.CLAMP)
            : interpolate(scrollY.value, [start, fullStart, end], [0.95, 1, 0.96], Extrapolation.CLAMP),
        },
      ],
    };
  });

  return (
    <View style={[styles.storyScene, { minHeight: sceneHeight, paddingHorizontal: side }]}>
      <Animated.View style={[styles.storyText, index === 1 && styles.storyTextRight, index === 2 && styles.storyTextTop, textStyle]}>
        <Text style={styles.storyEyebrow}>{eyebrow}</Text>
        {index === 0 ? (
          <View style={styles.storyTitleBlock}>
            <Text style={styles.storyTitle}>Describe your dream</Text>
            <RollingWord compact words={OBJECT_WORDS} wordIndex={rollingWordIndex} />
          </View>
        ) : (
          <Text style={styles.storyTitle}>{title}</Text>
        )}
        <Text style={styles.storyBody}>{body}</Text>
      </Animated.View>
    </View>
  );
}

function useRollingWordIndex(words: string[], isActive: boolean) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const timer = setInterval(() => {
      setIndex((value) => (value + 1) % words.length);
    }, 1350);

    return () => clearInterval(timer);
  }, [isActive, words.length]);

  return index;
}

function RollingWord({ compact = false, wordIndex, words }: { compact?: boolean; wordIndex: number; words: string[] }) {
  const progress = useSharedValue(wordIndex);
  const itemHeight = compact ? 40 : 48;

  useEffect(() => {
    progress.value = withTiming(wordIndex, { duration: 520 });
  }, [progress, wordIndex]);

  const reelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -progress.value * itemHeight }],
  }));

  const blurTopStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value % 1, [0, 0.5, 1], [0.18, 0.42, 0.18], Extrapolation.CLAMP),
  }));

  return (
    <View style={[styles.rollingWordWindow, compact && styles.rollingWordWindowCompact]}>
      <Animated.View style={[styles.rollingBlur, styles.rollingBlurTop, blurTopStyle]} />
      <Animated.View style={[styles.rollingWordReel, reelStyle]}>
        {words.map((word) => (
          <Text key={word} style={[styles.rollingWordText, compact && styles.rollingWordTextCompact]}>
            {word}.
          </Text>
        ))}
      </Animated.View>
      <Animated.View style={[styles.rollingBlur, styles.rollingBlurBottom, blurTopStyle]} />
    </View>
  );
}

function AnimatedSelectionIntro({ sceneHeight, scrollY }: { sceneHeight: number; scrollY: SharedValue<number> }) {
  const introStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [sceneHeight * 2.35, sceneHeight * 2.62], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [sceneHeight * 2.35, sceneHeight * 2.62], [34, 0], Extrapolation.CLAMP) }],
  }));

  return (
    <Animated.View style={[styles.selectionIntro, introStyle]}>
      <Text style={styles.storyEyebrow}>Choose how you style it</Text>
      <Text style={styles.selectionTitle}>
        So, how do you want to <Text style={styles.selectionTitleAccent}>create?</Text>
      </Text>
      <Text style={styles.selectionBody}>Start with a written idea or build every detail by hand.</Text>
    </Animated.View>
  );
}

function MethodCard({
  accent,
  background,
  description,
  iconBackground,
  icon: Icon,
  onPress,
  title,
}: {
  accent: string;
  background: string;
  description: string;
  icon: typeof Sparkles;
  iconBackground: string;
  onPress?: () => void;
  title: string;
}) {
  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      onPress={onPress ?? (() => {})}
      style={({ pressed }) => [styles.methodCard, { backgroundColor: background }, pressed && styles.methodCardPressed]}>
      <View style={[styles.methodIcon, { backgroundColor: iconBackground }]}>
        <Icon color={accent} size={25} strokeWidth={2.3} />
      </View>
      <View style={styles.methodCopy}>
        <Text style={styles.methodTitle}>{title}</Text>
        <Text style={styles.methodDescription}>{description}</Text>
      </View>
      <ArrowRight color={accent} size={22} strokeWidth={2.4} />
    </Pressable>
  );
}

function HandPickScene({ sceneHeight, scrollY }: { sceneHeight: number; scrollY: SharedValue<number> }) {
  const cardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [sceneHeight * 1.38, sceneHeight * 1.68, sceneHeight * 2.72, sceneHeight * 2.95], [0, 1, 1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollY.value, [sceneHeight * 1.38, sceneHeight * 1.78, sceneHeight * 2.72], [34, 0, -24], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [sceneHeight * 1.38, sceneHeight * 1.78, sceneHeight * 2.72], [0.96, 1, 0.98], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <Animated.View style={[styles.pickScene, cardStyle]}>
      <View style={styles.mixCard}>
        <View style={styles.mixHeader}>
          <View style={styles.mixIcon}>
            <Shuffle color={theme.colors.primary} size={19} strokeWidth={2.4} />
          </View>
          <View style={styles.mixHeaderCopy}>
            <Text style={styles.mixTitle}>Mix and Match</Text>
            <Text style={styles.mixSubtitle}>Build your bouquet step by step</Text>
          </View>
        </View>
        <View style={styles.mixProgress}>
          {MIX_STEPS.map((step, index) => (
            <MixStep key={step} index={index} label={step} sceneHeight={sceneHeight} scrollY={scrollY} />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const MIX_STEPS = ['Arrangement', 'Flower & Fillers', 'Container', 'Accessories'];

function MixStep({ index, label, sceneHeight, scrollY }: { index: number; label: string; sceneHeight: number; scrollY: SharedValue<number> }) {
  const activeStyle = useAnimatedStyle(() => {
    const start = sceneHeight * (1.48 + index * 0.18);
    const fill = interpolate(scrollY.value, [start, start + sceneHeight * 0.18], [0, 1], Extrapolation.CLAMP);

    return {
      backgroundColor: interpolateColor(fill, [0, 1], ['#FFFFFF', theme.colors.primary]),
      borderColor: fill > 0.5 ? theme.colors.primary : '#DDE1DC',
      transform: [{ scale: interpolate(fill, [0, 1], [1, 1.08], Extrapolation.CLAMP) }],
    };
  });

  const numberStyle = useAnimatedStyle(() => {
    const start = sceneHeight * (1.48 + index * 0.18);
    const fill = interpolate(scrollY.value, [start, start + sceneHeight * 0.18], [0, 1], Extrapolation.CLAMP);

    return {
      color: interpolateColor(fill, [0, 1], ['#3F4741', '#FFFFFF']),
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    const start = sceneHeight * (1.48 + index * 0.18);
    const fill = interpolate(scrollY.value, [start, start + sceneHeight * 0.18], [0, 1], Extrapolation.CLAMP);

    return {
      color: fill > 0.5 ? theme.colors.primaryDark : theme.colors.textMuted,
      opacity: interpolate(fill, [0, 1], [0.64, 1], Extrapolation.CLAMP),
    };
  });

  return (
    <View style={styles.mixStep}>
      <Animated.View style={[styles.mixStepCircle, activeStyle]}>
        <Animated.Text style={[styles.mixStepNumber, numberStyle]}>{index + 1}</Animated.Text>
      </Animated.View>
      {index < MIX_STEPS.length - 1 ? <View style={styles.mixConnector} /> : null}
      <Animated.Text style={[styles.mixStepLabel, labelStyle]}>{label}</Animated.Text>
    </View>
  );
}

function LowFrameSwipeGuide({ isActive }: { isActive: boolean }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const timer = setInterval(() => {
      setFrame((value) => (value + 1) % 4);
    }, 220);

    return () => clearInterval(timer);
  }, [isActive]);

  return (
    <View style={styles.swipeGuideFrame}>
      <View style={styles.swipeGuideTrack}>
        <View
          style={[
            styles.swipeGuideArrow,
            {
              opacity: [0.35, 0.65, 1, 0.45][frame],
              transform: [{ translateY: [12, 4, -5, -13][frame] }, { rotate: '45deg' }],
            },
          ]}
        />
        <View
          style={[
            styles.swipeTouchPill,
            {
              opacity: [0.75, 1, 0.9, 0.65][frame],
              transform: [{ translateY: [18, 8, -2, -10][frame] }],
            },
          ]}
        />
      </View>
    </View>
  );
}

function PromptPreviewScene({ sceneHeight, scrollY, width }: { sceneHeight: number; scrollY: SharedValue<number>; width: number }) {
  const typedPrompt = useTypewriterPrompt(PROMPT_SAMPLES);
  const promptMaxWidth = Math.min(340, Math.max(width - 40, 280));
  const promptFontSize = Math.min(20, Math.max(16, width * 0.05));
  const promptLineHeight = Math.min(28, Math.max(22, width * 0.07));
  const chipFontSize = Math.min(12, Math.max(10, width * 0.03));

  const promptStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, sceneHeight * 1.05, sceneHeight * 1.32], [1, 1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollY.value, [0, sceneHeight * 0.9, sceneHeight * 1.32], [34, -28, -78], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [0, sceneHeight * 0.45, sceneHeight * 1.32], [1, 1, 0.96], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <View style={styles.aiScene}>
      <Animated.View style={[styles.promptCard, { maxWidth: promptMaxWidth }, promptStyle]}>
        <View style={styles.promptGlass}>
          <View style={styles.promptHeader}>
            <View style={styles.aiPill}>
              <Text style={[styles.aiPillText, { fontSize: chipFontSize }]}>Your prompt</Text>
            </View>
            <Text style={[styles.promptStatus, { fontSize: chipFontSize }]}>example</Text>
          </View>
          <Text style={[styles.promptText, { fontSize: promptFontSize, lineHeight: promptLineHeight }]}>
            {typedPrompt}
            <Text style={styles.promptCursor}>|</Text>
          </Text>
          <View style={styles.promptFooter}>
            <View style={styles.promptChipRow}>
              <Text style={[styles.promptChip, { fontSize: chipFontSize }]}>single prompt</Text>
              <Text style={[styles.promptChip, { fontSize: chipFontSize }]}>image concept</Text>
            </View>
            <Pressable accessibilityLabel="Preview prompt example" accessibilityRole="button" onPress={() => {}} style={styles.promptSubmitPreview}>
              <Send color="#1F2A24" size={17} strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function useTypewriterPrompt(samples: string[]) {
  const [sampleIndex, setSampleIndex] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const currentSample = samples[sampleIndex];

  useEffect(() => {
    const isComplete = characterCount === currentSample.length;
    const isEmpty = characterCount === 0;
    const delay = isComplete ? 1150 : isEmpty && isDeleting ? 260 : isDeleting ? 24 : 42;

    const timer = setTimeout(() => {
      if (!isDeleting && isComplete) {
        setIsDeleting(true);
        return;
      }

      if (isDeleting && isEmpty) {
        setIsDeleting(false);
        setSampleIndex((value) => (value + 1) % samples.length);
        return;
      }

      setCharacterCount((value) => value + (isDeleting ? -1 : 1));
    }, delay);

    return () => clearTimeout(timer);
  }, [characterCount, currentSample.length, isDeleting, samples.length]);

  return useMemo(() => currentSample.slice(0, characterCount), [characterCount, currentSample]);
}

function WindPetalScene({ sceneHeight, scrollY }: { sceneHeight: number; scrollY: SharedValue<number> }) {
  const ribbonStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, sceneHeight * 0.2, sceneHeight * 2.65], [0.35, 1, 0.45], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollY.value, [0, sceneHeight * 2.5], [90, -80], Extrapolation.CLAMP) },
      { rotate: `${interpolate(scrollY.value, [0, sceneHeight * 2], [-6, 8], Extrapolation.CLAMP)}deg` },
    ],
  }));

  return (
    <View style={styles.windStage}>
      <Animated.View style={[styles.windRibbon, ribbonStyle]}>
        {PETALS.map((petal, index) => (
          <WindPetal key={`${petal.left}-${petal.top}`} index={index} sceneHeight={sceneHeight} scrollY={scrollY} {...petal} />
        ))}
      </Animated.View>
    </View>
  );
}

const PETALS = [
  { color: '#F8A9BC', entry: 0, left: -28, scale: 1.08, shape: 'round', top: 246 },
  { color: '#F36F95', entry: 0.15, left: 24, scale: 0.72, shape: 'long', top: 132 },
  { color: '#FFC3D0', entry: 0.3, left: 62, scale: 1.35, shape: 'heart', top: 198 },
  { color: '#EC5F88', entry: 0.65, left: 112, scale: 0.9, shape: 'round', top: 82 },
  { color: '#F7A1B5', entry: 0.95, left: 154, scale: 1.16, shape: 'long', top: 154 },
  { color: '#FFD7DE', entry: 1.25, left: 206, scale: 0.82, shape: 'heart', top: 262 },
  { color: '#F27B9D', entry: 1.55, left: 250, scale: 1.22, shape: 'round', top: 116 },
  { color: '#F9B5C5', entry: 1.85, left: 306, scale: 0.76, shape: 'long', top: 190 },
  { color: '#F05E86', entry: 2.1, left: 70, scale: 0.62, shape: 'heart', top: 306 },
  { color: '#FFD0DB', entry: 2.25, left: 286, scale: 1, shape: 'round', top: 316 },
  { color: '#F58CAA', entry: 0.55, left: 332, scale: 0.58, shape: 'heart', top: 64 },
  { color: '#FFDDE5', entry: 1.75, left: -6, scale: 0.86, shape: 'long', top: 352 },
];

function WindPetal({
  color,
  entry,
  index,
  left,
  scale,
  shape,
  sceneHeight,
  scrollY,
  top,
}: {
  color: string;
  entry: number;
  index: number;
  left: number;
  scale: number;
  shape: string;
  sceneHeight: number;
  scrollY: SharedValue<number>;
  top: number;
}) {
  const petalStyle = useAnimatedStyle(() => {
    const start = sceneHeight * entry;
    const mid = start + sceneHeight * 0.7;
    const end = start + sceneHeight * 1.85;

    return {
      opacity: interpolate(scrollY.value, [start - 120, start + 80, end], [0, 1, 0.35], Extrapolation.CLAMP),
      transform: [
        { translateX: interpolate(scrollY.value, [start, mid, end], [-70 + index * 4, 20 - index * 2, 120 - index * 7], Extrapolation.CLAMP) },
        { translateY: interpolate(scrollY.value, [start, mid, end], [50 - index * 6, -36 + index * 4, -132 + index * 9], Extrapolation.CLAMP) },
        { rotate: `${interpolate(scrollY.value, [start, end], [-40 + index * 12, 96 - index * 8], Extrapolation.CLAMP)}deg` },
        { scale },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.windPetal,
        shape === 'long' && styles.windPetalLong,
        shape === 'heart' && styles.windPetalHeart,
        {
          backgroundColor: color,
          left,
          top,
        },
        petalStyle,
      ]}
    />
  );
}

function BackgroundWash() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 390 980" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="page" x1="0" x2="390" y1="0" y2="980">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.52" stopColor="#FAFAFA" />
          <Stop offset="1" stopColor="#F2F3F2" />
        </LinearGradient>
      </Defs>
      <Path d="M0 0H390V980H0Z" fill="url(#page)" />
      <DotWaveField />
      <Path d="M0 836 C92 792 180 814 276 774 C330 752 364 718 390 676 V980H0Z" fill="#F3F4F2" opacity={0.72} />
    </Svg>
  );
}

function DotWaveField() {
  const dots = [];
  const rows = 24;
  const columns = 15;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = column * 28 + (row % 2 === 0 ? 2 : 15);
      const wave = Math.sin(column * 0.9 + row * 0.38) * 18;
      const y = row * 39 + 34 + wave;
      const opacity = 0.14 + ((row + column) % 5) * 0.045;
      dots.push(<Circle key={`${row}-${column}`} cx={x} cy={y} r={1.35} fill="#9CA19B" opacity={opacity} />);
    }
  }

  return <>{dots}</>;
}

function sidePadding(width: number) {
  return Math.min(Math.max(width * 0.062, 20), 30);
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  background: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  scroll: {
    flex: 1,
  },
  headerLayer: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 5,
  },
  finalHeaderLayer: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 28,
  },
  fixedScene: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 0,
  },
  topProgressTrack: {
    backgroundColor: 'rgba(31, 42, 36, 0.16)',
    borderBottomColor: 'rgba(255, 255, 255, 0.7)',
    borderBottomWidth: 1,
    height: 5,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 30,
  },
  topProgressFill: {
    backgroundColor: '#1F8A3B',
    height: '100%',
    transformOrigin: 'left center',
    width: '100%',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.24) inset',
  },
  aiScene: {
    bottom: 92,
    left: 20,
    position: 'absolute',
    right: 20,
    top: 300,
    zIndex: 3,
  },
  promptCard: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(218, 222, 218, 0.72)',
    borderRadius: 26,
    borderWidth: 1,
    boxShadow: '0 18px 42px rgba(31, 42, 36, 0.1)',
    maxWidth: 340,
    minHeight: 156,
    overflow: 'hidden',
    width: '100%',
  },
  promptGlass: {
    backgroundColor: '#FFFFFF',
    gap: theme.spacing.md,
    minHeight: 156,
    padding: theme.spacing.lg,
    width: '100%',
  },
  pickScene: {
    alignItems: 'center',
    bottom: 0,
    gap: theme.spacing.md,
    justifyContent: 'center',
    left: 22,
    position: 'absolute',
    right: 22,
    top: 0,
    zIndex: 2,
  },
  mixCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: 'rgba(31, 42, 36, 0.1)',
    borderRadius: 26,
    borderWidth: 1,
    boxShadow: '0 18px 42px rgba(31, 42, 36, 0.12)',
    maxWidth: 340,
    padding: 18,
    width: '100%',
  },
  mixHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: 22,
  },
  mixIcon: {
    alignItems: 'center',
    backgroundColor: '#EEF7EF',
    borderRadius: theme.radius.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  mixHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  mixTitle: {
    color: '#3F4741',
    fontFamily: Fonts.sansExtraBold,
    fontSize: 18,
    fontWeight: '800',
  },
  mixSubtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
  },
  mixProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mixStep: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  mixStepCircle: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE1DC',
    borderRadius: theme.radius.pill,
    borderWidth: 1.2,
    height: 34,
    justifyContent: 'center',
    width: 34,
    zIndex: 2,
  },
  mixStepNumber: {
    color: '#3F4741',
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    fontWeight: '800',
  },
  mixConnector: {
    backgroundColor: '#DDE1DC',
    height: 1.3,
    left: '58%',
    position: 'absolute',
    right: '-42%',
    top: 17,
    zIndex: 1,
  },
  mixStepLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
    marginTop: 8,
    maxWidth: 70,
    minHeight: 28,
    textAlign: 'center',
  },
  promptHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  aiPill: {
    backgroundColor: 'rgba(238, 247, 239, 0.78)',
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  aiPillText: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  promptStatus: {
    color: '#F36F95',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  promptText: {
    color: '#3F4741',
    fontFamily: Fonts.sansMedium,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    minHeight: 84,
  },
  promptCursor: {
    color: '#F36F95',
    fontFamily: Fonts.sansBold,
    fontWeight: '800',
  },
  promptFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  promptChipRow: {
    flexDirection: 'row',
    flexShrink: 1,
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  promptChip: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(218, 222, 218, 0.72)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  promptSubmitPreview: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(218, 222, 218, 0.72)',
    borderRadius: 10,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  windStage: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingTop: 120,
  },
  windRibbon: {
    height: 390,
    maxWidth: 390,
    position: 'relative',
    width: '100%',
  },
  windPetal: {
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 6,
    boxShadow: '0 10px 22px rgba(240, 105, 143, 0.18)',
    height: 32,
    position: 'absolute',
    width: 18,
  },
  windPetalLong: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 6,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 18,
    height: 40,
    width: 14,
  },
  windPetalHeart: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 8,
    height: 24,
    width: 24,
  },
  storyScene: {
    justifyContent: 'center',
  },
  storyText: {
    gap: theme.spacing.md,
    maxWidth: 342,
    paddingBottom: 360,
    zIndex: 2,
  },
  storyTextRight: {
    alignSelf: 'flex-start',
    paddingBottom: 0,
    paddingTop: 470,
  },
  storyTextTop: {
    paddingBottom: 336,
  },
  storyEyebrow: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  storyTitle: {
    color: '#3F4741',
    fontFamily: Fonts.sansExtraBold,
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 46,
  },
  storyTitleBlock: {
    gap: 2,
  },
  rollingWordWindow: {
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  rollingWordWindowCompact: {
    height: 40,
  },
  rollingWordReel: {
    position: 'absolute',
    top: 0,
  },
  rollingWordText: {
    color: '#F36F95',
    fontFamily: Fonts.sansExtraBold,
    fontSize: 42,
    fontWeight: '800',
    height: 48,
    lineHeight: 46,
  },
  rollingWordTextCompact: {
    fontSize: 34,
    height: 40,
    lineHeight: 39,
    textAlign: 'left',
  },
  rollingBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    height: 11,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 2,
  },
  rollingBlurTop: {
    top: 0,
  },
  rollingBlurBottom: {
    bottom: 0,
  },
  storyBody: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 292,
  },
  selectionScene: {
    justifyContent: 'center',
    gap: 30,
  },
  selectionIntro: {
    gap: theme.spacing.md,
  },
  selectionTitle: {
    color: '#3F4741',
    fontFamily: Fonts.sansExtraBold,
    fontSize: 38,
    fontWeight: '800',
    lineHeight: 43,
  },
  selectionTitleAccent: {
    color: '#F36F95',
  },
  selectionBody: {
    color: '#6A706B',
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 22,
  },
  methodList: {
    gap: theme.spacing.md,
  },
  methodCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(218, 222, 218, 0.72)',
    borderRadius: 26,
    borderWidth: 1,
    boxShadow: '0 18px 38px rgba(31, 42, 36, 0.1)',
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 118,
    padding: theme.spacing.lg,
  },
  methodCardPressed: {
    transform: [{ scale: 0.985 }],
  },
  methodIcon: {
    alignItems: 'center',
    borderRadius: 22,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  methodCopy: {
    flex: 1,
    gap: 5,
  },
  methodTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  methodDescription: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
  },
  sideSwipeGuide: {
    position: 'absolute',
    right: 12,
    zIndex: 20,
  },
  swipeGuideFrame: {
    alignItems: 'center',
    height: 112,
    justifyContent: 'center',
    width: 54,
  },
  swipeGuideTrack: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    borderColor: 'rgba(31, 42, 36, 0.1)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    boxShadow: '0 12px 28px rgba(31, 42, 36, 0.12)',
    height: 100,
    justifyContent: 'center',
    width: 42,
  },
  swipeGuideArrow: {
    borderColor: '#343A3F',
    borderLeftWidth: 3,
    borderTopWidth: 3,
    height: 18,
    position: 'absolute',
    top: 14,
    width: 18,
  },
  swipeTouchPill: {
    backgroundColor: '#343A3F',
    borderRadius: theme.radius.pill,
    height: 28,
    width: 14,
  },
});
