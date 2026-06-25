import Feather from '@expo/vector-icons/Feather';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, theme } from '@/constants/theme';
import {
  getDeliveryById,
  submitDeliveryProof,
  updateDeliveryStatus,
  type RiderDelivery,
  type RiderDeliveryStatus,
} from '@/services/deliveries-api';
import { getRiderStatusLabel } from '@/utils/delivery-format';

const progressSteps: { label: string; status: RiderDeliveryStatus }[] = [
  { label: 'Assigned', status: 'assigned' },
  { label: 'Picked Up', status: 'picked_up' },
  { label: 'Out for Delivery', status: 'out_for_delivery' },
  { label: 'Arrived', status: 'arrived' },
  { label: 'Delivered', status: 'delivered' },
];

const issuePresets = [
  'Recipient unavailable',
  'Wrong or incomplete address',
  'Delivery delayed',
  'Item concern',
  'Other issue',
];

export default function DeliveryDetailsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const deliveryId = params.id ?? '';
  const [delivery, setDelivery] = useState<RiderDelivery | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [issueNote, setIssueNote] = useState(issuePresets[0]);
  const [proofNote, setProofNote] = useState('Received by recipient');
  const [permission, requestPermission] = useCameraPermissions();

  const status = delivery?.status ?? 'assigned';
  const isCompleted = status === 'delivered';
  const needsProof = status === 'arrived' && !delivery?.proofPhotoUrl;
  const nextAction = useMemo(() => getNextAction(status, Boolean(delivery?.proofPhotoUrl)), [delivery?.proofPhotoUrl, status]);

  useEffect(() => {
    let isMounted = true;

    if (!deliveryId) {
      setError('Delivery ID is missing.');
      setIsLoading(false);
      return;
    }

    getDeliveryById(deliveryId)
      .then((nextDelivery) => {
        if (isMounted) {
          setDelivery(nextDelivery);
          setError(null);
        }
      })
      .catch((nextError) => {
        if (isMounted) {
          setError(nextError instanceof Error ? nextError.message : 'Unable to load this delivery.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [deliveryId]);

  async function handleCallRecipient() {
    if (!delivery?.recipientPhone) {
      Alert.alert('No phone number', 'This delivery has no recipient phone number.');
      return;
    }

    await Linking.openURL(`tel:${delivery.recipientPhone}`);
  }

  async function handleOpenMaps() {
    if (!delivery?.address) {
      Alert.alert('No address', 'This delivery has no address.');
      return;
    }

    const encodedAddress = encodeURIComponent(delivery.address);
    Alert.alert('Open map', delivery.address, [
      { text: 'Google Maps', onPress: () => void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`) },
      { text: 'Waze', onPress: () => void Linking.openURL(`https://waze.com/ul?q=${encodedAddress}&navigate=yes`) },
      { style: 'cancel', text: 'Cancel' },
    ]);
  }

  async function handlePrimaryAction() {
    if (!delivery || !nextAction) {
      return;
    }

    if (needsProof) {
      await handleProofPhoto();
      return;
    }

    setIsUpdating(true);
    try {
      const nextDelivery = await updateDeliveryStatus(delivery.id, nextAction.status);
      setDelivery(nextDelivery);
    } catch (nextError) {
      Alert.alert('Update failed', nextError instanceof Error ? nextError.message : 'Try again.');
    } finally {
      setIsUpdating(false);
    }
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

  async function handleUseProofPhoto() {
    if (!delivery) {
      return;
    }

    setIsUpdating(true);
    try {
      const proofPhotoUrl = `rider-proof://${delivery.id}/${Date.now()}`;
      const nextDelivery = await submitDeliveryProof({
        deliveryId: delivery.id,
        proofNote,
        proofPhotoUrl,
      });
      setDelivery(nextDelivery);
      setIsCameraOpen(false);
    } catch (nextError) {
      Alert.alert('Proof failed', nextError instanceof Error ? nextError.message : 'Try again.');
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleReportIssue() {
    if (!delivery || !issueNote.trim()) {
      return;
    }

    setIsUpdating(true);
    try {
      const nextDelivery = await updateDeliveryStatus(delivery.id, 'issue_reported', issueNote.trim());
      setDelivery(nextDelivery);
      setIsIssueOpen(false);
    } catch (nextError) {
      Alert.alert('Issue report failed', nextError instanceof Error ? nextError.message : 'Try again.');
    } finally {
      setIsUpdating(false);
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
            <Text style={styles.orderTitle}>{delivery?.orderNumber ?? 'Delivery'}</Text>
            <Text style={styles.orderSubtitle}>Delivery task workspace</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{getRiderStatusLabel(status)}</Text>
          </View>
        </View>

        {isLoading ? <StateCard message="Loading delivery details..." /> : null}
        {error ? <StateCard message={error} /> : null}

        {delivery ? (
          <>
            {isCompleted ? (
              <View style={styles.completedPanel}>
                <Feather color={theme.colors.primary} name="check-circle" size={30} />
                <View style={styles.completedCopy}>
                  <Text style={styles.completedTitle}>Delivery Completed</Text>
                  <Text style={styles.completedText}>{delivery.deliveredAt ? `Completed at ${formatDisplayTime(delivery.deliveredAt)}` : 'Completion time recorded'}</Text>
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

            <SectionCard title="Recipient">
              <InfoAction icon="user" label="Recipient Name" value={delivery.recipientName} />
              <InfoAction icon="phone" label="Phone Number" value={delivery.recipientPhone || 'No phone number'} onPress={handleCallRecipient} />
              <InfoAction icon="map-pin" label="Address" value={delivery.address || 'No address'} onPress={handleOpenMaps} />
            </SectionCard>

            <SectionCard title="Order Items">
              <View style={styles.itemRow}>
                <View style={styles.productImage}>
                  <Feather color={theme.colors.primary} name="gift" size={38} />
                </View>
                <View style={styles.itemCopy}>
                  <Text style={styles.itemName}>{delivery.itemSummary}</Text>
                  <Text style={styles.itemMeta}>{delivery.branch ? `${delivery.branch} branch` : 'Assigned branch'}</Text>
                </View>
              </View>
              {delivery.handlingNotes.length > 0 ? (
                <View style={styles.handlingList}>
                  <Text style={styles.cardLabel}>Handling notes</Text>
                  {delivery.handlingNotes.map((instruction) => (
                    <View key={instruction} style={styles.handlingRow}>
                      <Feather color={theme.colors.primary} name="alert-circle" size={15} />
                      <Text style={styles.handlingText}>{instruction}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </SectionCard>

            <SectionCard title="Delivery Notes">
              <Text style={styles.notesText}>{delivery.deliveryNotes || delivery.customerNotes || 'No special notes for this delivery.'}</Text>
            </SectionCard>

            {delivery.proofPhotoUrl ? (
              <SectionCard title="Proof Photo">
                <View style={styles.proofPreview}>
                  <Feather color={theme.colors.primary} name="camera" size={28} />
                  <View style={styles.proofCopy}>
                    <Text style={styles.proofText}>Proof photo added</Text>
                    {delivery.proofNote ? <Text style={styles.proofNote}>{delivery.proofNote}</Text> : null}
                  </View>
                </View>
              </SectionCard>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.actionFooter, { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) + theme.spacing.sm }]}>
        <View style={styles.footerActions}>
          <Pressable
            accessibilityRole="button"
            disabled={!delivery || isCompleted || isUpdating}
            style={({ pressed }) => [styles.issueButton, (!delivery || isCompleted) && styles.disabledButton, pressed && styles.pressed]}
            onPress={() => setIsIssueOpen(true)}>
            <Feather color={theme.colors.text} name="alert-circle" size={19} />
            <Text style={styles.issueButtonText}>Report Issue</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={!delivery || isCompleted || isUpdating}
            style={({ pressed }) => [styles.primaryButton, (!delivery || isCompleted) && styles.disabledPrimary, pressed && styles.pressed]}
            onPress={handlePrimaryAction}>
            <Text style={styles.primaryButtonText}>{isCompleted ? 'Delivery Completed' : isUpdating ? 'Updating...' : nextAction?.label ?? 'No Action'}</Text>
          </Pressable>
        </View>
      </View>

      <Modal animationType="slide" visible={isCameraOpen} onRequestClose={() => setIsCameraOpen(false)}>
        <View style={styles.cameraScreen}>
          <CameraView style={styles.cameraPreview} facing="back" />
          <View style={styles.proofForm}>
            <Text style={styles.proofFormLabel}>Proof note</Text>
            <TextInput
              multiline
              placeholder="Add a short handoff note"
              placeholderTextColor="#A3A3A3"
              style={styles.proofInput}
              value={proofNote}
              onChangeText={setProofNote}
            />
          </View>
          <View style={styles.cameraFooter}>
            <Pressable accessibilityRole="button" style={styles.cameraCancelButton} onPress={() => setIsCameraOpen(false)}>
              <Text style={styles.cameraCancelText}>Cancel</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={isUpdating} style={styles.cameraCaptureButton} onPress={handleUseProofPhoto}>
              <Feather color={theme.colors.white} name="camera" size={22} />
              <Text style={styles.cameraCaptureText}>{isUpdating ? 'Saving...' : 'Use Proof Photo'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={isIssueOpen} onRequestClose={() => setIsIssueOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.issueModal}>
            <Text style={styles.issueTitle}>Report Issue</Text>
            <Text style={styles.issueText}>Choose the closest reason so dispatch can help quickly.</Text>
            <View style={styles.issueOptions}>
              {issuePresets.map((preset) => (
                <Pressable
                  key={preset}
                  accessibilityRole="button"
                  style={[styles.issueOption, issueNote === preset && styles.issueOptionActive]}
                  onPress={() => setIssueNote(preset)}>
                  <Text style={[styles.issueOptionText, issueNote === preset && styles.issueOptionTextActive]}>{preset}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              multiline
              placeholder="Add details if needed"
              placeholderTextColor="#A3A3A3"
              style={styles.issueInput}
              value={issueNote}
              onChangeText={setIssueNote}
            />
            <View style={styles.issueFooter}>
              <Pressable accessibilityRole="button" style={styles.issueCancelButton} onPress={() => setIsIssueOpen(false)}>
                <Text style={styles.issueCancelText}>Cancel</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={isUpdating || !issueNote.trim()} style={styles.issueSubmitButton} onPress={handleReportIssue}>
                <Text style={styles.issueSubmitText}>{isUpdating ? 'Sending...' : 'Send Issue'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StateCard({ message }: { message: string }) {
  return (
    <View style={styles.stateCard}>
      <Text selectable style={styles.stateText}>{message}</Text>
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
        <Text selectable style={styles.infoValue}>{value}</Text>
      </View>
      {onPress ? <Feather color={theme.colors.textMuted} name="external-link" size={17} /> : null}
    </Pressable>
  );
}

function getProgressIndex(status: RiderDeliveryStatus) {
  if (status === 'delivered') {
    return 4;
  }

  if (status === 'arrived' || status === 'issue_reported' || status === 'failed') {
    return 3;
  }

  if (status === 'out_for_delivery') {
    return 2;
  }

  if (status === 'picked_up') {
    return 1;
  }

  return 0;
}

function getNextAction(status: RiderDeliveryStatus, hasProof: boolean) {
  if (status === 'assigned') {
    return { label: 'Confirm Pickup', status: 'picked_up' as const };
  }

  if (status === 'picked_up') {
    return { label: 'Mark Out for Delivery', status: 'out_for_delivery' as const };
  }

  if (status === 'out_for_delivery') {
    return { label: 'Mark Arrived', status: 'arrived' as const };
  }

  if (status === 'arrived' && !hasProof) {
    return { label: 'Take Proof Photo', status: 'arrived' as const };
  }

  if (status === 'arrived' && hasProof) {
    return { label: 'Complete Delivery', status: 'delivered' as const };
  }

  return null;
}

function formatDisplayTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
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
  disabledButton: {
    opacity: 0.46,
  },
  disabledPrimary: {
    backgroundColor: '#BBDDC0',
  },
  footerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
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
  issueButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 18,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: theme.spacing.md,
  },
  issueButtonText: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 13,
  },
  issueCancelButton: {
    alignItems: 'center',
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
  },
  issueCancelText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
  },
  issueFooter: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  issueInput: {
    borderColor: theme.colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: theme.colors.text,
    fontFamily: Fonts.sans,
    fontSize: 14,
    minHeight: 78,
    padding: theme.spacing.md,
    textAlignVertical: 'top',
  },
  issueModal: {
    backgroundColor: theme.colors.white,
    borderRadius: 22,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  issueOption: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  issueOptionActive: {
    backgroundColor: theme.colors.greenSoft,
  },
  issueOptionText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
  },
  issueOptionTextActive: {
    color: theme.colors.primaryDark,
  },
  issueOptions: {
    gap: theme.spacing.sm,
  },
  issueSubmitButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
  },
  issueSubmitText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 14,
  },
  issueText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 19,
  },
  issueTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 20,
    lineHeight: 25,
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
  modalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    flex: 1,
    justifyContent: 'flex-end',
    padding: theme.spacing.lg,
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
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    flex: 1,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: theme.spacing.md,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  productImage: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: 18,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  proofCopy: {
    flex: 1,
    gap: 2,
  },
  proofForm: {
    backgroundColor: '#111111',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  proofFormLabel: {
    color: theme.colors.white,
    fontFamily: Fonts.sansExtraBold,
    fontSize: 14,
  },
  proofInput: {
    backgroundColor: theme.colors.white,
    borderRadius: 14,
    color: theme.colors.text,
    fontFamily: Fonts.sans,
    minHeight: 64,
    padding: theme.spacing.md,
    textAlignVertical: 'top',
  },
  proofNote: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
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
  stateCard: {
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    padding: theme.spacing.lg,
  },
  stateText: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 20,
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
