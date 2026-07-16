import { ArrowLeft, Check, Sparkles, WandSparkles } from 'lucide-react-native';
import { memo, useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AI_EASE_OUT, AI_MOTION, MotionPressable } from '@/components/ai-arrangement-motion';
import { RecipeGallery } from '@/components/recipe-gallery';
import { formatPhp } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import type { DyaRecipePreview } from '@/services/customization-api';

type AiArrangementReviewProps = {
  isGenerating: boolean;
  onEdit: () => void;
  onGenerate: () => void;
  preview: DyaRecipePreview;
  prompt: string;
};

export const AiArrangementReview = memo(function AiArrangementReview({
  isGenerating,
  onEdit,
  onGenerate,
  preview,
  prompt,
}: AiArrangementReviewProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: reduceMotion ? 100 : AI_MOTION.contentEntrance,
      easing: AI_EASE_OUT,
    });
  }, [progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: reduceMotion ? 0 : interpolate(progress.value, [0, 1], [8, 0]) }],
  }));

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 112 + insets.bottom }]}
        showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.header, animatedStyle]}>
          <View style={styles.icon}>
            <Sparkles color={theme.colors.primary} size={22} strokeWidth={2.2} />
          </View>
          <Text style={styles.eyebrow}>READY TO REVIEW</Text>
          <Text style={styles.title}>Review and generate</Text>
          <Text style={styles.subtitle}>Check the complete recipe and estimated price before using an AI creation.</Text>
        </Animated.View>

        <Animated.View style={[styles.promptCard, animatedStyle]}>
          <Text style={styles.promptLabel}>Your description</Text>
          <Text style={styles.promptText}>{prompt}</Text>
        </Animated.View>

        <Animated.View style={[styles.reviewCard, animatedStyle]}>
          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionTitle}>{preview.arrangementLabel} recipe</Text>
              <Text style={styles.sectionSubtitle}>{preview.items.length} products selected</Text>
            </View>
            <View style={styles.tokenPill}>
              <Check color={theme.colors.primary} size={13} strokeWidth={2.5} />
              <Text style={styles.tokenPillText}>No image credit used</Text>
            </View>
          </View>

          <RecipeGallery items={preview.items.map((item) => ({
            id: item.product_id,
            imageUrl: item.image_url,
            label: item.product_name,
            quantity: item.quantity,
          }))} />

          <View style={styles.breakdown}>
            <Text style={styles.breakdownTitle}>Price breakdown</Text>
            {preview.items.map((item) => (
              <View key={item.product_id} style={styles.priceRow}>
                <View style={styles.priceCopy}>
                  <Text numberOfLines={1} style={styles.productName}>{item.product_name}</Text>
                  <Text style={styles.productMeta}>{item.material_type} · {item.quantity} × {formatPhp(Math.round(item.unit_price * 100))}</Text>
                </View>
                <Text style={styles.productPrice}>{formatPhp(Math.round(item.subtotal * 100))}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>Estimated total</Text>
                <Text style={styles.totalHint}>Gemini and safe stock reviewed</Text>
              </View>
              <Text style={styles.totalPrice}>{formatPhp(Math.round(preview.totalPrice * 100))}</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.inventoryNote}>
          <Text style={styles.inventoryNoteText}>Gemini matched your request to today’s safe inventory and pricing. No image was generated, and stock is checked once more when you continue.</Text>
        </View>
      </ScrollView>

      <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <MotionPressable
          accessibilityLabel="Edit description"
          accessibilityRole="button"
          disabled={isGenerating}
          onPress={onEdit}
          style={styles.editButton}>
          <ArrowLeft color={theme.colors.primary} size={18} strokeWidth={2.3} />
          <Text style={styles.editButtonText}>Edit</Text>
        </MotionPressable>
        <MotionPressable
          accessibilityHint="Uses one AI creation after validating this recipe"
          accessibilityLabel="Generate AI preview"
          accessibilityRole="button"
          accessibilityState={{ busy: isGenerating, disabled: isGenerating }}
          disabled={isGenerating}
          onPress={onGenerate}
          style={styles.generateButton}>
          {isGenerating ? (
            <ActivityIndicator color={theme.colors.white} size="small" />
          ) : (
            <WandSparkles color={theme.colors.white} size={18} strokeWidth={2.3} />
          )}
          <Text style={styles.generateButtonText}>{isGenerating ? 'Creating preview…' : 'Generate preview'}</Text>
        </MotionPressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: { backgroundColor: theme.colors.surfaceAlt, flex: 1 },
  content: { gap: 13, paddingHorizontal: 16, paddingTop: 18 },
  header: { alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10 },
  icon: { alignItems: 'center', backgroundColor: theme.colors.greenSoft, borderRadius: 999, height: 46, justifyContent: 'center', marginBottom: 2, width: 46 },
  eyebrow: { color: theme.colors.primary, fontFamily: Fonts.sansBold, fontSize: 10, letterSpacing: 1.2 },
  title: { color: theme.colors.text, fontFamily: Fonts.sansBold, fontSize: 23, lineHeight: 29 },
  subtitle: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19, maxWidth: 330, textAlign: 'center' },
  promptCard: { backgroundColor: theme.colors.greenSoft, borderRadius: 14, gap: 5, padding: 13 },
  promptLabel: { color: theme.colors.primaryDark, fontFamily: Fonts.sansBold, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  promptText: { color: theme.colors.text, fontFamily: Fonts.sansMedium, fontSize: 12, lineHeight: 18 },
  reviewCard: { backgroundColor: theme.colors.white, borderColor: theme.colors.border, borderRadius: 18, borderWidth: 1, padding: 14 },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 13 },
  sectionTitle: { color: theme.colors.text, fontFamily: Fonts.sansBold, fontSize: 17 },
  sectionSubtitle: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 11, marginTop: 2 },
  tokenPill: { alignItems: 'center', backgroundColor: theme.colors.greenSoft, borderRadius: 999, flexDirection: 'row', gap: 4, paddingHorizontal: 8, paddingVertical: 6 },
  tokenPillText: { color: theme.colors.primaryDark, fontFamily: Fonts.sansBold, fontSize: 9 },
  breakdown: { borderTopColor: theme.colors.subtleBorder, borderTopWidth: 1, paddingTop: 13 },
  breakdownTitle: { color: theme.colors.text, fontFamily: Fonts.sansBold, fontSize: 13, marginBottom: 4 },
  priceRow: { alignItems: 'center', borderBottomColor: theme.colors.subtleBorder, borderBottomWidth: 1, flexDirection: 'row', gap: 10, minHeight: 52, paddingVertical: 7 },
  priceCopy: { flex: 1, gap: 2 },
  productName: { color: theme.colors.text, fontFamily: Fonts.sansSemiBold, fontSize: 12 },
  productMeta: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 10, textTransform: 'capitalize' },
  productPrice: { color: theme.colors.text, fontFamily: Fonts.sansBold, fontSize: 12 },
  totalRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 14 },
  totalLabel: { color: theme.colors.text, fontFamily: Fonts.sansBold, fontSize: 13 },
  totalHint: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 9, marginTop: 2 },
  totalPrice: { color: theme.colors.primaryDark, fontFamily: Fonts.sansExtraBold, fontSize: 18 },
  inventoryNote: { paddingHorizontal: 8 },
  inventoryNoteText: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 10, lineHeight: 16, textAlign: 'center' },
  actionBar: { alignItems: 'center', backgroundColor: theme.colors.white, borderTopColor: theme.colors.border, borderTopWidth: 1, bottom: 0, flexDirection: 'row', gap: 10, left: 0, paddingHorizontal: 16, paddingTop: 12, position: 'absolute', right: 0 },
  editButton: { alignItems: 'center', borderColor: theme.colors.border, borderRadius: 13, borderWidth: 1, flexDirection: 'row', gap: 6, justifyContent: 'center', minHeight: 50, paddingHorizontal: 18 },
  editButtonText: { color: theme.colors.primary, fontFamily: Fonts.sansBold, fontSize: 13 },
  generateButton: { alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: 13, flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 50, paddingHorizontal: 16 },
  generateButtonText: { color: theme.colors.white, fontFamily: Fonts.sansBold, fontSize: 13 },
});
