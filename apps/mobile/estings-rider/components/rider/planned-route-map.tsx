import {
  Camera,
  GeoJSONSource,
  Layer,
  Map as MapLibreMap,
  ViewAnnotation,
} from '@maplibre/maplibre-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts, theme } from '@/constants/theme';
import type { RoutePreview } from '@/services/deliveries-api';

const mapStyleUrl = process.env.EXPO_PUBLIC_MAP_STYLE_URL ?? 'https://tiles.openfreemap.org/styles/liberty';

export function PlannedRouteMap({
  preview,
  height = 300,
  onMapInteractionChange,
}: {
  preview: RoutePreview;
  height?: number;
  onMapInteractionChange?: (isInteracting: boolean) => void;
}) {
  const markers = preview.markers.filter((marker) => Number.isFinite(marker.latitude) && Number.isFinite(marker.longitude));
  const center = markers[0] ?? { latitude: 14.5995, longitude: 120.9842 };

  return (
    <View style={styles.card}>
      <MapLibreMap
        androidView="texture"
        attribution
        attributionPosition={{ bottom: 8, right: 8 }}
        compass
        dragPan
        logo={false}
        mapStyle={mapStyleUrl}
        onTouchCancel={() => onMapInteractionChange?.(false)}
        onTouchEnd={() => onMapInteractionChange?.(false)}
        onTouchStart={() => onMapInteractionChange?.(true)}
        style={{ height }}
        touchPitch={false}
        touchRotate
        touchZoom>
        <Camera initialViewState={{ center: [center.longitude, center.latitude], zoom: markers.length > 1 ? 11 : 15 }} maxBounds={[116, 4.2, 127, 21.5]} maxZoom={19} minZoom={5} />
        {preview.geometry ? (
          <GeoJSONSource id="planned-route" data={{ type: 'Feature', properties: {}, geometry: preview.geometry }}>
            <Layer id="route-outline" type="line" style={{ lineColor: '#FFFFFF', lineOpacity: 0.9, lineWidth: 7 }} />
            <Layer id="route-line" type="line" style={{ lineColor: theme.colors.primary, lineOpacity: 0.96, lineWidth: 4 }} />
          </GeoJSONSource>
        ) : null}
        {markers.map((marker, index) => (
          <ViewAnnotation anchor="bottom" id={`route-marker-${index}`} key={`${marker.type}-${marker.deliveryId ?? index}`} lngLat={[marker.longitude, marker.latitude]}>
            <View style={[styles.marker, marker.type === 'origin' && styles.originMarker]}><Text style={styles.markerText}>{marker.type === 'origin' ? 'B' : marker.stopSequence ?? index}</Text></View>
          </ViewAnnotation>
        ))}
      </MapLibreMap>
      <View style={styles.caption}><Text style={styles.captionTitle}>Interactive route map</Text><Text style={styles.captionText}>{preview.available ? formatSummary(preview) : preview.availabilityReason || 'Route line unavailable. Use the verified pins or navigation shortcut.'} Drag in any direction or pinch to zoom.</Text><Text style={styles.attribution}>MapLibre · OpenStreetMap contributors · OpenFreeMap</Text></View>
    </View>
  );
}

function formatSummary(preview: RoutePreview) {
  const distance = preview.distanceM ? `${(preview.distanceM / 1000).toFixed(1)} km` : null;
  const duration = preview.durationS ? `about ${Math.round(preview.durationS / 60)} min` : null;
  return [distance, duration].filter(Boolean).join(' · ') || 'Verified route pins';
}

const styles = StyleSheet.create({
  caption: { backgroundColor: theme.colors.surface, gap: 2, padding: theme.spacing.md },
  captionText: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },
  captionTitle: { color: theme.colors.text, fontFamily: Fonts.sansBold, fontSize: 13, lineHeight: 18 },
  attribution: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 9, lineHeight: 13, marginTop: 3 },
  card: { borderColor: 'rgba(31,42,36,0.1)', borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  marker: { alignItems: 'center', backgroundColor: theme.colors.primary, borderColor: theme.colors.white, borderRadius: 18, borderWidth: 3, height: 34, justifyContent: 'center', width: 34 },
  markerText: { color: theme.colors.white, fontFamily: Fonts.sansBold, fontSize: 12 },
  originMarker: { backgroundColor: theme.colors.text },
});
