import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, theme } from '@/constants/theme';

type FeatherIconName = ComponentProps<typeof Feather>['name'];

const settingsGroups: {
  items: {
    detail: string;
    icon: FeatherIconName;
    title: string;
  }[];
  title: string;
}[] = [
  {
    title: 'Rider',
    items: [
      { detail: 'Vehicle, delivery bag, and dispatch name', icon: 'truck', title: 'Rider profile' },
      { detail: 'Shift status and route availability', icon: 'navigation', title: 'Shift controls' },
      { detail: 'Proof of delivery and handoff notes', icon: 'file-text', title: 'Delivery records' },
    ],
  },
  {
    title: 'App',
    items: [
      { detail: 'Route assignments and shop broadcasts', icon: 'bell', title: 'Notifications' },
      { detail: 'Live location while on active deliveries', icon: 'map-pin', title: 'Location sharing' },
      { detail: "Help from Esting's dispatch team", icon: 'headphones', title: 'Support' },
    ],
  },
];

export default function RiderSettingsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: insets.bottom + theme.spacing.xl,
          paddingTop: insets.top + theme.spacing.lg,
        },
      ]}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}
          onPress={() => router.back()}>
          <Feather color={theme.colors.text} name="chevron-left" size={24} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Rider account and dispatch preferences</Text>
        </View>
      </View>

      <View style={styles.statusPanel}>
        <View style={styles.statusCopy}>
          <Text style={styles.statusTitle}>Accepting deliveries</Text>
          <Text style={styles.statusText}>Keep this on while you are available for shop assignments.</Text>
        </View>
        <Switch value trackColor={{ false: theme.colors.border, true: theme.colors.greenSoft }} thumbColor={theme.colors.primary} />
      </View>

      {settingsGroups.map((group) => (
        <View key={group.title} style={styles.groupBlock}>
          <SectionHeader title={group.title} />
          <View style={styles.menuGroup}>
            {group.items.map((item, index) => (
              <View key={item.title}>
                <SettingsRow {...item} />
                {index < group.items.length - 1 ? <View style={styles.divider} /> : null}
              </View>
            ))}
          </View>
        </View>
      ))}

      <Pressable accessibilityRole="button" style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]} onPress={() => router.replace('/login')}>
        <Feather color={theme.colors.danger} name="log-out" size={19} />
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </ScrollView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

function SettingsRow({ detail, icon, title }: { detail: string; icon: FeatherIconName; title: string }) {
  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.settingsRow, pressed && styles.pressed]}>
      <View style={styles.rowIcon}>
        <Feather color={theme.colors.textMuted} name={icon} size={20} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDetail}>{detail}</Text>
      </View>
      <Feather color={theme.colors.textMuted} name="chevron-right" size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  divider: {
    backgroundColor: 'rgba(31, 42, 36, 0.09)',
    height: 1,
    marginLeft: 72,
  },
  groupBlock: {
    gap: theme.spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: 3,
  },
  headerIconButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 36,
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(180, 35, 24, 0.16)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 54,
  },
  logoutText: {
    color: theme.colors.danger,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 14,
    lineHeight: 18,
  },
  menuGroup: {
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.07)',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowDetail: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
  },
  rowIcon: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  rowTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  screen: {
    backgroundColor: theme.colors.surfaceAlt,
    flex: 1,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  sectionLine: {
    backgroundColor: 'rgba(31, 42, 36, 0.09)',
    flex: 1,
    height: 1,
  },
  sectionTitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 15,
    lineHeight: 20,
  },
  settingsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 66,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  statusCopy: {
    flex: 1,
    gap: 3,
  },
  statusPanel: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.07)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  statusText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  statusTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    lineHeight: 21,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 30,
    lineHeight: 36,
  },
});
