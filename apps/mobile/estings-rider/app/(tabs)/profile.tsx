import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { RiderScreen } from '@/components/rider/screen';
import { Fonts, theme } from '@/constants/theme';
import { getAuthSession, type AuthUser } from '@/services/auth-session';
import { getMyDeliveries, getMyDeliveryHistory } from '@/services/deliveries-api';

export default function ProfileScreen() {
  const [rider, setRider] = useState<AuthUser | null>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [isAvailable, setIsAvailable] = useState(true);
  const riderName = getRiderName(rider);
  const riderEmail = rider?.email ?? 'rider@estings.shop';
  const profilePicture = rider?.profile_picture_url?.trim();

  useEffect(() => {
    let mounted = true;

    void Promise.all([
      getAuthSession(),
      getMyDeliveries().catch(() => []),
      getMyDeliveryHistory().catch(() => []),
    ]).then(([session, activeDeliveries, completedDeliveries]) => {
      if (mounted) {
        setRider(session?.user ?? null);
        setActiveCount(activeDeliveries.length);
        setCompletedCount(completedDeliveries.length);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <RiderScreen
      headerAction={
        <Pressable accessibilityLabel="Open settings" accessibilityRole="button" style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]} onPress={() => router.push('/settings')}>
          <Feather color={theme.colors.text} name="settings" size={22} />
        </Pressable>
      }
      title="Profile">
      <View style={styles.identityPanel}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            {profilePicture ? (
              <Image contentFit="cover" source={{ uri: profilePicture }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitials}>{getRiderInitials(rider)}</Text>
            )}
          </View>
        </View>
        <View style={styles.identityCopy}>
          <View style={styles.nameRow}>
            <Text numberOfLines={1} style={styles.profileName}>{riderName}</Text>
            <Feather color="#2D9CDB" name="check-circle" size={14} />
          </View>
          <Text numberOfLines={1} style={styles.profileEmail}>{riderEmail}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCell label="Deliveries" value={String(activeCount)} />
        <StatCell label="Completed" value={String(completedCount)} />
        <StatCell label="Status" value={isAvailable ? 'Available' : 'Offline'} />
      </View>

      <Text style={styles.sectionTitle}>Settings</Text>
      <View style={styles.statusPanel}>
        <View style={styles.statusCopy}>
          <Text style={styles.statusTitle}>Status: {isAvailable ? 'Available' : 'Offline'}</Text>
          <Text style={styles.statusText}>{isAvailable ? 'You are currently on standby.' : 'You will not appear available for new routes.'}</Text>
        </View>
        <Switch value={isAvailable} trackColor={{ false: theme.colors.border, true: theme.colors.greenSoft }} thumbColor={theme.colors.primary} onValueChange={setIsAvailable} />
      </View>
    </RiderScreen>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function getRiderName(user: AuthUser | null) {
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
  return name || user?.username || "Esting's Rider";
}

function getRiderInitials(user: AuthUser | null) {
  const first = user?.first_name?.trim();
  const last = user?.last_name?.trim();
  const initials = `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
  if (initials.length > 0) return initials;

  const fallback = user?.username?.trim() || user?.email?.trim() || 'Rider';
  return fallback
    .split(/[\s._@-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    height: 56,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 56,
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  avatarInitials: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 23,
    lineHeight: 28,
  },
  avatarRing: {
    alignItems: 'center',
    borderColor: 'rgba(31, 42, 36, 0.1)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  headerIconButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 36,
  },
  identityCopy: {
    flex: 1,
    gap: 4,
  },
  identityPanel: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.sm,
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
  profileEmail: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  profileName: {
    color: theme.colors.text,
    flexShrink: 1,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    lineHeight: 19,
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
    fontSize: 10,
    lineHeight: 14,
  },
  statValue: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
  },
  statsGrid: {
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.07)',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
  },
  statusCopy: {
    flex: 1,
    gap: 3,
  },
  statusPanel: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.07)',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 58,
    padding: theme.spacing.md,
  },
  statusText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 11,
    lineHeight: 15,
  },
  statusTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    lineHeight: 19,
  },
});
