import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Platform,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { ChevronRight, Flower2, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatPhp, type Product } from '@/constants/shop';
import { theme } from '@/constants/theme';

type ScreenProps = {
  eyebrow?: string;
  headerAction?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
};

type SectionProps = {
  title: string;
  action?: string;
  titleStyle?: StyleProp<TextStyle>;
  children: React.ReactNode;
};

type ProductCardProps = {
  product: Product;
  compact?: boolean;
};

type PrimaryButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary';
};

export function BloomScreen({ eyebrow, headerAction, title, subtitle, children }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const topPadding = insets.top > 0 ? insets.top + theme.spacing.lg : theme.spacing.xxl;
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? theme.spacing.md : theme.spacing.xl);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.screenContent,
        { paddingBottom: 72 + bottomInset, paddingTop: topPadding },
      ]}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        {typeof title === 'string' ? (
          <>
            {eyebrow || headerAction ? (
              <View style={styles.eyebrowRow}>
                {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : <View />}
                {headerAction}
              </View>
            ) : null}
            <Text style={styles.title}>{title}</Text>
          </>
        ) : (
          <>
            <View style={styles.brandRow}>
              {title}
              {headerAction}
            </View>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          </>
        )}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </ScrollView>
  );
}

export function Section({ title, action, titleStyle, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, titleStyle]}>{title}</Text>
        {action ? (
          <Pressable style={styles.sectionAction}>
            <Text style={styles.sectionActionText}>{action}</Text>
            <ChevronRight size={theme.icon.sm} color={theme.colors.primary} />
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  return (
    <View style={[styles.productCard, compact && styles.productCardCompact]}>
      <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
      <View style={styles.productBody}>
        <Text style={styles.productTag}>{product.tag}</Text>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>{formatPhp(product.priceCents)}</Text>
          <Pressable style={styles.addButton}>
            <Plus size={theme.icon.sm} color={theme.colors.white} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function PrimaryButton({ label, variant = 'primary', style, ...props }: PrimaryButtonProps) {
  const isSecondary = variant === 'secondary';

  return (
    <Pressable
      style={(state) => [
        styles.button,
        isSecondary && styles.buttonSecondary,
        state.pressed && styles.buttonPressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}>
      <Text style={[styles.buttonText, isSecondary && styles.buttonTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Flower2 size={theme.icon.lg} color={theme.colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  screenContent: {
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    gap: theme.spacing.sm,
  },
  eyebrowRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
    minHeight: 48,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 40,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 16,
    lineHeight: 23,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0,
  },
  sectionAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  sectionActionText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  productCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    overflow: 'hidden',
    width: 176,
  },
  productCardCompact: {
    width: '48%',
  },
  productImage: {
    backgroundColor: theme.colors.surfaceAlt,
    height: 128,
    width: '100%',
  },
  productBody: {
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  productTag: {
    color: theme.colors.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  productName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 21,
    minHeight: 42,
  },
  productFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  productPrice: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  button: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: theme.spacing.xl,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.greenSoft,
    borderColor: theme.colors.border,
    borderWidth: theme.borderWidth,
  },
  buttonPressed: {
    opacity: 0.84,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonTextSecondary: {
    color: theme.colors.primaryDark,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDescription: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
