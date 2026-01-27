import React from "react";
import { router } from "expo-router";
import { Text, View, Pressable } from "react-native";

const Map = () => {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-2xl font-rubikBold text-black-300">Map</Text>

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