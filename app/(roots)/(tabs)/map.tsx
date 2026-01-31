import React, { useState, useEffect } from "react";
import { router } from "expo-router";
import { Text, View, Pressable, StyleSheet } from "react-native";
import Mapbox from '@rnmapbox/maps';
import Button from "@/components/Button";
import { colors } from "@/constants/colors";
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { UBC_BOUNDARY, UBC_CENTER_COORDINATE, UBC_MAX_BOUNDS } from "@/constants/boundaries";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

const Map = () => {
    const [markers, setMarkers] = useState<Array<{ id: string, lng: number, lat: number }>>([])

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

    const handleMapPress = (point: any) => {
        const [lng, lat] = point.geometry.coordinates

        if (!isPointInPolygon(lng, lat)) {
            Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Error
              )
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

        const newMarker = {
            id: `marker-${Date.now()}`,
            lng,
            lat,
        };
        setMarkers([...markers, newMarker])
    };

    const handleMarkerPress = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        setMarkers(prev => prev.filter(marker => marker.id !== id));
    };

    console.log({ markers })

    return (
        <View style={styles.container}>
            <Mapbox.MapView
                style={styles.map}
                attributionPosition={{ top: 5, left: 8 }}
                styleURL={Mapbox.StyleURL.Street}
                scaleBarEnabled={false}
                onPress={handleMapPress}
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
                            fillExtrusionColor: '#aaa',
                            fillExtrusionOpacity: 0.6,
                        }}
                    />
                </Mapbox.VectorSource>

                {markers.map((marker, index) => {
                    const color = index === 0
                        ? colors.secondary[700]
                        : colors.primary[700];

                    return (
                        <Mapbox.PointAnnotation
                            key={marker.id}
                            id={marker.id}
                            coordinate={[marker.lng, marker.lat]}
                            anchor={{ x: 0.5, y: 1 }}
                            onSelected={() => handleMarkerPress(marker.id)}
                        >
                            <View style={styles.marker}>
                                <Ionicons name="location" color={color} size={48} />
                            </View>
                        </Mapbox.PointAnnotation>
                    );
                })}
            </Mapbox.MapView>

            <View style={styles.button}>
                <Button
                    title="Create Walk"
                    onPress={() => router.push("/(roots)/create_walks")}
                    variant="solid"
                    size="solid"
                    fullWidth={false}
                />
            </View>

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
