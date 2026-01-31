import React, { useState, useEffect } from "react";
import { router } from "expo-router";
import { Text, View, Pressable, StyleSheet } from "react-native";
import Mapbox from '@rnmapbox/maps';
import Button from "@/components/Button";
import { colors } from "@/constants/colors";
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

const UBC_BOUNDS = {
    ne: [-123.2254, 49.2825],  // top-right 
    sw: [-123.2676, 49.2437],  // bottom-left
  };  

const Map = () => {
    const [markers, setMarkers] = useState<Array<{ id: string, lng: number, lat: number }>>([])

    const handleMapPress = (point: any) => {
        const [lng, lat] = point.geometry.coordinates

        if (
            lng < UBC_BOUNDS.sw[0] || lng > UBC_BOUNDS.ne[0] ||
            lat < UBC_BOUNDS.sw[1] || lat > UBC_BOUNDS.ne[1]
        ) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            console.log("Marker outside UBC bounds, ignoring.");
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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
