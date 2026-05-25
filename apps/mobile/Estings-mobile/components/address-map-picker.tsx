import * as Location from 'expo-location';
import { Expand, MapPin, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, type MapPressEvent, type Region } from 'react-native-maps';

import { Fonts, theme } from '@/constants/theme';

type PinnedLocation = {
  latitude: number;
  longitude: number;
};

type AddressMapPickerProps = {
  onAddressChange: (address: string) => void;
};

const defaultPinnedLocation = {
  latitude: 14.5995,
  longitude: 120.9842,
};

const defaultMapRegion = {
  ...defaultPinnedLocation,
  latitudeDelta: 0.035,
  longitudeDelta: 0.035,
};

export function AddressMapPicker({ onAddressChange }: AddressMapPickerProps) {
  const insets = useSafeAreaInsets();
  const [pinnedLocation, setPinnedLocation] = useState<PinnedLocation>(defaultPinnedLocation);
  const [mapRegion, setMapRegion] = useState<Region>(defaultMapRegion);
  const [message, setMessage] = useState('Tap or drag the pin to fill the address.');
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  async function handlePinnedLocationChange(location: PinnedLocation) {
    setPinnedLocation(location);
    setMapRegion((current) => ({
      ...current,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
    setIsResolvingAddress(true);
    setMessage('Finding address...');

    try {
      const [result] = await Location.reverseGeocodeAsync(location);
      const resolvedAddress = formatReverseGeocodedAddress(result);

      if (resolvedAddress) {
        onAddressChange(resolvedAddress);
        setMessage('Address filled from pinned location.');
      } else {
        setMessage('No address found. You can type it manually.');
      }
    } catch {
      setMessage('Could not read this address. You can type it manually.');
    } finally {
      setIsResolvingAddress(false);
    }
  }

  function handleMapPress(event: MapPressEvent) {
    void handlePinnedLocationChange(event.nativeEvent.coordinate);
  }

  return (
    <>
      <View style={styles.mapPicker}>
        <MapCanvas
          mapRegion={mapRegion}
          pinnedLocation={pinnedLocation}
          style={styles.map}
          onMapPress={handleMapPress}
          onPinnedLocationChange={handlePinnedLocationChange}
          onRegionChangeComplete={setMapRegion}
        />
        <View style={styles.mapHintRow}>
          <MapPin size={theme.icon.sm} color={theme.colors.primary} strokeWidth={2.1} />
          <Text style={styles.mapHintText}>{isResolvingAddress ? 'Finding address...' : message}</Text>
          <Pressable accessibilityRole="button" style={styles.expandButton} onPress={() => setIsFullscreen(true)}>
            <Expand size={theme.icon.sm} color={theme.colors.primary} strokeWidth={2.1} />
            <Text style={styles.expandButtonText}>Expand</Text>
          </Pressable>
        </View>
      </View>

      <Modal animationType="slide" visible={isFullscreen} onRequestClose={() => setIsFullscreen(false)}>
        <View style={styles.fullscreen}>
          <View style={[styles.fullscreenHeader, { paddingTop: insets.top + theme.spacing.md }]}>
            <View style={styles.fullscreenTitleRow}>
              <MapPin size={theme.icon.sm} color={theme.colors.primary} strokeWidth={2.1} />
              <Text style={styles.fullscreenTitle}>Pin delivery location</Text>
            </View>
            <Pressable accessibilityLabel="Close map" accessibilityRole="button" style={styles.closeButton} onPress={() => setIsFullscreen(false)}>
              <X size={theme.icon.md} color={theme.colors.text} strokeWidth={2.1} />
            </Pressable>
          </View>
          <MapCanvas
            mapRegion={mapRegion}
            pinnedLocation={pinnedLocation}
            style={styles.fullscreenMap}
            onMapPress={handleMapPress}
            onPinnedLocationChange={handlePinnedLocationChange}
            onRegionChangeComplete={setMapRegion}
          />
          <View style={[styles.fullscreenFooter, { paddingBottom: insets.bottom + theme.spacing.md }]}>
            <Text style={styles.mapHintText}>{isResolvingAddress ? 'Finding address...' : message}</Text>
            <Pressable accessibilityRole="button" style={styles.doneButton} onPress={() => setIsFullscreen(false)}>
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
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
  onPinnedLocationChange: (location: PinnedLocation) => void;
  onRegionChangeComplete: (region: Region) => void;
  pinnedLocation: PinnedLocation;
  style: object;
}) {
  return (
    <MapView
      initialRegion={defaultMapRegion}
      region={mapRegion}
      style={style}
      onPress={onMapPress}
      onRegionChangeComplete={onRegionChangeComplete}>
      <Marker
        coordinate={pinnedLocation}
        draggable
        onDragEnd={(event) => {
          void onPinnedLocationChange(event.nativeEvent.coordinate);
        }}
      />
    </MapView>
  );
}

function formatReverseGeocodedAddress(address?: Location.LocationGeocodedAddress) {
  if (!address) {
    return '';
  }

  return [
    address.name,
    address.street,
    address.district,
    address.city,
    address.subregion,
    address.region,
    address.postalCode,
    address.country,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .filter((part, index, parts) => parts.indexOf(part) === index)
    .join(', ');
}

const styles = StyleSheet.create({
  mapPicker: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    gap: theme.spacing.sm,
    overflow: 'hidden',
  },
  map: {
    height: 220,
    width: '100%',
  },
  mapHintRow: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  mapHintText: {
    color: theme.colors.textMuted,
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    lineHeight: 17,
  },
  expandButton: {
    alignItems: 'center',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth,
    flexDirection: 'row',
    gap: 5,
    minHeight: 34,
    paddingHorizontal: theme.spacing.sm,
  },
  expandButtonText: {
    color: theme.colors.primary,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  fullscreen: {
    backgroundColor: theme.colors.surface,
    flex: 1,
  },
  fullscreenHeader: {
    alignItems: 'center',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  fullscreenTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  fullscreenTitle: {
    color: theme.colors.text,
    fontFamily: Fonts.sansBold,
    fontSize: 17,
    lineHeight: 22,
  },
  closeButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  fullscreenMap: {
    flex: 1,
    width: '100%',
  },
  fullscreenFooter: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  doneButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    justifyContent: 'center',
    minHeight: 52,
  },
  doneButtonText: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
  },
});
