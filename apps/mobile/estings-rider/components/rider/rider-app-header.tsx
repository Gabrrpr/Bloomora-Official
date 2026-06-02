import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RiderAppLogo } from '@/components/rider/rider-app-logo';
import { theme } from '@/constants/theme';

const defaultProfile = require('@/assets/images/rider/default-profile.png');

type RiderAppHeaderProps = {
  style?: StyleProp<ViewStyle>;
};

export function RiderAppHeader({ style }: RiderAppHeaderProps) {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const layout = getRiderAppHeaderLayout(width, height, insets.top);

  return (
    <View
      style={[
        styles.header,
        {
          minHeight: layout.height,
          paddingHorizontal: layout.sidePadding,
          paddingTop: layout.top,
        },
        style,
      ]}>
      <View style={[styles.logoFrame, { height: layout.logoHeight, marginLeft: layout.logoOffset, width: layout.logoWidth }]}>
        <RiderAppLogo style={styles.logoImage} />
      </View>
      <View style={styles.headerActions}>
        <Image contentFit="cover" source={defaultProfile} style={styles.avatar} />
        <Pressable accessibilityLabel="Open notifications" accessibilityRole="button" style={({ pressed }) => [styles.notificationButton, pressed && styles.pressed]}>
          <Feather color={theme.colors.primary} name="bell" size={24} />
          <View style={styles.notificationDot} />
        </Pressable>
      </View>
    </View>
  );
}

export function getRiderAppHeaderLayout(width: number, height: number, topInset: number) {
  const sidePadding = clamp(width * 0.048, 16, 24);

  return {
    height: 58,
    logoHeight: 48,
    logoOffset: clamp(width * 0.012, 4, 8),
    logoWidth: clamp(width * 0.5, 184, 220),
    sidePadding,
    top: topInset + clamp(height * 0.014, 10, 18),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: theme.radius.pill,
    height: 52,
    width: 52,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    zIndex: 10,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  logoFrame: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    position: 'relative',
  },
  logoImage: {
    height: '100%',
    width: '100%',
  },
  notificationButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    height: 52,
    justifyContent: 'center',
    position: 'relative',
    width: 52,
  },
  notificationDot: {
    backgroundColor: '#FF5151',
    borderRadius: theme.radius.pill,
    height: 16,
    position: 'absolute',
    right: -1,
    top: -1,
    width: 16,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.96 }],
  },
});
