import { router } from 'expo-router';
import {
  Ban,
  BadgeX,
  ChevronLeft,
  Info,
  PackageX,
  Truck,
  WalletCards,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BloomScreen, PrimaryButton } from '@/components/bloom-ui';
import { theme } from '@/constants/theme';

const policySections = [
  {
    icon: Ban,
    title: 'No-Cancellation Policy',
    body: [
      'Once payment has been made, your order is considered confirmed and cannot be cancelled. We begin processing orders immediately after payment to ensure timely delivery and freshness.',
      'If you need to make changes to your order (such as delivery address or preferred time), please contact us as soon as possible. We will do our best to accommodate last-minute adjustments before your order is dispatched.',
    ],
  },
  {
    icon: WalletCards,
    title: 'Store Credit',
    body: [
      'If you are unable to proceed with your order after payment, the full amount will be converted into store credit.',
      'Store credit can be used toward any future order and does not expire. It applies to the full order value including any delivery fees paid.',
      'To request a store credit conversion, contact us via our website, phone, or live chat with your order reference number.',
    ],
  },
  {
    icon: BadgeX,
    title: 'Quality Concerns',
    body: [
      'We take great pride in the quality of every arrangement we deliver. If you receive flowers that are damaged, wilted, or significantly different from what was ordered, please contact us within 24 hours of delivery.',
      'Please include:\n* Your order reference number\n* A photo of the arrangement as received\n* A brief description of the concern',
      'We will review your case promptly and offer an appropriate resolution, which may include a replacement or store credit.',
    ],
  },
  {
    icon: Truck,
    title: 'Wrong or Incomplete Deliveries',
    body: [
      'If you receive the wrong arrangement or an incomplete order, please get in touch with us immediately. We will arrange for the correct items to be delivered as quickly as possible at no additional charge.',
      'Kindly do not discard any items received until the concern has been fully resolved, as we may request them to be returned.',
    ],
  },
  {
    icon: PackageX,
    title: 'Non-Returnable Items',
    body: [
      'Due to the perishable nature of our products, the following items are non-returnable:',
      '* Fresh flowers and arrangements already accepted upon delivery\n* Custom or personalized arrangements that were made to order\n* Any items that have been used, altered, or tampered with',
      'We encourage all customers to inspect their delivery upon receipt and raise any concerns immediately.',
    ],
  },
];

export default function ReturnPolicyScreen() {
  return (
    <BloomScreen
      eyebrow="Policies"
      headerAction={
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={theme.icon.sm} color={theme.colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      }
      title="Return Policy"
      subtitle="We want every experience with Esting's to be a great one. Here's what you need to know about our return and refund policies.">
      <Text style={styles.updatedText}>Last updated: January 2025</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Info size={theme.icon.sm} color={theme.colors.primary} />
        </View>
        <View style={styles.summaryBody}>
          <Text style={styles.summaryTitle}>Quick Summary</Text>
          <Text style={styles.summaryText}>
            We do not accept cancellations after payment. Paid orders can be converted to store
            credit. Quality issues must be reported within 24 hours of delivery with photo evidence.
          </Text>
        </View>
      </View>

      <View style={styles.policyStack}>
        {policySections.map((section) => (
          <View key={section.title} style={styles.policyCard}>
            <View style={styles.policyHeader}>
              <View style={styles.policyIcon}>
                <section.icon size={theme.icon.sm} color={theme.colors.primary} />
              </View>
              <Text style={styles.policyTitle}>{section.title}</Text>
            </View>
            {section.body.map((paragraph) => (
              <Text key={paragraph} style={styles.policyText}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.concernCard}>
        <Text style={styles.concernTitle}>Have a concern?</Text>
        <Text style={styles.concernText}>
          Our team is here to help resolve any issues quickly and fairly.
        </Text>
        <View style={styles.concernActions}>
          <PrimaryButton
            label="Contact Us"
            variant="secondary"
            style={styles.concernButton}
            onPress={() => router.push('/contact')}
          />
          <PrimaryButton
            label="Open Live Chat"
            variant="secondary"
            style={styles.concernButton}
          />
        </View>
      </View>
    </BloomScreen>
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
  updatedText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  summaryCard: {
    alignItems: 'flex-start',
    backgroundColor: theme.colors.greenSoft,
    borderColor: '#BFE6C6',
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  summaryIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  summaryBody: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  summaryTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  summaryText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  policyStack: {
    gap: theme.spacing.lg,
  },
  policyCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  policyHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  policyIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  policyTitle: {
    color: theme.colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  policyText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 21,
  },
  concernCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
  },
  concernTitle: {
    color: theme.colors.white,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  concernText: {
    color: theme.colors.white,
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.82,
    textAlign: 'center',
  },
  concernActions: {
    gap: theme.spacing.md,
    width: '100%',
  },
  concernButton: {
    backgroundColor: theme.colors.white,
    minHeight: 46,
  },
});
