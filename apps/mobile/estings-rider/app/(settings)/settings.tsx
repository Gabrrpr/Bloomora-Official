import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, theme } from '@/constants/theme';
import { logout } from '@/services/auth-api';
import {
  getAuthSession,
  getRememberedRider,
  saveRememberedRider,
  type AuthUser,
  type RememberedRider,
} from '@/services/auth-session';
import {
  authenticateWithScreenLock,
  getBiometricsAvailability,
  type BiometricsAvailability,
} from '@/services/biometrics';

const dangerTone = '#D96B6B';

export default function RiderSettingsScreen() {
  const insets = useSafeAreaInsets();
  const [rider, setRider] = useState<AuthUser | null>(null);
  const [rememberedRider, setRememberedRider] = useState<RememberedRider | null>(null);
  const [biometricsAvailability, setBiometricsAvailability] = useState<BiometricsAvailability | null>(null);
  const [biometricsMessage, setBiometricsMessage] = useState<string | null>(null);
  const [isScreenLockEnabled, setIsScreenLockEnabled] = useState(false);
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);
  useEffect(() => {
    let mounted = true;

    void Promise.all([getAuthSession(), getRememberedRider(), getBiometricsAvailability()]).then(
      ([session, storedRider, availability]) => {
        if (!mounted) {
          return;
        }

        setRider(session?.user ?? null);
        setRememberedRider(storedRider);
        setIsScreenLockEnabled(Boolean(storedRider?.biometricEnabled));
        setBiometricsAvailability(availability);
      },
    );

    return () => {
      mounted = false;
    };
  }, []);

  async function handleLogout() {
    setIsLogoutVisible(false);
    await logout({ forgetAccount: true });
    router.replace('/login');
  }

  async function handleToggleScreenLock(nextValue: boolean) {
    if (!nextValue) {
      const nextRider = getNextRememberedRider(rider, rememberedRider, false);
      if (nextRider) {
        await saveRememberedRider(nextRider);
        setRememberedRider(nextRider);
      }

      setIsScreenLockEnabled(false);
      setBiometricsMessage('Screen lock login is off for this device.');
      return;
    }

    const availability = await getBiometricsAvailability();
    setBiometricsAvailability(availability);

    if (!availability.isAvailable) {
      setIsScreenLockEnabled(false);
      setBiometricsMessage(availability.unavailableReason ?? 'Screen lock is unavailable on this device.');
      return;
    }

    const result = await authenticateWithScreenLock(`Enable ${availability.label} for Esting's Rider`);

    if (!result.success) {
      setIsScreenLockEnabled(false);
      setBiometricsMessage(result.error ?? 'Screen lock setup was not completed.');
      return;
    }

    const nextRider = getNextRememberedRider(rider, rememberedRider, true);
    if (nextRider) {
      await saveRememberedRider(nextRider);
      setRememberedRider(nextRider);
    }

    setIsScreenLockEnabled(true);
    setBiometricsMessage(`${availability.label} is enabled for rider login on this device.`);
  }

  const riderName = getRiderName(rider);
  const screenLockLabel = biometricsAvailability?.label ?? 'Screen lock';
  const screenLockStatus =
    biometricsMessage ??
    biometricsAvailability?.unavailableReason ??
    `${screenLockLabel} can protect rider login on this device.`;

  return (
    <>
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
          <Text style={styles.title}>Settings</Text>
        </View>

        <SettingsSection title="Account Information">
          <InfoRow icon="user" label="Name" value={riderName} />
          <Divider />
          <InfoRow icon="at-sign" label="Username" value={rider?.username ?? 'Not set'} />
          <Divider />
          <InfoRow icon="mail" label="Email" value={rider?.email ?? 'Not signed in'} />
          <Divider />
          <InfoRow icon="phone" label="Phone" value={rider?.phone_number ?? 'Not set'} />
          <Divider />
          <InfoRow icon="map-pin" label="Assigned Branch" value={rider?.branch ?? 'Not assigned'} />
        </SettingsSection>

        <SettingsSection title="Permission Settings">
          <ToggleRow
            description={`Use ${screenLockLabel.toLowerCase()} before opening your remembered rider session.`}
            disabled={!biometricsAvailability?.isAvailable}
            icon="shield"
            label={screenLockLabel}
            value={isScreenLockEnabled}
            onValueChange={handleToggleScreenLock}
          />
          <View style={styles.statusPanel}>
            <Feather
              color={biometricsAvailability?.isAvailable ? theme.colors.primary : theme.colors.textMuted}
              name="info"
              size={theme.icon.sm}
            />
            <Text style={styles.statusText}>{screenLockStatus}</Text>
          </View>
        </SettingsSection>

        <SettingsSection danger title="Danger Zone">
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.dangerRow, pressed && styles.pressed]}
            onPress={() => setIsLogoutVisible(true)}>
            <View style={[styles.iconBox, styles.dangerIconBox]}>
              <Feather color={dangerTone} name="log-out" size={theme.icon.md} />
            </View>
            <Text style={styles.dangerText}>Logout</Text>
            <Feather color={dangerTone} name="chevron-right" size={theme.icon.sm} />
          </Pressable>
        </SettingsSection>
      </ScrollView>

      <Modal animationType="fade" transparent visible={isLogoutVisible} onRequestClose={() => setIsLogoutVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Feather color={dangerTone} name="log-out" size={28} />
            </View>
            <View style={styles.modalCopy}>
              <Text style={styles.modalTitle}>Log out of Rider?</Text>
              <Text style={styles.modalMessage}>
                This signs you out and removes the remembered rider account from this device.
              </Text>
            </View>
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
                onPress={() => setIsLogoutVisible(false)}>
                <Text style={styles.cancelText}>Stay signed in</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.confirmLogoutButton, pressed && styles.pressed]}
                onPress={handleLogout}>
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
  children: React.ReactNode;
  danger?: boolean;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionAccent, danger && styles.sectionAccentDanger]} />
        <Text style={[styles.sectionTitle, danger && styles.dangerText]}>{title}</Text>
      </View>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.iconBox}>
        <Feather color={theme.colors.textMuted} name={icon} size={theme.icon.md} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text numberOfLines={2} selectable style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}

function ToggleRow({
  description,
  disabled = false,
  icon,
  label,
  value,
  onValueChange,
}: {
  description: string;
  disabled?: boolean;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={[styles.toggleRow, disabled && styles.disabledRow]}>
      <View style={styles.iconBox}>
        <Feather color={theme.colors.textMuted} name={icon} size={theme.icon.md} />
      </View>
      <View style={styles.toggleCopy}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
      <Switch
        disabled={disabled}
        thumbColor={value ? theme.colors.primary : theme.colors.white}
        trackColor={{ false: theme.colors.border, true: theme.colors.greenSoft }}
        value={value}
        onValueChange={onValueChange}
      />
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function getRiderName(user: AuthUser | null) {
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
  return name || user?.username || "Esting's Rider";
}

function getNextRememberedRider(
  rider: AuthUser | null,
  rememberedRider: RememberedRider | null,
  biometricEnabled: boolean,
) {
  if (rememberedRider) {
    return {
      ...rememberedRider,
      biometricEnabled,
      lastLoginAt: new Date().toISOString(),
    };
  }

  if (!rider) {
    return null;
  }

  return {
    biometricEnabled,
    email: rider.email,
    firstName: rider.first_name ?? null,
    id: rider.id,
    lastLoginAt: new Date().toISOString(),
    lastName: rider.last_name ?? null,
    username: rider.username ?? null,
  };
}

const styles = StyleSheet.create({
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
    fontFamily: Fonts.sansBold,
    fontSize: 14,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.07)',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
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
    color: dangerTone,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
  },
  content: {
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  dangerIconBox: {
    backgroundColor: 'rgba(217, 107, 107, 0.1)',
  },
  dangerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 58,
    padding: theme.spacing.md,
  },
  dangerText: {
    color: dangerTone,
    flex: 1,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    lineHeight: 19,
  },
  disabledRow: {
    opacity: 0.55,
  },
  divider: {
    backgroundColor: 'rgba(31, 42, 36, 0.07)',
    height: 1,
    marginLeft: 56,
  },
  header: {
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
  iconBox: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
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
  modalCopy: {
    gap: theme.spacing.sm,
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
  modalMessage: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(31, 42, 36, 0.32)',
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 58,
    padding: theme.spacing.md,
  },
  rowLabel: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    lineHeight: 19,
  },
  rowValue: {
    color: theme.colors.textMuted,
    flex: 1.2,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'right',
  },
  screen: {
    backgroundColor: theme.colors.surfaceAlt,
    flex: 1,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionAccent: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    height: 14,
    width: 4,
  },
  sectionAccentDanger: {
    backgroundColor: dangerTone,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    lineHeight: 19,
  },
  statusPanel: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    margin: theme.spacing.md,
    marginTop: 0,
    padding: theme.spacing.md,
  },
  statusText: {
    color: theme.colors.primaryDark,
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    lineHeight: 16,
  },
  title: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 24,
    lineHeight: 30,
  },
  toggleCopy: {
    flex: 1,
    gap: 3,
  },
  toggleDescription: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 11,
    lineHeight: 15,
  },
  toggleLabel: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    lineHeight: 19,
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 72,
    padding: theme.spacing.md,
  },
});
