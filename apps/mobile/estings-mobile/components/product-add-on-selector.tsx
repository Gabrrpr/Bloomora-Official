import { Image } from 'expo-image';
import { Check, Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatPhp, type Product } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';

const imageNotFound = require('@/assets/images/default-img/ImageNotFound.webp');
const INITIAL_VISIBLE_COUNT = 4;

type ProductAddOnSelectorProps = {
  addOns: Product[];
  isLoading?: boolean;
  onToggle: (addOnId: string) => void;
  selectedIds: ReadonlySet<string>;
};

export function ProductAddOnSelector({
  addOns,
  isLoading = false,
  onToggle,
  selectedIds,
}: ProductAddOnSelectorProps) {
  const [showAll, setShowAll] = useState(false);

  const visibleAddOns = useMemo(
    () => (showAll ? addOns : addOns.slice(0, INITIAL_VISIBLE_COUNT)),
    [addOns, showAll],
  );

  if (isLoading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          Add-ons <Text style={styles.optionalLabel}>(optional)</Text>
        </Text>
        <View style={styles.loadingRow}>
          <ActivityIndicator color={theme.colors.primary} size="small" />
          <Text style={styles.loadingText}>Loading add-ons…</Text>
        </View>
      </View>
    );
  }

  if (addOns.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>
        Add-ons <Text style={styles.optionalLabel}>(optional)</Text>
      </Text>

      <View style={styles.grid}>
        {visibleAddOns.map((addOn) => {
          const isUnavailable = (addOn.stock ?? 0) <= 0 || addOn.isActive === false;
          const isSelected = selectedIds.has(addOn.id) && !isUnavailable;

          return (
            <Pressable
              accessibilityLabel={`${isSelected ? 'Remove' : 'Add'} ${addOn.name}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: isUnavailable, selected: isSelected }}
              disabled={isUnavailable}
              key={addOn.id}
              onPress={() => onToggle(addOn.id)}
              style={({ pressed }) => [
                styles.card,
                isSelected && styles.cardSelected,
                isUnavailable && styles.cardUnavailable,
                pressed && !isUnavailable && styles.pressed,
              ]}>
              <View style={styles.thumbnailWrap}>
                {addOn.imageUrl ? (
                  <Image contentFit="cover" source={{ uri: addOn.imageUrl }} style={styles.thumbnail} />
                ) : (
                  <Image contentFit="contain" source={imageNotFound} style={styles.thumbnail} />
                )}
              </View>

              <View style={styles.cardBody}>
                <Text numberOfLines={2} style={styles.cardName}>
                  {addOn.name}
                </Text>
                <Text style={styles.cardStock}>
                  {isUnavailable ? 'Unavailable' : `${addOn.stock ?? 0} available`}
                </Text>
                <Text style={[styles.cardPrice, isUnavailable && styles.cardPriceUnavailable]}>
                  {isUnavailable ? 'Out of stock' : `+${formatPhp(addOn.priceCents)}`}
                </Text>
              </View>

              <View style={[styles.toggleButton, isSelected && styles.toggleButtonSelected]}>
                {isSelected ? (
                  <Check color={theme.colors.white} size={14} strokeWidth={3} />
                ) : (
                  <Plus color={theme.colors.textMuted} size={14} strokeWidth={2.5} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {addOns.length > INITIAL_VISIBLE_COUNT ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowAll((current) => !current)}
          style={({ pressed }) => [styles.showAllButton, pressed && styles.pressed]}>
          <Text style={styles.showAllText}>{showAll ? 'Show less' : `Show all (${addOns.length})`}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: theme.spacing.sm,
  },
  sectionLabel: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
  },
  optionalLabel: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  card: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderColor: 'rgba(31, 42, 36, 0.1)',
    borderRadius: theme.radius.md,
    borderWidth: 1.2,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 72,
    padding: theme.spacing.sm,
    width: '48.5%',
  },
  cardSelected: {
    backgroundColor: theme.colors.greenSoft,
    borderColor: theme.colors.primary,
  },
  cardUnavailable: {
    opacity: 0.55,
  },
  thumbnailWrap: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: 'rgba(31, 42, 36, 0.06)',
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    height: 44,
    overflow: 'hidden',
    width: 44,
  },
  thumbnail: {
    height: '100%',
    width: '100%',
  },
  cardBody: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  cardName: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  cardStock: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 10,
    lineHeight: 14,
  },
  cardPrice: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    lineHeight: 15,
  },
  cardPriceUnavailable: {
    color: theme.colors.textMuted,
  },
  toggleButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: 'rgba(31, 42, 36, 0.08)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  toggleButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  showAllButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  showAllText: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
