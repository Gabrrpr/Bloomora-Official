import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Home, Search, ShoppingBag, Sparkles, UserRound, type LucideIcon } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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
import { getCartItems } from '@/services/cart-storage';
import { addCartUpdatedListener } from '@/services/guest-cart';

type FloatingTabRoute = 'index' | 'categories' | 'generate' | 'cart' | 'me';

const tabConfig: Record<FloatingTabRoute, { icon: LucideIcon; label: string }> = {
  cart: { icon: ShoppingBag, label: 'Cart' },
  categories: { icon: Search, label: 'Shop' },
  generate: { icon: Sparkles, label: 'Create' },
  index: { icon: Home, label: 'Home' },
  me: { icon: UserRound, label: 'Profile' },
};

export function FloatingTabBar({ descriptors, navigation, state }: BottomTabBarProps) {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const visibleRoutes = state.routes.filter(
    (route): route is typeof route & { name: FloatingTabRoute } => isFloatingTabRoute(route.name),
  );
  const visibleActiveIndex = Math.max(
    0,
    visibleRoutes.findIndex((route) => route.key === state.routes[state.index]?.key),
  );
  const layout = getFloatingTabLayout(width, height, insets.bottom, visibleRoutes.length);
  const activeIndex = useSharedValue(visibleActiveIndex);
  const isHomeTab = state.routes[state.index]?.name === 'index';
  const [cartCount, setCartCount] = useState(0);

  const refreshCartCount = useCallback(() => {
    getCartItems()
      .then((items) => {
        setCartCount(items.reduce((total, item) => total + item.quantity, 0));
      })
      .catch(() => {
        setCartCount(0);
      });
  }, []);

  useEffect(() => {
    activeIndex.value = withSpring(visibleActiveIndex, {
      damping: 22,
      mass: 0.82,
      stiffness: 260,
    });
  }, [activeIndex, visibleActiveIndex]);

  useEffect(() => {
    refreshCartCount();
  }, [refreshCartCount, state.index]);

  useEffect(() => addCartUpdatedListener(refreshCartCount), [refreshCartCount]);

  const activePlateStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: activeIndex.value * layout.itemWidth }],
  }));

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: layout.bottom }]}>
      <View
        style={[
          styles.container,
          isHomeTab ? styles.containerGlass : styles.containerSolid,
          {
            height: layout.height,
            padding: layout.containerPadding,
            width: layout.width,
          },
        ]}>
        {isHomeTab ? <View pointerEvents="none" style={styles.glassHighlight} /> : null}
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
        {visibleRoutes.map((route, index) => {
          const routeName = route.name;
          const item = tabConfig[routeName];

          const options = descriptors[route.key]?.options;
          const isFocused = state.routes[state.index]?.key === route.key;
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
              activeIndex={activeIndex}
              icon={item.icon}
              index={index}
              isHomeTab={isHomeTab}
              key={route.key}
              label={item.label}
              layout={layout}
              badgeCount={routeName === 'cart' ? cartCount : 0}
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
  activeIndex,
  badgeCount,
  icon: Icon,
  index,
  isHomeTab,
  label,
  layout,
  onPress,
  tabBarAccessibilityLabel,
  testID,
}: {
  active: boolean;
  activeIndex: SharedValue<number>;
  badgeCount?: number;
  icon: LucideIcon;
  index: number;
  isHomeTab: boolean;
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

  const inactiveColor = isHomeTab ? '#3D4A42' : theme.colors.textMuted;

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [inactiveColor, theme.colors.primary]),
    opacity: interpolate(progress.value, [0, 1], [0.72, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [2, 0], Extrapolation.CLAMP) }],
  }));

  const iconColor = active ? theme.colors.primary : inactiveColor;

  return (
    <Pressable
      accessibilityLabel={tabBarAccessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={active ? { selected: true } : {}}
      hitSlop={layout.hitSlop}
      style={[styles.tabButton, { width: layout.itemWidth }]}
      testID={testID}
      onPress={onPress}>
      <Reanimated.View style={[styles.iconSlot, iconStyle]}>
        <Icon color={iconColor} size={layout.icon} strokeWidth={active ? 2.55 : 2.15} />
        {badgeCount ? (
          <View style={styles.cartBadge}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.cartBadgeText}>
              {badgeCount > 99 ? '99+' : badgeCount}
            </Text>
          </View>
        ) : null}
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

function isFloatingTabRoute(name: string): name is FloatingTabRoute {
  return name in tabConfig;
}

function getFloatingTabLayout(width: number, height: number, bottomInset: number, itemCount: number) {
  const sidePadding = clamp(width * 0.048, 16, 24);
  const navWidth = clamp(width - sidePadding * 2, 326, 390);
  const containerPadding = clamp(Math.min(width, height) * 0.017, 6, 8);
  const innerWidth = navWidth - containerPadding * 2;
  const navHeight = clamp(height * 0.076, 64, 74);
  const icon = clamp(Math.min(width, height) * 0.056, 20, 23);
  const fontSize = clamp((height / 844) * 11, 10, 11.5);
  const itemWidth = innerWidth / Math.max(itemCount, 1);
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
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    borderColor: 'rgba(31, 42, 36, 0.11)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.6)',
    position: 'absolute',
  },
  container: {
    alignItems: 'center',
    borderRadius: theme.radius.pill,
    borderWidth: 1.2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  containerGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.82)',
    boxShadow: '0 18px 38px rgba(31, 42, 36, 0.2)',
  },
  containerSolid: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.subtleBorder,
    boxShadow: '0 12px 26px rgba(31, 42, 36, 0.12)',
  },
  glassHighlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderColor: 'rgba(31, 42, 36, 0.07)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    bottom: 1,
    left: 1,
    position: 'absolute',
    right: 1,
    top: 1,
  },
  cartBadge: {
    alignItems: 'center',
    backgroundColor: '#E11D48',
    borderColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    height: 17,
    justifyContent: 'center',
    minWidth: 17,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -10,
    top: -8,
  },
  cartBadgeText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    lineHeight: 11,
    textAlign: 'center',
  },
  iconSlot: {
    position: 'relative',
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
