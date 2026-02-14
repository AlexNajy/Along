import { useState, useEffect } from 'react';
import { supabase } from '@/libs/supabase';

type Coordinates = {
  lat: number;
  lng: number;
} | null;

export const useReverseGeocode = (startCoords: Coordinates, endCoords: Coordinates) => {
  const [startLocation, setStartLocation] = useState<string>('');
  const [endLocation, setEndLocation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    const { data, error } = await supabase.functions.invoke("reverse_geocode", {
      body: { lng, lat },
    });

    if (error) {
      console.error("Reverse geocode error:", error);
      return null;
    }
    
    return (data?.place_name as string | null) ?? null;
  };

  useEffect(() => {
    const fetchLocations = async () => {
      if (!startCoords?.lat || !startCoords?.lng || !endCoords?.lat || !endCoords?.lng) {
        return;
      }

      setIsLoading(true);

      try {
        const [startName, endName] = await Promise.all([
          reverseGeocode(startCoords.lat, startCoords.lng),
          reverseGeocode(endCoords.lat, endCoords.lng),
        ]);

        setStartLocation(
          startName ?? `${startCoords.lat.toFixed(5)}, ${startCoords.lng.toFixed(5)}`
        );
        setEndLocation(
          endName ?? `${endCoords.lat.toFixed(5)}, ${endCoords.lng.toFixed(5)}`
        );
      } catch {
        setStartLocation(`${startCoords.lat.toFixed(5)}, ${startCoords.lng.toFixed(5)}`);
        setEndLocation(`${endCoords.lat.toFixed(5)}, ${endCoords.lng.toFixed(5)}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, [startCoords?.lat, startCoords?.lng, endCoords?.lat, endCoords?.lng]);

  return { startLocation, endLocation, isLoading };
};