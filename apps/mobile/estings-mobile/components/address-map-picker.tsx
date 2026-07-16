import * as Location from 'expo-location';
import { Expand, LocateFixed, MapPin, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, type MapPressEvent, type Region } from 'react-native-maps';

import { Fonts, theme } from '@/constants/theme';
import {
  getAddressZoneLabel,
  reverseGeocodeLocation,
  type AddressVerification,
  type VerifiedAddress,
} from '@/services/location-api';

type PinnedLocation = {
  latitude: number;
  longitude: number;
};

export type AddressMapPickerProps = {
  initialAddress?: VerifiedAddress | null;
  onSelectionChange: (selection: AddressVerification | null) => void;
};

const defaultMapRegion: Region = {
  latitude: 14.5995,
  longitude: 120.9842,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export function AddressMapPicker({ initialAddress, onSelectionChange }: AddressMapPickerProps) {
  const insets = useSafeAreaInsets();
  const initialPin = useMemo(() => getInitialPin(initialAddress), [initialAddress]);
  const [pinnedLocation, setPinnedLocation] = useState<PinnedLocation | null>(initialPin);
  const [mapRegion, setMapRegion] = useState<Region>(() => toRegion(initialPin));
  const [message, setMessage] = useState(
    initialPin ? 'Saved verified pin. Tap or drag to change it.' : 'Tap the map to pin the exact delivery location.',
  );
  const [attribution, setAttribution] = useState('Address details appear after the pin is verified');
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const requestId = useRef(0);
  const abortController = useRef<AbortController | null>(null);

  useEffect(() => {
    const nextPin = getInitialPin(initialAddress);
    abortController.current?.abort();
    requestId.current += 1;
    setPinnedLocation(nextPin);
    setMapRegion(toRegion(nextPin));
    setIsResolvingAddress(false);
    setMessage(
      nextPin ? 'Saved verified pin. Tap or drag to change it.' : 'Tap the map to pin the exact delivery location.',
    );
  }, [initialAddress]);

  useEffect(() => () => abortController.current?.abort(), []);

  async function verifyPinnedLocation(location: PinnedLocation) {
    const nextRequestId = requestId.current + 1;
    requestId.current = nextRequestId;
    abortController.current?.abort();
    const controller = new AbortController();
    abortController.current = controller;

    setPinnedLocation(location);
    setMapRegion((current) => ({
      ...current,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
    setIsResolvingAddress(true);
    setMessage('Finding the address for this pin...');
    onSelectionChange(null);

    try {
      const verification = await reverseGeocodeLocation(
        location.latitude,
        location.longitude,
        controller.signal,
      );

      if (nextRequestId !== requestId.current) {
        return;
      }

      setAttribution(verification.attribution || 'Address details verified from the selected pin');

      if (!verification.address.is_serviceable || verification.address.service_zone === 'unsupported') {
        setMessage("Esting's currently delivers only within NCR and Pampanga. Choose another pin.");
        return;
      }

      setPinnedLocation({
        latitude: verification.address.latitude,
        longitude: verification.address.longitude,
      });
      setMessage(`Verified: ${getAddressZoneLabel(verification.address)}`);
      onSelectionChange(verification);
    } catch (error) {
      if (controller.signal.aborted || nextRequestId !== requestId.current) {
        return;
      }

      setMessage(
        error instanceof Error
          ? error.message
          : 'This pin could not be verified. Check your connection and try again.',
      );
    } finally {
      if (nextRequestId === requestId.current) {
        setIsResolvingAddress(false);
      }
    }
  }

  async function handleUseCurrentLocation() {
    if (isLocating || isResolvingAddress) {
      return;
    }

    setIsLocating(true);
    setMessage('Requesting your current location...');

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setMessage('Location permission was not granted. You can still place the pin manually.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await verifyPinnedLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Your location is unavailable. Place the pin manually instead.',
      );
    } finally {
      setIsLocating(false);
    }
  }

  function handleMapPress(event: MapPressEvent) {
    void verifyPinnedLocation(event.nativeEvent.coordinate);
  }

  const map = (style: object, mapKey: string) => (
    <MapCanvas
      key={mapKey}
      mapRegion={mapRegion}
      pinnedLocation={pinnedLocation}
      style={style}
      onMapPress={handleMapPress}
      onPinnedLocationChange={verifyPinnedLocation}
      onRegionChangeComplete={setMapRegion}
    />
  );

  return (
    <>
      <View style={styles.mapPicker}>
        {isFullscreen ? <View style={styles.mapPlaceholder} /> : map(styles.map, 'embedded-map')}
        <MapStatus
          attribution={attribution}
          isLocating={isLocating}
          isResolving={isResolvingAddress}
          message={message}
          onExpand={() => setIsFullscreen(true)}
          onUseCurrentLocation={handleUseCurrentLocation}
        />
      </View>

      <Modal
        animationType="slide"
        presentationStyle="fullScreen"
        visible={isFullscreen}
        onRequestClose={() => setIsFullscreen(false)}>
        <View style={styles.fullscreen}>
          <View style={[styles.fullscreenHeader, { paddingTop: insets.top + theme.spacing.md }]}>
            <View style={styles.fullscreenTitleRow}>
              <MapPin size={theme.icon.sm} color={theme.colors.primary} strokeWidth={2.1} />
              <Text style={styles.fullscreenTitle}>Pin delivery location</Text>
            </View>
            <Pressable
              accessibilityLabel="Close map"
              accessibilityRole="button"
              style={styles.closeButton}
              onPress={() => setIsFullscreen(false)}>
              <X size={theme.icon.md} color={theme.colors.text} strokeWidth={2.1} />
            </Pressable>
          </View>
          {map(styles.fullscreenMap, 'fullscreen-map')}
          <View style={[styles.fullscreenFooter, { paddingBottom: insets.bottom + theme.spacing.md }]}>
            <Text style={styles.mapHintText}>{message}</Text>
            <Text style={styles.attributionText}>{attribution}</Text>
            <View style={styles.fullscreenActions}>
              <Pressable
                accessibilityRole="button"
                disabled={isLocating || isResolvingAddress}
                style={[styles.locationButton, (isLocating || isResolvingAddress) && styles.disabled]}
                onPress={() => void handleUseCurrentLocation()}>
                {isLocating ? (
                  <ActivityIndicator color={theme.colors.primary} size="small" />
                ) : (
                  <LocateFixed size={17} color={theme.colors.primary} />
                )}
                <Text style={styles.locationButtonText}>Use my location</Text>
              </Pressable>
              <Pressable accessibilityRole="button" style={styles.doneButton} onPress={() => setIsFullscreen(false)}>
                <Text style={styles.doneButtonText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function MapStatus({
  attribution,
  isLocating,
  isResolving,
  message,
  onExpand,
  onUseCurrentLocation,
}: {
  attribution: string;
  isLocating: boolean;
  isResolving: boolean;
  message: string;
  onExpand: () => void;
  onUseCurrentLocation: () => Promise<void>;
}) {
  return (
    <View style={styles.mapStatus}>
      <View style={styles.mapHintRow}>
        {isResolving ? (
          <ActivityIndicator color={theme.colors.primary} size="small" />
        ) : (
          <MapPin size={theme.icon.sm} color={theme.colors.primary} strokeWidth={2.1} />
        )}
        <Text style={styles.mapHintText}>{message}</Text>
      </View>
      <Text style={styles.attributionText}>{attribution}</Text>
      <View style={styles.mapActions}>
        <Pressable
          accessibilityRole="button"
          disabled={isLocating || isResolving}
          style={[styles.locationButton, (isLocating || isResolving) && styles.disabled]}
          onPress={() => void onUseCurrentLocation()}>
          {isLocating ? (
            <ActivityIndicator color={theme.colors.primary} size="small" />
          ) : (
            <LocateFixed size={17} color={theme.colors.primary} />
          )}
          <Text style={styles.locationButtonText}>Use my location</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.expandButton} onPress={onExpand}>
          <Expand size={17} color={theme.colors.primary} strokeWidth={2.1} />
          <Text style={styles.expandButtonText}>Expand</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MapCanvas({
  mapRegion,
  onMapPress,
  onPinnedLocationChange,
  onRegionChangeComplete,
  pinnedLocation,
  style,
}: {
  mapRegion: Region;
  onMapPress: (event: MapPressEvent) => void;
  onPinnedLocationChange: (location: PinnedLocation) => Promise<void>;
  onRegionChangeComplete: (region: Region) => void;
  pinnedLocation: PinnedLocation | null;
  style: object;
}) {
  return (
    <MapView
      pitchEnabled
      region={mapRegion}
      rotateEnabled
      scrollEnabled
      style={style}
      toolbarEnabled={false}
      zoomEnabled
      onPress={onMapPress}
      onRegionChangeComplete={onRegionChangeComplete}>
      {pinnedLocation ? (
        <Marker
          coordinate={pinnedLocation}
          draggable
          onDragEnd={(event) => {
            void onPinnedLocationChange(event.nativeEvent.coordinate);
          }}
        />
      ) : null}
    </MapView>
  );
}

function getInitialPin(address?: VerifiedAddress | null): PinnedLocation | null {
  if (!address || !Number.isFinite(address.latitude) || !Number.isFinite(address.longitude)) {
    return null;
  }

  return { latitude: address.latitude, longitude: address.longitude };
}

function toRegion(location: PinnedLocation | null): Region {
  return {
    ...(location ?? defaultMapRegion),
    latitudeDelta: 0.035,
    longitudeDelta: 0.035,
  };
}

const styles = StyleSheet.create({
  mapPicker: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    overflow: 'hidden',
  },
  map: { height: 250, width: '100%' },
  mapPlaceholder: { backgroundColor: theme.colors.surfaceAlt, height: 250, width: '100%' },
  mapStatus: { backgroundColor: theme.colors.surfaceAlt, gap: 7, padding: theme.spacing.md },
  mapHintRow: { alignItems: 'flex-start', flexDirection: 'row', gap: theme.spacing.sm },
  mapHintText: {
    color: theme.colors.textMuted,
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 17,
  },
  attributionText: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 9, lineHeight: 13 },
  mapActions: { flexDirection: 'row', gap: theme.spacing.sm, justifyContent: 'flex-end' },
  locationButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth,
    flexDirection: 'row',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: theme.spacing.md,
  },
  locationButtonText: { color: theme.colors.primary, fontFamily: Fonts.sansSemiBold, fontSize: 12 },
  expandButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth,
    flexDirection: 'row',
    gap: 5,
    minHeight: 38,
    paddingHorizontal: theme.spacing.md,
  },
  expandButtonText: { color: theme.colors.primary, fontFamily: Fonts.sansSemiBold, fontSize: 12 },
  fullscreen: { backgroundColor: theme.colors.surface, flex: 1 },
  fullscreenHeader: {
    alignItems: 'center',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  fullscreenTitleRow: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm },
  fullscreenTitle: { color: theme.colors.text, fontFamily: Fonts.sansBold, fontSize: 17, lineHeight: 22 },
  closeButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  fullscreenMap: { flex: 1, width: '100%' },
  fullscreenFooter: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  fullscreenActions: { flexDirection: 'row', gap: theme.spacing.sm },
  doneButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  doneButtonText: { color: theme.colors.white, fontFamily: Fonts.sansBold, fontSize: 15 },
  disabled: { opacity: 0.45 },
});
