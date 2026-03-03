import React, { useState, useEffect, useRef } from "react";
import { router } from "expo-router";
import { View, StyleSheet, Text, Animated } from "react-native";
import Mapbox from '@rnmapbox/maps';
import { distanceMeters, isPointInPolygon, calculateDistance } from '@/libs/geometry';
import Button from "@/components/Button";
import WalkPins from "@/components/WalkPins";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CAMPUSES, CampusConfig } from "@/constants/campuses";
import { useRouteAnimation } from "@/hooks/useRouteAnimation";
import { useMapCamera } from "@/hooks/useMapCamera";
import { useRouting } from "@/hooks/useRouting";
import { useWalks } from "@/hooks/useWalks";
import { WalkModal } from '@/components/WalkModal';
import { useReverseGeocode } from "@/hooks/useReverseGeocode";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { triggerOfflineJiggle } from "@/app/_layout";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

const USER_REROUTE_METERS = 10;

const Map = () => {
    const { isConnected } = useNetworkStatus();
    const { colors, isDark } = useTheme();
    const [campus] = useState<CampusConfig>(CAMPUSES.ubc);
    const [modalVisible, setModalVisible] = useState(false);

    const { cameraState, cameraRef, fitToBounds, updateCameraCenter } = useMapCamera(campus.center);
    const { walks, selectedWalkId, setSelectedWalkId, selectedWalk } = useWalks();
    const { animatedRoute: animatedWalkRoute, animateRoute, clearAnimation } = useRouteAnimation();
    const {
        route,
        isLoadingRoute,
        lastRoutedLocation,
        fetchRoute,
        clearRoute
    } = useRouting(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/${process.env.EXPO_PUBLIC_ROUTING_FUNCTION}`,
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [startMarker, setStartMarker] = useState<{ lng: number; lat: number } | null>(null);
    const [endMarker, setEndMarker] = useState<{ lng: number; lat: number } | null>(null);

    const userRouteStart = startMarker ?? (userLocation ? { lng: userLocation[0], lat: userLocation[1] } : null);
    const userRouteEnd = endMarker;
    const { startLocation: userStartLoc, endLocation: userEndLoc } = useReverseGeocode(
        userRouteStart,
        userRouteEnd
    );

    const didMountRef = useRef(false);

    useEffect(() => {
        if (!isConnected) {
            setModalVisible(false);
            setStartMarker(null);
            setEndMarker(null);
            clearRoute();
            setSelectedWalkId(null);
        }
    }, [isConnected]);


    useEffect(() => {
        if (userLocation && !selectedWalkId && !route) {
            const [lng, lat] = userLocation;
            if (isPointInPolygon(lng, lat, campus.boundary)) {
                updateCameraCenter(userLocation);
            }
        }
    }, [userLocation, selectedWalkId, route, campus.boundary]);

    useEffect(() => {
        if (selectedWalk?.route) {
            fitToBounds(selectedWalk.route);
        }
    }, [selectedWalk]);

    useEffect(() => {
        if (route && !selectedWalkId && !isLoadingRoute) {
            setModalVisible(true);
        }
    }, [route, selectedWalkId, isLoadingRoute]);

    useEffect(() => {
        if (!route && !selectedWalkId) {
            setModalVisible(false);
        }
    }, [route, selectedWalkId]);

    useEffect(() => {
        if (!isConnected) return;

        if (didMountRef.current) {
            if (!endMarker || (!startMarker && !userLocation)) {
                clearRoute();
                return;
            }

            const start = startMarker ? [startMarker.lng, startMarker.lat] : userLocation!;
            const end = [endMarker.lng, endMarker.lat];

            fetchRoute(start as [number, number], end as [number, number], fitToBounds);
        } else {
            didMountRef.current = true;
        }
    }, [startMarker, endMarker, isConnected]);

    useEffect(() => {
        if (!isConnected || !userLocation || !endMarker || startMarker) return;

        const distance = lastRoutedLocation.current
            ? distanceMeters(lastRoutedLocation.current, userLocation)
            : Infinity;

        if (distance >= USER_REROUTE_METERS) {
            const end = [endMarker.lng, endMarker.lat];
            fetchRoute(userLocation, end as [number, number], fitToBounds);
            lastRoutedLocation.current = userLocation;
        }
    }, [userLocation, isConnected]);

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

    const handleOfflineAction = (action: () => void, message?: string) => {
        if (!isConnected) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            triggerOfflineJiggle?.();
            return;
        }
        action();
    };

    const handleMapPress = (point: any) => {
        handleOfflineAction(() => {
            const [lng, lat] = point.geometry.coordinates;
            if (!validatePoint(lng, lat)) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setEndMarker({ lng, lat });
            setSelectedWalkId(null);
        });
    };

    const handleMapLongPress = (point: any) => {
        handleOfflineAction(() => {
            const [lng, lat] = point.geometry.coordinates;
            if (!validatePoint(lng, lat)) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setStartMarker({ lng, lat });
        });
    };

    const handleMarkerPress = (type: 'start' | 'end') => {
        handleOfflineAction(() => {
            if (type === 'start') {
                setStartMarker(null);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } else {
                setEndMarker(startMarker);
                setStartMarker(null);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
            }
        });
    };

    const handleWalkPress = (walkId: string) => {
        if (selectedWalkId === walkId) {
            setSelectedWalkId(null);
            setModalVisible(false);
        } else {
            const selectedWalk = walks.find(w => w.id === walkId);
            setEndMarker(null);
            setStartMarker(null);
            clearRoute();
            setSelectedWalkId(walkId);
            setModalVisible(true);
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
                        <View>
                            <Ionicons name="location" color={colors.primary[500]} size={48} />
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
                        <View>
                            <Ionicons name="location" color={colors.secondary[500]} size={48} />
                        </View>
                    </Mapbox.PointAnnotation>
                )}

                <WalkPins
                    walks={walks}
                    onWalkPress={handleWalkPress}
                    selectedWalkId={selectedWalkId}
                />
            </Mapbox.MapView>

            <WalkModal
                visible={modalVisible}
                onClose={() => {
                    setModalVisible(false);
                    if (selectedWalkId) {
                        setSelectedWalkId(null);
                    } else {
                        setEndMarker(null);
                        setStartMarker(null);
                        clearRoute();
                    }
                }}
                selectedWalk={selectedWalk}
                userRoute={route && !selectedWalkId ? {
                    start: userStartLoc || 'Your location',
                    end: userEndLoc || 'Selected destination',
                    distance: calculateDistance(route),
                } : null}
            />

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
                                distance: calculateDistance(route),
                            },
                        })}
                        variant="solid"
                        size="solid"
                        fullWidth={false}
                        disabled={isLoadingRoute || !isConnected}
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
});

export default Map;