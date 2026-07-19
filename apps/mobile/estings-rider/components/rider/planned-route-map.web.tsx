import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef } from 'react';

import type { RoutePreview } from '@/services/deliveries-api';

const mapStyleUrl = process.env.EXPO_PUBLIC_MAP_STYLE_URL ?? 'https://tiles.openfreemap.org/styles/liberty';

export function PlannedRouteMap({ preview, height = 300 }: { preview: RoutePreview; height?: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const markers = preview.markers.filter((marker) => Number.isFinite(marker.latitude) && Number.isFinite(marker.longitude));
    const center = markers[0] ? [markers[0].longitude, markers[0].latitude] as [number, number] : [120.9842, 14.5995] as [number, number];
    const map = new maplibregl.Map({ container: containerRef.current, style: mapStyleUrl, center, zoom: markers.length > 1 ? 11 : 15 });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    const mapMarkers = markers.map((marker, index) => {
      const element = document.createElement('div');
      element.textContent = marker.type === 'origin' ? 'B' : String(marker.stopSequence ?? index);
      Object.assign(element.style, { alignItems: 'center', background: marker.type === 'origin' ? '#1f2a24' : '#308d36', border: '3px solid white', borderRadius: '18px', color: 'white', display: 'flex', fontWeight: '800', height: '34px', justifyContent: 'center', width: '34px' });
      return new maplibregl.Marker({ element }).setLngLat([marker.longitude, marker.latitude]).addTo(map);
    });
    map.on('load', () => {
      if (preview.geometry) {
        map.addSource('planned-route', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: preview.geometry } });
        map.addLayer({ id: 'planned-route', type: 'line', source: 'planned-route', paint: { 'line-color': '#308d36', 'line-width': 4 } });
      }
    });
    return () => { mapMarkers.forEach((marker) => marker.remove()); map.remove(); };
  }, [preview]);

  return <div><div ref={containerRef} style={{ borderRadius: 18, height, overflow: 'hidden' }} /><div style={{ background: 'white', color: '#55635b', fontFamily: 'sans-serif', fontSize: 12, padding: 12 }}><strong>Planned route — not live rider location</strong><br />{preview.availabilityReason || 'OpenStreetMap route preview'}</div></div>;
}
