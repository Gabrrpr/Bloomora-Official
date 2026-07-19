import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

export default function DeliveryRouteMap({ geometry, markers = [], onMapClick, height = 360 }) {
  const containerRef = useRef(null);
  const clickHandlerRef = useRef(onMapClick);
  useEffect(() => { clickHandlerRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => {
    if (!containerRef.current) return undefined;
    const validMarkers = markers.filter((marker) => Number.isFinite(marker.latitude) && Number.isFinite(marker.longitude));
    const center = validMarkers[0] ? [validMarkers[0].longitude, validMarkers[0].latitude] : [120.9842, 14.5995];
    const map = new maplibregl.Map({ container: containerRef.current, style: STYLE_URL, center, zoom: validMarkers.length ? 12 : 9, attributionControl: true });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    const mapMarkers = validMarkers.map((marker, index) => {
      const element = document.createElement("button");
      element.type = "button";
      element.textContent = marker.type === "origin" ? "B" : String(marker.stopSequence || index);
      element.title = marker.label || marker.address || "Delivery location";
      Object.assign(element.style, { alignItems: "center", background: marker.type === "origin" ? "#0f172a" : "#167c3a", border: "3px solid white", borderRadius: "9999px", boxShadow: "0 3px 10px rgba(15,23,42,.3)", color: "white", cursor: "pointer", display: "flex", fontSize: "12px", fontWeight: "800", height: "34px", justifyContent: "center", width: "34px" });
      return new maplibregl.Marker({ element }).setLngLat([marker.longitude, marker.latitude]).setPopup(new maplibregl.Popup({ offset: 24 }).setText(marker.label || marker.address || "Delivery location")).addTo(map);
    });
    map.on("load", () => {
      if (geometry) {
        map.addSource("planned-route", { type: "geojson", data: { type: "Feature", properties: {}, geometry } });
        map.addLayer({ id: "planned-route-outline", type: "line", source: "planned-route", paint: { "line-color": "#ffffff", "line-width": 7, "line-opacity": 0.9 } });
        map.addLayer({ id: "planned-route-line", type: "line", source: "planned-route", paint: { "line-color": "#167c3a", "line-width": 4, "line-opacity": 0.95 } });
      }
      if (validMarkers.length > 1) {
        const bounds = validMarkers.reduce((value, marker) => value.extend([marker.longitude, marker.latitude]), new maplibregl.LngLatBounds([validMarkers[0].longitude, validMarkers[0].latitude], [validMarkers[0].longitude, validMarkers[0].latitude]));
        map.fitBounds(bounds, { padding: 54, maxZoom: 15, duration: 0 });
      }
    });
    map.on("click", (event) => clickHandlerRef.current?.({ latitude: event.lngLat.lat, longitude: event.lngLat.lng }));
    return () => { mapMarkers.forEach((marker) => marker.remove()); map.remove(); };
  }, [geometry, markers]);
  return <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700"><div ref={containerRef} style={{ height }} /><div className="pointer-events-none absolute bottom-2 left-2 rounded bg-white/90 px-2 py-1 text-[10px] text-slate-600 shadow">Planned route — not live rider location</div></div>;
}
