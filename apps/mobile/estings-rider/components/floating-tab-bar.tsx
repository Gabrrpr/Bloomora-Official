import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
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
import { getAuthSession, type AuthUser } from '@/services/auth-session';

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
  const [rider, setRider] = useState<AuthUser | null>(null);
  const isProfileFocused = state.routes[state.index]?.name === 'profile';
  const activePillIndex = isProfileFocused ? -1 : Math.min(state.index, layout.pillRouteCount - 1);
  const activeIndex = useSharedValue(activePillIndex);

  useEffect(() => {
    activeIndex.value = withSpring(activePillIndex, {
      damping: 22,
      mass: 0.82,
      stiffness: 260,
    });
  }, [activeIndex, activePillIndex]);

  useEffect(() => {
    let mounted = true;

    void getAuthSession().then((session) => {
      if (mounted) {
        setRider(session?.user ?? null);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const activePlateStyle = useAnimatedStyle(() => ({
    opacity: withSpring(isProfileFocused ? 0 : 1, {
      damping: 24,
      stiffness: 260,
    }),
    transform: [{ translateX: activeIndex.value * layout.itemWidth }],
  }));

  const pillContainerStyle = useAnimatedStyle(() => {
    const focusProgress = interpolate(activeIndex.value, [-1, 0], [0, 1], Extrapolation.CLAMP);

    return {
      opacity: interpolate(focusProgress, [0, 1], [0.92, 1], Extrapolation.CLAMP),
      transform: [
        {
          translateY: interpolate(focusProgress, [0, 1], [2, 0], Extrapolation.CLAMP),
        },
        {
          scale: interpolate(activeIndex.value, [-1, 0, 1, 2], [0.985, 1, 1.008, 1], Extrapolation.CLAMP),
        },
      ],
    };
  });

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: layout.bottom, paddingHorizontal: layout.sidePadding }]}>
      <View
        style={[
          styles.tabRail,
          {
            gap: layout.avatarGap,
            maxWidth: layout.totalWidth,
          },
        ]}>
        <Reanimated.View
          style={[
            styles.container,
            {
              height: layout.height,
              padding: layout.containerPadding,
              width: layout.navWidth,
            },
            pillContainerStyle,
          ]}>
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

            if (!item || routeName === 'profile') {
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
        </Reanimated.View>
        <ProfileTabButton
          active={isProfileFocused}
          layout={layout}
          route={state.routes.find((route) => route.name === 'profile')}
          rider={rider}
          navigation={navigation}
          descriptors={descriptors}
        />
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
    color: interpolateColor(progress.value, [0, 1], [theme.colors.white, theme.colors.text]),
    opacity: interpolate(progress.value, [0, 1], [0.9, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [2, 0], Extrapolation.CLAMP) }],
  }));

  const iconColor = active ? theme.colors.text : theme.colors.white;
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

function ProfileTabButton({
  active,
  descriptors,
  layout,
  navigation,
  rider,
  route,
}: {
  active: boolean;
  descriptors: BottomTabBarProps['descriptors'];
  layout: ReturnType<typeof getFloatingTabLayout>;
  navigation: BottomTabBarProps['navigation'];
  rider: AuthUser | null;
  route?: BottomTabBarProps['state']['routes'][number];
}) {
  const initials = getRiderInitials(rider);
  const profilePicture = rider?.profile_picture_url?.trim();
  const options = route ? descriptors[route.key]?.options : undefined;

  const onPress = () => {
    if (!route) {
      return;
    }

    const event = navigation.emit({
      canPreventDefault: true,
      target: route.key,
      type: 'tabPress',
    });

    if (!active && !event.defaultPrevented) {
      if (Platform.OS === 'ios') {
        void Haptics.selectionAsync().catch(() => {});
      }
      navigation.navigate(route.name, route.params);
    }
  };

  return (
    <Pressable
      accessibilityLabel={options?.tabBarAccessibilityLabel ?? 'Profile'}
      accessibilityRole="button"
      accessibilityState={active ? { selected: true } : {}}
      hitSlop={layout.hitSlop}
      style={({ pressed }) => [
        styles.avatarButton,
        {
          height: layout.avatarSize,
          width: layout.avatarSize,
        },
        active && styles.avatarButtonActive,
        pressed && styles.avatarButtonPressed,
      ]}
      testID={options?.tabBarButtonTestID}
      onPress={onPress}>
      {profilePicture ? (
        <Image contentFit="cover" source={{ uri: profilePicture }} style={styles.avatarImage} />
      ) : (
        <Text numberOfLines={1} style={[styles.avatarInitials, { fontSize: layout.avatarFontSize, lineHeight: layout.avatarFontSize + 5 }]}>
          {initials}
        </Text>
      )}
    </Pressable>
  );
}

function getRiderInitials(user: AuthUser | null) {
  const first = user?.first_name?.trim();
  const last = user?.last_name?.trim();
  const initials = `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();

  if (initials.length > 0) {
    return initials;
  }

  const fallback = user?.username?.trim() || user?.email?.trim() || 'Rider';
  return fallback
    .split(/[\s._@-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getFloatingTabLayout(width: number, height: number, bottomInset: number) {
  const sidePadding = clamp(width * 0.048, 16, 24);
  const avatarGap = clamp(width * 0.035, 14, 26);
  const avatarSize = clamp(Math.min(width, height) * 0.15, 58, 74);
  const totalWidth = clamp(width - sidePadding * 2, 330, 460);
  const navWidth = totalWidth - avatarSize - avatarGap;
  const containerPadding = clamp(Math.min(width, height) * 0.017, 6, 8);
  const innerWidth = navWidth - containerPadding * 2;
  const navHeight = clamp(height * 0.076, 62, 72);
  const icon = clamp(Math.min(width, height) * 0.065, 23, 29);
  const fontSize = clamp((height / 844) * 13, 11.5, 14);
  const pillRouteCount = 3;
  const itemWidth = innerWidth / pillRouteCount;
  const plateHeight = navHeight - containerPadding * 2;

  return {
    avatarFontSize: clamp(avatarSize * 0.44, 25, 33),
    avatarGap,
    avatarSize,
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
      lineHeight: clamp((height / 844) * 17, 15, 18),
    },
    navWidth,
    plateHeight,
    pillRouteCount,
    sidePadding,
    totalWidth,
  };
}

const styles = StyleSheet.create({
  activePlate: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.pill,
    boxShadow: '0 1px 1px rgba(255, 255, 255, 0.12)',
    position: 'absolute',
  },
  avatarButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    boxShadow: '0 16px 30px rgba(31, 42, 36, 0.22)',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarButtonActive: {
    backgroundColor: theme.colors.primaryDark,
    transform: [{ scale: 1.03 }],
  },
  avatarButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.96 }],
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  avatarInitials: {
    color: theme.colors.white,
    fontFamily: Fonts.sansSemiBold,
    textAlign: 'center',
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#222222',
    borderRadius: theme.radius.pill,
    boxShadow: '0 16px 30px rgba(31, 42, 36, 0.24)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  label: {
    fontFamily: Fonts.sansSemiBold,
    marginTop: 2,
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
  tabRail: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
});
