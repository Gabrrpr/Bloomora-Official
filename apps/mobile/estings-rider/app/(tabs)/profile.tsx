import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Switch, Text, View } from 'react-native';

import { RiderScreen } from '@/components/rider/screen';
import { Fonts, theme } from '@/constants/theme';
import { getRiderProfile, updateRiderAvailability, type RiderProfile } from '@/services/deliveries-api';

export default function ProfileScreen() {
  const [rider, setRider] = useState<RiderProfile | null>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const isAvailable = rider?.riderIsAvailable ?? false;
  const riderName = getRiderName(rider);
  const riderEmail = rider?.email ?? 'rider@estings.shop';
  const profilePicture = rider?.profilePictureUrl?.trim();

  const loadProfile = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setIsRefreshing(true);
    }

    try {
      const profile = await getRiderProfile();
      setRider(profile);
      setActiveCount(profile.activeDeliveries);
      setCompletedCount(profile.completedDeliveries);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load rider profile.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
    let mounted = true;

      getRiderProfile()
        .then((profile) => {
          if (!mounted) return;
          setRider(profile);
          setActiveCount(profile.activeDeliveries);
          setCompletedCount(profile.completedDeliveries);
          setError(null);
        })
        .catch((nextError) => {
          if (mounted) {
            setError(nextError instanceof Error ? nextError.message : 'Unable to load rider profile.');
          }
        });

    return () => {
      mounted = false;
    };
    }, []),
  );

  async function handleAvailabilityChange(nextValue: boolean) {
    const previousProfile = rider;
    if (!previousProfile || isUpdatingAvailability) return;

    setIsUpdatingAvailability(true);
    setRider({ ...previousProfile, riderIsAvailable: nextValue });
    try {
      const nextProfile = await updateRiderAvailability(nextValue);
      setRider(nextProfile);
      setActiveCount(nextProfile.activeDeliveries);
      setCompletedCount(nextProfile.completedDeliveries);
      setError(null);
    } catch (nextError) {
      setRider(previousProfile);
      setError(nextError instanceof Error ? nextError.message : 'Unable to update availability.');
    } finally {
      setIsUpdatingAvailability(false);
    }
  }

  return (
    <RiderScreen
      headerAction={
        <Pressable accessibilityLabel="Open settings" accessibilityRole="button" style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]} onPress={() => router.push('/settings')}>
          <Feather color={theme.colors.text} name="settings" size={22} />
        </Pressable>
      }
      title="Profile"
      refreshControl={<RefreshControl refreshing={isRefreshing} tintColor={theme.colors.primary} onRefresh={() => void loadProfile()} />}>
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
        <Switch
          disabled={isUpdatingAvailability || !rider}
          value={isAvailable}
          trackColor={{ false: theme.colors.border, true: theme.colors.greenSoft }}
          thumbColor={theme.colors.primary}
          onValueChange={(value) => void handleAvailabilityChange(value)}
        />
      </View>
      {error ? <Text selectable style={styles.errorText}>{error}</Text> : null}
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

function getRiderName(user: RiderProfile | null) {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  return name || user?.username || "Esting's Rider";
}

function getRiderInitials(user: RiderProfile | null) {
  const first = user?.firstName?.trim();
  const last = user?.lastName?.trim();
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
  errorText: {
    color: theme.colors.danger,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 17,
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
