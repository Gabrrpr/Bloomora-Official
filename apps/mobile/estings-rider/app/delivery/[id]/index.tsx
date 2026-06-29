import Feather from '@expo/vector-icons/Feather';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DeliveryStopCard, StatusTag } from '@/components/rider/delivery-stop-card';
import { RouteStrip } from '@/components/rider/route-strip';
import { SwipeToConfirm } from '@/components/rider/swipe-to-confirm';
import { Fonts, theme } from '@/constants/theme';
import { authenticateWithScreenLock } from '@/services/biometrics';
import {
  getDeliveryById,
  submitDeliveryProof,
  updateDeliveryStatus,
  type RiderDelivery,
  type RiderDeliveryStatus,
} from '@/services/deliveries-api';
import { addCompletedDeliveryNotification } from '@/services/rider-notifications';

const issuePresets = [
  'Recipient unavailable',
  'Wrong or incomplete address',
  'Delivery delayed',
  'Item concern',
  'Other issue',
];

const progressSteps: { label: string; status: RiderDeliveryStatus }[] = [
  { label: 'Assigned', status: 'assigned' },
  { label: 'Picked Up', status: 'picked_up' },
  { label: 'Out for Delivery', status: 'out_for_delivery' },
  { label: 'Arrived', status: 'arrived' },
  { label: 'Completed', status: 'delivered' },
];

type CameraStage = 'preview' | 'review';

export default function DeliveryDetailsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    dispatchId?: string;
    id?: string;
    stopIndex?: string;
    stopTotal?: string;
  }>();

  const deliveryId = params.id ?? '';
  const dispatchId = params.dispatchId;
  const stopIndex = params.stopIndex ? parseInt(params.stopIndex, 10) : null;
  const stopTotal = params.stopTotal ? parseInt(params.stopTotal, 10) : null;
  const hasStopContext = stopIndex !== null && stopTotal !== null;

  const [delivery, setDelivery] = useState<RiderDelivery | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStage, setCameraStage] = useState<CameraStage>('preview');
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [issueNote, setIssueNote] = useState(issuePresets[0]);
  const [proofNote, setProofNote] = useState('Received by recipient');
  const [permission, requestPermission] = useCameraPermissions();
  const [swipeKey, setSwipeKey] = useState(0);
  const cameraRef = useRef<CameraView>(null);

  const status = delivery?.status ?? 'assigned';
  const isCompleted = status === 'delivered';
  const needsProof = status === 'arrived' && !delivery?.proofPhotoUrl;
  const hasProof = Boolean(delivery?.proofPhotoUrl);
  const nextAction = useMemo(() => getNextAction(status, hasProof), [hasProof, status]);
  const showSwipeArrived = status === 'out_for_delivery' && !isUpdating;
  const showPrimaryButton = !showSwipeArrived && !isCompleted;

  const loadDelivery = useCallback(async () => {
    if (!deliveryId) {
      setError('Delivery ID is missing.');
      setIsLoading(false);
      return;
    }

    try {
      const nextDelivery = await getDeliveryById(deliveryId);
      setDelivery(nextDelivery);
      setError(null);
    } catch (nextError) {
      setDelivery(null);
      setError(nextError instanceof Error ? nextError.message : 'Unable to load this delivery.');
    } finally {
      setIsLoading(false);
    }
  }, [deliveryId]);

  useEffect(() => {
    void loadDelivery();
  }, [loadDelivery]);

  async function handleCallRecipient() {
    if (!delivery?.recipientPhone) {
      Alert.alert('No phone number', 'This delivery has no recipient phone number.');
      return;
    }
    await Linking.openURL(`tel:${delivery.recipientPhone}`);
  }

  async function handleTextRecipient() {
    if (!delivery?.recipientPhone) {
      Alert.alert('No phone number', 'This delivery has no recipient phone number.');
      return;
    }
    await Linking.openURL(`sms:${delivery.recipientPhone}`);
  }

  function handleOpenGoogleMaps() {
    if (!delivery?.address) {
      Alert.alert('No address', 'This delivery has no address.');
      return;
    }
    const encodedAddress = encodeURIComponent(delivery.address);
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
  }

  function handleOpenWaze() {
    if (!delivery?.address) {
      Alert.alert('No address', 'This delivery has no address.');
      return;
    }
    const encodedAddress = encodeURIComponent(delivery.address);
    void Linking.openURL(`https://waze.com/ul?q=${encodedAddress}&navigate=yes`);
  }

  async function handleOpenContacts() {
    if (!delivery?.recipientPhone) {
      Alert.alert('No phone number', 'This delivery has no recipient phone number.');
      return;
    }

    const opened = await Linking.canOpenURL('contacts://')
      .then((canOpen) => {
        if (!canOpen) return false;
        return Linking.openURL('contacts://').then(() => true);
      })
      .catch(() => false);

    if (!opened) {
      await Linking.openURL(`tel:${delivery.recipientPhone}`);
    }
  }

  async function handleSwipeArrived() {
    if (!delivery || isUpdating) return;
    setIsUpdating(true);
    try {
      const next = await updateDeliveryStatus(delivery.id, 'arrived');
      setDelivery(next);
      setSwipeKey((key) => key + 1);
    } catch (nextError) {
      Alert.alert('Update failed', nextError instanceof Error ? nextError.message : 'Try again.');
    } finally {
      setIsUpdating(false);
    }
  }

  async function handlePrimaryAction() {
    if (!delivery || !nextAction) return;

    if (needsProof) {
      await handleOpenCamera();
      return;
    }

    if (status === 'arrived' && hasProof) {
      await handleCompleteDelivery();
      return;
    }

    setIsUpdating(true);
    try {
      const next = await updateDeliveryStatus(delivery.id, nextAction.status);
      setDelivery(next);
      setSwipeKey((key) => key + 1);
    } catch (nextError) {
      Alert.alert('Update failed', nextError instanceof Error ? nextError.message : 'Try again.');
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleCompleteDelivery() {
    if (!delivery) return;

    const auth = await authenticateWithScreenLock(`Confirm delivery complete for ${delivery.recipientName}`);
    if (!auth.success) {
      if (auth.error) {
        Alert.alert('Authentication required', auth.error);
      }
      return;
    }

    setIsUpdating(true);
    try {
      const next = await updateDeliveryStatus(delivery.id, 'delivered');
      setDelivery(next);
      await addCompletedDeliveryNotification({
        deliveryId: delivery.id,
        orderNumber: delivery.orderNumber,
        recipientName: delivery.recipientName,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (hasStopContext && stopIndex !== null && stopTotal !== null) {
        const nextStopIndex = stopIndex + 1;
        if (nextStopIndex < stopTotal) {
          Alert.alert('Delivered', `${delivery.orderNumber} complete. Continue to stop ${nextStopIndex + 1} of ${stopTotal}.`, [
            { text: 'Continue', onPress: () => router.back() },
          ]);
        } else {
          router.replace('/(tabs)' as never);
        }
      }
    } catch (nextError) {
      Alert.alert('Could not confirm delivery', nextError instanceof Error ? nextError.message : 'Try again.');
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleOpenCamera() {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera permission needed', 'Proof photo is required before completing this delivery.');
        return;
      }
    }

    setCameraStage('preview');
    setCapturedPhotoUri(null);
    setIsCameraOpen(true);
  }

  function handleCloseCamera() {
    setIsCameraOpen(false);
    setCameraStage('preview');
    setCapturedPhotoUri(null);
  }

  function handleDiscardCapturedPhoto() {
    setCapturedPhotoUri(null);
    setCameraStage('preview');
  }

  function returnToDeliveryDetails(nextDelivery: RiderDelivery) {
    handleCloseCamera();

    const nextParams: { id: string; dispatchId?: string; stopIndex?: string; stopTotal?: string } = { id: nextDelivery.id };
    if (dispatchId) nextParams.dispatchId = dispatchId;
    if (stopIndex !== null) nextParams.stopIndex = String(stopIndex);
    if (stopTotal !== null) nextParams.stopTotal = String(stopTotal);

    router.replace({ pathname: '/delivery/[id]', params: nextParams });
  }

  async function handleCapture() {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: false, quality: 0.75 });
      if (photo?.uri) {
        setCapturedPhotoUri(photo.uri);
        setCameraStage('review');
      }
    } catch {
      Alert.alert('Capture failed', 'Please try again.');
    }
  }

  async function handleSubmitProof() {
    if (!delivery) return;
    if (!capturedPhotoUri) {
      Alert.alert('Proof photo required', 'Take a proof photo before saving.');
      return;
    }
    setIsUpdating(true);
    try {
      const next = await submitDeliveryProof({
        deliveryId: delivery.id,
        photoUri: capturedPhotoUri,
        proofNote,
      });
      setDelivery(next);
      returnToDeliveryDetails(next);
    } catch (nextError) {
      Alert.alert('Proof failed', nextError instanceof Error ? nextError.message : 'Try again.');
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleReportIssue() {
    if (!delivery || !issueNote.trim()) return;
    setIsUpdating(true);
    try {
      const next = await updateDeliveryStatus(delivery.id, 'issue_reported', issueNote.trim());
      setDelivery(next);
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
            paddingBottom: insets.bottom + 136,
            paddingTop: insets.top + theme.spacing.lg,
          },
        ]}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Go back" accessibilityRole="button" style={({ pressed }) => [styles.backButton, pressed && styles.pressed]} onPress={() => router.back()}>
            <Feather color={theme.colors.text} name="chevron-left" size={24} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text selectable numberOfLines={1} style={styles.headerTitle}>
              {delivery ? `Order ID #${delivery.orderNumber}` : 'Order Details'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {hasStopContext && stopIndex !== null && stopTotal !== null ? `Stop ${stopIndex + 1} of ${stopTotal}` : 'Delivery task'}
            </Text>
          </View>
          <StatusTag status={status} />
        </View>

        {isLoading ? <StateCard icon="loader" message="Loading delivery details..." /> : null}
        {error ? <StateCard icon="alert-circle" message={error} tone="danger" /> : null}

        {delivery ? (
          <>
            <DeliveryStopCard
              delivery={delivery}
              variant="featuredDark"
              onCall={handleCallRecipient}
              onMessage={handleTextRecipient}
              onPress={handleOpenGoogleMaps}
            />

            {isCompleted ? (
              <View style={styles.completedPanel}>
                <Feather color={theme.colors.primary} name="check-circle" size={28} />
                <View style={styles.completedCopy}>
                  <Text style={styles.completedTitle}>Delivery completed</Text>
                  <Text style={styles.completedText}>
                    {delivery.deliveredAt ? `Completed at ${formatDisplayTime(delivery.deliveredAt)}` : 'Completion has been recorded.'}
                  </Text>
                </View>
              </View>
            ) : null}

            <RouteStrip address={delivery.address} estimatedArrival={delivery.estimatedArrival} recipientName={delivery.recipientName} />

            <SectionCard title="Progress">
              <View style={styles.progressRow}>
                {progressSteps.map((step, index) => {
                  const progressIndex = getProgressIndex(status);
                  const done = index <= progressIndex;
                  const current = index === progressIndex;
                  return (
                    <View key={step.status} style={styles.progressStep}>
                      <View style={[styles.progressDot, done && styles.progressDotDone]}>
                        {done ? <Feather color={theme.colors.white} name="check" size={12} /> : null}
                      </View>
                      <Text numberOfLines={2} style={[styles.progressLabel, current && styles.progressLabelCurrent]}>
                        {step.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${getProgressPercent(status)}%` }]} />
              </View>
            </SectionCard>

            <SectionCard title="Timeline">
              <View style={styles.timelineList}>
                {getTimelineItems(delivery).map((item) => (
                  <View key={item.key} style={styles.timelineRow}>
                    <View style={[styles.timelineDot, item.done && styles.timelineDotDone]}>
                      {item.done ? <Feather color={theme.colors.white} name="check" size={11} /> : null}
                    </View>
                    <View style={styles.timelineCopy}>
                      <Text style={[styles.timelineLabel, item.done && styles.timelineLabelDone]}>{item.label}</Text>
                      <Text style={styles.timelineTime}>{item.time ? formatDisplayDateTime(item.time) : 'Pending'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </SectionCard>

            <SectionCard title="Recipient">
              <InfoRow icon="user" label="Name" value={delivery.recipientName} />
              <InfoRow icon="phone" label="Phone" value={delivery.recipientPhone || 'No phone number'} onPress={delivery.recipientPhone ? handleCallRecipient : undefined} />
              <InfoRow icon="map-pin" label="Address" value={delivery.address || 'No address'} onPress={delivery.address ? handleOpenGoogleMaps : undefined} />
              <View style={styles.systemActions}>
                <SystemAction icon="map-pin" label="Google Maps" onPress={handleOpenGoogleMaps} />
                <SystemAction icon="navigation" label="Waze" onPress={handleOpenWaze} />
                <SystemAction icon="user" label="Contacts" disabled={!delivery.recipientPhone} onPress={() => void handleOpenContacts()} />
                <SystemAction icon="phone" label="Phone" disabled={!delivery.recipientPhone} onPress={() => void handleCallRecipient()} />
              </View>
            </SectionCard>

            <SectionCard title="Order">
              <View style={styles.itemRow}>
                <View style={styles.productImageWrap}>
                  {delivery.imageUrl ? (
                    <Image contentFit="cover" source={{ uri: delivery.imageUrl }} style={styles.productImageAsset} />
                  ) : (
                    <Text style={styles.productPlaceholder}>product image</Text>
                  )}
                </View>
                <View style={styles.itemCopy}>
                  <Text style={styles.itemName}>{delivery.itemSummary}</Text>
                  <Text style={styles.itemMeta}>{delivery.branch ? `${delivery.branch} branch` : 'Assigned branch'}</Text>
                  {delivery.scheduledAt ? <Text style={styles.itemMeta}>Scheduled {formatDisplayDate(delivery.scheduledAt)}</Text> : null}
                </View>
              </View>

              {delivery.handlingNotes.length > 0 ? (
                <View style={styles.noteList}>
                  <Text style={styles.noteLabel}>Handling notes</Text>
                  {delivery.handlingNotes.map((note) => (
                    <View key={note} style={styles.noteRow}>
                      <Feather color={theme.colors.accent} name="alert-triangle" size={14} />
                      <Text style={styles.noteText}>{note}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </SectionCard>

            {delivery.deliveryNotes || delivery.customerNotes ? (
              <View style={styles.instructionsCard}>
                <View style={styles.instructionsHeader}>
                  <Feather color="#8A5A05" name="message-square" size={16} />
                  <Text style={styles.instructionsTitle}>Customer instructions</Text>
                </View>
                <Text style={styles.instructionsText}>{delivery.deliveryNotes || delivery.customerNotes}</Text>
              </View>
            ) : null}

            {delivery.proofPhotoUrl ? (
              <SectionCard title="Proof">
                <View style={styles.proofPreview}>
                  <Image contentFit="cover" source={{ uri: delivery.proofPhotoUrl }} style={styles.proofImage} />
                  <View style={styles.proofCopy}>
                    <Text style={styles.proofText}>Proof photo added</Text>
                    {delivery.proofNote ? <Text style={styles.proofNote}>{delivery.proofNote}</Text> : null}
                    {delivery.deliveredAt ? <Text style={styles.proofNote}>Completed {formatDisplayDateTime(delivery.deliveredAt)}</Text> : null}
                  </View>
                </View>
              </SectionCard>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.actionFooter, { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) + theme.spacing.sm }]}>
        {showSwipeArrived ? (
          <SwipeToConfirm
            key={swipeKey}
            disabled={!delivery || isUpdating}
            label="Slide to Mark Arrived"
            sublabel="Slide right when you reach the recipient"
            onConfirm={() => void handleSwipeArrived()}
          />
        ) : (
          <View style={styles.footerActions}>
            <Pressable
              accessibilityRole="button"
              disabled={!delivery || isCompleted || isUpdating}
              style={({ pressed }) => [styles.issueButton, (!delivery || isCompleted) && styles.disabledButton, pressed && styles.pressed]}
              onPress={() => setIsIssueOpen(true)}>
              <Feather color={theme.colors.text} name="alert-circle" size={18} />
              <Text style={styles.issueButtonText}>Report Issue</Text>
            </Pressable>

            {showPrimaryButton ? (
              <Pressable
                accessibilityRole="button"
                disabled={!delivery || isUpdating}
                style={({ pressed }) => [styles.primaryButton, (!delivery || isUpdating) && styles.disabledPrimary, pressed && styles.pressed]}
                onPress={() => void handlePrimaryAction()}>
                <Text style={styles.primaryButtonText}>{isUpdating ? 'Updating...' : nextAction?.label ?? 'No Action'}</Text>
              </Pressable>
            ) : null}

            {isCompleted ? (
              <View style={[styles.primaryButton, styles.disabledPrimary]}>
                <Text style={styles.primaryButtonText}>Delivery Completed</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>

      <Modal animationType="slide" visible={isCameraOpen} onRequestClose={handleCloseCamera}>
        <View style={styles.cameraScreen}>
          {cameraStage === 'preview' ? (
            <>
              <CameraView ref={cameraRef} facing="back" style={styles.cameraPreview}>
                <View pointerEvents="none" style={styles.cameraGrid}>
                  <View style={[styles.cameraGridLineVertical, { left: '33.333%' }]} />
                  <View style={[styles.cameraGridLineVertical, { left: '66.666%' }]} />
                  <View style={[styles.cameraGridLineHorizontal, { top: '33.333%' }]} />
                  <View style={[styles.cameraGridLineHorizontal, { top: '66.666%' }]} />
                  <View style={styles.cameraCenterMark} />
                </View>
                <View style={styles.cameraGuide}>
                  <View style={styles.cameraGuideFrame}>
                    <Text style={styles.cameraGuideText}>Include flowers and door or gate in frame</Text>
                  </View>
                </View>
                <View style={styles.cameraRecipientTag}>
                  <Text numberOfLines={1} style={styles.cameraRecipientText}>Proof for {delivery?.recipientName}</Text>
                </View>
              </CameraView>
              <View style={styles.cameraFooter}>
                <View style={styles.cameraFooterSide}>
                  <Pressable accessibilityRole="button" style={styles.cameraCancelButton} onPress={handleCloseCamera}>
                    <Text style={styles.cameraCancelText}>Cancel</Text>
                  </Pressable>
                </View>
                <View style={styles.cameraFooterCenter}>
                  <Pressable accessibilityRole="button" style={styles.cameraShutterButton} onPress={() => void handleCapture()}>
                    <View style={styles.cameraShutterInner} />
                  </Pressable>
                </View>
                <View style={styles.cameraFooterSide} />
              </View>
            </>
          ) : (
            <>
              <View style={styles.cameraReviewPreview}>
                {capturedPhotoUri ? <Image contentFit="cover" source={{ uri: capturedPhotoUri }} style={styles.cameraReviewImage} /> : null}
                <View style={styles.cameraReviewTopBar}>
                  <Pressable accessibilityRole="button" style={styles.cameraIconButton} onPress={handleDiscardCapturedPhoto}>
                    <Feather color={theme.colors.white} name="trash-2" size={20} />
                  </Pressable>
                  <View style={styles.cameraReviewTitlePill}>
                    <Text numberOfLines={1} style={styles.cameraReviewTitle}>Review proof photo</Text>
                  </View>
                  <Pressable accessibilityRole="button" style={styles.cameraIconButton} onPress={handleCloseCamera}>
                    <Feather color={theme.colors.white} name="x" size={21} />
                  </Pressable>
                </View>
              </View>
              <View style={styles.proofForm}>
                <Text style={styles.proofFormLabel}>Proof note</Text>
                <TextInput
                  multiline
                  placeholder="Add a short handoff note"
                  placeholderTextColor="#A3A3A3"
                  style={styles.proofInput}
                  textAlignVertical="top"
                  value={proofNote}
                  onChangeText={setProofNote}
                />
              </View>
              <View style={styles.cameraFooter}>
                <Pressable accessibilityRole="button" style={styles.cameraCancelButton} onPress={handleDiscardCapturedPhoto}>
                  <Text style={styles.cameraCancelText}>Retake</Text>
                </Pressable>
                <Pressable accessibilityRole="button" style={styles.cameraDeleteButton} onPress={handleDiscardCapturedPhoto}>
                  <Feather color={theme.colors.white} name="trash-2" size={18} />
                  <Text style={styles.cameraCancelText}>Delete</Text>
                </Pressable>
                <Pressable accessibilityRole="button" disabled={isUpdating} style={styles.cameraCaptureButton} onPress={() => void handleSubmitProof()}>
                  <Feather color={theme.colors.white} name="check" size={20} />
                  <Text style={styles.cameraCaptureText}>{isUpdating ? 'Saving...' : 'Use This Photo'}</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={isIssueOpen} onRequestClose={() => setIsIssueOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.issueModal}>
            <View style={styles.modalHandle} />
            <Text style={styles.issueTitle}>Report Issue</Text>
            <Text style={styles.issueText}>Choose the closest reason so dispatch can help quickly.</Text>
            <View style={styles.issueOptions}>
              {issuePresets.map((preset) => (
                <Pressable key={preset} accessibilityRole="button" style={[styles.issueOption, issueNote === preset && styles.issueOptionActive]} onPress={() => setIssueNote(preset)}>
                  <Text style={[styles.issueOptionText, issueNote === preset && styles.issueOptionTextActive]}>{preset}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              multiline
              placeholder="Add details if needed"
              placeholderTextColor="#A3A3A3"
              style={styles.issueInput}
              textAlignVertical="top"
              value={issueNote}
              onChangeText={setIssueNote}
            />
            <View style={styles.issueFooter}>
              <Pressable accessibilityRole="button" style={styles.issueCancelButton} onPress={() => setIsIssueOpen(false)}>
                <Text style={styles.issueCancelText}>Cancel</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={isUpdating || !issueNote.trim()} style={styles.issueSubmitButton} onPress={() => void handleReportIssue()}>
                <Text style={styles.issueSubmitText}>{isUpdating ? 'Sending...' : 'Send Issue'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SectionCard({ children, title }: { children: ReactNode; title: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function StateCard({ icon, message, tone = 'neutral' }: { icon: React.ComponentProps<typeof Feather>['name']; message: string; tone?: 'danger' | 'neutral' }) {
  return (
    <View style={styles.stateCard}>
      <Feather color={tone === 'danger' ? theme.colors.danger : theme.colors.primary} name={icon} size={22} />
      <Text selectable style={styles.stateText}>{message}</Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  onPress,
  value,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress?: () => void;
  value: string;
}) {
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} disabled={!onPress} style={({ pressed }) => [styles.infoRow, pressed && onPress && styles.pressed]} onPress={onPress}>
      <View style={styles.infoIcon}>
        <Feather color={theme.colors.primary} name={icon} size={19} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text selectable style={styles.infoValue}>{value}</Text>
      </View>
      {onPress ? <Feather color={theme.colors.textMuted} name="external-link" size={16} /> : null}
    </Pressable>
  );
}

function SystemAction({
  disabled,
  icon,
  label,
  onPress,
}: {
  disabled?: boolean;
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} style={({ pressed }) => [styles.systemAction, disabled && styles.disabledButton, pressed && !disabled && styles.pressed]} onPress={onPress}>
      <View style={styles.systemIcon}>
        <Feather color={theme.colors.primary} name={icon} size={20} />
      </View>
      <Text numberOfLines={1} style={styles.systemLabel}>{label}</Text>
    </Pressable>
  );
}

function getProgressIndex(status: RiderDeliveryStatus) {
  if (status === 'delivered') return 4;
  if (status === 'arrived' || status === 'issue_reported' || status === 'failed') return 3;
  if (status === 'out_for_delivery') return 2;
  if (status === 'picked_up') return 1;
  return 0;
}

function getProgressPercent(status: RiderDeliveryStatus) {
  return [12, 32, 55, 78, 100][getProgressIndex(status)] ?? 12;
}

function getNextAction(status: RiderDeliveryStatus, hasProof: boolean) {
  if (status === 'assigned') return { label: 'Confirm Pickup', status: 'picked_up' as const };
  if (status === 'picked_up') return { label: 'Mark Out for Delivery', status: 'out_for_delivery' as const };
  if (status === 'out_for_delivery') return null;
  if (status === 'arrived' && !hasProof) return { label: 'Take Proof Photo', status: 'arrived' as const };
  if (status === 'arrived' && hasProof) return { label: 'Confirm Delivery', status: 'delivered' as const };
  return null;
}

function getTimelineItems(delivery: RiderDelivery) {
  return [
    { key: 'assigned', label: 'Assigned', time: delivery.assignedAt ?? delivery.scheduledAt },
    { key: 'picked-up', label: 'Picked up', time: delivery.pickedUpAt },
    { key: 'out-for-delivery', label: 'Out for delivery', time: delivery.inTransitAt },
    { key: 'arrived', label: 'Arrived', time: delivery.arrivedAt },
    { key: 'completed', label: 'Completed', time: delivery.deliveredAt },
  ].map((item) => ({ ...item, done: Boolean(item.time) }));
}

function formatDisplayTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatDisplayDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-PH', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  }).format(date);
}

function formatDisplayDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-PH', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  }).format(date);
}

const styles = StyleSheet.create({
  actionFooter: {
    backgroundColor: theme.colors.surfaceAlt,
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
    justifyContent: 'center',
    minHeight: 52,
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
    borderRadius: 20,
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 52,
  },
  cameraCaptureText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
  },
  cameraFooter: {
    alignItems: 'center',
    backgroundColor: '#111111',
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  cameraFooterCenter: {
    alignItems: 'center',
    flex: 1,
  },
  cameraFooterSide: {
    flex: 1,
    minWidth: 76,
  },
  cameraGuide: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    padding: theme.spacing.xl,
  },
  cameraGuideFrame: {
    borderColor: 'rgba(255,255,255,0.45)',
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  cameraGuideText: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  cameraCenterMark: {
    borderColor: 'rgba(255,255,255,0.62)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 18,
    left: '50%',
    marginLeft: -9,
    marginTop: -9,
    position: 'absolute',
    top: '50%',
    width: 18,
  },
  cameraGrid: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraGridLineHorizontal: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    height: StyleSheet.hairlineWidth,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  cameraGridLineVertical: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    bottom: 0,
    position: 'absolute',
    top: 0,
    width: StyleSheet.hairlineWidth,
  },
  cameraPreview: {
    flex: 1,
  },
  cameraDeleteButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: theme.spacing.sm,
  },
  cameraIconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.52)',
    borderRadius: theme.radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  cameraRecipientTag: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: theme.radius.pill,
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  cameraRecipientText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    lineHeight: 17,
  },
  cameraReviewImage: {
    height: '100%',
    width: '100%',
  },
  cameraReviewPreview: {
    backgroundColor: '#050505',
    flex: 1,
  },
  cameraReviewTitle: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    lineHeight: 18,
  },
  cameraReviewTitlePill: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.52)',
    borderRadius: theme.radius.pill,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: theme.spacing.lg,
  },
  cameraReviewTopBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    left: 0,
    padding: theme.spacing.lg,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  cameraScreen: {
    backgroundColor: '#111111',
    flex: 1,
  },
  cameraShutterButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 36,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  cameraShutterInner: {
    backgroundColor: theme.colors.white,
    borderRadius: 28,
    height: 56,
    width: 56,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  cardTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
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
    borderColor: 'rgba(48, 141, 54, 0.14)',
    borderRadius: 18,
    borderWidth: 1,
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
    fontFamily: Fonts.sansBold,
    fontSize: 17,
    lineHeight: 22,
  },
  content: {
    backgroundColor: theme.colors.surfaceAlt,
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  disabledButton: {
    opacity: 0.46,
  },
  disabledPrimary: {
    opacity: 0.58,
  },
  footerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
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
  headerSubtitle: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  headerTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 19,
    lineHeight: 24,
  },
  infoCopy: {
    flex: 1,
    gap: 2,
  },
  infoIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
    borderRadius: 16,
    height: 44,
    justifyContent: 'center',
    width: 44,
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
    fontSize: 14,
    lineHeight: 20,
  },
  instructionsCard: {
    backgroundColor: theme.colors.amberSoft,
    borderColor: 'rgba(242, 185, 80, 0.35)',
    borderRadius: 18,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  instructionsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  instructionsText: {
    color: theme.colors.text,
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    lineHeight: 21,
  },
  instructionsTitle: {
    color: '#8A5A05',
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
  },
  issueButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: theme.spacing.md,
  },
  issueButtonText: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
  },
  issueCancelButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
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
    borderRadius: 16,
    borderWidth: 1,
    color: theme.colors.text,
    fontFamily: Fonts.sans,
    fontSize: 14,
    minHeight: 78,
    padding: theme.spacing.md,
  },
  issueModal: {
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  issueOption: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 16,
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
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  issueSubmitText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
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
    fontFamily: Fonts.sansBold,
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
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    lineHeight: 23,
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
  modalHandle: {
    alignSelf: 'center',
    backgroundColor: 'rgba(31, 42, 36, 0.16)',
    borderRadius: theme.radius.pill,
    height: 4,
    width: 42,
  },
  noteLabel: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    lineHeight: 18,
  },
  noteList: {
    gap: theme.spacing.sm,
  },
  noteRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  noteText: {
    color: theme.colors.textMuted,
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
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
    minHeight: 56,
    paddingHorizontal: theme.spacing.md,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
  },
  productImageAsset: {
    height: '100%',
    width: '100%',
  },
  productImageWrap: {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    borderRadius: 16,
    height: 82,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 82,
  },
  productPlaceholder: {
    color: theme.colors.text,
    fontFamily: Fonts.sans,
    fontSize: 9,
    lineHeight: 12,
    textAlign: 'center',
  },
  progressDot: {
    alignItems: 'center',
    backgroundColor: '#DADADA',
    borderRadius: theme.radius.pill,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  progressDotDone: {
    backgroundColor: theme.colors.primary,
  },
  progressFill: {
    backgroundColor: '#41B650',
    borderRadius: theme.radius.pill,
    height: '100%',
  },
  progressLabel: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sansMedium,
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
  },
  progressLabelCurrent: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  progressTrack: {
    backgroundColor: '#E0E0E0',
    borderColor: 'rgba(31, 42, 36, 0.16)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 12,
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 2,
  },
  proofCopy: {
    flex: 1,
    gap: 2,
  },
  proofImage: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 14,
    height: 72,
    width: 72,
  },
  proofForm: {
    backgroundColor: '#111111',
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  proofFormLabel: {
    color: theme.colors.white,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
  },
  proofInput: {
    backgroundColor: '#222222',
    borderRadius: 16,
    color: theme.colors.white,
    fontFamily: Fonts.sans,
    fontSize: 14,
    minHeight: 72,
    padding: theme.spacing.md,
  },
  proofNote: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  proofPreview: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  proofText: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    lineHeight: 19,
  },
  screen: {
    backgroundColor: theme.colors.surfaceAlt,
    flex: 1,
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(31, 42, 36, 0.08)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  stateText: {
    color: theme.colors.textMuted,
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  systemAction: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  systemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.xs,
  },
  systemIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 18,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  systemLabel: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    lineHeight: 12,
    maxWidth: 72,
    textAlign: 'center',
  },
  timelineCopy: {
    flex: 1,
    gap: 2,
  },
  timelineDot: {
    alignItems: 'center',
    backgroundColor: '#DADADA',
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
    fontSize: 14,
    lineHeight: 19,
  },
  timelineLabelDone: {
    color: theme.colors.text,
  },
  timelineList: {
    gap: theme.spacing.md,
  },
  timelineRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  timelineTime: {
    color: theme.colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
});
