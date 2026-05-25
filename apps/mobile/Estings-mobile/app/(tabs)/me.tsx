import { router } from 'expo-router';
import {
  Bell,
  ChevronRight,
  Flower2,
  Heart,
  HelpCircle,
  Info,
  MapPin,
  MessageCircle,
  Package,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  UserRound,
  WalletCards,
} from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, theme } from '@/constants/theme';

type RowIcon = typeof UserRound;

const outlineColor = 'rgba(31, 42, 36, 0.11)';
const hairlineColor = 'rgba(31, 42, 36, 0.09)';

const purchaseActions = [
  { icon: WalletCards, label: 'To Pay', value: '0' },
  { icon: Package, label: 'To Ship', value: '0' },
  { icon: Truck, label: 'To Receive', value: '0' },
  { icon: Star, label: 'To Rate', value: '0' },
];

const profileStats = [
  { label: 'Saved', value: '0' },
  { label: 'Orders', value: '0' },
  { label: 'Points', value: '0' },
];

export default function MeScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + theme.spacing.lg;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: insets.bottom + 104,
          paddingTop: topPadding,
        },
      ]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Me</Text>
        </View>
        <View style={styles.headerActions}>
          <HeaderIconButton accessibilityLabel="Open notifications" icon={Bell} onPress={() => router.push('/notifications')} />
          <HeaderIconButton accessibilityLabel="Open settings" icon={Settings} onPress={() => router.push('/settings')} />
        </View>
      </View>

      <View style={styles.identityPanel}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <UserRound size={31} color={theme.colors.white} strokeWidth={2.1} />
          </View>
        </View>
        <View style={styles.identityCopy}>
          <Text style={styles.profileName}>{"Esting's member"}</Text>
          <Text style={styles.profileEmail}>maya@estings.app</Text>
          <View style={styles.memberPill}>
            <Sparkles size={13} color={theme.colors.primaryDark} strokeWidth={2.2} />
            <Text style={styles.memberPillText}>New Customer</Text>
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

      <SectionHeader title="Purchases" />
      <View style={styles.purchasePanel}>
        {purchaseActions.map((action, index) => (
          <Pressable
            key={action.label}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.purchaseButton,
              index < purchaseActions.length - 1 && styles.purchaseDivider,
              pressed && styles.pressed,
            ]}>
            <View style={styles.purchaseIconWrap}>
              <action.icon size={21} color={theme.colors.textMuted} strokeWidth={2} />
            </View>
            <Text style={styles.purchaseValue}>{action.value}</Text>
            <Text style={styles.purchaseText}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.addressPanel}>
        <View style={styles.addressIcon}>
          <MapPin size={22} color={theme.colors.textMuted} strokeWidth={2.1} />
        </View>
        <View style={styles.addressBody}>
          <Text style={styles.addressTitle}>Delivery address</Text>
          <Text style={styles.addressText}>Unit 12, Sampaguita St., Quezon City, Metro Manila</Text>
        </View>
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.editChip, pressed && styles.pressed]}>
          <Text style={styles.editChipText}>Edit</Text>
        </Pressable>
      </View>

      <SectionHeader title="Collection" />
      <View style={styles.menuGroup}>
        <AccountRow
          icon={Heart}
          title="Wishlist"
          detail="0 bouquets"
          onPress={() => router.push('/wishlist')}
        />
        <Divider />
        <AccountRow disabled icon={Flower2} title="Favorite styles" detail="Coming soon" />
        <Divider />
        <AccountRow disabled icon={Bell} title="Occasion reminders" detail="Coming soon" />
      </View>

      <SectionHeader title="Support" />
      <View style={styles.menuGroup}>
        <AccountRow icon={MessageCircle} title="Live chat" detail="Usually replies fast" onPress={() => router.push('/live-chat')} />
        <Divider />
        <AccountRow icon={HelpCircle} title="Contact us" detail="Branches and support" onPress={() => router.push('/contact')} />
        <Divider />
        <AccountRow icon={Info} title="About Esting's" detail="Our story" onPress={() => router.push('/about')} />
      </View>

      <View style={styles.trustPanel}>
        <ShieldCheck size={19} color={theme.colors.primary} strokeWidth={2.1} />
        <Text style={styles.trustText}>Secure account, protected checkout, and verified delivery updates.</Text>
      </View>
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

function AccountRow({
  detail,
  disabled = false,
  icon: Icon,
  onPress,
  title,
}: {
  detail?: string;
  disabled?: boolean;
  icon: RowIcon;
  onPress?: () => void;
  title: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.accountRow,
        disabled && styles.accountRowDisabled,
        pressed && !disabled && styles.pressed,
      ]}
      onPress={onPress}>
      <View style={styles.rowIcon}>
        <Icon size={20} color={disabled ? 'rgba(109, 119, 111, 0.45)' : theme.colors.textMuted} strokeWidth={2} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, disabled && styles.rowTextDisabled]}>{title}</Text>
        {detail ? <Text style={[styles.rowDetail, disabled && styles.rowTextDisabled]}>{detail}</Text> : null}
      </View>
      {!disabled ? <ChevronRight size={18} color={theme.colors.textMuted} strokeWidth={2} /> : null}
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function HeaderIconButton({
  accessibilityLabel,
  icon: Icon,
  onPress,
}: {
  accessibilityLabel: string;
  icon: RowIcon;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}
      onPress={onPress}>
      <Icon size={22} color={theme.colors.text} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.surfaceAlt,
    flex: 1,
  },
  content: {
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  headerIconButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 36,
  },
  title: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 30,
    lineHeight: 36,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
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
  avatarRing: {
    alignItems: 'center',
    borderColor: 'rgba(31, 42, 36, 0.1)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 74,
    justifyContent: 'center',
    width: 74,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  identityCopy: {
    flex: 1,
    gap: 5,
  },
  profileName: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    lineHeight: 23,
  },
  profileEmail: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  memberPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: 'rgba(31, 42, 36, 0.09)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    marginTop: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  memberPillText: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 15,
  },
  statsGrid: {
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.07)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  statCell: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
    paddingVertical: theme.spacing.md,
  },
  statValue: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    lineHeight: 23,
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 15,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  sectionTitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 15,
    lineHeight: 20,
  },
  sectionLine: {
    backgroundColor: hairlineColor,
    flex: 1,
    height: 1,
  },
  purchasePanel: {
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.07)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  purchaseButton: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    minHeight: 98,
    paddingVertical: theme.spacing.md,
  },
  purchaseDivider: {
    borderRightColor: hairlineColor,
    borderRightWidth: 1,
  },
  purchaseIconWrap: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  purchaseValue: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 19,
  },
  purchaseText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
  addressPanel: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.07)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  addressIcon: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  addressBody: {
    flex: 1,
    gap: 3,
  },
  addressTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
  },
  addressText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  editChip: {
    borderColor: outlineColor,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  editChipText: {
    color: theme.colors.text,
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
  accountRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 66,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  accountRowDisabled: {
    opacity: 0.62,
  },
  rowIcon: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  rowDetail: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
  },
  rowTextDisabled: {
    color: 'rgba(109, 119, 111, 0.64)',
  },
  divider: {
    backgroundColor: hairlineColor,
    height: 1,
    marginLeft: 72,
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
