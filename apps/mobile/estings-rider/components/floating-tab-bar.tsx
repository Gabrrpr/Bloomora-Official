import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Reanimated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, theme } from '@/constants/theme';

type FloatingTabRoute = 'index' | 'deliveries' | 'history' | 'profile';
type MaterialCommunityIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const tabConfig: Record<FloatingTabRoute, { activeIcon: MaterialCommunityIconName; inactiveIcon: MaterialCommunityIconName; label: string }> = {
  deliveries: { activeIcon: 'truck-delivery', inactiveIcon: 'truck-delivery-outline', label: 'Deliveries' },
  history: { activeIcon: 'clock-time-four', inactiveIcon: 'clock-time-four-outline', label: 'History' },
  index: { activeIcon: 'home', inactiveIcon: 'home-outline', label: 'Home' },
  profile: { activeIcon: 'account', inactiveIcon: 'account-outline', label: 'Profile' },
};

export function FloatingTabBar({ descriptors, navigation, state }: BottomTabBarProps) {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const layout = getFloatingTabLayout(width, height, insets.bottom);
  const activeIndex = useSharedValue(state.index);

  useEffect(() => {
    activeIndex.value = withSpring(state.index, {
      damping: 22,
      mass: 0.82,
      stiffness: 260,
    });
  }, [activeIndex, state.index]);

  const activePlateStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: activeIndex.value * layout.itemWidth }],
  }));

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: layout.bottom }]}>
      <View
        style={[
          styles.container,
          {
            height: layout.height,
            padding: layout.containerPadding,
            width: layout.width,
          },
        ]}>
        <View pointerEvents="none" style={styles.glassHighlight} />
        <Reanimated.View
          pointerEvents="none"
          style={[
            styles.activePlate,
            {
              height: layout.plateHeight,
              left: layout.containerPadding,
              top: layout.containerPadding,
              width: layout.itemWidth,
            },
            activePlateStyle,
          ]}
        />
        {state.routes.map((route, index) => {
          const routeName = route.name as FloatingTabRoute;
          const item = tabConfig[routeName];

          if (!item) {
            return null;
          }

          const options = descriptors[route.key]?.options;
          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({
              canPreventDefault: true,
              target: route.key,
              type: 'tabPress',
            });

            if (!isFocused && !event.defaultPrevented) {
              if (Platform.OS === 'ios') {
                void Haptics.selectionAsync().catch(() => {});
              }
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <FloatingTabItem
              active={isFocused}
              activeIcon={item.activeIcon}
              activeIndex={activeIndex}
              inactiveIcon={item.inactiveIcon}
              index={index}
              key={route.key}
              label={item.label}
              layout={layout}
              onPress={onPress}
              tabBarAccessibilityLabel={options?.tabBarAccessibilityLabel}
              testID={options?.tabBarButtonTestID}
            />
          );
        })}
      </View>
    </View>
  );
}

function FloatingTabItem({
  active,
  activeIcon,
  activeIndex,
  inactiveIcon,
  index,
  label,
  layout,
  onPress,
  tabBarAccessibilityLabel,
  testID,
}: {
  active: boolean;
  activeIcon: MaterialCommunityIconName;
  activeIndex: SharedValue<number>;
  inactiveIcon: MaterialCommunityIconName;
  index: number;
  label: string;
  layout: ReturnType<typeof getFloatingTabLayout>;
  onPress: () => void;
  tabBarAccessibilityLabel?: string;
  testID?: string;
}) {
  const progress = useDerivedValue(() => 1 - Math.min(Math.abs(activeIndex.value - index), 1));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(progress.value, [0, 1], [0.96, 1.08], Extrapolation.CLAMP),
      },
      {
        translateY: interpolate(progress.value, [0, 1], [2, -1], Extrapolation.CLAMP),
      },
    ],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [theme.colors.textMuted, theme.colors.primary]),
    opacity: interpolate(progress.value, [0, 1], [0.62, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [2, 0], Extrapolation.CLAMP) }],
  }));

  const iconColor = active ? theme.colors.primary : theme.colors.textMuted;
  const icon = active ? activeIcon : inactiveIcon;

  return (
    <Pressable
      accessibilityLabel={tabBarAccessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={active ? { selected: true } : {}}
      hitSlop={layout.hitSlop}
      style={[styles.tabButton, { width: layout.itemWidth }]}
      testID={testID}
      onPress={onPress}>
      <Reanimated.View style={iconStyle}>
        <MaterialCommunityIcons color={iconColor} name={icon} size={layout.icon + 1} />
      </Reanimated.View>
      <Reanimated.Text numberOfLines={1} style={[styles.label, layout.labelText, labelStyle]}>
        {label}
      </Reanimated.Text>
    </Pressable>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getFloatingTabLayout(width: number, height: number, bottomInset: number) {
  const sidePadding = clamp(width * 0.048, 16, 24);
  const navWidth = clamp(width - sidePadding * 2, 316, 390);
  const containerPadding = clamp(Math.min(width, height) * 0.017, 6, 8);
  const innerWidth = navWidth - containerPadding * 2;
  const navHeight = clamp(height * 0.076, 64, 74);
  const icon = clamp(Math.min(width, height) * 0.056, 20, 23);
  const fontSize = clamp((height / 844) * 11, 10, 11.5);
  const itemWidth = innerWidth / 4;
  const plateHeight = navHeight - containerPadding * 2;

  return {
    bottom: Math.max(bottomInset + theme.spacing.sm, 14),
    containerPadding,
    height: navHeight,
    hitSlop: {
      bottom: 4,
      left: 4,
      right: 4,
      top: 4,
    },
    icon,
    itemWidth,
    labelText: {
      fontSize,
      lineHeight: clamp((height / 844) * 14, 13, 15),
    },
    plateHeight,
    width: navWidth,
  };
}

const styles = StyleSheet.create({
  activePlate: {
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
    borderColor: 'rgba(31, 42, 36, 0.11)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.7)',
    position: 'absolute',
  },
  container: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    borderColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: theme.radius.pill,
    borderWidth: 1.2,
    boxShadow: '0 16px 34px rgba(31, 42, 36, 0.18)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  glassHighlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'rgba(31, 42, 36, 0.07)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    bottom: 1,
    left: 1,
    position: 'absolute',
    right: 1,
    top: 1,
  },
  label: {
    fontFamily: Fonts.sansMedium,
    marginTop: 3,
    textAlign: 'center',
  },
  tabButton: {
    alignItems: 'center',
    gap: 1,
    height: '100%',
    justifyContent: 'center',
    zIndex: 1,
  },
  wrapper: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 100,
  },
});
