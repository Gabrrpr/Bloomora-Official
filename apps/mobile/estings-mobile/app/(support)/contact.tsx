import { router } from 'expo-router';
import { ChevronLeft, Clock3, Mail, MapPin, Phone } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { BloomScreen, PrimaryButton } from '@/components/bloom-ui';
import { theme } from '@/constants/theme';

type Branch = 'Manila Branch' | 'Pampanga Branch';

const branches: Record<
  Branch,
  {
    address: string;
    email: string;
    locationLabel: string;
    mapTitle: string;
    phone: string;
    phoneHours: string;
    storeHours: string;
  }
> = {
  'Manila Branch': {
    address: '1605 Laon-Laan Corner Dos Castillas Street, Sampaloc, Manila',
    email: 'estings_manila@yahoo.com',
    locationLabel: 'Manila Branch - Location',
    mapTitle: 'Map',
    phone: '+63 918 902 2401',
    phoneHours: '9:00 AM - 9:00 PM daily',
    storeHours: '9:00 AM - 9:00 PM daily',
  },
  'Pampanga Branch': {
    address: 'McArthur Hi-way, Dolores, City of San Fernando, Pampanga C-2000',
    email: 'estings_pampanga@yahoo.com',
    locationLabel: 'Pampanga Branch - Location',
    mapTitle: 'McArthur Highway',
    phone: '+63 045 961 5378',
    phoneHours: '7:30 AM - 5:00 PM daily',
    storeHours: '7:30 AM - 5:00 PM daily',
  },
};

export default function ContactScreen() {
  const [selectedBranch, setSelectedBranch] = useState<Branch>('Manila Branch');
  const branch = branches[selectedBranch];

  function handleCall() {
    Linking.openURL(`tel:${branch.phone.replace(/\s/g, '')}`);
  }

  function handleEmail() {
    Linking.openURL(`mailto:${branch.email}`);
  }

  return (
    <BloomScreen
      eyebrow="Contact Esting's"
      headerAction={
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={theme.icon.sm} color={theme.colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      }
      title="Get In Touch"
      subtitle="We're here to help - visit us, give us a call, or shoot us an email. Two branches, one commitment to great service.">
      <View style={styles.branchSection}>
        <Text style={styles.kicker}>Select Branch</Text>
        <View style={styles.branchSelector}>
          {(['Manila Branch', 'Pampanga Branch'] as Branch[]).map((item) => (
            <Pressable
              key={item}
              style={[styles.branchButton, selectedBranch === item && styles.branchButtonActive]}
              onPress={() => setSelectedBranch(item)}>
              <Text
                style={[
                  styles.branchButtonText,
                  selectedBranch === item && styles.branchButtonTextActive,
                ]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.infoStack}>
        <ContactCard icon={MapPin} label="Visit Us" title={branch.address} />
        <ContactCard
          icon={Phone}
          label="Call Us"
          title={branch.phone}
          subtitle={branch.phoneHours}
          onPress={handleCall}
        />
        <ContactCard
          icon={Mail}
          label="Email Us"
          title={branch.email}
          subtitle="We reply within 24 hours"
          onPress={handleEmail}
        />
        <ContactCard
          icon={Clock3}
          label="Store Hours"
          title={branch.storeHours}
          subtitle="Open daily including holidays"
        />
      </View>

      <View style={styles.chatCard}>
        <Text style={styles.chatTitle}>Want to chat with us?</Text>
        <Text style={styles.chatText}>
          Our team is online and ready to answer any question - instantly.
        </Text>
        <PrimaryButton label="Open Chat" variant="secondary" style={styles.chatButton} />
      </View>

      <View style={styles.mapSection}>
        <Text style={styles.kicker}>{branch.locationLabel}</Text>
        <View style={styles.mapBox}>
          <MapPin size={theme.icon.lg} color={theme.colors.primary} />
          <Text style={styles.mapTitle}>{branch.mapTitle}</Text>
          <Text style={styles.mapText}>{branch.address}</Text>
        </View>
        <Text style={styles.locationText}>© {branch.address}</Text>
      </View>
    </BloomScreen>
  );
}

function ContactCard({
  icon: Icon,
  label,
  onPress,
  subtitle,
  title,
}: {
  icon: typeof MapPin;
  label: string;
  onPress?: () => void;
  subtitle?: string;
  title: string;
}) {
  return (
    <Pressable disabled={!onPress} style={styles.contactCard} onPress={onPress}>
      <View style={styles.cardIcon}>
        <Icon size={theme.icon.sm} color={theme.colors.primary} />
      </View>
      <View style={styles.contactBody}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={styles.contactTitle}>{title}</Text>
        {subtitle ? <Text style={styles.contactSubtitle}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.xs,
    minHeight: 36,
  },
  backText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  branchSection: {
    gap: theme.spacing.md,
  },
  kicker: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  branchSelector: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    padding: theme.spacing.xs,
  },
  branchButton: {
    alignItems: 'center',
    borderRadius: theme.radius.sm,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: theme.spacing.sm,
  },
  branchButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  branchButtonText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  branchButtonTextActive: {
    color: theme.colors.white,
  },
  infoStack: {
    gap: theme.spacing.md,
  },
  contactCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  cardIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  contactBody: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  contactLabel: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  contactTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  contactSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  chatCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  chatTitle: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  chatText: {
    color: theme.colors.white,
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.9,
  },
  chatButton: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.white,
    minHeight: 44,
    paddingHorizontal: theme.spacing.lg,
  },
  mapSection: {
    gap: theme.spacing.md,
  },
  mapBox: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 260,
    padding: theme.spacing.xl,
  },
  mapTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  mapText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    textAlign: 'center',
  },
  locationText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});
