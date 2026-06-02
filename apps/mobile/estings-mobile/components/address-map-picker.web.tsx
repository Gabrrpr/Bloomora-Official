import { MapPin } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts, theme } from '@/constants/theme';

export function AddressMapPicker() {
  return (
    <View style={styles.mapFallback}>
      <View style={styles.mapFallbackIcon}>
        <MapPin size={28} color={theme.colors.primary} strokeWidth={2.1} />
      </View>
      <Text style={styles.mapFallbackTitle}>Location map is available on mobile.</Text>
      <Text style={styles.mapFallbackText}>Use Expo Go on Android or iOS to pin your location. On web, type the address manually.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mapFallback: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    gap: theme.spacing.sm,
    minHeight: 180,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  mapFallbackIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  mapFallbackTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  mapFallbackText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
