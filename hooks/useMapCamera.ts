import { useRef } from 'react';
import Mapbox from '@rnmapbox/maps';
import { isPointInPolygon } from '@/libs/geometry';

export const useMapCamera = () => {
    const cameraRef = useRef<Mapbox.Camera>(null);

    const focusOnRoute = (routeGeoJSON: any) => {
        if (!routeGeoJSON?.geometry?.coordinates) return;

        const coordinates = routeGeoJSON.geometry.coordinates;
        const lngs = coordinates.map((c: [number, number]) => c[0]);
        const lats = coordinates.map((c: [number, number]) => c[1]);

        cameraRef.current?.setCamera({
            bounds: {
                ne: [Math.max(...lngs), Math.max(...lats)],
                sw: [Math.min(...lngs), Math.min(...lats)],
                paddingTop: 160,
                paddingRight: 60,
                paddingBottom: 260,
                paddingLeft: 60,
            },
            pitch: 30,
            animationMode: 'flyTo',
            animationDuration: 1000,
        });
    };

    const focusOnUser = (
        userLocation: [number, number] | null,
        boundary: any,
        fallbackCenter: [number, number]
    ) => {
        const center =
            userLocation && isPointInPolygon(userLocation[0], userLocation[1], boundary)
                ? userLocation
                : fallbackCenter;

        cameraRef.current?.setCamera({
            centerCoordinate: center,
            zoomLevel: 15,
            pitch: 30,
            animationMode: 'flyTo',
            animationDuration: 800,
        });
    };

    return { cameraRef, focusOnRoute, focusOnUser };
};