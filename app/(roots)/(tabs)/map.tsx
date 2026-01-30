import React, { useState, useEffect } from "react";
import { router } from "expo-router";
import { Text, View, Pressable, StyleSheet } from "react-native";
import Mapbox from '@rnmapbox/maps';
import Button from "@/components/Button";
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

const Map = () => {
    const [markers, setMarkers] = useState<Array<{ id: string, lng: number, lat: number }>>([])

    const handleMapPress = (point: any) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        const coordinates = point.geometry.coordinates
        const newMarker = {
            id: `marker-${Date.now()}`,
            lng: coordinates[0],
            lat: coordinates[1]
        };
        setMarkers([...markers, newMarker])
    };

    return (
        <View style={styles.container}>
            <Mapbox.MapView
                style={styles.map}
                attributionPosition={{ top: 5, left: 8 }}
                styleURL={Mapbox.StyleURL.Street}
                scaleBarEnabled={false}
                onPress={handleMapPress}
            >

                <Mapbox.Camera
                    minZoomLevel={12}
                    maxZoomLevel={18}
                    zoomLevel={14}
                    centerCoordinate={[-123.2460, 49.2606]}
                    animationMode="flyTo"
                    animationDuration={2000}
                    maxBounds={{
                        ne: [-123.2254, 49.2825],
                        sw: [-123.2676, 49.2437],
                    }}
                    pitch={30}
                />

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

                {markers.map(marker => (
                    <Mapbox.PointAnnotation
                        key={marker.id}
                        id={marker.id}
                        coordinate={[marker.lng, marker.lat]}
                        anchor={{ x: 0.5, y: 1 }}
                    >
                        <View style={styles.marker}>
                            <Ionicons name="location" color={"teal"} size={48} />
                        </View>
                    </Mapbox.PointAnnotation>
                ))}
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
