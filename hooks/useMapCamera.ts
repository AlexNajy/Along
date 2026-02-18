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

        const lngDiff = maxLng - minLng;
        const latDiff = maxLat - minLat;
        const maxDiff = Math.max(lngDiff, latDiff);
        
        let zoom = 15;
        if (maxDiff > 0.05) zoom = 12;      
        else if (maxDiff > 0.02) zoom = 13; 
        else if (maxDiff > 0.01) zoom = 14; 
        else if (maxDiff > 0.005) zoom = 15; 
        else zoom = 16;                      

        setCameraState({ center, zoom, pitch: 30 });

        cameraRef.current?.setCamera({
            bounds: {
                ne: [maxLng, maxLat],
                sw: [minLng, minLat],
                paddingTop: 160,
                paddingRight: 60,
                paddingBottom: 0,
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