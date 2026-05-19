import { router } from 'expo-router';
import {
  ChevronDown,
  ChevronLeft,
  CreditCard,
  Paintbrush,
  Truck,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';

import { BloomScreen, PrimaryButton } from '@/components/bloom-ui';
import { theme } from '@/constants/theme';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const faqCategories = [
  {
    category: 'Ordering & Delivery',
    icon: Truck,
    faqs: [
      {
        question: 'What are your delivery hours?',
        answer:
          'Our delivery hours vary by branch:\n\nManila Branch: 9:00 AM – 9:00 PM\nPampanga Branch: 7:30 AM – 5:00 PM\n\nOrders placed late in the evening may be scheduled for next-day delivery.',
      },
      {
        question: 'Do you deliver outside Metro Manila?',
        answer:
          'Yes, we do. Please ensure you provide a complete and accurate delivery address to avoid any delays.',
      },
      {
        question: 'How do I track my order?',
        answer:
          "Once your order is confirmed, you can track it through the Orders section in your account. You'll also receive updates via the contact number you provided.",
      },
      {
        question: 'Can I schedule a specific delivery time?',
        answer:
          'We accommodate preferred delivery windows where possible. Please include your preferred time when placing your order, and our team will do their best to accommodate it.',
      },
    ],
  },
  {
    category: 'Products & Customization',
    icon: Paintbrush,
    faqs: [
      {
        question: 'Can I customize my arrangement?',
        answer:
          'Yes. You can use our "Make it Personal" feature to describe your ideal bouquet, or create your own arrangement through our Mix and Match option.',
      },
      {
        question: 'Do you offer bulk orders?',
        answer:
          'Yes, we accept bulk orders. Send us a message through our website so we can discuss your requirements, including quantity and pricing.',
      },
      {
        question: 'Are all flowers fresh?',
        answer:
          'Absolutely. We take pride in sourcing only fresh-cut flowers. Our stock is refreshed regularly to ensure every arrangement you receive is vibrant and long-lasting.',
      },
      {
        question: 'Can I include a personalized message?',
        answer:
          'Yes! You can add a message card to any order during checkout. Simply enter your message in the provided field.',
      },
    ],
  },
  {
    category: 'Payments & Cancellations',
    icon: CreditCard,
    faqs: [
      {
        question: 'What payment methods do you accept?',
        answer:
          'We accept GCash, PayPal, BDO, BPI, Metrobank bank transfers, and Western Union for international orders.',
      },
      {
        question: 'What is your cancellation policy?',
        answer:
          'We do not accept cancellations once payment has been made. However, the amount paid can be converted into store credit, which you may use for a future order at your convenience.',
      },
      {
        question: 'Is it safe to pay online?',
        answer:
          'Yes. All transactions through our platform are secured. We do not store your payment details.',
      },
    ],
  },
];

export default function FaqScreen() {
  const [openItem, setOpenItem] = useState<string | null>(null);

  function handleToggle(key: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenItem((current) => (current === key ? null : key));
  }

  return (
    <BloomScreen
      eyebrow="Help Center"
      headerAction={
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={theme.icon.sm} color={theme.colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      }
      title="Frequently Asked Questions"
      subtitle="Everything you need to know about ordering, delivery, and our products.">
      <View style={styles.categoryStack}>
        {faqCategories.map((category) => (
          <View key={category.category} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryIcon}>
                <category.icon size={theme.icon.sm} color={theme.colors.primaryDark} />
              </View>
              <Text style={styles.categoryTitle}>{category.category}</Text>
            </View>

            <View style={styles.faqList}>
              {category.faqs.map((faq, index) => {
                const key = `${category.category}-${index}`;

                return (
                  <FaqItem
                    key={key}
                    answer={faq.answer}
                    isOpen={openItem === key}
                    question={faq.question}
                    onToggle={() => handleToggle(key)}
                  />
                );
              })}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.helpCard}>
        <Text style={styles.helpTitle}>Still have questions?</Text>
        <Text style={styles.helpText}>Our team is happy to help. Reach out to us anytime.</Text>
        <View style={styles.helpActions}>
          <PrimaryButton
            label="Contact Us"
            variant="secondary"
            style={styles.helpButton}
            onPress={() => router.push('/contact')}
          />
          <PrimaryButton
            label="Open Live Chat"
            variant="secondary"
            style={styles.helpButton}
          />
        </View>
      </View>
    </BloomScreen>
  );
}

function FaqItem({
  answer,
  isOpen,
  onToggle,
  question,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={[styles.faqItem, isOpen && styles.faqItemOpen]}>
      <Pressable style={[styles.questionRow, isOpen && styles.questionRowOpen]} onPress={onToggle}>
        <Text style={styles.questionText}>{question}</Text>
        <View style={[styles.chevronButton, isOpen && styles.chevronButtonOpen]}>
          <ChevronDown
            size={theme.icon.sm}
            color={isOpen ? theme.colors.white : theme.colors.textMuted}
          />
        </View>
      </Pressable>
      {isOpen ? (
        <View style={styles.answerWrap}>
          <Text style={styles.answerText}>{answer}</Text>
        </View>
      ) : null}
    </View>
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
  categoryStack: {
    gap: theme.spacing.xxl,
  },
  categorySection: {
    gap: theme.spacing.md,
  },
  categoryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  categoryIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.md,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  categoryTitle: {
    color: theme.colors.text,
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
  },
  faqList: {
    gap: theme.spacing.sm,
  },
  faqItem: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    overflow: 'hidden',
  },
  faqItemOpen: {
    borderColor: theme.colors.primary,
  },
  questionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 62,
    padding: theme.spacing.lg,
  },
  questionRowOpen: {
    backgroundColor: theme.colors.greenSoft,
  },
  questionText: {
    color: theme.colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  chevronButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.pill,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  chevronButtonOpen: {
    backgroundColor: theme.colors.primary,
  },
  answerWrap: {
    borderTopColor: theme.colors.border,
    borderTopWidth: theme.borderWidth,
    minHeight: 54,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  answerText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  helpCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
  },
  helpTitle: {
    color: theme.colors.white,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  helpText: {
    color: theme.colors.white,
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.78,
    textAlign: 'center',
  },
  helpActions: {
    gap: theme.spacing.md,
  },
  helpButton: {
    backgroundColor: theme.colors.white,
    minHeight: 46,
  },
});
