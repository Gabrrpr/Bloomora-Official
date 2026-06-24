import { Heart, Leaf, Scissors } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts, theme } from '@/constants/theme';

type CareGuideEntry = {
  description?: string;
  icon: ReactNode;
  iconBackground: string;
  title: string;
};

const DEFAULT_CARE_TIPS: CareGuideEntry[] = [
  {
    title: 'Water daily',
    description: 'Replace water every 1-2 days with clean, room-temperature water.',
    iconBackground: 'rgba(46, 139, 52, 0.12)',
    icon: <Leaf color={theme.colors.primary} size={18} strokeWidth={2} />,
  },
  {
    title: 'Avoid direct sunlight',
    description: 'Keep away from heat sources and direct sun to slow wilting.',
    iconBackground: 'rgba(236, 72, 153, 0.12)',
    icon: <Heart color="#BE185D" size={18} strokeWidth={2} />,
  },
  {
    title: 'Trim stems',
    description: 'Cut 1-2cm at a 45° angle every few days for better absorption.',
    iconBackground: 'rgba(46, 139, 52, 0.12)',
    icon: <Scissors color={theme.colors.primary} size={18} strokeWidth={2} />,
  },
];

type ProductCareGuideSectionProps = {
  entries: string[];
};

export function ProductCareGuideSection({ entries }: ProductCareGuideSectionProps) {
  const customEntries = entries.map((entry) => entry.trim()).filter(Boolean);
  const tips =
    customEntries.length > 0
      ? customEntries.map((entry) => ({
          title: entry,
          description: undefined,
          iconBackground: theme.colors.greenSoft,
          icon: <Heart color={theme.colors.primary} size={18} strokeWidth={2} />,
        }))
      : DEFAULT_CARE_TIPS;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Care guide</Text>
      <Text style={styles.intro}>
        Proper care significantly extends the life of your arrangement.
      </Text>

      <View style={styles.cardList}>
        {tips.map((tip, index) => (
          <View key={`${tip.title}-${index}`} style={styles.card}>
            {tip.icon ? (
              <View style={[styles.iconWrap, { backgroundColor: tip.iconBackground }]}>{tip.icon}</View>
            ) : (
              <View style={[styles.iconWrap, styles.iconWrapDefault]}>
                <Text style={styles.iconBullet}>✓</Text>
              </View>
            )}
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{tip.title}</Text>
              {tip.description ? <Text style={styles.cardDescription}>{tip.description}</Text> : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    lineHeight: 24,
  },
  intro: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 21,
  },
  cardList: {
    gap: theme.spacing.sm,
  },
  card: {
    alignItems: 'flex-start',
    backgroundColor: theme.colors.greenSoft,
    borderColor: 'rgba(46, 139, 52, 0.15)',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: theme.radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  iconWrapDefault: {
    backgroundColor: 'rgba(46, 139, 52, 0.12)',
  },
  iconBullet: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  cardDescription: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
  },
});
