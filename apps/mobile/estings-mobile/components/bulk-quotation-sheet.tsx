import { Image } from 'expo-image';
import { FileText, MessageCircle, Share2, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatPhp, type Product } from '@/constants/shop';
import { Fonts, theme } from '@/constants/theme';
import { buildQuotationRef, buildQuotationText, type QuotationMeta } from '@/utils/product-helpers';

const imageNotFound = require('@/assets/images/default-img/ImageNotFound.webp');
const QUICK_QUANTITIES = [10, 25, 50, 100];

type BulkQuotationSheetProps = {
  addOns: Product[];
  colorName?: string;
  onClose: () => void;
  onOpenChat: (quoteText: string) => void;
  product: Product;
  visible: boolean;
};

type SheetPhase = 'input' | 'loading' | 'report';

export function BulkQuotationSheet({
  addOns,
  colorName,
  onClose,
  onOpenChat,
  product,
  visible,
}: BulkQuotationSheetProps) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<SheetPhase>('input');
  const [quantityInput, setQuantityInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [meta, setMeta] = useState<QuotationMeta>({ date: '', qty: 0, ref: '' });

  const unitPriceCents = useMemo(
    () => product.priceCents + addOns.reduce((total, item) => total + item.priceCents, 0),
    [addOns, product.priceCents],
  );

  useEffect(() => {
    if (!visible) {
      setPhase('input');
      setQuantityInput('');
      setErrorMessage(null);
      setMeta({ date: '', qty: 0, ref: '' });
    }
  }, [visible]);

  useEffect(() => {
    if (phase !== 'loading') {
      return undefined;
    }

    const timer = setTimeout(() => setPhase('report'), 1400);
    return () => clearTimeout(timer);
  }, [phase]);

  const handleGenerate = () => {
    const quantity = Number.parseInt(quantityInput, 10);

    if (!quantity || quantity < 1) {
      setErrorMessage('Please enter how many you would like to order.');
      return;
    }

    setMeta({
      qty: quantity,
      ref: buildQuotationRef(product.id),
      date: new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }),
    });
    setErrorMessage(null);
    setPhase('loading');
  };

  const quoteText = useMemo(() => {
    if (phase !== 'report') {
      return '';
    }

    return buildQuotationText({
      addOns,
      colorName,
      meta,
      product,
    });
  }, [addOns, colorName, meta, phase, product]);

  const grandTotalCents = unitPriceCents * meta.qty;

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(quoteText);
        return;
      }

      await Share.share({ message: quoteText, title: 'Bulk order quotation' });
    } catch {
      // User dismissed share sheet.
    }
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Close quotation sheet" onPress={onClose} style={styles.backdrop} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + theme.spacing.lg }]}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderText}>
              <Text style={styles.sheetTitle}>Bulk order quotation</Text>
              <Text style={styles.sheetSubtitle}>Get an instant estimate for a large order</Text>
            </View>
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              hitSlop={10}
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
              <X color={theme.colors.textMuted} size={20} strokeWidth={2.4} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
            {phase === 'input' ? (
              <>
                <View style={styles.productPreview}>
                  {product.imageUrl ? (
                    <Image contentFit="cover" source={{ uri: product.imageUrl }} style={styles.previewImage} />
                  ) : (
                    <Image contentFit="contain" source={imageNotFound} style={styles.previewImage} />
                  )}
                  <View style={styles.previewBody}>
                    <Text numberOfLines={2} style={styles.previewName}>
                      {product.name}
                    </Text>
                    <Text style={styles.previewMeta}>
                      {[colorName, addOns.length > 0 ? `${addOns.length} add-on${addOns.length === 1 ? '' : 's'}` : null]
                        .filter(Boolean)
                        .join(' · ') || 'Standard'}
                    </Text>
                    <Text style={styles.previewPrice}>
                      {formatPhp(unitPriceCents)} per unit{addOns.length > 0 ? ' (incl. add-ons)' : ''}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.fieldLabel, errorMessage ? styles.fieldLabelError : null]}>
                  How many would you like to order?
                </Text>
                <TextInput
                  keyboardType="number-pad"
                  onChangeText={(value) => {
                    setQuantityInput(value.replace(/[^0-9]/g, ''));
                    setErrorMessage(null);
                  }}
                  placeholder="e.g. 10"
                  placeholderTextColor={theme.colors.textMuted}
                  style={[styles.input, errorMessage ? styles.inputError : null]}
                  value={quantityInput}
                />

                <View style={styles.quickRow}>
                  {QUICK_QUANTITIES.map((quantity) => {
                    const isSelected = quantityInput === String(quantity);

                    return (
                      <Pressable
                        accessibilityRole="button"
                        key={quantity}
                        onPress={() => {
                          setQuantityInput(String(quantity));
                          setErrorMessage(null);
                        }}
                        style={({ pressed }) => [
                          styles.quickChip,
                          isSelected && styles.quickChipSelected,
                          pressed && styles.pressed,
                        ]}>
                        <Text style={[styles.quickChipText, isSelected && styles.quickChipTextSelected]}>
                          {quantity} pcs
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                <Pressable
                  accessibilityRole="button"
                  onPress={handleGenerate}
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                  <FileText color={theme.colors.white} size={18} strokeWidth={2.2} />
                  <Text style={styles.primaryButtonText}>Generate quotation</Text>
                </Pressable>
              </>
            ) : null}

            {phase === 'loading' ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color={theme.colors.primary} size="large" />
                <Text style={styles.loadingTitle}>Preparing your quotation…</Text>
                <Text style={styles.loadingSubtitle}>Crunching the numbers for {quantityInput} pcs</Text>
              </View>
            ) : null}

            {phase === 'report' ? (
              <>
                <View style={styles.reportHeader}>
                  <Text style={styles.reportEyebrow}>Bulk order quotation</Text>
                  <Text style={styles.reportBrand}>Esting&apos;s Flower International Inc.</Text>
                  <Text style={styles.reportMeta}>
                    Ref {meta.ref} · {meta.date}
                  </Text>
                </View>

                <View style={styles.reportCard}>
                  <ReportRow label="Item" value={product.name} />
                  {colorName ? <ReportRow label="Color" value={colorName} /> : null}
                  <ReportRow label="Quantity" value={String(meta.qty)} />
                  <View style={styles.reportDivider} />
                  <ReportLineRow label={product.name} quantity={meta.qty} unitPriceCents={product.priceCents} />
                  {addOns.map((addOn) => (
                    <ReportLineRow addOn key={addOn.id} label={addOn.name} quantity={meta.qty} unitPriceCents={addOn.priceCents} />
                  ))}
                  <ReportRow label="Per-unit total" value={formatPhp(unitPriceCents)} />
                  <View style={styles.reportDivider} />
                  <ReportRow emphasized label="Grand total" value={formatPhp(grandTotalCents)} />
                </View>

                <Text style={styles.reportNote}>
                  This is a standard-rate estimate. Bulk discounts are not applied automatically. Message us to discuss a better rate for this quantity.
                </Text>

                <View style={styles.actionRow}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void handleShare()}
                    style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                    <Share2 color={theme.colors.primary} size={16} strokeWidth={2.2} />
                    <Text style={styles.secondaryButtonText}>Share quote</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => onOpenChat(quoteText)}
                    style={({ pressed }) => [styles.primaryButton, styles.chatButton, pressed && styles.pressed]}>
                    <MessageCircle color={theme.colors.white} size={18} strokeWidth={2.2} />
                    <Text style={styles.primaryButtonText}>Send to chat</Text>
                  </Pressable>
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => setPhase('input')}
                  style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}>
                  <Text style={styles.linkButtonText}>Change quantity</Text>
                </Pressable>
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ReportRow({
  emphasized = false,
  label,
  value,
}: {
  emphasized?: boolean;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.reportRow}>
      <Text style={styles.reportLabel}>{label}</Text>
      <Text style={[styles.reportValue, emphasized && styles.reportValueEmphasized]}>{value}</Text>
    </View>
  );
}

function ReportLineRow({
  addOn = false,
  label,
  quantity,
  unitPriceCents,
}: {
  addOn?: boolean;
  label: string;
  quantity: number;
  unitPriceCents: number;
}) {
  return (
    <View style={styles.reportLineRow}>
      <View style={styles.reportLineCopy}>
        <Text numberOfLines={1} style={styles.reportLineLabel}>{addOn ? `Add-on: ${label}` : label}</Text>
        <Text style={styles.reportLineMath}>{formatPhp(unitPriceCents)} x {quantity.toLocaleString('en-PH')}</Text>
      </View>
      <Text style={styles.reportLineTotal}>{formatPhp(unitPriceCents * quantity)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31, 42, 36, 0.42)',
  },
  sheet: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingTop: theme.spacing.lg,
  },
  sheetHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  sheetHeaderText: {
    flex: 1,
    gap: 4,
  },
  sheetTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    lineHeight: 24,
  },
  sheetSubtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  sheetContent: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },
  productPreview: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: 'rgba(31, 42, 36, 0.08)',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  previewImage: {
    borderRadius: theme.radius.sm,
    height: 56,
    width: 56,
  },
  previewBody: {
    flex: 1,
    gap: 3,
  },
  previewName: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  previewMeta: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
  },
  previewPrice: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  fieldLabel: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  fieldLabelError: {
    color: theme.colors.danger,
  },
  input: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1.2,
    color: theme.colors.text,
    fontFamily: Fonts.sansMedium,
    fontSize: 15,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: theme.colors.dangerBorder,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  quickChip: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
  },
  quickChipSelected: {
    backgroundColor: theme.colors.greenSoft,
    borderColor: theme.colors.primary,
  },
  quickChipText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
  },
  quickChipTextSelected: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansSemiBold,
  },
  errorText: {
    color: theme.colors.danger,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: theme.spacing.lg,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
  },
  chatButton: {
    flex: 1,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.md,
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
  },
  loadingState: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xxl,
  },
  loadingTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
  },
  loadingSubtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
  },
  reportHeader: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    gap: 4,
    padding: theme.spacing.lg,
  },
  reportEyebrow: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  reportBrand: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 16,
  },
  reportMeta: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: Fonts.sans,
    fontSize: 11,
  },
  reportCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: 'rgba(31, 42, 36, 0.08)',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  reportRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  reportLabel: {
    color: theme.colors.textMuted,
    flexShrink: 0,
    fontFamily: Fonts.sans,
    fontSize: 13,
  },
  reportLineCopy: {
    flex: 1,
    gap: 2,
  },
  reportLineLabel: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
  },
  reportLineMath: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 11,
  },
  reportLineRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  reportLineTotal: {
    color: theme.colors.text,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    textAlign: 'right',
  },
  reportValue: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    textAlign: 'right',
  },
  reportValueEmphasized: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansBold,
    fontSize: 16,
  },
  reportDivider: {
    backgroundColor: 'rgba(31, 42, 36, 0.08)',
    height: 1,
    marginVertical: 4,
  },
  reportNote: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  linkButtonText: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
