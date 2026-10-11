'use client';
import { useEffect, useRef, useState } from 'react';
import { updateUserLocation } from './api';

export type GeoState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'resolved'; lat: number; lng: number }
  | { status: 'error'; reason: string };

/**
 * Requests the browser's GPS position once and persists it to the backend.
 * Returns the current geo state and a manual retry function.
 */
export function useEmployerLocation(enabled = true) {
  const [geo, setGeo] = useState<GeoState>({ status: 'idle' });
  const sentRef = useRef(false);

  const request = () => {
    if (!navigator?.geolocation) {
      setGeo({ status: 'error', reason: 'Geolocation not supported' });
      return;
    }
    setGeo({ status: 'pending' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGeo({ status: 'resolved', lat, lng });
        if (!sentRef.current) {
          sentRef.current = true;
          updateUserLocation({ latitude: lat, longitude: lng, geo_source: 'gps' }).catch(() => {
            // silent — geo is best-effort
          });
        }
      },
      (err) => {
        setGeo({ status: 'error', reason: err.message });
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 }
    );
  };

  useEffect(() => {
    if (enabled) request();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { geo, requestLocation: request };
}
