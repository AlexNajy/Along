import React, { useState, useEffect, useRef } from "react";
import { router } from "expo-router";
import { Text, View, Pressable, StyleSheet } from "react-native";
import Mapbox from '@rnmapbox/maps';
//import mbxDirections from '@mapbox/mapbox-sdk/services/directions';
import Button from "@/components/Button";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { UBC_BOUNDARY, UBC_CENTER_COORDINATE, UBC_MAX_BOUNDS } from "@/constants/boundaries";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

// const directionsClient = mbxDirections({
//     accessToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!
// });

const Map = () => {
    const { colors, isDark } = useTheme();
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [startMarker, setStartMarker] = useState<{ lng: number, lat: number } | null>(null);
    const [endMarker, setEndMarker] = useState<{ lng: number, lat: number } | null>(null);
    const [route, setRoute] = useState<any>(null);
    const lastRoutedLocation = useRef<[number, number] | null>(null);
    const didMountRef = useRef(false);
    const lastRouteTime = useRef(0);

    const distanceFlat = (coord1: [number, number], coord2: [number, number]) => {
        const [x1, y1] = coord1;
        const [x2, y2] = coord2;
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    };

    // const fetchRoute = async () => {
    //     if (!endMarker || (!startMarker && !userLocation)) {
    //         setRoute(null);
    //         return;
    //     }

    //     try {
    //         const response = await directionsClient.getDirections({
    //             profile: 'walking',
    //             waypoints: startMarker
    //                 ? [
    //                     { coordinates: [startMarker.lng, startMarker.lat] },
    //                     { coordinates: [endMarker.lng, endMarker.lat] }
    //                 ]
    //                 : [
    //                     { coordinates: userLocation! },
    //                     { coordinates: [endMarker.lng, endMarker.lat] }
    //                 ],
    //             geometries: 'geojson'
    //         }).send();

    //         const routeGeoJSON = response.body.routes[0].geometry;
    //         setRoute(routeGeoJSON);
    //         console.log("Fetched Route");
    //     } catch (error) {
    //         console.error('Error fetching route:', error);
    //     }
    // };

    const fetchRoute = async () => {
        if (!endMarker || (!startMarker && !userLocation)) {
            setRoute(null);
            return;
        }
    
        const start = startMarker
            ? [startMarker.lng, startMarker.lat]
            : userLocation!;
    
        const end = [endMarker.lng, endMarker.lat];
    
        try {
            const res = await fetch(
                `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-route`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`
                    },
                    body: JSON.stringify({ start, end })
                }
            );
    
            if (!res.ok) {
                console.error('Route fetch error:', await res.text());
                return;
            }
    
            const geojson = await res.json();
            setRoute(geojson);
        } catch (err) {
            console.error('Route fetch failed:', err);
        }
    };

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
            ? distanceFlat(lastRoutedLocation.current, userLocation)
            : Infinity;

        if (distance >= 0.00009) {
            fetchRoute();
            lastRoutedLocation.current = userLocation;
            console.log("User Moved: Fetching Route");
        }
    }, [userLocation]);

    const handleMapPress = (point: any) => {
        const [lng, lat] = point.geometry.coordinates;

        if (!isPointInPolygon(lng, lat)) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setEndMarker({ lng, lat });
    };

    const handleMapLongPress = (point: any) => {
        const [lng, lat] = point.geometry.coordinates;

        if (!isPointInPolygon(lng, lat)) {
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

    const isPointInPolygon = (lng: number, lat: number) => {
        const coords = UBC_BOUNDARY.geometry.coordinates[0];
        let inside = false;

        for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
            const xi = coords[i][0], yi = coords[i][1];
            const xj = coords[j][0], yj = coords[j][1];

            const intersect = ((yi > lat) !== (yj > lat))
                && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
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
                        <View style={styles.marker}>
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
                        <View style={styles.marker}>
                            <Ionicons name="location" color={colors.primary[500]} size={48} />
                        </View>
                    </Mapbox.PointAnnotation>
                )}
            </Mapbox.MapView>

            {route && (
                <View style={styles.button}>
                    <Button
                        title="Create Walk"
                        onPress={() => router.push({
                            pathname: "/(roots)/create_walks",
                            params: {
                                start: startMarker ? JSON.stringify(startMarker) : undefined,
                                end: endMarker ? JSON.stringify(endMarker) : undefined,
                                user: userLocation ? JSON.stringify({ lng: userLocation[0], lat: userLocation[1] }) : undefined,
                            },
                        })
                        }

                        variant="solid"
                        size="solid"
                        fullWidth={false}
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
    },
    marker: {
    }
});

export default Map;