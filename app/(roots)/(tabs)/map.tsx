import React from "react";
import { router } from "expo-router";
import { Text, View, Pressable } from "react-native";
import Mapbox from '@rnmapbox/maps';

Mapbox.setAccessToken(process.env.MAPBOX_ACCESS_TOKEN!);

const Map = () => {
    return (
        <View className="flex-1 items-center justify-center bg-background">
            <Text className="text-2xl font-rubikBold text-black-300">Map</Text>

            <Mapbox.MapView
                styleURL={Mapbox.StyleURL.Street}
            >
                <Mapbox.Camera
                    zoomLevel={14}
                    centerCoordinate={[49.2593, 123.2475]}
                    animationMode="flyTo"
                    animationDuration={2000}
                />
            </Mapbox.MapView>

            <Pressable
                onPress={() => router.push("/(roots)/create_walks")}
                className="h-14 px-8 items-center justify-center bg-primary-300 rounded-2xl mt-6"
            >
                <Text className="text-lg font-rubikMedium text-white">
                    Create a walk
                </Text>
            </Pressable>

        </View>
    );
};

export default Map;