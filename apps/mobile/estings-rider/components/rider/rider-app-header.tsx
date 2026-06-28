import Feather from '@expo/vector-icons/Feather';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RiderAppLogo } from '@/components/rider/rider-app-logo';
import { theme } from '@/constants/theme';
import { getRiderNotifications } from '@/services/rider-notifications';

type RiderAppHeaderProps = {
  style?: StyleProp<ViewStyle>;
};

export function RiderAppHeader({ style }: RiderAppHeaderProps) {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const layout = getRiderAppHeaderLayout(width, height, insets.top);
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      void getRiderNotifications().then((notifications) => {
        if (isActive) {
          setUnreadCount(notifications.filter((notification) => !notification.isRead).length);
        }
      });

      return () => {
        isActive = false;
      };
    }, []),
  );

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
        <Pressable
          accessibilityLabel="Open notifications"
          accessibilityRole="button"
          style={({ pressed }) => [styles.notificationButton, pressed && styles.pressed]}
          onPress={() => router.push('/notifications')}>
          <Feather color={theme.colors.primary} name="bell" size={24} />
          {unreadCount > 0 ? <View style={styles.notificationDot} /> : null}
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
    borderRadius: theme.radius.pill,
    height: 52,
    justifyContent: 'center',
    position: 'relative',
    width: 52,
  },
  notificationDot: {
    backgroundColor: '#FF5151',
    borderRadius: theme.radius.pill,
    height: 8,
    position: 'absolute',
    right: 8,
    top: 9,
    width: 8,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.96 }],
  },
});
