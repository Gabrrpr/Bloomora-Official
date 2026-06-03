import { StyleSheet, View, useWindowDimensions, type GestureResponderHandlers, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EstingsLogo } from '@/components/estings-logo';
import { PageHeaderActions } from '@/components/page-header-actions';
import { theme } from '@/constants/theme';

type AppBrandHeaderProps = {
  actionColor?: string;
  absolute?: boolean;
  logoColor?: string;
  onSearchPress?: () => void;
  panHandlers?: GestureResponderHandlers;
  shadowLogo?: boolean;
  showSearchAction?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AppBrandHeader({
  actionColor = theme.colors.primary,
  absolute = false,
  logoColor = theme.colors.primary,
  onSearchPress,
  panHandlers,
  shadowLogo = false,
  showSearchAction = true,
  style,
}: AppBrandHeaderProps) {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const layout = getAppBrandHeaderLayout(width, height, insets.top);

  return (
    <View
      {...panHandlers}
      style={[
        styles.header,
        absolute && styles.absoluteHeader,
        {
          left: absolute ? 0 : undefined,
          minHeight: layout.height,
          paddingHorizontal: layout.sidePadding,
          paddingTop: layout.top,
          right: absolute ? 0 : undefined,
          top: absolute ? 0 : undefined,
        },
        style,
      ]}>
      <View style={[styles.logoFrame, { height: layout.logoHeight, marginLeft: layout.logoOffset, width: layout.logoWidth }]}>
        {shadowLogo ? <EstingsLogo color="rgba(0, 0, 0, 0.72)" style={styles.logoShadowImage} /> : null}
        <EstingsLogo color={logoColor} style={styles.logoImage} />
      </View>
      <PageHeaderActions color={actionColor} onSearchPress={onSearchPress} showSearch={showSearchAction} />
    </View>
  );
}

export function getAppBrandHeaderLayout(width: number, height: number, topInset: number) {
  const sidePadding = clamp(width * 0.048, 16, 24);

  return {
    height: 58,
    logoHeight: 48,
    logoOffset: clamp(width * 0.012, 4, 8),
    logoWidth: clamp(width * 0.5, 190, 204),
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
  absoluteHeader: {
    position: 'absolute',
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
  logoShadowImage: {
    height: '100%',
    opacity: 0.26,
    position: 'absolute',
    transform: [{ translateX: 0.8 }, { translateY: 1.2 }],
    width: '100%',
  },
});
