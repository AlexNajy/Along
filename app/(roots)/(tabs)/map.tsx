import React from "react";
import { router } from "expo-router";
import { Text, View, Pressable, StyleSheet} from "react-native";
import Mapbox from '@rnmapbox/maps';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

const Map = () => {
    return (
        <View className="flex-1 items-center justify-center bg-background">

            <Mapbox.MapView
                style={styles.map}
                logoEnabled={true} // legally required don't change 
                attributionEnabled={true} // legally required don't change 
                styleURL={Mapbox.StyleURL.Street}
            >
                <Mapbox.Camera
                    zoomLevel={14}
                    centerCoordinate={[-123.2460, 49.2606]}
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

const styles = StyleSheet.create({
    map: {
        flex: 1,
        width: "100%",
    }
});

export default Map;

