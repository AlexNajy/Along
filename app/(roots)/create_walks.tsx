import React, { useState } from "react";
import { Text, View, Pressable, ScrollView, TextInput, KeyboardType  } from "react-native";
import { router } from "expo-router";


type Walk = {
    id: string;
    time: string;
    distance: string;
    from: string;
    to: string;
    status: "active" | "upcoming" | "past";
};


export default function createWalks() {
    const [start, setStart] = useState("");
    const [destination, setDestination] = useState("");
    const [timeText, setTimeText] = useState("");
    const [vibe, setVibe] = useState("");

    const canPost = 
        start.trim() !== "" &&
        destination.trim() !== "" &&
        timeText.trim() !== "" &&
        vibe.trim() !== ""; 


return (
    <View>
        <View className="flex-row items-center px-5 mt-10">
            <Pressable
                onPress={() => router.back()}
                className="h-10 w-10 rounded-full bg-background border border-black-200 items-center justify-center"
            >
                <Text className="text-xl text-black-300">←</Text>
            </Pressable>

            <Text className="ml-4 text-2xl font-rubikBold text-black-300">
                Create Walk
            </Text>
        </View>

        <View>
            <View className="px-5 mt-10">
                <Text className="text-2xl font-rubik text-black-300">
                    Starting Location
                </Text>

                <TextInput
                    value={start}
                    onChangeText={setStart}
                    placeholder="Enter starting location"
                    placeholderTextColor={"#666876"}
                    className="h-14 rounded-2xl bg-background border border-black-200 mt-3 px-4 text-lg font-rubikMedium text-black-300"
                />
            </View>

            <View className="px-5 mt-10">
                <Text className="text-2xl font-rubik text-black-300">
                    Final Location
                </Text>

                <TextInput
                    value={destination}
                    onChangeText={setDestination}
                    placeholder="Enter destination location"
                    placeholderTextColor={"#666876"}
                    className="h-14 rounded-2xl bg-background border border-black-200 mt-10 px-4 text-lg font-rubikMedium text-black-300"
                />
            </View>

            <View className="px-5 mt-10">
                <Text className="text-2xl font-rubik text-black-300">
                    Leaving at
                </Text>

                <TextInput
                    value={timeText}
                    onChangeText={setTimeText}
                    placeholder="Enter destination location"
                    placeholderTextColor="black-300"
                    keyboardType="numbers-and-punctuation"
                    className="h-14 rounded-2xl bg-background border border-black-200 mt-10 px-4 text-lg font-rubikMedium text-black-300"
                />
            </View>


            <View className="mt-8">
                <Text className="text-2xl font-rubik text-black-300 px-5">
                    Walk Vibe
                </Text>

                <View className="flex-row justify-between">
                    <Pressable
                        onPress={() => setVibe("chill")}
                        className={`h-14 w-32 rounded-2xl items-center justify-center mx-12 mt-3 border ${
                            vibe === "chill"
                                ? "bg-primary-300 border-primary-300"
                                : "bg-background border-black-200"
                        }`}
                    >
                        <Text
                            className={`text-lg font-rubikMedium ${
                                vibe === "chill"
                                    ? "text-white"
                                    : "text-black-300"
                            }`}
                        >
                            Chill
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => setVibe("energetic")}
                        className={`h-14 w-32 rounded-2xl items-center justify-center mx-12 mt-3 border ${
                            vibe === "energetic"
                                ? "bg-primary-300 border-primary-300"
                                : "bg-background border-black-200"
                        }`}
                    >
                        <Text
                            className={`text-lg font-rubikMedium ${
                                vibe === "energetic"
                                    ? "text-white"
                                    : "text-black-300"
                            }`}
                        >
                            Energetic
                        </Text>
                    </Pressable>
                </View>
            </View>

            <View className="mt-12">
                <Pressable
                    disabled={!canPost}
                    onPress ={() => {
                        console.log({
                            start,
                            destination,
                            timeText,
                            vibe,
                        });
                    }}
                    className={`h-14 px-8 items-center justify-center rounded-2xl mx-5 ${
                        canPost
                            ? "bg-primary-300"
                            : "bg-black-100"
                    }`}
                >
                    <Text className="text-lg font-rubikMedium" >
                            Create Walk 
                    </Text>
                </Pressable>
            </View>
        </View>
    </View>
);
}

