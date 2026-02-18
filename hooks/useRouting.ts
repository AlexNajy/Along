import { useState, useRef } from 'react';

export const useRouting = (routingUrl: string, routingKey: string) => {
    const [route, setRoute] = useState<any>(null);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const lastRoutedLocation = useRef<[number, number] | null>(null);

    const fetchRoute = async (
        start: [number, number],
        end: [number, number],
        onSuccess?: (route: any) => void
    ) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        if (!end) {
            setRoute(null);
            return;
        }

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        setIsLoadingRoute(true);
        setRoute({
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: [start, end]
            }
        });

        try {
            const res = await fetch(routingUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${routingKey}`
                },
                body: JSON.stringify({ start, end }),
                signal: abortController.signal
            });

            if (!res.ok) {
                console.error('Route fetch error:', await res.text());
                setIsLoadingRoute(false);
                return;
            }

            const geojson = await res.json();
            setRoute(geojson);
            onSuccess?.(geojson);
            setIsLoadingRoute(false);
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') return;
            console.error('Route fetch failed:', err);
            setIsLoadingRoute(false);
        }
    };

    const clearRoute = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setRoute(null);
        setIsLoadingRoute(false); 
    };

    return {
        route,
        isLoadingRoute,
        lastRoutedLocation,
        fetchRoute,
        clearRoute
    };
};