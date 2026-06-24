import { router } from 'expo-router';
import { Search, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, TextInput, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, theme } from '@/constants/theme';

type FloatingProductSearchProps = {
  onClose: () => void;
  visible: boolean;
};

export function FloatingProductSearch({ onClose, visible }: FloatingProductSearchProps) {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const side = Math.min(Math.max(width * 0.048, 16), 24);
  const top = insets.top + Math.min(Math.max(height * 0.014, 10), 18) + 66;

  useEffect(() => {
    if (visible) {
      setMounted(true);
    }

    progress.stopAnimation();
    Animated.timing(progress, {
      duration: visible ? 240 : 180,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      toValue: visible ? 1 : 0,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !visible) {
        setMounted(false);
        setQuery('');
      }
    });
  }, [progress, visible]);

  if (!mounted) {
    return null;
  }

  const openResults = () => {
    const nextQuery = query.trim();
    onClose();
    router.push(nextQuery ? `/search-results?q=${encodeURIComponent(nextQuery)}` : '/search-results');
  };

  const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.overlay,
        {
          left: side,
          opacity,
          right: side,
          top,
          transform: [{ translateY }, { scale }],
        },
      ]}>
      <Search size={20} color={theme.colors.textMuted} strokeWidth={2} />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={visible}
        onChangeText={setQuery}
        onSubmitEditing={openResults}
        placeholder="Search bouquets, flowers, gifts..."
        placeholderTextColor={theme.colors.textMuted}
        returnKeyType="search"
        style={styles.input}
        value={query}
      />
      <Pressable accessibilityLabel="Close search" accessibilityRole="button" hitSlop={10} onPress={onClose}>
        <X size={20} color={theme.colors.text} strokeWidth={2.2} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(31, 42, 36, 0.1)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    boxShadow: '0 16px 34px rgba(31, 42, 36, 0.12)',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    height: 50,
    paddingHorizontal: theme.spacing.md,
    position: 'absolute',
    zIndex: 80,
  },
  input: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 15,
    paddingVertical: 0,
  },
});
