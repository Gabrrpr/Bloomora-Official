import { Info, Sparkles, X } from 'lucide-react-native';
import { useEffect } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AI_EASE_OUT, AI_MOTION, MotionPressable } from '@/components/ai-arrangement-motion';
import { Fonts, theme } from '@/constants/theme';
import {
  type ArrangementLimitKey,
  type CustomizationRules,
  type QuantityValidation,
} from '@/services/customization-api';

const ARRANGEMENT_ORDER: ArrangementLimitKey[] = ['bouquet', 'vase', 'box'];

type RecoveryProps = {
  onApplySuggestion: () => void;
  onBuildManually: () => void;
  onOpenDetails: () => void;
  validation: QuantityValidation;
};

type DetailsProps = {
  onApplySuggestion: () => void;
  onBuildManually: () => void;
  onDismiss: () => void;
  validation: QuantityValidation;
  visible: boolean;
};

export function ArrangementCapacityGuide({ rules }: { rules: CustomizationRules }) {
  return (
    <View accessibilityLabel="Standard arrangement capacity limits" style={styles.capacitySection}>
      <Text style={styles.capacityHeading}>Standard arrangement sizes</Text>
      <View style={styles.capacityChips}>
        {ARRANGEMENT_ORDER.map((key) => {
          const limit = rules.arrangement_limits[key];
          return (
            <View key={key} style={styles.capacityChip}>
              <Text style={styles.capacityChipLabel}>{limit.label}</Text>
              <Text style={styles.capacityChipValue}>{limit.max_stems} stems</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function ArrangementValidationRecovery({
  onApplySuggestion,
  onBuildManually,
  onOpenDetails,
  validation,
}: RecoveryProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);
  const hasSuggestion = Boolean(validation.suggested_prompt.trim());
  const recoveryTitle = getRecoveryTitle(validation);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: reduceMotion ? 100 : AI_MOTION.statusEntrance,
      easing: AI_EASE_OUT,
    });
  }, [progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: reduceMotion ? 0 : interpolate(progress.value, [0, 1], [-6, 0]) }],
  }));

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.recoveryCard, animatedStyle]}>
      <View style={styles.recoveryHeader}>
        <View style={styles.recoveryIcon}>
          <Sparkles color={theme.colors.primary} size={17} strokeWidth={2.3} />
        </View>
        <View style={styles.recoveryHeadingGroup}>
          <Text style={styles.assistantLabel}>BLOOMORA SUGGESTION</Text>
          <Text style={styles.recoveryTitle}>{recoveryTitle}</Text>
          <Text style={styles.recoveryReason}>
            {validation.adjustment_reasons[0] || 'The requested quantities need a small adjustment.'}
          </Text>
        </View>
      </View>

      {validation.suggested_items.length > 0 ? (
        <View style={styles.recipeSection}>
          <Text style={styles.recipeLabel}>Recommended recipe</Text>
          <View style={styles.recipeChips}>
            {validation.suggested_items.map((item) => (
              <View key={`${item.product_id || item.product_name}`} style={styles.recipeChip}>
                <Text style={styles.recipeQuantity}>{item.quantity}</Text>
                <Text numberOfLines={1} style={styles.recipeName}>{item.product_name}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <Text style={styles.recoverySuggestion}>A complete stocked recipe is not available right now.</Text>
      )}

      <View style={styles.recoveryActions}>
        {hasSuggestion ? (
          <MotionPressable
            accessibilityHint="Replaces your description without generating an image"
            accessibilityLabel="Use this recommended recipe"
            accessibilityRole="button"
            onPress={onApplySuggestion}
            style={styles.primaryAction}>
            <Text style={styles.primaryActionText}>Use this recipe</Text>
          </MotionPressable>
        ) : (
          <MotionPressable
            accessibilityRole="button"
            onPress={onBuildManually}
            style={styles.primaryAction}>
            <Text style={styles.primaryActionText}>Choose manually</Text>
          </MotionPressable>
        )}
        <MotionPressable
          accessibilityRole="button"
          onPress={onOpenDetails}
          style={styles.secondaryAction}>
          <Text style={styles.secondaryActionText}>See quantities</Text>
        </MotionPressable>
      </View>
    </Animated.View>
  );
}

export function QuantityDetailsSheet({
  onApplySuggestion,
  onBuildManually,
  onDismiss,
  validation,
  visible,
}: DetailsProps) {
  const insets = useSafeAreaInsets();
  const hasSuggestion = Boolean(validation.suggested_prompt.trim());
  const detailRows = buildQuantityDetailRows(validation);

  return (
    <Modal
      accessibilityViewIsModal
      animationType="slide"
      onRequestClose={onDismiss}
      presentationStyle="overFullScreen"
      transparent
      visible={visible}>
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityLabel="Close quantity details"
          accessibilityRole="button"
          onPress={onDismiss}
          style={styles.modalBackdrop}
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleGroup}>
              <Text style={styles.sheetTitle}>Quantity details</Text>
              <Text style={styles.sheetSubtitle}>
                Requested, safely available, and recommended quantities
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Close quantity details"
              accessibilityRole="button"
              hitSlop={10}
              onPress={onDismiss}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
              <X color="#626861" size={20} strokeWidth={2.3} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.ruleSummary}>
              <Info color={theme.colors.primary} size={17} strokeWidth={2.2} />
              <Text style={styles.ruleSummaryText}>
                {validation.requested_total > 0
                  ? `${getArrangementLabel(validation.arrangement_type)} limit: ${validation.max_stems} flower stems. You requested ${validation.requested_total.toLocaleString()}.`
                  : `We could not match a safely available flower from the request. Here is an available ${getArrangementLabel(validation.arrangement_type).toLowerCase()} recipe.`}
              </Text>
            </View>

            <View style={styles.columnHeadings}>
              <Text style={styles.flowerHeading}>Material</Text>
              <Text style={styles.numberHeading}>Asked</Text>
              <Text style={styles.numberHeading}>Available</Text>
              <Text style={styles.numberHeading}>Suggested</Text>
            </View>
            {detailRows.length > 0 ? detailRows.map((item) => (
                <View key={item.key} style={styles.quantityRow}>
                  <Text numberOfLines={2} style={styles.flowerName}>{item.productName}</Text>
                  <Text style={styles.quantityValue}>
                    {item.requestedQuantity === null ? '—' : item.requestedQuantity.toLocaleString()}
                  </Text>
                  <Text style={styles.quantityValue}>{item.availableQuantity.toLocaleString()}</Text>
                  <Text style={styles.suggestedValue}>{item.suggestedQuantity}</Text>
                </View>
              )) : (
                <Text style={styles.noInventoryText}>
                  A complete stocked arrangement is not available right now. Continue in Mix and Match to review the available materials.
                </Text>
              )}

            <View style={styles.reasonSection}>
              <Text style={styles.reasonHeading}>Why it changed</Text>
              {validation.adjustment_reasons.map((reason) => (
                <View key={reason} style={styles.reasonRow}>
                  <View style={styles.reasonDot} />
                  <Text style={styles.reasonText}>{reason}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.sheetActions}>
            {hasSuggestion ? (
              <Pressable
                accessibilityHint="Updates your description and returns to the prompt"
                accessibilityRole="button"
                onPress={onApplySuggestion}
                style={({ pressed }) => [styles.sheetPrimaryAction, pressed && styles.pressed]}>
                <Text style={styles.sheetPrimaryText}>Use suggested recipe</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={onBuildManually}
              style={({ pressed }) => [styles.sheetSecondaryAction, pressed && styles.pressed]}>
              <Text style={styles.sheetSecondaryText}>Build manually</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getRecoveryTitle(validation: QuantityValidation) {
  const arrangement = getArrangementLabel(validation.arrangement_type).toLowerCase();
  if (validation.code === 'quantity_adjustment_required') return `Let’s resize your ${arrangement}`;
  if (validation.code === 'stock_adjustment_required') return 'Let’s match today’s stock';
  if (validation.requested_total === 0) return 'Here’s a complete recipe';
  if (validation.adjustment_reasons.some((reason) => reason.startsWith('No stocked'))) {
    return 'Let’s complete your arrangement';
  }
  return 'Let’s swap unavailable flowers';
}

function buildQuantityDetailRows(validation: QuantityValidation) {
  const rows = validation.requested_items.map((requested) => {
    const suggested = validation.suggested_items.find(
      (candidate) => candidate.product_id === requested.product_id
        || candidate.product_name === requested.product_name,
    );
    return {
      availableQuantity: requested.available_quantity,
      key: requested.product_id || requested.product_name,
      productName: requested.product_name,
      requestedQuantity: requested.requested_quantity as number | null,
      suggestedQuantity: suggested?.quantity ?? 0,
    };
  });
  const existingKeys = new Set(rows.map((row) => row.key));

  validation.suggested_items.forEach((suggested) => {
    const key = suggested.product_id || suggested.product_name;
    if (existingKeys.has(key)) return;
    rows.push({
      availableQuantity: suggested.available_quantity ?? suggested.quantity,
      key,
      productName: suggested.product_name,
      requestedQuantity: null,
      suggestedQuantity: suggested.quantity,
    });
  });
  return rows;
}

function getArrangementLabel(type: QuantityValidation['arrangement_type']) {
  if (type === 'box') return 'Flower Box';
  if (type === 'vase') return 'Vase';
  return 'Bouquet';
}

const styles = StyleSheet.create({
  capacitySection: { gap: 8, marginTop: 14 },
  capacityHeading: { color: '#6A706B', fontFamily: Fonts.sansSemiBold, fontSize: 12, fontWeight: '600' },
  capacityChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  capacityChip: { backgroundColor: '#FFFFFF', borderColor: '#E2E5E2', borderRadius: 999, borderWidth: 1, flexDirection: 'row', gap: 5, paddingHorizontal: 10, paddingVertical: 7 },
  capacityChipLabel: { color: '#3F4640', fontFamily: Fonts.sansSemiBold, fontSize: 11, fontWeight: '600' },
  capacityChipValue: { color: theme.colors.primary, fontFamily: Fonts.sansBold, fontSize: 11, fontWeight: '700' },
  recoveryCard: { backgroundColor: theme.colors.white, borderColor: 'rgba(46, 139, 52, 0.20)', borderRadius: 18, borderWidth: 1, gap: 14, padding: 14 },
  recoveryHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: 10 },
  recoveryIcon: { alignItems: 'center', backgroundColor: theme.colors.greenSoft, borderRadius: 999, height: 34, justifyContent: 'center', width: 34 },
  recoveryHeadingGroup: { flex: 1, gap: 3 },
  assistantLabel: { color: theme.colors.primary, fontFamily: Fonts.sansBold, fontSize: 9, letterSpacing: 0.9, lineHeight: 12 },
  recoveryTitle: { color: theme.colors.text, fontFamily: Fonts.sansBold, fontSize: 15, fontWeight: '700' },
  recoveryReason: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  recoverySuggestion: { color: theme.colors.textMuted, fontFamily: Fonts.sansMedium, fontSize: 12, lineHeight: 18 },
  recipeSection: { gap: 8 },
  recipeLabel: { color: theme.colors.textMuted, fontFamily: Fonts.sansSemiBold, fontSize: 10, textTransform: 'uppercase' },
  recipeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  recipeChip: { alignItems: 'center', backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.subtleBorder, borderRadius: 999, borderWidth: 1, flexDirection: 'row', gap: 5, maxWidth: '100%', minHeight: 34, paddingHorizontal: 10 },
  recipeQuantity: { color: theme.colors.primary, fontFamily: Fonts.sansBold, fontSize: 12 },
  recipeName: { color: theme.colors.text, flexShrink: 1, fontFamily: Fonts.sansMedium, fontSize: 11 },
  recoveryActions: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  primaryAction: { alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: 12, flex: 1, minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  primaryActionText: { color: '#FFFFFF', fontFamily: Fonts.sansBold, fontSize: 13, fontWeight: '700' },
  secondaryAction: { alignItems: 'center', backgroundColor: theme.colors.white, borderColor: theme.colors.border, borderRadius: 12, borderWidth: 1, flex: 1, minHeight: 44, justifyContent: 'center', paddingHorizontal: 10 },
  secondaryActionText: { color: theme.colors.text, fontFamily: Fonts.sansBold, fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.72 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { backgroundColor: 'rgba(23, 30, 25, 0.48)', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '86%', paddingHorizontal: 20, paddingTop: 10 },
  sheetHandle: { alignSelf: 'center', backgroundColor: '#D6DAD6', borderRadius: 999, height: 4, marginBottom: 16, width: 42 },
  sheetHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  sheetTitleGroup: { flex: 1, gap: 3 },
  sheetTitle: { color: '#263029', fontFamily: Fonts.sansBold, fontSize: 20, fontWeight: '700' },
  sheetSubtitle: { color: '#7A807B', fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },
  closeButton: { alignItems: 'center', backgroundColor: '#F3F5F3', borderRadius: 999, height: 40, justifyContent: 'center', width: 40 },
  sheetScroll: { gap: 16, paddingBottom: 18, paddingTop: 18 },
  ruleSummary: { alignItems: 'flex-start', backgroundColor: theme.colors.greenSoft, borderRadius: 13, flexDirection: 'row', gap: 9, padding: 12 },
  ruleSummaryText: { color: theme.colors.primaryDark, flex: 1, fontFamily: Fonts.sansMedium, fontSize: 12, lineHeight: 18 },
  columnHeadings: { alignItems: 'flex-end', flexDirection: 'row', gap: 5, paddingHorizontal: 6 },
  flowerHeading: { color: '#858B86', flex: 1.5, fontFamily: Fonts.sansBold, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  numberHeading: { color: '#858B86', flex: 1, fontFamily: Fonts.sansBold, fontSize: 9, fontWeight: '700', textAlign: 'right', textTransform: 'uppercase' },
  quantityRow: { alignItems: 'center', borderBottomColor: '#ECEFEC', borderBottomWidth: 1, flexDirection: 'row', gap: 5, minHeight: 52, paddingHorizontal: 6, paddingVertical: 9 },
  flowerName: { color: '#333C35', flex: 1.5, fontFamily: Fonts.sansSemiBold, fontSize: 12, fontWeight: '600' },
  quantityValue: { color: '#59605B', flex: 1, fontFamily: Fonts.sansMedium, fontSize: 12, textAlign: 'right' },
  suggestedValue: { color: theme.colors.primary, flex: 1, fontFamily: Fonts.sansBold, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  noInventoryText: { color: '#69706A', fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18, paddingHorizontal: 6 },
  reasonSection: { gap: 8 },
  reasonHeading: { color: '#384139', fontFamily: Fonts.sansBold, fontSize: 13, fontWeight: '700' },
  reasonRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 8 },
  reasonDot: { backgroundColor: theme.colors.primary, borderRadius: 999, height: 6, marginTop: 6, width: 6 },
  reasonText: { color: '#69706A', flex: 1, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  sheetActions: { borderTopColor: '#ECEFEC', borderTopWidth: 1, gap: 9, paddingTop: 14 },
  sheetPrimaryAction: { alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: 14, minHeight: 48, justifyContent: 'center', paddingHorizontal: 16 },
  sheetPrimaryText: { color: '#FFFFFF', fontFamily: Fonts.sansBold, fontSize: 14, fontWeight: '700' },
  sheetSecondaryAction: { alignItems: 'center', borderColor: '#D7DDD8', borderRadius: 14, borderWidth: 1, minHeight: 46, justifyContent: 'center', paddingHorizontal: 16 },
  sheetSecondaryText: { color: '#485049', fontFamily: Fonts.sansBold, fontSize: 13, fontWeight: '700' },
});
