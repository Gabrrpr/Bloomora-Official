import { router } from 'expo-router';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Code2,
  Headset,
  Mail,
  Phone,
  KeyRound,
  LogOut,
  MessageCircle,
  Pencil,
  RotateCcw,
  Search,
  ShieldOff,
  SlidersHorizontal,
  Trash2,
  UserRound,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, theme } from '@/constants/theme';

type RowIcon = typeof Pencil;

const pastelDanger = '#D96B6B';

type SettingsItem = {
  danger?: boolean;
  detail?: string;
  icon: RowIcon;
  title: string;
  onPress?: () => void;
};

type SettingsGroup = {
  danger?: boolean;
  items: SettingsItem[];
  title: string;
};

export default function SettingsScreen() {
  const [activeView, setActiveView] = useState<'settings' | 'account'>('settings');
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (
      Platform.OS === 'android' &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  function handleLogout() {
    setIsLogoutVisible(false);
    router.replace('/login');
  }

  function handleBack() {
    if (activeView === 'account') {
      setActiveView('settings');
      return;
    }

    router.back();
  }

  function handleSearchChange(value: string) {
    LayoutAnimation.configureNext({
      create: {
        duration: 180,
        property: LayoutAnimation.Properties.opacity,
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        duration: 140,
        property: LayoutAnimation.Properties.opacity,
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      update: {
        duration: 220,
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
    setSearchQuery(value);
  }

  const settingsGroups: SettingsGroup[] = [
    {
      title: 'Account',
      items: [
        {
          icon: UserRound,
          title: 'Account',
          onPress: () => setActiveView('account'),
        },
      ],
    },
    {
      title: 'App Settings',
      items: [
        { icon: Bell, title: 'Notifications' },
        { icon: SlidersHorizontal, title: 'App preferences' },
        {
          icon: Code2,
          title: 'Developer Tools',
          onPress: () => router.push('/developer'),
        },
      ],
    },
    {
      title: 'Help Center',
      items: [
        { icon: CircleHelp, title: 'FAQs', onPress: () => router.push('/faq') },
        { icon: RotateCcw, title: 'Return Policy', onPress: () => router.push('/return-policy') },
        { icon: Headset, title: 'Live Chat', onPress: () => router.push('/live-chat') },
        { icon: MessageCircle, title: 'Contact', onPress: () => router.push('/contact') },
      ],
    },
  ];
  const accountGroups: SettingsGroup[] = [
    {
      title: 'Account Information',
      items: [
        { detail: 'Bloomora member', icon: UserRound, title: 'Display Name' },
        { detail: 'maya@bloomora.app', icon: Mail, title: 'Email' },
        { detail: '+63 947 865 0531', icon: Phone, title: 'Phone' },
      ],
    },
    {
      title: 'How you sign into your account',
      items: [
        { detail: 'Change password', icon: KeyRound, title: 'Password' },
      ],
    },
    {
      title: 'Account Management',
      items: [
        { danger: true, icon: ShieldOff, title: 'Disable account' },
        { danger: true, icon: Trash2, title: 'Delete account' },
      ],
    },
  ];
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const visibleSettingsGroups = settingsGroups
    .map((group) => ({
      ...group,
      items: normalizedSearch
        ? group.items.filter((item) =>
            `${group.title} ${item.title} ${item.detail ?? ''}`.toLowerCase().includes(normalizedSearch),
          )
        : group.items,
    }))
    .filter((group) => group.items.length > 0);
  const visibleGroups = activeView === 'account' ? accountGroups : visibleSettingsGroups;

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + 104,
            paddingTop: insets.top + theme.spacing.lg,
          },
        ]}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Go back" style={styles.closeButton} onPress={handleBack}>
            <ChevronLeft size={28} color={theme.colors.primary} strokeWidth={2.4} />
          </Pressable>
          <Text style={styles.headerTitle}>{activeView === 'account' ? 'Account' : 'Settings'}</Text>
        </View>

        {activeView === 'settings' ? (
          <View style={styles.searchBar}>
            <Search size={21} color={theme.colors.primary} strokeWidth={2.2} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              onChangeText={handleSearchChange}
              placeholder="Search"
              placeholderTextColor={theme.colors.textMuted}
              returnKeyType="search"
              style={styles.searchInput}
              value={searchQuery}
            />
          </View>
        ) : null}

        {visibleGroups.map((group) => (
          <SettingsSection key={group.title} title={group.title}>
            <View style={styles.groupCard}>
              {group.items.map((item, index) => (
                <View key={item.title}>
                  {index > 0 ? <Divider /> : null}
                  <SettingsRow {...item} />
                </View>
              ))}
            </View>
          </SettingsSection>
        ))}

        {activeView === 'settings' && !normalizedSearch ? (
          <SettingsSection danger title="Danger Zone">
            <View style={styles.groupCard}>
              <SettingsRow danger icon={LogOut} title="Logout" onPress={() => setIsLogoutVisible(true)} />
            </View>
          </SettingsSection>
        ) : null}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={isLogoutVisible}
        onRequestClose={() => setIsLogoutVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <LogOut size={26} color={pastelDanger} strokeWidth={2.3} />
            </View>
            <View style={styles.modalCopy}>
              <Text style={styles.modalTitle}>Log out of Bloomora?</Text>
              <Text style={styles.modalMessage}>
                You can sign back in anytime to continue managing your account and orders.
              </Text>
            </View>
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelButton} onPress={() => setIsLogoutVisible(false)}>
                <Text style={styles.cancelText}>Stay signed in</Text>
              </Pressable>
              <Pressable style={styles.confirmLogoutButton} onPress={handleLogout}>
                <Text style={styles.confirmLogoutText}>Log out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function SettingsSection({
  children,
  danger = false,
  title,
}: {
  children: ReactNode;
  danger?: boolean;
  title: string;
}) {
  const fadeAnim = useState(() => new Animated.Value(0))[0];
  const slideAnim = useState(() => new Animated.Value(8))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        duration: 180,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        duration: 180,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionAccent, danger && styles.sectionAccentDanger]} />
        <Text style={[styles.sectionTitle, danger && styles.dangerText]}>{title}</Text>
      </View>
      {children}
    </Animated.View>
  );
}

function SettingsRow({
  danger = false,
  detail,
  icon: Icon,
  onPress,
  title,
}: {
  danger?: boolean;
  detail?: string;
  icon: RowIcon;
  onPress?: () => void;
  title: string;
}) {
  return (
    <Pressable style={styles.settingsRow} onPress={onPress}>
      <View style={styles.rowIcon}>
        <Icon size={theme.icon.md} color={danger ? pastelDanger : theme.colors.textMuted} />
      </View>
      <Text style={[styles.rowTitle, danger && styles.dangerText]}>{title}</Text>
      {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      {onPress || !danger ? <ChevronRight size={theme.icon.sm} color={theme.colors.primary} /> : null}
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F4F5F7',
    flex: 1,
  },
  content: {
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 44,
  },
  closeButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    marginLeft: -6,
    width: 42,
  },
  headerTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 26,
    lineHeight: 32,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 58,
    paddingHorizontal: theme.spacing.lg,
  },
  searchInput: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    padding: 0,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  sectionAccent: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    height: 14,
    width: 4,
  },
  sectionAccentDanger: {
    backgroundColor: pastelDanger,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 15,
    lineHeight: 20,
  },
  groupCard: {
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(46, 139, 52, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.lg,
    minHeight: 68,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  rowIcon: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  rowTitle: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    lineHeight: 21,
  },
  rowDetail: {
    color: theme.colors.textMuted,
    flexShrink: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    textAlign: 'right',
  },
  divider: {
    backgroundColor: 'rgba(31, 42, 36, 0.07)',
    height: 1,
    marginLeft: 66,
  },
  dangerText: {
    color: pastelDanger,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(31, 42, 36, 0.32)',
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    gap: theme.spacing.xl,
    padding: theme.spacing.xl,
    width: '100%',
  },
  modalIconWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: 'rgba(217, 107, 107, 0.22)',
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  modalCopy: {
    gap: theme.spacing.sm,
  },
  modalTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
  },
  modalMessage: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  confirmLogoutButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  confirmLogoutText: {
    color: pastelDanger,
    fontSize: 15,
    fontWeight: '800',
  },
});
