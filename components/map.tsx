'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Issue {
  id: string;
  category: string;
  severity: string;
  summary: string;
  latitude: number;
  longitude: number;
}

interface MapProps {
  issues: Issue[];
  onMapClick: (lat: number, lng: number) => void;
  selectedLocation: [number, number] | null;
}

export default function Map({ issues, onMapClick, selectedLocation }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const activeClickMarkerRef = useRef<L.Marker | null>(null);

  // Fix Leaflet's default pin icon asset glitch in Next.js
  const customIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  // 1. Core Map Initialization Lifecycle
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Build the map base container instance centered on New Delhi coordinates
    const map = L.map(mapContainerRef.current).setView([28.6139, 77.2090], 13);
    mapInstanceRef.current = map;

    // Load OpenStreetMap style skins mapping tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Create a dynamic layer to hold all our community markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Bind interactive map click click handlers
    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });

    // Clean up function: RUNS ON RELOADS TO DESTROY GHOST INSTANCES!
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [onMapClick]);

  // 2. Sync Existing Database Issue Pins
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    // Clear old pin states before rendering to prevent duplication bugs
    layer.clearLayers();

    issues.forEach((issue) => {
      const badgeColor = 
        issue.severity === 'CRITICAL' ? '#dc2626' :
        issue.severity === 'HIGH' ? '#f97316' : '#3b82f6';

      const popupHTML = `
        <div style="font-family: sans-serif; min-width: 140px;">
          <span style="display: inline-block; font-size: 10px; font-weight: bold; background-color: ${badgeColor}; color: white; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px;">
            ${issue.category} - ${issue.severity}
          </span>
          <p style="font-size: 12px; font-weight: 500; color: #1e293b; margin: 0; line-height: 1.4;">${issue.summary}</p>
        </div>
      `;

      L.marker([issue.latitude, issue.longitude], { icon: customIcon })
        .bindPopup(popupHTML)
        .addTo(layer);
    });
  }, [issues, customIcon]);

  // 3. Track Current Active Pending Creation Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (activeClickMarkerRef.current) {
      activeClickMarkerRef.current.remove();
    }

    if (selectedLocation) {
      const marker = L.marker(selectedLocation, { icon: customIcon })
        .bindPopup('<b style="font-family: sans-serif; font-size: 12px; color: #06b6d4;">Reporting point targeted</b>')
        .addTo(map);
      
      marker.openPopup();
      activeClickMarkerRef.current = marker;
    }
  }, [selectedLocation, customIcon]);

  return <div ref={mapContainerRef} className="w-full h-full z-0" />;
}