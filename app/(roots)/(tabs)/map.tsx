import React, { useState, useEffect, useRef } from "react";
import { router } from "expo-router";
import { supabase } from "@/libs/supabase";
import { View, StyleSheet } from "react-native";
import Mapbox from '@rnmapbox/maps';
import { distanceMeters, isPointInPolygon } from '@/libs/geometry';
import Button from "@/components/Button";
import WalkPins from "@/components/WalkPins";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Walk } from "@/constants/types";
import { CAMPUSES, CampusConfig } from "@/constants/campuses";
import { useRouteAnimation } from "@/hooks/useRouteAnimation";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

const USER_REROUTE_METERS = 10;

const Map = () => {
    const { colors, isDark } = useTheme();
    const [campus] = useState<CampusConfig>(CAMPUSES.ubc);
    
    const [cameraState, setCameraState] = useState<{
        center: [number, number];
        zoom: number;
        pitch: number;
    }>({
        center: campus.center,
        zoom: 15,
        pitch: 30,
    });

    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [startMarker, setStartMarker] = useState<{ lng: number; lat: number } | null>(null);
    const [endMarker, setEndMarker] = useState<{ lng: number; lat: number } | null>(null);
    const [route, setRoute] = useState<any>(null);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);

    const cameraRef = useRef<Mapbox.Camera>(null);
    const lastRoutedLocation = useRef<[number, number] | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const didMountRef = useRef(false);

    const [walks, setWalks] = useState<Walk[]>([]);
    const [selectedWalkId, setSelectedWalkId] = useState<string | null>(null);

    const { animatedRoute: animatedWalkRoute, animateRoute, clearAnimation } = useRouteAnimation();

    const selectedWalk = selectedWalkId ? walks.find(w => w.id === selectedWalkId) : null;

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

    const fetchWalks = async () => {
        try {
            const { data, error } = await supabase
                .from("walks")
                .select("*")
                .eq("status", "upcoming")
                .order("start_time", { ascending: true });

            if (error) throw error;

            if (data) {
                setWalks(data as Walk[]);
            }
        } catch (err: any) {
            console.error("Failed to fetch walks:", err);
        }
    };

    const fetchRoute = async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        if (!endMarker || (!startMarker && !userLocation)) {
            setRoute(null);
            return;
        }

        const start = startMarker ? [startMarker.lng, startMarker.lat] : userLocation!;
        const end = [endMarker.lng, endMarker.lat];

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
            const res = await fetch(
                `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/${process.env.EXPO_PUBLIC_ROUTING_FUNCTION}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`
                    },
                    body: JSON.stringify({ start, end }),
                    signal: abortController.signal
                }
            );

            if (!res.ok) {
                console.error('Route fetch error:', await res.text());
                setIsLoadingRoute(false);
                return;
            }

            const geojson = await res.json();
            setRoute(geojson);
            fitToBounds(geojson);
            setIsLoadingRoute(false);
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') return;
            console.error('Route fetch failed:', err);
            setIsLoadingRoute(false);
        }
    };

    useEffect(() => {
        fetchWalks();
        const channel = supabase.channel('walks-updates').on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'walks' },
            () => fetchWalks()
        ).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    useEffect(() => {
        if (userLocation && !selectedWalkId && !route) {
            const [lng, lat] = userLocation;
            if (isPointInPolygon(lng, lat, campus.boundary)) {
                setCameraState(prev => ({ ...prev, center: userLocation }));
            }
        }
    }, [userLocation, selectedWalkId, route, campus.boundary]);

    useEffect(() => {
        if (selectedWalk?.route) {
            fitToBounds(selectedWalk.route);
        }
    }, [selectedWalk]);

    useEffect(() => {
        if (didMountRef.current) {
            fetchRoute();
        } else {
            didMountRef.current = true;
        }
    }, [startMarker, endMarker]);

    useEffect(() => {
        if (!userLocation || !endMarker || startMarker) return;
        const distance = lastRoutedLocation.current
            ? distanceMeters(lastRoutedLocation.current, userLocation)
            : Infinity;
        if (distance >= USER_REROUTE_METERS) {
            fetchRoute();
            lastRoutedLocation.current = userLocation;
        }
    }, [userLocation]);

    useEffect(() => {
        if (!selectedWalkId) clearAnimation();
    }, [selectedWalkId]);

    const validatePoint = (lng: number, lat: number) => {
        if (!isPointInPolygon(lng, lat, campus.boundary)) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return false;
        }
        return true;
    };

    const handleMapPress = (point: any) => {
        const [lng, lat] = point.geometry.coordinates;
        if (!validatePoint(lng, lat)) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setEndMarker({ lng, lat });
        setSelectedWalkId(null);
    };

    const handleMapLongPress = (point: any) => {
        const [lng, lat] = point.geometry.coordinates;
        if (!validatePoint(lng, lat)) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setStartMarker({ lng, lat });
    };

    const handleMarkerPress = (type: 'start' | 'end') => {
        if (type === 'start') {
            setStartMarker(null);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
            setEndMarker(startMarker);
            setStartMarker(null);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        }
    };

    const handleWalkPress = (walkId: string) => {
        if (selectedWalkId === walkId) {
            setSelectedWalkId(null);
        } else {
            const selectedWalk = walks.find(w => w.id === walkId);
            setEndMarker(null);
            setStartMarker(null);
            setRoute(null);
            setSelectedWalkId(walkId);
            if (selectedWalk?.route) {
                animateRoute(selectedWalk.route);
            }
        }
    };

    const styleURL = isDark
        ? 'mapbox://styles/alongapp/cmldiepmw007101sz252obyok/draft'
        : 'mapbox://styles/alongapp/cmlcnlosl006101szfwf099ap/draft';

    return (
        <View style={styles.container}>
            <Mapbox.MapView
                key={styleURL}
                style={styles.map}
                attributionPosition={{ top: -24, left: 10 }}
                styleURL={styleURL}
                scaleBarEnabled={false}
                onPress={handleMapPress}
                onLongPress={handleMapLongPress}
                pitchEnabled={false}
                gestureSettings={{ doubleTapToZoomInEnabled: false }}
            >
                <Mapbox.Camera
                    ref={cameraRef}
                    minZoomLevel={12}
                    maxZoomLevel={18}
                    zoomLevel={cameraState.zoom}
                    pitch={cameraState.pitch}
                    animationMode="flyTo"
                    animationDuration={2000}
                    maxBounds={campus.maxBounds}
                    centerCoordinate={cameraState.center}
                />

                <Mapbox.UserLocation
                    visible={true}
                    showsUserHeadingIndicator={true}
                    onUpdate={(location) => {
                        const lng = location.coords.longitude;
                        const lat = location.coords.latitude;
                        if (typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat)) {
                            setUserLocation([lng, lat]);
                        }
                    }}
                />

                <Mapbox.ShapeSource id="campus-boundary" shape={campus.boundary}>
                    <Mapbox.LineLayer
                        id="campus-boundary-line"
                        style={{
                            lineColor: campus.themeColor,
                            lineWidth: 3,
                            lineDasharray: [4, 2],
                            lineOpacity: 0.8,
                        }}
                    />
                </Mapbox.ShapeSource>

                {route && !selectedWalkId && (
                    <Mapbox.ShapeSource id="route" shape={route}>
                        <Mapbox.LineLayer
                            id="route-line-halo"
                            style={{
                                lineColor: 'white',
                                lineWidth: 8,
                                lineOpacity: isLoadingRoute ? 0.15 : 0.3,
                                lineCap: 'round',
                                lineJoin: 'round',
                            }}
                        />
                        <Mapbox.LineLayer
                            id="route-line"
                            style={{
                                lineColor: '#4dacff',
                                lineWidth: 4,
                                lineCap: 'round',
                                lineJoin: 'round',
                                lineDasharray: isLoadingRoute ? [2, 2] : [],
                                lineOpacity: isLoadingRoute ? 0.5 : 1,
                            }}
                        />
                    </Mapbox.ShapeSource>
                )}

                {animatedWalkRoute && selectedWalkId && (
                    <Mapbox.ShapeSource id="selected-walk-route" shape={animatedWalkRoute}>
                        <Mapbox.LineLayer
                            id="selected-walk-route-halo"
                            style={{
                                lineColor: 'white',
                                lineWidth: 8,
                                lineOpacity: 0.3,
                                lineCap: 'round',
                                lineJoin: 'round',
                            }}
                        />
                        <Mapbox.LineLayer
                            id="selected-walk-route-line"
                            style={{
                                lineColor: '#4dacff',
                                lineWidth: 5,
                                lineCap: 'round',
                                lineJoin: 'round',
                            }}
                        />
                    </Mapbox.ShapeSource>
                )}

                {startMarker && (
                    <Mapbox.PointAnnotation
                        id="start-marker"
                        coordinate={[startMarker.lng, startMarker.lat]}
                        anchor={{ x: 0.5, y: 1 }}
                        onSelected={() => handleMarkerPress('start')}
                    >
                        <View style={[]}>
                            <Ionicons name="location" color={colors.secondary[500]} size={48} />
                        </View>
                    </Mapbox.PointAnnotation>
                )}

                {endMarker && (
                    <Mapbox.PointAnnotation
                        id="end-marker"
                        coordinate={[endMarker.lng, endMarker.lat]}
                        anchor={{ x: 0.5, y: 1 }}
                        onSelected={() => handleMarkerPress('end')}
                    >
                        <View style={[]}>
                            <Ionicons name="location" color={colors.primary[500]} size={48} />
                        </View>
                    </Mapbox.PointAnnotation>
                )}

                <WalkPins
                    walks={walks}
                    onWalkPress={handleWalkPress}
                    selectedWalkId={selectedWalkId}
                />
            </Mapbox.MapView>

            {route && !selectedWalkId && (
                <View style={styles.button}>
                    <Button
                        title={isLoadingRoute ? "Fetching..." : "Go Walk"}
                        onPress={() => router.push({
                            pathname: "/(roots)/create_walks",
                            params: {
                                start: startMarker ? JSON.stringify(startMarker) : undefined,
                                end: endMarker ? JSON.stringify(endMarker) : undefined,
                                user: userLocation ? JSON.stringify({ lng: userLocation[0], lat: userLocation[1] }) : undefined,
                                route: route ? JSON.stringify(route) : undefined,
                            },
                        })}
                        variant="solid"
                        size="solid"
                        fullWidth={false}
                        disabled={isLoadingRoute}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
        width: "100%",
    },
    button: {
        position: "absolute",
        bottom: 30,
        alignSelf: "center",
        height: 56,
    }
});

export default Map;