import Feather from '@expo/vector-icons/Feather';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, theme } from '@/constants/theme';

export function RouteStrip({
  address,
  estimatedArrival,
  recipientName,
}: {
  address: string;
  estimatedArrival?: string | null;
  recipientName: string;
}) {
  function openMaps() {
    const encodedAddress = encodeURIComponent(address);
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
  }

  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.routeCard, pressed && styles.pressed]} onPress={openMaps}>
      <View style={styles.iconColumn}>
        <View style={styles.storeIcon}>
          <Feather color={theme.colors.primary} name="home" size={28} />
        </View>
        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <Feather color={theme.colors.text} name="map-pin" size={32} />
      </View>

      <View style={styles.copyColumn}>
        <View style={styles.pointBlock}>
          <Text numberOfLines={1} style={styles.storeTitle}>{"Esting's Flower International Inc."}</Text>
          <Text numberOfLines={1} style={styles.addressText}>Mac Arthur H-way, Brgy. Dolores, San Fernando...</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.pointBlock}>
          <Text numberOfLines={1} style={styles.recipientTitle}>{recipientName}</Text>
          <Text numberOfLines={1} style={styles.addressText}>{address}</Text>
          {estimatedArrival ? <Text style={styles.etaText}>ETA {estimatedArrival}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  addressText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 17,
  },
  copyColumn: {
    flex: 1,
    gap: theme.spacing.md,
    paddingTop: 3,
  },
  dot: {
    backgroundColor: '#8F8F8F',
    borderRadius: theme.radius.pill,
    height: 6,
    width: 6,
  },
  dots: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  etaText: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    lineHeight: 15,
  },
  iconColumn: {
    alignItems: 'center',
    width: 42,
  },
  pointBlock: {
    gap: 1,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }],
  },
  recipientTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    lineHeight: 21,
  },
  routeCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 18,
    flexDirection: 'row',
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  separator: {
    backgroundColor: 'rgba(31, 42, 36, 0.14)',
    height: 1,
  },
  storeIcon: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  storeTitle: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
  },
});
