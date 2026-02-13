import { useState, useRef } from 'react';
import Mapbox from '@rnmapbox/maps';

export const useMapCamera = (initialCenter: [number, number]) => {
    const [cameraState, setCameraState] = useState({
        center: initialCenter,
        zoom: 15,
        pitch: 30,
    });
    
    const cameraRef = useRef<Mapbox.Camera>(null);

    const fitToBounds = (routeGeoJSON: any) => {
        if (!routeGeoJSON?.geometry?.coordinates) return;

        const coordinates = routeGeoJSON.geometry.coordinates;
        const lngs = coordinates.map((coord: [number, number]) => coord[0]);
        const lats = coordinates.map((coord: [number, number]) => coord[1]);
        
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const center: [number, number] = [(minLng + maxLng) / 2, (minLat + maxLat) / 2];

        setCameraState({ center, zoom: 15, pitch: 30 });

        cameraRef.current?.setCamera({
            bounds: {
                ne: [maxLng, maxLat],
                sw: [minLng, minLat],
                paddingTop: 80,
                paddingRight: 60,
                paddingBottom: 200,
                paddingLeft: 60,
            },
            pitch: 30,
            animationDuration: 1000,
        });
    };

    const updateCameraCenter = (center: [number, number]) => {
        setCameraState(prev => ({ ...prev, center }));
    };

    return { cameraState, cameraRef, fitToBounds, updateCameraCenter };
};