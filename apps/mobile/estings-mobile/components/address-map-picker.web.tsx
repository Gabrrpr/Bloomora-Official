import { LocateFixed, MapPin } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import 'leaflet/dist/leaflet.css';

import { AddressLocationSearch } from '@/components/address-location-search';
import { Fonts, theme } from '@/constants/theme';
import {
  getAddressZoneLabel,
  reverseGeocodeLocation,
  type AddressSearchResult,
  type AddressVerification,
  type VerifiedAddress,
} from '@/services/location-api';

export type AddressMapPickerProps = {
  initialAddress?: VerifiedAddress | null;
  onMapInteractionChange?: (isInteracting: boolean) => void;
  onSelectionChange: (selection: AddressVerification | null) => void;
};

type LeafletModule = typeof import('leaflet');
type LeafletMap = import('leaflet').Map;
type LeafletMarker = import('leaflet').Marker;

const defaultCenter: [number, number] = [14.5995, 120.9842];

export function AddressMapPicker({ initialAddress, onSelectionChange }: AddressMapPickerProps) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<LeafletMarker | null>(null);
  const leaflet = useRef<LeafletModule | null>(null);
  const requestId = useRef(0);
  const abortController = useRef<AbortController | null>(null);
  const [message, setMessage] = useState(
    initialAddress ? 'Saved verified pin. Click the map to change it.' : 'Click the map to pin the exact delivery location.',
  );
  const [attribution, setAttribution] = useState('Address data © OpenStreetMap contributors');
  const [isResolving, setIsResolving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void import('leaflet').then((L) => {
      if (!isMounted || !mapElement.current || map.current) {
        return;
      }

      leaflet.current = L;
      const center = getInitialCenter(initialAddress);
      const nextMap = L.map(mapElement.current, { zoomControl: true }).setView(center, initialAddress ? 16 : 12);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(nextMap);
      nextMap.on('click', (event) => {
        void verifyLocation(event.latlng.lat, event.latlng.lng);
      });
      map.current = nextMap;

      if (initialAddress) {
        setMarker(initialAddress.latitude, initialAddress.longitude);
      }
    });

    return () => {
      isMounted = false;
      abortController.current?.abort();
      marker.current = null;
      map.current?.remove();
      map.current = null;
    };
    // The map is intentionally created once. Later initial-address changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!map.current || !leaflet.current) {
      return;
    }

    if (initialAddress) {
      setMarker(initialAddress.latitude, initialAddress.longitude);
      map.current.setView([initialAddress.latitude, initialAddress.longitude], 16);
      setMessage('Saved verified pin. Click or drag the pin to change it.');
    } else {
      marker.current?.remove();
      marker.current = null;
      setMessage('Click the map to pin the exact delivery location.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAddress]);

  function setMarker(latitude: number, longitude: number) {
    const L = leaflet.current;
    const currentMap = map.current;

    if (!L || !currentMap) {
      return;
    }

    if (!marker.current) {
      const icon = L.divIcon({
        className: '',
        html: '<div aria-hidden="true" style="width:22px;height:22px;background:#2E8B34;border:4px solid white;border-radius:50%;box-shadow:0 1px 6px rgba(0,0,0,.45)"></div>',
        iconAnchor: [11, 11],
        iconSize: [22, 22],
      });
      marker.current = L.marker([latitude, longitude], { draggable: true, icon }).addTo(currentMap);
      marker.current.on('dragend', () => {
        const position = marker.current?.getLatLng();
        if (position) {
          void verifyLocation(position.lat, position.lng);
        }
      });
    } else {
      marker.current.setLatLng([latitude, longitude]);
    }
  }

  async function verifyLocation(latitude: number, longitude: number) {
    const nextRequestId = requestId.current + 1;
    requestId.current = nextRequestId;
    abortController.current?.abort();
    const controller = new AbortController();
    abortController.current = controller;

    setMarker(latitude, longitude);
    map.current?.setView([latitude, longitude], Math.max(map.current.getZoom(), 16));
    setIsResolving(true);
    setMessage('Verifying this pin with OpenStreetMap...');
    onSelectionChange(null);

    try {
      const verification = await reverseGeocodeLocation(latitude, longitude, controller.signal);
      if (nextRequestId !== requestId.current) {
        return;
      }

      setAttribution(verification.attribution || 'Address data © OpenStreetMap contributors');
      if (!verification.address.is_serviceable || verification.address.service_zone === 'unsupported') {
        setMessage("Esting's currently delivers only within NCR and Pampanga. Choose another pin.");
        return;
      }

      setMarker(verification.address.latitude, verification.address.longitude);
      setMessage(`Verified: ${getAddressZoneLabel(verification.address)}`);
      onSelectionChange(verification);
    } catch (error) {
      if (controller.signal.aborted || nextRequestId !== requestId.current) {
        return;
      }
      setMessage(error instanceof Error ? error.message : 'This pin could not be verified. Try again.');
    } finally {
      if (nextRequestId === requestId.current) {
        setIsResolving(false);
      }
    }
  }

  function handleUseCurrentLocation() {
    if (!globalThis.navigator?.geolocation) {
      setMessage('Browser location is unavailable. Place the pin manually instead.');
      return;
    }

    setIsLocating(true);
    setMessage('Requesting your current location...');
    globalThis.navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        void verifyLocation(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setIsLocating(false);
        setMessage('Location permission was not granted. You can still place the pin manually.');
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 15_000 },
    );
  }

  function handleSearchResult(result: AddressSearchResult) {
    void verifyLocation(result.latitude, result.longitude);
  }

  return (
    <View style={styles.mapPicker}>
      <AddressLocationSearch
        disabled={isLocating || isResolving}
        onResultSelect={handleSearchResult}
      />
      <div ref={mapElement} aria-label="Delivery address map" style={mapElementStyle} />
      <View style={styles.mapStatus}>
        <View style={styles.messageRow}>
          {isResolving ? (
            <ActivityIndicator color={theme.colors.primary} size="small" />
          ) : (
            <MapPin color={theme.colors.primary} size={18} />
          )}
          <Text style={styles.message}>{message}</Text>
        </View>
        <Text style={styles.attribution}>{attribution}</Text>
        <Pressable
          accessibilityRole="button"
          disabled={isLocating || isResolving}
          onPress={handleUseCurrentLocation}
          style={[styles.locationButton, (isLocating || isResolving) && styles.disabled]}>
          {isLocating ? (
            <ActivityIndicator color={theme.colors.primary} size="small" />
          ) : (
            <LocateFixed color={theme.colors.primary} size={17} />
          )}
          <Text style={styles.locationButtonText}>Use my location</Text>
        </Pressable>
      </View>
    </View>
  );
}

function getInitialCenter(address?: VerifiedAddress | null): [number, number] {
  return address ? [address.latitude, address.longitude] : defaultCenter;
}

const mapElementStyle = {
  height: 300,
  width: '100%',
};

const styles = StyleSheet.create({
  mapPicker: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth,
    overflow: 'hidden',
  },
  mapStatus: { alignItems: 'flex-start', backgroundColor: theme.colors.surfaceAlt, gap: 7, padding: 12 },
  messageRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 8, width: '100%' },
  message: { color: theme.colors.textMuted, flex: 1, fontFamily: Fonts.sansMedium, fontSize: 12, lineHeight: 17 },
  attribution: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 9, lineHeight: 13 },
  locationButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: theme.borderWidth,
    flexDirection: 'row',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 12,
  },
  locationButtonText: { color: theme.colors.primary, fontFamily: Fonts.sansSemiBold, fontSize: 12 },
  disabled: { opacity: 0.45 },
});
