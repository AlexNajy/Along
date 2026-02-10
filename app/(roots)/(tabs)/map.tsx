import React, { useState, useEffect, useRef } from "react";
import { router } from "expo-router";
import { supabase } from "@/libs/supabase";
import { View, StyleSheet, Animated } from "react-native";
import Mapbox from '@rnmapbox/maps';
import { distanceMeters, isPointInPolygon } from '@/libs/geometry';
import Button from "@/components/Button";
import WalkPins from "@/components/WalkPins";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Walk } from "@/constants/types";
import { CAMPUSES, CampusConfig } from "@/constants/campuses";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

const USER_REROUTE_METERS = 10;

const Map = () => {
    const { colors, isDark } = useTheme();

    const [campus] = useState<CampusConfig>(CAMPUSES.ubc);
    const [focus, setFocus] = useState<[number, number]>(campus.center);

    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [startMarker, setStartMarker] = useState<{ lng: number; lat: number } | null>(null);
    const [endMarker, setEndMarker] = useState<{ lng: number; lat: number } | null>(null);

    const [route, setRoute] = useState<any>(null);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);

    const lastRoutedLocation = useRef<[number, number] | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const didMountRef = useRef(false);

    const [walks, setWalks] = useState<Walk[]>([]);
    const [selectedWalkId, setSelectedWalkId] = useState<string | null>(null);

    const [animatedRoute, setAnimatedRoute] = useState<any>(null);
    const animationProgress = useRef(new Animated.Value(0)).current;

    // Get value of selected walk
    const selectedWalk = selectedWalkId
        ? walks.find(w => w.id === selectedWalkId)
        : null;

    // Ensure focus is always valid coordinates
    const safeFocus = focus &&
        typeof focus[0] === 'number' &&
        typeof focus[1] === 'number' &&
        !isNaN(focus[0]) &&
        !isNaN(focus[1])
        ? focus
        : campus.center;

    // Draw route
    const animateRoute = (fullRoute: any) => {
        if (!fullRoute?.geometry?.coordinates) return;

        const coordinates = fullRoute.geometry.coordinates;
        const totalPoints = coordinates.length;

        animationProgress.setValue(0);
        setAnimatedRoute({
            ...fullRoute,
            geometry: {
                ...fullRoute.geometry,
                coordinates: [coordinates[0]] 
            }
        });

        Animated.timing(animationProgress, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
        }).start();

        const listenerId = animationProgress.addListener(({ value }) => {
            const pointsToShow = Math.floor(value * totalPoints);
            const visibleCoordinates = coordinates.slice(0, Math.max(1, pointsToShow));

            setAnimatedRoute({
                ...fullRoute,
                geometry: {
                    ...fullRoute.geometry,
                    coordinates: visibleCoordinates
                }
            });
        });

        setTimeout(() => {
            animationProgress.removeListener(listenerId);
            setAnimatedRoute(fullRoute); 
        }, 1500);
    };

    // GET all upcoming walks
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

    // POST for route from OSR
    const fetchRoute = async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        if (!endMarker || (!startMarker && !userLocation)) {
            setRoute(null);
            setAnimatedRoute(null);
            return;
        }

        const start = startMarker
            ? [startMarker.lng, startMarker.lat]
            : userLocation!;
        const end = [endMarker.lng, endMarker.lat];

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        setIsLoadingRoute(true);
        const straightLine = {
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: [start, end]
            }
        };
        setRoute(straightLine);
        setAnimatedRoute(straightLine);

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
            animateRoute(geojson);
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

    // UPDATE walks on postgres realtime
    useEffect(() => {
        fetchWalks();

        const channel = supabase
            .channel('walks-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'walks',
                },
                (payload) => {
                    console.log('Walks changed:', payload);
                    fetchWalks();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Set focus for camera
    useEffect(() => {
        if (userLocation && userLocation.length === 2) {
            const [lng, lat] = userLocation;
            if (isPointInPolygon(lng, lat, campus.boundary)) {
                setFocus(userLocation);
            } else {
                setFocus(campus.center);
            }
        } else if (endMarker) {
            setFocus([endMarker.lng, endMarker.lat]);
        } else {
            setFocus(campus.center)
        }
    }, [userLocation, endMarker, campus.center]);

    // Reroute on marker change after mount
    useEffect(() => {
        if (didMountRef.current) {
            fetchRoute();
        } else {
            didMountRef.current = true;
        }
    }, [startMarker, endMarker]);

    // Reroute on user X meter stray 
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

    // Check point is in bounds
    const validatePoint = (lng: number, lat: number) => {
        if (!isPointInPolygon(lng, lat, campus.boundary)) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return false;
        }
        return true;
    };

    // Set end marker and clear selected walk
    const handleMapPress = (point: any) => {
        const [lng, lat] = point.geometry.coordinates;
        if (!validatePoint(lng, lat)) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setEndMarker({ lng, lat });
        setSelectedWalkId(null);
    };

    // Set start marker
    const handleMapLongPress = (point: any) => {
        const [lng, lat] = point.geometry.coordinates;
        if (!validatePoint(lng, lat)) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setStartMarker({ lng, lat });
    };

    // Remove marker
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

    // Select walk and clear markers
    const handleWalkPress = (walkId: string) => {
        if (selectedWalkId === walkId) {
            setSelectedWalkId(null);
            console.log('Deselected walk');
        } else {
            setSelectedWalkId(walkId);
            const selectedWalk = walks.find(w => w.id === walkId);
            console.log('Selected walk:', selectedWalk);
            
            setEndMarker(null);
            setStartMarker(null);
            setRoute(null);
            setAnimatedRoute(null); 

            if (selectedWalk?.route) {
                animateRoute(selectedWalk.route); 
            }
        }
    };

    // TODO put styles in .env
    const styleURL = isDark
        ? 'mapbox://styles/alongapp/cmldiepmw007101sz252obyok/draft'
        : 'mapbox://styles/alongapp/cmlcnlosl006101szfwf099ap/draft';

    return (
        <View style={styles.container}>
            {/* Map */}
            <Mapbox.MapView
                key={styleURL}
                style={styles.map}
                attributionPosition={{ top: -24, left: 10 }}
                styleURL={styleURL}
                scaleBarEnabled={false}
                onPress={handleMapPress}
                onLongPress={handleMapLongPress}
                pitchEnabled={false}
            >
                {/* Camera */}
                <Mapbox.Camera
                    minZoomLevel={12}
                    maxZoomLevel={18}
                    zoomLevel={15}
                    pitch={45}
                    animationMode="flyTo"
                    animationDuration={2000}
                    maxBounds={campus.maxBounds}
                    centerCoordinate={safeFocus}
                />

                {/* User */}
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

                {/* Boundary */}
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

                {/* User Route */}
                {animatedRoute && !selectedWalkId && (
                    <Mapbox.ShapeSource id="route" shape={animatedRoute}>
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

                {/* Selected Route */}
                {selectedWalk && animatedRoute && selectedWalkId && (
                    <Mapbox.ShapeSource id="selected-walk-route" shape={animatedRoute}>
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
                                lineColor: '#A855F7',
                                lineWidth: 5,
                                lineCap: 'round',
                                lineJoin: 'round',
                            }}
                        />
                    </Mapbox.ShapeSource>
                )}


                {/* Start Marker */}
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

                {/* End Marker */}
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

                {/* Walks */}
                <WalkPins
                    walks={walks}
                    onWalkPress={handleWalkPress}
                    selectedWalkId={selectedWalkId}
                />

            </Mapbox.MapView>

            {/* Create Walk */}
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