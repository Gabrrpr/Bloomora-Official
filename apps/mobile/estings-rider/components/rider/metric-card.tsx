import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, theme } from '@/constants/theme';

type IconName = ComponentProps<typeof IconSymbol>['name'];

export function MetricCard({
  icon,
  label,
  tone = 'green',
  value,
}: {
  icon: IconName;
  label: string;
  tone?: 'green' | 'slate' | 'amber';
  value: string;
}) {
  const colors = {
    amber: { background: theme.colors.amberSoft, foreground: '#8A5A05' },
    green: { background: theme.colors.greenSoft, foreground: theme.colors.primaryDark },
    slate: { background: theme.colors.riderSoft, foreground: theme.colors.rider },
  }[tone];

  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: colors.background }]}>
        <IconSymbol color={colors.foreground} name={icon} size={22} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.07)',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 5,
    minHeight: 124,
    padding: theme.spacing.md,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: theme.radius.pill,
    height: 42,
    justifyContent: 'center',
    marginBottom: 2,
    width: 42,
  },
  label: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  value: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 22,
    lineHeight: 27,
  },
});
