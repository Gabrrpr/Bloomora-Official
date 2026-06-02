import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RiderScreen, SectionHeader } from '@/components/rider/screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, theme } from '@/constants/theme';

type IconName = ComponentProps<typeof IconSymbol>['name'];

const profileStats = [
  { label: 'Delivered', value: '128' },
  { label: 'Rating', value: '4.9' },
  { label: 'Routes', value: '32' },
];

const accountRows: { detail: string; icon: IconName; title: string }[] = [
  { detail: 'Assigned vehicle and bag checks', icon: 'truck.box.fill', title: 'Rider equipment' },
  { detail: 'Shop announcements and route updates', icon: 'bell.fill', title: 'Notifications' },
  { detail: 'Proof of delivery and recipient notes', icon: 'doc.text.fill', title: 'Delivery records' },
];

export default function ProfileScreen() {
  return (
    <RiderScreen
      headerAction={
        <HeaderIconButton
          accessibilityLabel="Open rider settings"
          icon="settings"
          onPress={() => router.push('/settings')}
        />
      }
      subtitle="Staff account and delivery performance"
      title="Profile">
      <View style={styles.identityPanel}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <IconSymbol color={theme.colors.white} name="person.crop.circle.fill" size={34} />
          </View>
        </View>
        <View style={styles.identityCopy}>
          <Text style={styles.profileName}>{"Esting's Rider"}</Text>
          <Text style={styles.profileEmail}>rider@estings.app</Text>
          <View style={styles.memberPill}>
            <IconSymbol color={theme.colors.rider} name="checkmark.seal.fill" size={14} />
            <Text style={styles.memberPillText}>Staff Delivery</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {profileStats.map((stat) => (
          <View key={stat.label} style={styles.statCell}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <SectionHeader title="Shift" />
      <View style={styles.shiftPanel}>
        <View>
          <Text style={styles.shiftTitle}>Active shift</Text>
          <Text style={styles.shiftText}>May 31, 2026 - 9:00 AM to 6:00 PM</Text>
        </View>
        <View style={styles.shiftBadge}>
          <Text style={styles.shiftBadgeText}>Online</Text>
        </View>
      </View>

      <SectionHeader title="Account" />
      <View style={styles.menuGroup}>
        {accountRows.map((row, index) => (
          <View key={row.title}>
            <AccountRow {...row} />
            {index < accountRows.length - 1 ? <View style={styles.divider} /> : null}
          </View>
        ))}
      </View>

      <View style={styles.trustPanel}>
        <IconSymbol color={theme.colors.primary} name="checkmark.seal.fill" size={19} />
        <Text style={styles.trustText}>{"Verified staff profile for Esting's delivery operations."}</Text>
      </View>
    </RiderScreen>
  );
}

function AccountRow({ detail, icon, title }: { detail: string; icon: IconName; title: string }) {
  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.accountRow, pressed && styles.pressed]}>
      <View style={styles.rowIcon}>
        <IconSymbol color={theme.colors.textMuted} name={icon} size={21} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDetail}>{detail}</Text>
      </View>
      <IconSymbol color={theme.colors.textMuted} name="chevron.right" size={18} />
    </Pressable>
  );
}

function HeaderIconButton({
  accessibilityLabel,
  icon,
  onPress,
}: {
  accessibilityLabel: string;
  icon: ComponentProps<typeof Feather>['name'];
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}
      onPress={onPress}>
      <Feather color={theme.colors.text} name={icon} size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  accountRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 66,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: theme.colors.rider,
    borderRadius: theme.radius.pill,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  avatarRing: {
    alignItems: 'center',
    borderColor: 'rgba(31, 42, 36, 0.1)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 74,
    justifyContent: 'center',
    width: 74,
  },
  divider: {
    backgroundColor: 'rgba(31, 42, 36, 0.09)',
    height: 1,
    marginLeft: 72,
  },
  identityCopy: {
    flex: 1,
    gap: 5,
  },
  headerIconButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 36,
  },
  identityPanel: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.07)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  memberPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.riderSoft,
    borderColor: 'rgba(51, 65, 85, 0.1)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    marginTop: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  memberPillText: {
    color: theme.colors.rider,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 15,
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
  profileEmail: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  profileName: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    lineHeight: 23,
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
  shiftBadge: {
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  shiftBadgeText: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 15,
  },
  shiftPanel: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.07)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  shiftText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  shiftTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
  },
  statCell: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
    paddingVertical: theme.spacing.md,
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 15,
  },
  statValue: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    lineHeight: 23,
  },
  statsGrid: {
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.07)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  trustPanel: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.07)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  trustText: {
    color: theme.colors.textMuted,
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
});
