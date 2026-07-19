import { Camera, GeoJSONSource, Layer, Map as MapLibreMap, ViewAnnotation } from '@maplibre/maplibre-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts, theme } from '@/constants/theme';
import type { CustomerRoutePreview } from '@/services/orders-api';

const mapStyleUrl = process.env.EXPO_PUBLIC_MAP_STYLE_URL ?? 'https://tiles.openfreemap.org/styles/liberty';

export function CustomerDeliveryRouteMap({
  preview,
  onMapInteractionChange,
}: {
  preview: CustomerRoutePreview;
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
        style={styles.map}
        touchPitch={false}
        touchRotate
        touchZoom>
        <Camera initialViewState={{ center: [center.longitude, center.latitude], zoom: markers.length > 1 ? 11 : 15 }} maxBounds={[116, 4.2, 127, 21.5]} maxZoom={19} minZoom={5} />
        {preview.geometry ? <GeoJSONSource id="customer-route" data={{ type: 'Feature', properties: {}, geometry: preview.geometry }}><Layer id="customer-route-outline" type="line" style={{ lineColor: '#FFFFFF', lineOpacity: 0.9, lineWidth: 7 }} /><Layer id="customer-route-line" type="line" style={{ lineColor: theme.colors.primary, lineOpacity: 0.96, lineWidth: 4 }} /></GeoJSONSource> : null}
        {markers.map((marker, index) => <ViewAnnotation anchor="bottom" id={`customer-route-${index}`} key={`${marker.type}-${index}`} lngLat={[marker.longitude, marker.latitude]}><View style={[styles.marker, marker.type === 'origin' && styles.origin]}><Text style={styles.markerText}>{marker.type === 'origin' ? 'B' : '1'}</Text></View></ViewAnnotation>)}
      </MapLibreMap>
      <View style={styles.caption}><Text style={styles.captionTitle}>Interactive route map</Text><Text style={styles.captionText}>{preview.available ? routeSummary(preview) : preview.availabilityReason || 'Route line unavailable. Your verified delivery pin is still shown.'} Drag in any direction or pinch to zoom.</Text><Text style={styles.attribution}>MapLibre · OpenStreetMap contributors · OpenFreeMap</Text></View>
    </View>
  );
}

function routeSummary(preview: CustomerRoutePreview) {
  return [preview.distanceM ? `${(preview.distanceM / 1000).toFixed(1)} km` : null, preview.durationS ? `about ${Math.round(preview.durationS / 60)} min` : null].filter(Boolean).join(' · ') || 'Verified delivery route';
}

const styles = StyleSheet.create({
  caption: { backgroundColor: theme.colors.surface, gap: 2, padding: theme.spacing.md },
  captionText: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },
  captionTitle: { color: theme.colors.text, fontFamily: Fonts.sansBold, fontSize: 13, lineHeight: 18 },
  attribution: { color: theme.colors.textMuted, fontFamily: Fonts.sans, fontSize: 9, lineHeight: 13, marginTop: 3 },
  card: { borderColor: 'rgba(31,42,36,0.1)', borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  map: { height: 300 },
  marker: { alignItems: 'center', backgroundColor: theme.colors.primary, borderColor: '#FFFFFF', borderRadius: 18, borderWidth: 3, height: 34, justifyContent: 'center', width: 34 },
  markerText: { color: '#FFFFFF', fontFamily: Fonts.sansBold, fontSize: 12 },
  origin: { backgroundColor: theme.colors.text },
});
