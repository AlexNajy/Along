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
import { UBC_BOUNDARY, UBC_CENTER_COORDINATE, UBC_MAX_BOUNDS } from "@/constants/boundaries";
import { Walk } from "@/constants/types";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

const USER_REROUTE_METERS = 10;

const Map = () => {
    const { colors, isDark } = useTheme();
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [startMarker, setStartMarker] = useState<{ lng: number, lat: number } | null>(null);
    const [endMarker, setEndMarker] = useState<{ lng: number, lat: number } | null>(null);
    const [route, setRoute] = useState<any>(null);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    const lastRoutedLocation = useRef<[number, number] | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const didMountRef = useRef(false);
    const [walks, setWalks] = useState<Walk[]>([]);

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

        const start = startMarker
            ? [startMarker.lng, startMarker.lat]
            : userLocation!;
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
            setIsLoadingRoute(false);
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                console.log('Route fetch cancelled');
                return;
            }
            console.error('Route fetch failed:', err);
            setIsLoadingRoute(false);
        }
    };

    useEffect(() => {
        fetchWalks();
    }, []);

    useEffect(() => {
        if (didMountRef.current) {
            fetchRoute();
            console.log("Marker Effect Triggered: Fetching Route");
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

    const handleMapPress = (point: any) => {
        const [lng, lat] = point.geometry.coordinates;

        if (!isPointInPolygon(lng, lat, UBC_BOUNDARY)) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setEndMarker({ lng, lat });
    };

    const handleMapLongPress = (point: any) => {
        const [lng, lat] = point.geometry.coordinates;

        if (!isPointInPolygon(lng, lat, UBC_BOUNDARY)) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setStartMarker({ lng, lat });
    };

    const handleMarkerPress = (type: 'start' | 'end') => {
        if (type === 'start') {
            setStartMarker(null)
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
            setEndMarker(startMarker)
            setStartMarker(null)
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        }
    };

    return (
        <View style={styles.container}>
            <Mapbox.MapView
                style={styles.map}
                attributionPosition={{ top: -24, left: 10 }}
                styleURL={isDark ? Mapbox.StyleURL.Street : Mapbox.StyleURL.Street}
                scaleBarEnabled={false}
                onPress={handleMapPress}
                onLongPress={handleMapLongPress}
                pitchEnabled={false}
            >
                <Mapbox.Camera
                    minZoomLevel={12}
                    maxZoomLevel={18}
                    zoomLevel={15}
                    animationMode="flyTo"
                    animationDuration={2000}
                    maxBounds={UBC_MAX_BOUNDS}
                    centerCoordinate={UBC_CENTER_COORDINATE}
                    pitch={30}
                />

                <Mapbox.UserLocation
                    visible={true}
                    showsUserHeadingIndicator={true}
                    onUpdate={(location) => {
                        setUserLocation([location.coords.longitude, location.coords.latitude]);
                    }}
                />

                <Mapbox.ShapeSource id="ubc-boundary" shape={UBC_BOUNDARY}>
                    <Mapbox.LineLayer
                        id="ubc-boundary-line"
                        style={{
                            lineColor: colors.ubc.secondary,
                            lineWidth: 3,
                            lineDasharray: [4, 2],
                            lineOpacity: 0.8,
                        }}
                    />
                </Mapbox.ShapeSource>

                <Mapbox.VectorSource id="mapbox-buildings" url="mapbox://mapbox.mapbox-streets-v8">
                    <Mapbox.FillExtrusionLayer
                        id="3d-buildings"
                        sourceLayerID="building"
                        minZoomLevel={12}
                        maxZoomLevel={22}
                        style={{
                            fillExtrusionHeight: ['get', 'height'],
                            fillExtrusionBase: ['get', 'min_height'],
                            fillExtrusionColor: isDark ? '#555' : '#aaa',
                            fillExtrusionOpacity: 0.6,
                        }}
                    />
                </Mapbox.VectorSource>

                {route && (
                    <Mapbox.ShapeSource id="route" shape={route}>
                        <Mapbox.LineLayer
                            id="route-line"
                            style={{
                                lineColor: colors.secondary[300],
                                lineWidth: 4,
                                lineCap: 'round',
                                lineJoin: 'round',
                                lineDasharray: isLoadingRoute ? [2, 2] : [],
                                lineOpacity: isLoadingRoute ? 0.5 : 1,
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

                <WalkPins walks={walks} />

            </Mapbox.MapView>

            {route && (
                <View style={styles.button}>
                    <Button
                        title={isLoadingRoute ? "Fetching..." : "Go Walk"}
                        onPress={() => router.push({
                            pathname: "/(roots)/create_walks",
                            params: {
                                start: startMarker ? JSON.stringify(startMarker) : undefined,
                                end: endMarker ? JSON.stringify(endMarker) : undefined,
                                user: userLocation ? JSON.stringify({ lng: userLocation[0], lat: userLocation[1] }) : undefined,
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