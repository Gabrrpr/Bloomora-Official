import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, ChevronLeft, Info, Sparkles } from 'lucide-react-native';

import { BloomScreen, PrimaryButton } from '@/components/bloom-ui';
import { AiDisclaimer, BackHeaderAction } from '@/components/make-personal-ui';
import { theme } from '@/constants/theme';

type MixStep = 1 | 2 | 3 | 4;

type OptionCard = {
  badge?: string;
  description: string;
  disabled?: boolean;
  id: string;
  imageUrl?: string;
  title: string;
};

const stepLabels = ['Size', 'Type', 'Flowers', 'Finish'];

const sizeOptions: OptionCard[] = [
  {
    description: 'A clarity gesture.',
    id: 'single',
    imageUrl: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=500&q=80',
    title: 'Single Stem',
  },
  {
    badge: 'Good for gifts',
    description: '3 main flowers plus fillers.',
    id: 'small',
    imageUrl: 'https://images.unsplash.com/photo-1487070183336-b863922373d4?auto=format&fit=crop&w=500&q=80',
    title: 'Small',
  },
  {
    description: 'Sweet and simple.',
    id: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1494972308805-463bc619d34e?auto=format&fit=crop&w=500&q=80',
    title: 'Medium',
  },
  {
    description: 'Luxurious and full.',
    id: 'large',
    imageUrl: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=500&q=80',
    title: 'Large',
  },
];

const typeOptions: OptionCard[] = [
  {
    description: 'Hand tied bouquet, ready to gift.',
    id: 'wrapped',
    imageUrl: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=500&q=80',
    title: 'Wrapped Arrangement',
  },
  {
    badge: 'Ready to display',
    description: 'A polished vase arrangement.',
    id: 'vase',
    imageUrl: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=500&q=80',
    title: 'Vase Arrangement',
  },
  {
    description: 'Stylish box.',
    id: 'box',
    imageUrl: 'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?auto=format&fit=crop&w=500&q=80',
    title: 'Flower in a Box',
  },
];

const focalFlowerOptions: OptionCard[] = [
  {
    description: 'Classic and romantic.',
    id: 'china-roses',
    imageUrl: 'https://images.unsplash.com/photo-1559563362-c667ba5f5480?auto=format&fit=crop&w=500&q=80',
    title: 'China Roses',
  },
  {
    description: 'Large premium blooms.',
    id: 'ecuador-roses',
    imageUrl: 'https://images.unsplash.com/photo-1518709779341-56cf4535e94b?auto=format&fit=crop&w=500&q=80',
    title: 'Ecuador Roses',
  },
  {
    description: 'Bright cheerful focus.',
    id: 'sunflower',
    imageUrl: 'https://images.unsplash.com/photo-1470509037663-253afd7f0f51?auto=format&fit=crop&w=500&q=80',
    title: 'Sunflower',
  },
  {
    description: 'Elegant graceful focal.',
    disabled: true,
    id: 'lilies',
    imageUrl: 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?auto=format&fit=crop&w=500&q=80',
    title: 'Lilies',
  },
  {
    description: 'Soft sweet charm.',
    id: 'pink-carnation',
    imageUrl: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=500&q=80',
    title: 'Pink Carnation',
  },
];

const fillerFlowerOptions: OptionCard[] = [
  {
    description: 'Keep it clean.',
    id: 'none',
    imageUrl: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=500&q=80',
    title: 'No Fillers',
  },
  {
    description: 'Airy white texture.',
    id: 'babys-breath',
    imageUrl: 'https://images.unsplash.com/photo-1591886960571-74d43a9d4166?auto=format&fit=crop&w=500&q=80',
    title: "Baby's Breath",
  },
  {
    description: 'Purple accent.',
    id: 'statice',
    imageUrl: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=500&q=80',
    title: 'Statice',
  },
];

const finishingOptions: OptionCard[] = [
  {
    description: 'Soft and classic.',
    id: 'white-wrap',
    imageUrl: 'https://images.unsplash.com/photo-1487070183336-b863922373d4?auto=format&fit=crop&w=500&q=80',
    title: 'White Wrap',
  },
  {
    description: 'Romantic finish.',
    id: 'pink-ribbon',
    imageUrl: 'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?auto=format&fit=crop&w=500&q=80',
    title: 'Pink Ribbon',
  },
  {
    description: 'Premium note.',
    id: 'gift-card',
    imageUrl: 'https://images.unsplash.com/photo-1494972308805-463bc619d34e?auto=format&fit=crop&w=500&q=80',
    title: 'Gift Card',
  },
];

export default function MixAndMatchScreen() {
  const [step, setStep] = useState<MixStep>(1);
  const [selectedSize, setSelectedSize] = useState('small');
  const [selectedType, setSelectedType] = useState('vase');
  const [selectedFocal, setSelectedFocal] = useState('ecuador-roses');
  const [selectedFiller, setSelectedFiller] = useState('babys-breath');
  const [selectedFinish, setSelectedFinish] = useState('white-wrap');
  const selected = useMemo(
    () => ({
      filler: findOption(fillerFlowerOptions, selectedFiller),
      finish: findOption(finishingOptions, selectedFinish),
      focal: findOption(focalFlowerOptions, selectedFocal),
      size: findOption(sizeOptions, selectedSize),
      type: findOption(typeOptions, selectedType),
    }),
    [selectedFiller, selectedFinish, selectedFocal, selectedSize, selectedType],
  );
  function continueStep() {
    setStep((current) => (current < 4 ? ((current + 1) as MixStep) : current));
  }

  function returnStep() {
    setStep((current) => (current > 1 ? ((current - 1) as MixStep) : current));
  }

  return (
    <BloomScreen
      eyebrow="Make it personal"
      headerAction={<BackHeaderAction />}
      title="Mix & match.">
      <MixProgress step={step} />

      {step === 1 ? (
        <BuilderStep
          stepNumber={1}
          title="Choose size of the arrangement"
          subtitle="Pick a size for your custom arrangement."
          summary={`Selected size: ${selected.size.title}. ${selected.size.description}`}
          tips={[
            'Small bouquets feel balanced and easy to give.',
            'A small size usually includes 3 main flowers with filler stems.',
          ]}>
          <HorizontalOptions options={sizeOptions} selectedId={selectedSize} onSelect={setSelectedSize} />
        </BuilderStep>
      ) : null}

      {step === 2 ? (
        <BuilderStep
          stepNumber={2}
          title="Choose type of arrangement"
          subtitle="Choose how the bouquet should be presented."
          summary={`Selected type: ${selected.type.title}.`}
          tips={[
            'Wrapped arrangements are best when the recipient can place the bouquet in their own vase.',
            'Vase arrangements are great for homes, offices, or events where display matters immediately.',
            'Flower boxes feel polished and stay more stable during delivery.',
          ]}>
          <HorizontalOptions options={typeOptions} selectedId={selectedType} onSelect={setSelectedType} />
        </BuilderStep>
      ) : null}

      {step === 3 ? (
        <View style={styles.stepStack}>
          <BuilderStep
            stepNumber={3}
            title="Choose your focal flower"
            subtitle="The main flower that defines your bouquet."
            tips={[
              'Your focal flower sets the mood, color, and overall style.',
              'Pick one type to keep the bouquet clean and consistent.',
            ]}>
            <HorizontalOptions options={focalFlowerOptions} selectedId={selectedFocal} onSelect={setSelectedFocal} />
          </BuilderStep>
          <BuilderStep
            optional
            stepNumber={3}
            title="Choose your filler flower"
            subtitle="This adds texture, shape, and volume."
            summary={`Selected flowers: ${selected.focal.title} with ${selected.filler.title}.`}
            tips={[
              'Filler flowers support your focal flower without taking attention away from it.',
              'They add softness, movement, and depth to the final bouquet.',
            ]}>
            <HorizontalOptions options={fillerFlowerOptions} selectedId={selectedFiller} onSelect={setSelectedFiller} />
          </BuilderStep>
        </View>
      ) : null}

      {step === 4 ? (
        <FinalResult
          selections={selected}
          selectedFinish={selectedFinish}
          onSelectFinish={setSelectedFinish}
        />
      ) : null}

      <View style={styles.navRow}>
        <Pressable
          accessibilityRole="button"
          disabled={step === 1}
          style={({ pressed }) => [styles.returnButton, step === 1 && styles.disabledButton, pressed && step > 1 && styles.pressed]}
          onPress={returnStep}>
          <ChevronLeft size={theme.icon.sm} color={step === 1 ? theme.colors.textMuted : theme.colors.text} />
          <Text style={[styles.returnText, step === 1 && styles.disabledText]}>Return</Text>
        </Pressable>
        {step < 4 ? (
          <PrimaryButton label="Continue" style={styles.continueButton} onPress={continueStep} />
        ) : (
          <PrimaryButton label="Create my bouquet" style={styles.continueButton} onPress={() => {}} />
        )}
      </View>

      <AiDisclaimer />
    </BloomScreen>
  );
}

function MixProgress({ step }: { step: MixStep }) {
  return (
    <View style={styles.progressCard}>
      <View style={styles.progressTitleRow}>
        <View style={styles.progressBadge}>
          <Sparkles size={theme.icon.lg} color={theme.colors.primary} />
        </View>
        <View style={styles.progressTitleCopy}>
          <Text style={styles.progressTitle}>Mix and Match</Text>
        </View>
        <Text style={styles.stepCount}>{step === 4 ? 'Completed' : `Step ${step} of 4`}</Text>
      </View>

      <View style={styles.stepTrack}>
        {stepLabels.map((label, index) => {
          const stepNumber = (index + 1) as MixStep;
          const isComplete = step > stepNumber || step === 4;
          const isActive = step === stepNumber;
          const tintStyle = isComplete || isActive ? styles.stepNodeActive : styles.stepNodeInactive;

          return (
            <View key={label} style={styles.stepItem}>
              {index > 0 ? <View style={[styles.stepLine, step > stepNumber - 1 && styles.stepLineActive]} /> : null}
              <View style={[styles.stepNode, tintStyle]}>
                {isComplete ? (
                  <Check size={theme.icon.sm} color={theme.colors.white} />
                ) : (
                  <Text style={[styles.stepNodeText, isActive && styles.stepNodeTextActive]}>{stepNumber}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, (isActive || isComplete) && styles.stepLabelActive]}>{label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function BuilderStep({
  children,
  optional = false,
  stepNumber,
  subtitle,
  summary,
  tips,
  title,
}: {
  children: React.ReactNode;
  optional?: boolean;
  stepNumber: number;
  subtitle: string;
  summary?: string;
  tips: string[];
  title: string;
}) {
  return (
    <View style={styles.builderCard}>
      <View style={styles.builderHeader}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberBadgeText}>{stepNumber}</Text>
        </View>
        <View style={styles.builderHeaderCopy}>
          <Text style={styles.builderTitle}>
            {title}
            {optional ? <Text style={styles.optionalText}> (optional)</Text> : null}
          </Text>
          <Text style={styles.builderSubtitle}>{subtitle}</Text>
        </View>
      </View>
      {children}
      {summary ? <Text style={styles.summaryBar}>{summary}</Text> : null}
      <TipsCard tips={tips} />
    </View>
  );
}

function HorizontalOptions({
  onSelect,
  options,
  selectedId,
}: {
  onSelect: (id: string) => void;
  options: OptionCard[];
  selectedId: string;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionsRow}>
      {options.map((option) => {
        const selected = option.id === selectedId;

        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ disabled: option.disabled, selected }}
            disabled={option.disabled}
            style={({ pressed }) => [
              styles.optionCard,
              selected && styles.optionCardSelected,
              option.disabled && styles.optionCardDisabled,
              pressed && !option.disabled && styles.pressed,
            ]}
            onPress={() => onSelect(option.id)}>
            <View style={[styles.optionMark, selected && styles.optionMarkSelected]}>
              {selected ? <Check size={theme.icon.sm} color={theme.colors.white} /> : null}
            </View>
            <Text style={styles.optionTitle} numberOfLines={2}>
              {option.title}
            </Text>
            <Text style={styles.optionDescription} numberOfLines={2}>
              {option.description}
            </Text>
            {option.badge ? <Text style={styles.optionBadge}>{option.badge}</Text> : null}
            {option.disabled ? <Text style={styles.stockText}>Out of stock</Text> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function TipsCard({ tips }: { tips: string[] }) {
  return (
    <View style={styles.tipsCard}>
      <View style={styles.tipsHeader}>
        <Info size={theme.icon.sm} color={theme.colors.textMuted} />
        <Text style={styles.tipsTitle}>Floral tips and guides</Text>
      </View>
      {tips.map((tip) => (
        <View key={tip} style={styles.tipRow}>
          <Text style={styles.tipBullet}>{'\u2022'}</Text>
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      ))}
    </View>
  );
}

function FinalResult({
  onSelectFinish,
  selectedFinish,
  selections,
}: {
  onSelectFinish: (id: string) => void;
  selectedFinish: string;
  selections: {
    filler: OptionCard;
    finish: OptionCard;
    focal: OptionCard;
    size: OptionCard;
    type: OptionCard;
  };
}) {
  return (
    <View style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <View style={styles.resultHeaderCopy}>
          <Sparkles size={theme.icon.lg} color={theme.colors.primary} />
          <View>
            <Text style={styles.resultKicker}>Output placeholder</Text>
            <Text style={styles.resultSubtitle}>No generated result is shown yet</Text>
          </View>
        </View>
      </View>

      <View style={styles.resultBody}>
        <View style={styles.outputPlaceholder}>
          <Sparkles size={theme.icon.lg} color={theme.colors.primary} />
          <Text style={styles.resultTitle}>This is where the arrangement output will be.</Text>
          <Text style={styles.resultDescription}>
            Your selected options are saved below. The bouquet image, pricing, and analysis are hidden for now.
          </Text>
        </View>

        <Text style={styles.resultSectionTitle}>Selected direction</Text>
        <Text style={styles.resultDescription}>
          {[selections.size.title, selections.type.title, selections.focal.title, selections.filler.title].join(' / ')}
        </Text>

        <Text style={styles.resultSectionTitle}>Finish</Text>
        <HorizontalOptions options={finishingOptions} selectedId={selectedFinish} onSelect={onSelectFinish} />
      </View>
    </View>
  );
}

function findOption(options: OptionCard[], id: string) {
  return options.find((option) => option.id === id) ?? options[0];
}

const styles = StyleSheet.create({
  progressCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  progressTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  progressBadge: {
    alignItems: 'center',
    backgroundColor: '#F5EEFF',
    borderRadius: theme.radius.pill,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  progressTitleCopy: {
    flex: 1,
  },
  progressTitle: {
    color: theme.colors.text,
    fontSize: 23,
    fontWeight: '700',
  },
  stepCount: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  stepTrack: {
    flexDirection: 'row',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepLine: {
    backgroundColor: '#A7A7A7',
    height: 4,
    left: '-50%',
    position: 'absolute',
    right: '50%',
    top: 20,
  },
  stepLineActive: {
    backgroundColor: theme.colors.primary,
  },
  stepNode: {
    alignItems: 'center',
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth,
    height: 42,
    justifyContent: 'center',
    width: 42,
    zIndex: 1,
  },
  stepNodeActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  stepNodeInactive: {
    backgroundColor: theme.colors.surface,
    borderColor: '#A7A7A7',
  },
  stepNodeText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  stepNodeTextActive: {
    color: theme.colors.white,
  },
  stepLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: theme.colors.primaryDark,
  },
  stepStack: {
    gap: theme.spacing.lg,
  },
  builderCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  builderHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  numberBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    height: 24,
    justifyContent: 'center',
    marginTop: 2,
    width: 24,
  },
  numberBadgeText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  builderHeaderCopy: {
    flex: 1,
  },
  builderTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 23,
  },
  optionalText: {
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  builderSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  optionsRow: {
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.lg,
  },
  optionCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    minHeight: 132,
    padding: theme.spacing.md,
    width: 148,
  },
  optionCardSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  optionCardDisabled: {
    opacity: 0.48,
  },
  optionMark: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth,
    height: 30,
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
    width: 30,
  },
  optionMarkSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  stockText: {
    color: theme.colors.danger,
    fontSize: 11,
    fontWeight: '800',
    marginTop: theme.spacing.xs,
  },
  optionTitle: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 17,
    textAlign: 'left',
  },
  optionDescription: {
    color: theme.colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
    textAlign: 'left',
  },
  optionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '800',
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  summaryBar: {
    backgroundColor: '#DDF6E5',
    borderRadius: theme.radius.sm,
    color: theme.colors.primaryDark,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  tipsCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.subtleBorder,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  tipsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  tipsTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  tipRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  tipBullet: {
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 20,
  },
  tipText: {
    color: theme.colors.textMuted,
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  navRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  returnButton: {
    alignItems: 'center',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: theme.borderWidth,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  disabledButton: {
    opacity: 0.54,
  },
  returnText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  disabledText: {
    color: theme.colors.textMuted,
  },
  continueButton: {
    flex: 1,
  },
  resultCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    overflow: 'hidden',
  },
  resultHeader: {
    alignItems: 'center',
    borderBottomColor: theme.colors.subtleBorder,
    borderBottomWidth: theme.borderWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  resultHeaderCopy: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  resultKicker: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  resultSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  resultBody: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  outputPlaceholder: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.subtleBorder,
    borderRadius: theme.radius.md,
    borderStyle: 'dashed',
    borderWidth: theme.borderWidth,
    gap: theme.spacing.sm,
    minHeight: 180,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  resultTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
    textAlign: 'center',
  },
  resultDescription: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  resultSectionTitle: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.84,
  },
});
