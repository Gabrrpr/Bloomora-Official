import { Image as ExpoImage, type ImageStyle } from 'expo-image';
import { StyleSheet, type StyleProp } from 'react-native';

const riderAppLogo = require('@/assets/images/rider/estings-rider-app-logo.svg');

export function RiderAppLogo({ style }: { style?: StyleProp<ImageStyle> }) {
  return <ExpoImage contentFit="contain" source={riderAppLogo} style={[styles.logo, style]} />;
}

const styles = StyleSheet.create({
  logo: {
    height: 48,
    width: 204,
  },
});
