import { router } from 'expo-router';
import { Bell, Menu, Search, Store } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { theme } from '@/constants/theme';

export function PageHeaderActions({
  color = theme.colors.primary,
  onMenuPress,
  onSearchPress,
  onStorePress,
  showMenu = false,
  showSearch = true,
  showStore = false,
}: {
  color?: string;
  onMenuPress?: () => void;
  onSearchPress?: () => void;
  onStorePress?: () => void;
  showMenu?: boolean;
  showSearch?: boolean;
  showStore?: boolean;
}) {
  return (
    <View style={[styles.headerActions, (showMenu || showStore) && styles.headerActionsCompact]}>
      {showMenu ? (
        <Pressable
          accessibilityLabel="All Categories"
          accessibilityRole="button"
          onPress={onMenuPress}
          style={({ pressed }) => [styles.headerIconButton, pressed && styles.headerIconButtonPressed]}>
          <Menu size={23} color={color} strokeWidth={2.3} />
        </Pressable>
      ) : null}
      {showStore ? (
        <Pressable
          accessibilityLabel="Change store branch"
          accessibilityRole="button"
          onPress={onStorePress}
          style={({ pressed }) => [styles.headerIconButton, pressed && styles.headerIconButtonPressed]}>
          <Store size={22} color={color} strokeWidth={2.2} />
        </Pressable>
      ) : null}
      {showSearch ? (
        <Pressable
          accessibilityLabel="Search products"
          accessibilityRole="button"
          onPress={onSearchPress ?? (() => router.push('/categories'))}
          style={({ pressed }) => [styles.headerIconButton, pressed && styles.headerIconButtonPressed]}>
          <Search size={23} color={color} strokeWidth={2.2} />
        </Pressable>
      ) : null}
      <Pressable
        accessibilityLabel="Open notifications"
        accessibilityRole="button"
        onPress={() => router.push('/notifications')}
        style={({ pressed }) => [styles.headerIconButton, pressed && styles.headerIconButtonPressed]}>
        <Bell size={22} color={color} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  headerActionsCompact: {
    gap: 6,
  },
  headerIconButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderRadius: theme.radius.pill,
    borderWidth: 0,
    height: 40,
    justifyContent: 'center',
    width: 36,
  },
  headerIconButtonPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.96 }],
  },
});
