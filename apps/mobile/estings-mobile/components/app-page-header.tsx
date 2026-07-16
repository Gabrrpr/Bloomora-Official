import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, theme } from '@/constants/theme';

type AppPageHeaderProps = {
  onBack?: () => void;
  rightAction?: ReactNode;
  title: string;
};

export function AppPageHeader({ title, onBack, rightAction }: AppPageHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onBack ?? (() => router.back())}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <ArrowLeft color={theme.colors.text} size={22} strokeWidth={2.4} />
        </Pressable>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        <View style={styles.rightAction}>{rightAction}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: theme.colors.white,
    borderBottomColor: 'rgba(31, 42, 36, 0.10)',
    borderBottomWidth: 1,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 56,
    paddingHorizontal: theme.spacing.sm,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  title: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    lineHeight: 18,
    paddingHorizontal: theme.spacing.sm,
    textAlign: 'center',
  },
  rightAction: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  pressed: { opacity: 0.55 },
});
