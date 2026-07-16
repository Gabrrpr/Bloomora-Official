import { Info, Sparkles, X } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, theme } from '@/constants/theme';
import type { ArrangementLimitKey, CustomizationRules } from '@/services/customization-api';

const ARRANGEMENT_ORDER: ArrangementLimitKey[] = ['bouquet', 'vase', 'box'];

type AiCapabilitiesSheetProps = {
  onDismiss: () => void;
  rules: CustomizationRules;
  visible: boolean;
};

export function AiCapabilitiesSheet({ onDismiss, rules, visible }: AiCapabilitiesSheetProps) {
  const insets = useSafeAreaInsets();

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
          accessibilityLabel="Close arrangement guidance"
          accessibilityRole="button"
          onPress={onDismiss}
          style={styles.backdrop}
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, theme.spacing.xl) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.titleGroup}>
              <View style={styles.iconCircle}>
                <Sparkles color={theme.colors.primary} size={18} strokeWidth={2.2} />
              </View>
              <View style={styles.titleCopy}>
                <Text style={styles.title}>What can I create?</Text>
                <Text style={styles.subtitle}>Choose a standard arrangement size, then describe your style.</Text>
              </View>
            </View>
            <Pressable
              accessibilityLabel="Close arrangement guidance"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onDismiss}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
              <X color={theme.colors.textMuted} size={20} strokeWidth={2.3} />
            </Pressable>
          </View>

          <View accessibilityLabel="Standard arrangement capacity limits" style={styles.limitList}>
            {ARRANGEMENT_ORDER.map((key) => {
              const limit = rules.arrangement_limits[key];
              return (
                <View key={key} style={styles.limitRow}>
                  <Text style={styles.limitLabel}>{limit.label}</Text>
                  <Text style={styles.limitValue}>Up to {limit.max_stems} stems</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.note}>
            <Info color={theme.colors.primary} size={17} strokeWidth={2.1} />
            <Text style={styles.noteText}>
              Suggestions also account for safely available inventory. The preview shows the intended palette and style;
              your florist follows the confirmed recipe.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(23, 30, 25, 0.46)',
  },
  sheet: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    gap: theme.spacing.lg,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#D6DAD6',
    borderRadius: theme.radius.pill,
    height: 4,
    width: 42,
  },
  header: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  titleGroup: { alignItems: 'flex-start', flex: 1, flexDirection: 'row', gap: 12 },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  titleCopy: { flex: 1, gap: 3 },
  title: { color: theme.colors.text, fontFamily: Fonts.sansBold, fontSize: 20, lineHeight: 26 },
  subtitle: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  closeButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  limitList: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  limitRow: {
    alignItems: 'center',
    borderBottomColor: theme.colors.subtleBorder,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 54,
    paddingHorizontal: theme.spacing.lg,
  },
  limitLabel: { color: theme.colors.text, fontFamily: Fonts.sansSemiBold, fontSize: 14 },
  limitValue: { color: theme.colors.primary, fontFamily: Fonts.sansBold, fontSize: 13 },
  note: {
    alignItems: 'flex-start',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    gap: 10,
    padding: theme.spacing.md,
  },
  noteText: { color: theme.colors.textMuted, flex: 1, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  pressed: { opacity: 0.65 },
});
