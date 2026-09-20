"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker, Circle, Polyline } from "leaflet";

export interface MapMarkerItem {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  type: "victim" | "responder" | "mesh_node" | "lodge" | "rescue_hq";
  altitude?: number;
  status?: string;
  etaMinutes?: number;
}

export interface MapMeshHop {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  fromName: string;
  toName: string;
  rssi?: number;
}

interface HimalayanMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarkerItem[];
  meshHops?: MapMeshHop[];
  geoRadiusKm?: number;
  victimCoords?: [number, number];
  className?: string;
  onMarkerClick?: (marker: MapMarkerItem) => void;
}

export default function HimalayanMap({
  center = [27.8920, 86.8315], // Dingboche / Khumbu default
  zoom = 12,
  markers = [],
  meshHops = [],
  geoRadiusKm,
  victimCoords,
  className = "w-full h-[450px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800",
  onMarkerClick,
}: HimalayanMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const circlesRef = useRef<Circle[]>([]);
  const polylinesRef = useRef<Polyline[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;

      const L = await import("leaflet");

      // Check if map already initialized on this container
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Initialize map
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: false,
      });

      L.control.zoom({ position: "topright" }).addTo(map);

      // OpenStreetMap high-contrast / terrain tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Himalayan Lifeline',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
      if (isMounted) setIsLoaded(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center & zoom if changed
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom, { animate: true });
    }
  }, [center, zoom]);

  // Render markers, geo-fences, and mesh hop polylines
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      // Clear existing overlays
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      circlesRef.current.forEach((c) => c.remove());
      circlesRef.current = [];

      polylinesRef.current.forEach((p) => p.remove());
      polylinesRef.current = [];

      // 1. Draw Geo-fence circle if specified
      if (victimCoords && geoRadiusKm) {
        const circle = L.circle(victimCoords, {
          radius: geoRadiusKm * 1000,
          color: "#ef4444",
          fillColor: "#ef4444",
          fillOpacity: 0.12,
          weight: 2,
          dashArray: "6, 8",
        }).addTo(map);
        circlesRef.current.push(circle);
      }

      // 2. Render Markers
      markers.forEach((item) => {
        let iconHtml = "";
        let classNameModifier = "";

        if (item.type === "victim") {
          classNameModifier = "relative flex items-center justify-center";
          iconHtml = `
            <div class="relative flex items-center justify-center">
              <span class="absolute w-12 h-12 rounded-full bg-red-600/30 animate-ping"></span>
              <span class="absolute w-8 h-8 rounded-full bg-red-500/50"></span>
              <div class="relative w-6 h-6 rounded-full bg-red-600 border-2 border-white flex items-center justify-center shadow-lg text-white text-[10px] font-black">
                SOS
              </div>
            </div>
          `;
        } else if (item.type === "responder") {
          iconHtml = `
            <div class="relative flex items-center justify-center">
              <span class="absolute w-7 h-7 rounded-full bg-emerald-500/30 animate-pulse"></span>
              <div class="w-6 h-6 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center shadow-lg text-white text-[10px] font-bold">
                ▲
              </div>
            </div>
          `;
        } else if (item.type === "mesh_node") {
          iconHtml = `
            <div class="relative flex items-center justify-center">
              <div class="w-5 h-5 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-md text-white text-[9px]">
                📡
              </div>
            </div>
          `;
        } else if (item.type === "lodge") {
          iconHtml = `
            <div class="w-5 h-5 rounded-full bg-amber-600 border-2 border-white flex items-center justify-center shadow-md text-white text-[9px]">
              🏠
            </div>
          `;
        } else {
          iconHtml = `
            <div class="w-6 h-6 rounded-full bg-indigo-700 border-2 border-white flex items-center justify-center shadow-md text-white text-[10px] font-bold">
              HQ
            </div>
          `;
        }

        const customIcon = L.divIcon({
          html: iconHtml,
          className: classNameModifier,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([item.lat, item.lng], { icon: customIcon }).addTo(map);

        const popupContent = `
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; min-width: 140px;">
            <strong style="font-size: 13px; color: ${item.type === "victim" ? "#dc2626" : "#0284c7"}">
              ${item.title}
            </strong>
            ${item.subtitle ? `<div style="color: #64748b; margin-top: 2px;">${item.subtitle}</div>` : ""}
            ${item.altitude ? `<div style="margin-top: 4px; font-weight: 600;">🏔️ ${item.altitude}m elevation</div>` : ""}
            ${item.etaMinutes ? `<div style="color: #059669; font-weight: 700; margin-top: 2px;">ETA ~${item.etaMinutes} min</div>` : ""}
          </div>
        `;
        marker.bindPopup(popupContent);

        if (onMarkerClick) {
          marker.on("click", () => onMarkerClick(item));
        }

        markersRef.current.push(marker);
      });

      // 3. Render Mesh Hop Lines (Animated dashed lines)
      meshHops.forEach((hop) => {
        const polyline = L.polyline(
          [
            [hop.fromLat, hop.fromLng],
            [hop.toLat, hop.toLng],
          ],
          {
            color: "#3b82f6",
            weight: 3.5,
            dashArray: "8, 12",
            opacity: 0.85,
            className: "animated-mesh-hop-line",
          }
        ).addTo(map);

        polyline.bindTooltip(
          `📡 Mesh Hop: ${hop.fromName} ➔ ${hop.toName} ${hop.rssi ? `(${hop.rssi} dBm)` : ""}`,
          { sticky: true, className: "mesh-tooltip" }
        );

        polylinesRef.current.push(polyline);
      });
    });
  }, [markers, meshHops, geoRadiusKm, victimCoords, isLoaded, onMarkerClick]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[10] bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex flex-wrap gap-3 items-center shadow-lg">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
          <span className="font-semibold text-white">Distress SOS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Responder En Route</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span>BLE Mesh Node</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 border-b-2 border-dashed border-blue-400"></span>
          <span>Relay Path</span>
        </div>
      </div>
    </div>
  );
}
