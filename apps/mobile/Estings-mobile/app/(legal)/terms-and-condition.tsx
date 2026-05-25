import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BloomScreen, Section } from '@/components/bloom-ui';
import { theme } from '@/constants/theme';

const termsSections = [
  {
    title: '1. Acceptance of Terms',
    body: 'By creating an account or accessing any part of the Esting\'s Flower Shop platform ("Platform"), you confirm that you are at least 18 years of age and agree to comply with and be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our Platform.',
  },
  {
    title: "2. About Esting's",
    body: 'Esting\'s Flower International Inc. provides floral arrangement ordering and delivery coordination services through this digital platform. We connect customers with premium floral products and enable order, inventory, and customer support workflows.',
  },
  {
    title: '3. Account Registration',
    body: 'To access certain features of the Platform, you must register for an account. You agree to: (a) provide accurate, current, and complete information during registration; (b) maintain the security of your password and accept all risks of unauthorized access to your account; (c) promptly notify us of any unauthorized use of your account; and (d) not create accounts using automated methods or false identities. Esting\'s reserves the right to terminate accounts that violate these provisions.',
  },
  {
    title: '4. Products and Ordering',
    body: 'All floral products displayed on our Platform are subject to availability. We reserve the right to limit quantities or discontinue products at any time. Product colors, sizes, and arrangements may vary slightly from photographs shown. Pricing is subject to change without notice. All orders are subject to acceptance and availability confirmation.',
  },
  {
    title: '5. Payment Terms',
    body: 'Payment is required at the time of order placement. We accept major credit/debit cards and other specified payment methods. All transactions are processed securely. Prices are listed in the applicable local currency and include applicable taxes unless stated otherwise. We are not responsible for any additional bank charges or fees.',
  },
  {
    title: '6. Delivery and Fulfillment',
    body: 'Delivery times are estimates and not guaranteed. While we strive to deliver orders on time, factors such as weather, traffic, or other unforeseen circumstances may cause delays. For time-sensitive occasions, we recommend ordering well in advance. Delivery is subject to our service coverage area. We will make reasonable efforts to contact you if delivery cannot be completed.',
  },
  {
    title: '7. Cancellations and Refunds',
    body: 'Orders may be cancelled within 2 hours of placement for a full refund. After this window, cancellation may not be possible as preparation may have already begun. Refunds for damaged or incorrect orders will be issued after review. The perishable nature of floral products means returns may not always be possible; instead, we may offer a replacement or store credit.',
  },
  {
    title: '8. Privacy Policy',
    body: 'Your privacy is important to us. We collect and process personal information in accordance with our Privacy Policy, which is incorporated into these Terms by reference. We use your information to process orders, improve our services, and communicate with you about your account and our offerings. We do not sell your personal information to third parties.',
  },
  {
    title: '9. Intellectual Property',
    body: 'All content on the Esting\'s Platform, including logos, images, text, and software, is the exclusive property of Esting\'s or its content suppliers and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.',
  },
  {
    title: '10. Limitation of Liability',
    body: 'To the maximum extent permitted by law, Esting\'s shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use of the Platform. Our total liability for any claim arising from these Terms shall not exceed the amount paid by you for the specific order giving rise to the claim.',
  },
  {
    title: '11. Modifications to Terms',
    body: 'Esting\'s reserves the right to modify these Terms at any time. We will notify registered users of significant changes via email or through the Platform. Continued use of the Platform after changes become effective constitutes your acceptance of the revised Terms.',
  },
  {
    title: '12. Contact Information',
    body: 'If you have questions about these Terms and Conditions, please contact us at: legal@estingsflowers.com or through our customer support portal. We are committed to addressing your concerns in a timely manner.',
  },
];

export default function TermsAndConditionScreen() {
  return (
    <BloomScreen
      eyebrow="Legal Document"
      headerAction={
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={theme.icon.sm} color={theme.colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      }
      title="Terms & Conditions"
      subtitle="Esting's Flower Shop Platform">
      <View style={styles.metaCard}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Effective Date</Text>
          <Text style={styles.metaValue}>January 1, 2025</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Last Updated</Text>
          <Text style={styles.metaValue}>April 2025</Text>
        </View>
      </View>

      <View style={styles.introCard}>
        <Text style={styles.introText}>
          {"Please read these Terms and Conditions carefully before using Esting's platform. By "}
          accessing or using our services, you agree to be bound by these terms.
        </Text>
      </View>

      {termsSections.map((section) => (
        <Section key={section.title} title={section.title}>
          <View style={styles.sectionCard}>
            <Text style={styles.bodyText}>{section.body}</Text>
          </View>
        </Section>
      ))}

      <View style={styles.footerCard}>
        <Text style={styles.footerBrand}>{"Esting's"}</Text>
        <Text style={styles.footerText}>
          {"(c) 2025 Esting's Flower International Inc. All rights reserved."}
        </Text>
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
  metaCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  metaItem: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  metaLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaValue: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  metaDivider: {
    backgroundColor: theme.colors.border,
    height: 42,
    width: theme.borderWidth,
  },
  introCard: {
    backgroundColor: theme.colors.greenSoft,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    padding: theme.spacing.lg,
  },
  introText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    padding: theme.spacing.lg,
  },
  bodyText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  footerCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    gap: theme.spacing.xs,
    padding: theme.spacing.lg,
  },
  footerBrand: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  footerText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
