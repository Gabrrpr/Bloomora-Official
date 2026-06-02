import { Image as ExpoImage, type ImageStyle } from 'expo-image';
import { StyleSheet, type StyleProp } from 'react-native';

import { theme } from '@/constants/theme';

const estingsLogo = require('@/assets/images/branding/estingsFlowerShop-logo-white.svg');

export function EstingsLogo({
  color = theme.colors.primary,
  style,
}: {
  color?: string;
  style?: StyleProp<ImageStyle>;
}) {
  return <ExpoImage source={estingsLogo} style={[styles.logo, style]} contentFit="contain" tintColor={color} />;
}

const styles = StyleSheet.create({
  logo: {
    height: 42,
    width: 190,
  },
});
