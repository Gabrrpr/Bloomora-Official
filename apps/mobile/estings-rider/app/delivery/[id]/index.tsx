import Feather from '@expo/vector-icons/Feather';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Alert, Animated, Linking, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getDeliveryTask, getStatusLabel, type DeliveryTaskStatus } from '@/constants/mock-deliveries';
import { Fonts, theme } from '@/constants/theme';

const progressSteps: { label: string; status: DeliveryTaskStatus }[] = [
  { label: 'Assigned', status: 'ready_for_pickup' },
  { label: 'Picked Up', status: 'picked_up' },
  { label: 'On The Way', status: 'on_the_way' },
  { label: 'Delivered', status: 'completed' },
];

export default function DeliveryDetailsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const task = useMemo(() => getDeliveryTask(params.id ?? '1024'), [params.id]);
  const [status, setStatus] = useState<DeliveryTaskStatus>(task.status);
  const [proofPhotoUri, setProofPhotoUri] = useState<string | null>(null);
  const [completionTime, setCompletionTime] = useState<string | null>(task.completionTime ?? null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const statusLabel = getStatusLabel(status);
  const isCompleted = status === 'completed';

  async function handleCallRecipient() {
    await Linking.openURL(`tel:${task.phoneNumber}`);
  }

  async function handleOpenMaps() {
    const encodedAddress = encodeURIComponent(task.address);
    Alert.alert('Open navigation', task.address, [
      { text: 'Google Maps', onPress: () => void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`) },
      { text: 'Waze', onPress: () => void Linking.openURL(`https://waze.com/ul?q=${encodedAddress}&navigate=yes`) },
      { style: 'cancel', text: 'Cancel' },
    ]);
  }

  async function handleProofPhoto() {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera permission needed', 'Proof photo is required before completing this delivery.');
        return;
      }
    }

    setIsCameraOpen(true);
  }

  function handleCaptureMockProof() {
    setProofPhotoUri('proof-photo-added');
    setIsCameraOpen(false);
  }

  function handleNextAction() {
    if (status === 'ready_for_pickup') {
      setStatus('picked_up');
      return;
    }

    if (status === 'picked_up') {
      setStatus('on_the_way');
      return;
    }

    if (status === 'on_the_way') {
      setStatus('arrived');
      return;
    }

    if (status === 'arrived' && proofPhotoUri) {
      setStatus('completed');
      setCompletionTime(formatCompletionTime());
      return;
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + 124,
            paddingTop: insets.top + theme.spacing.lg,
          },
        ]}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Go back" accessibilityRole="button" style={({ pressed }) => [styles.backButton, pressed && styles.pressed]} onPress={() => router.back()}>
            <Feather color={theme.colors.text} name="chevron-left" size={24} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.orderTitle}>Order #{task.orderNumber}</Text>
            <Text style={styles.orderSubtitle}>Delivery task workspace</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{statusLabel}</Text>
          </View>
        </View>

        {isCompleted ? (
          <View style={styles.completedPanel}>
            <Feather color={theme.colors.primary} name="check-circle" size={30} />
            <View style={styles.completedCopy}>
              <Text style={styles.completedTitle}>Delivery Completed</Text>
              <Text style={styles.completedText}>{completionTime ? `Completed at ${completionTime}` : 'Completion time recorded'}</Text>
            </View>
          </View>
        ) : null}

        <SectionCard title="Delivery Progress">
          <View style={styles.timeline}>
            {progressSteps.map((step, index) => {
              const currentIndex = getProgressIndex(status);
              const isDone = index <= currentIndex;
              const isCurrent = index === currentIndex;

              return (
                <View key={step.label} style={styles.timelineRow}>
                  <View style={styles.timelineMarkColumn}>
                    <View style={[styles.timelineDot, isDone && styles.timelineDotDone]}>
                      {isDone ? <Feather color={theme.colors.white} name="check" size={12} /> : null}
                    </View>
                    {index < progressSteps.length - 1 ? <View style={[styles.timelineLine, isDone && styles.timelineLineDone]} /> : null}
                  </View>
                  <Text style={[styles.timelineLabel, isCurrent && styles.timelineLabelCurrent]}>{step.label}</Text>
                </View>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard title="Item Information">
          <View style={styles.itemRow}>
            <View style={styles.productImage}>
              <Feather color={theme.colors.primary} name="gift" size={38} />
            </View>
            <View style={styles.itemCopy}>
              <Text style={styles.itemName}>{task.item.name}</Text>
              <Text style={styles.itemMeta}>Quantity: {task.item.quantity}</Text>
            </View>
          </View>
          <View style={styles.handlingList}>
            <Text style={styles.cardLabel}>Special handling</Text>
            {task.item.handling.map((instruction) => (
              <View key={instruction} style={styles.handlingRow}>
                <Feather color={theme.colors.primary} name="alert-circle" size={15} />
                <Text style={styles.handlingText}>{instruction}</Text>
              </View>
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Recipient Information">
          <InfoAction icon="user" label="Recipient Name" value={task.recipientName} />
          <InfoAction icon="phone" label="Phone Number" value={task.phoneNumber} onPress={handleCallRecipient} />
          <InfoAction icon="map-pin" label="Address" value={task.address} onPress={handleOpenMaps} />
        </SectionCard>

        <SectionCard title="Delivery Notes">
          <Text style={styles.notesText}>{task.customerNotes}</Text>
        </SectionCard>

        {proofPhotoUri ? (
          <SectionCard title="Proof Photo">
            <View style={styles.proofPreview}>
              <Feather color={theme.colors.primary} name="camera" size={28} />
              <Text style={styles.proofText}>Proof photo added</Text>
            </View>
          </SectionCard>
        ) : null}
      </ScrollView>

      <View style={[styles.actionFooter, { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) + theme.spacing.sm }]}>
        {renderFooterAction({ handleNextAction, handleProofPhoto, isCompleted, proofPhotoUri, status })}
      </View>

      <Modal animationType="slide" visible={isCameraOpen} onRequestClose={() => setIsCameraOpen(false)}>
        <View style={styles.cameraScreen}>
          <CameraView style={styles.cameraPreview} facing="back" />
          <View style={styles.cameraFooter}>
            <Pressable accessibilityRole="button" style={styles.cameraCancelButton} onPress={() => setIsCameraOpen(false)}>
              <Text style={styles.cameraCancelText}>Cancel</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={styles.cameraCaptureButton} onPress={handleCaptureMockProof}>
              <Feather color={theme.colors.white} name="camera" size={22} />
              <Text style={styles.cameraCaptureText}>Use Proof Photo</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function renderFooterAction({
  handleNextAction,
  handleProofPhoto,
  isCompleted,
  proofPhotoUri,
  status,
}: {
  handleNextAction: () => void;
  handleProofPhoto: () => void;
  isCompleted: boolean;
  proofPhotoUri: string | null;
  status: DeliveryTaskStatus;
}) {
  if (isCompleted) {
    return (
      <View style={styles.completedFooter}>
        <Feather color={theme.colors.primary} name="check-circle" size={20} />
        <Text style={styles.completedFooterText}>Delivery Completed</Text>
      </View>
    );
  }

  if (status === 'arrived' && !proofPhotoUri) {
    return (
      <Pressable accessibilityRole="button" style={({ pressed }) => [styles.proofButton, pressed && styles.pressed]} onPress={handleProofPhoto}>
        <Feather color={theme.colors.white} name="camera" size={22} />
        <Text style={styles.proofButtonText}>Take Proof Photo</Text>
      </Pressable>
    );
  }

  const label =
    status === 'ready_for_pickup'
      ? 'Slide to Confirm Pickup'
      : status === 'picked_up'
        ? 'Slide to Start Delivery'
        : status === 'on_the_way'
          ? 'Slide to Mark Arrived'
          : 'Slide to Complete Delivery';

  return <SlideAction label={label} onPress={handleNextAction} />;
}

function SlideAction({ label, onPress }: { label: string; onPress: () => void }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const hasCompletedSwipe = useRef(false);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 8,
        onPanResponderMove: (_, gesture) => {
          translateX.setValue(Math.max(0, Math.min(gesture.dx, 188)));
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > 142 && !hasCompletedSwipe.current) {
            hasCompletedSwipe.current = true;
            Animated.timing(translateX, {
              duration: 140,
              toValue: 188,
              useNativeDriver: true,
            }).start(() => {
              onPress();
              translateX.setValue(0);
              hasCompletedSwipe.current = false;
            });
            return;
          }

          Animated.spring(translateX, {
            friction: 7,
            tension: 80,
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [onPress, translateX],
  );

  return (
    <View accessibilityRole="button" style={styles.slideAction}>
      <Animated.View style={[styles.slideThumb, { transform: [{ translateX }] }]} {...panResponder.panHandlers}>
        <Feather color={theme.colors.primary} name="chevrons-right" size={22} />
      </Animated.View>
      <Text style={styles.slideText}>{label}</Text>
    </View>
  );
}

function SectionCard({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoAction({ icon, label, onPress, value }: { icon: React.ComponentProps<typeof Feather>['name']; label: string; onPress?: () => void; value: string }) {
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} disabled={!onPress} style={({ pressed }) => [styles.infoRow, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.infoIcon}>
        <Feather color={theme.colors.primary} name={icon} size={20} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
      {onPress ? <Feather color={theme.colors.textMuted} name="external-link" size={17} /> : null}
    </Pressable>
  );
}

function getProgressIndex(status: DeliveryTaskStatus) {
  if (status === 'completed') {
    return 3;
  }

  if (status === 'arrived' || status === 'on_the_way') {
    return 2;
  }

  if (status === 'picked_up') {
    return 1;
  }

  return 0;
}

function formatCompletionTime() {
  return new Intl.DateTimeFormat('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date());
}

const styles = StyleSheet.create({
  actionFooter: {
    backgroundColor: theme.colors.white,
    borderTopColor: 'rgba(31, 42, 36, 0.08)',
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    position: 'absolute',
    right: 0,
  },
  backButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 34,
  },
  cameraCancelButton: {
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  cameraCancelText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
  },
  cameraCaptureButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 52,
  },
  cameraCaptureText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 15,
  },
  cameraFooter: {
    backgroundColor: '#111111',
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  cameraPreview: {
    flex: 1,
  },
  cameraScreen: {
    backgroundColor: '#111111',
    flex: 1,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  cardLabel: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 13,
    lineHeight: 17,
  },
  cardTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 17,
    lineHeight: 22,
  },
  completedCopy: {
    flex: 1,
    gap: 2,
  },
  completedFooter: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: 18,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 58,
  },
  completedFooterText: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 15,
  },
  completedPanel: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: 20,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  completedText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  completedTitle: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 17,
    lineHeight: 22,
  },
  content: {
    backgroundColor: theme.colors.white,
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  fieldDivider: {
    backgroundColor: 'rgba(31, 42, 36, 0.08)',
    height: 1,
  },
  handlingList: {
    gap: theme.spacing.sm,
  },
  handlingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  handlingText: {
    color: theme.colors.textMuted,
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  infoCopy: {
    flex: 1,
    gap: 2,
  },
  infoIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  infoLabel: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 58,
  },
  infoValue: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
  },
  itemCopy: {
    flex: 1,
    gap: 4,
  },
  itemMeta: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  itemName: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 19,
    lineHeight: 24,
  },
  itemRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  notesText: {
    color: theme.colors.text,
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  orderSubtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  orderTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 22,
    lineHeight: 27,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }],
  },
  productImage: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: 18,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  proofButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 58,
  },
  proofButtonText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 15,
    lineHeight: 20,
  },
  proofPreview: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: 16,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 64,
    paddingHorizontal: theme.spacing.md,
  },
  proofText: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 14,
  },
  screen: {
    backgroundColor: theme.colors.white,
    flex: 1,
  },
  slideAction: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 58,
    paddingHorizontal: theme.spacing.sm,
  },
  slideText: {
    color: theme.colors.white,
    flex: 1,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  slideThumb: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 14,
    height: 46,
    justifyContent: 'center',
    width: 58,
  },
  statusBadge: {
    backgroundColor: theme.colors.greenSoft,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusBadgeText: {
    color: theme.colors.primaryDark,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 11,
    lineHeight: 14,
  },
  timeline: {
    gap: 0,
  },
  timelineDot: {
    alignItems: 'center',
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  timelineDotDone: {
    backgroundColor: theme.colors.primary,
  },
  timelineLabel: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    lineHeight: 22,
    paddingBottom: theme.spacing.md,
    paddingTop: 1,
  },
  timelineLabelCurrent: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
  },
  timelineLine: {
    backgroundColor: theme.colors.border,
    flex: 1,
    minHeight: 24,
    width: 2,
  },
  timelineLineDone: {
    backgroundColor: theme.colors.primary,
  },
  timelineMarkColumn: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  timelineRow: {
    flexDirection: 'row',
  },
});
