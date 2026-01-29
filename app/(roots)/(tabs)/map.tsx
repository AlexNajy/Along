import React from "react";
import { router } from "expo-router";
import { Text, View, Pressable, StyleSheet } from "react-native";
import Mapbox from '@rnmapbox/maps';
import Button from "@/components/Button";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

const Map = () => {
    return (
        <View style={styles.container}>
            <Mapbox.MapView
                style={styles.map}
                // logoEnabled={true} // legally required don't change
                // attributionEnabled={true} // legally required don't change
                attributionPosition={{ top: 5, left: 8 }}
                styleURL={Mapbox.StyleURL.TrafficNight}
                scaleBarEnabled={false}
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
                    <Mapbox.VectorSource id="mapbox-buildings" url="mapbox://mapbox.mapbox-streets-v8">
                        <Mapbox.FillExtrusionLayer
                            id="3d-buildings"
                            sourceLayerID="building"
                            minZoomLevel={12}  // required
                            maxZoomLevel={22}  // required
                            style={{
                                fillExtrusionHeight: ['get', 'height'],
                                fillExtrusionBase: ['get', 'min_height'],
                                fillExtrusionColor: '#aaa',
                                fillExtrusionOpacity: 0.6,
                            }}
                        />
                    </Mapbox.VectorSource>

                </Mapbox.VectorSource>
            </Mapbox.MapView>


            {/* <Pressable
                onPress={() => router.push("/(roots)/create_walks")}
                style={styles.button}
                className="h-14 items-center justify-center rounded-2xl bg-primary-600" >
                <Text className="text-lg font-rubikMedium text-white">
                    Create a walk
                </Text>
            </Pressable> */}

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
    }
});

export default Map;
