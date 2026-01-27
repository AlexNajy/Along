import React, { useState } from "react";
import { Text, View, Pressable, TextInput, Alert } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/libs/supabase";

export default function createWalks() {
    const [start, setStart] = useState("");
    const [destination, setDestination] = useState("");
    const [timeText, setTimeText] = useState("");
    const [vibe, setVibe] = useState("");
    const [date, setDate] = useState(new Date());

    const canPost =
        start.trim() !== "" &&
        destination.trim() !== "" &&
        date &&
        vibe.trim() !== "";

    const handleCreateWalk = async () => {
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            Alert.alert("Error", "Please sign in");
            return;
        }

        const { data, error } = await supabase.from("walks").insert([
            {
                user_id: user.id,
                from: start,
                to: destination,
                time: date.toISOString(),
                status: "upcoming",
                vibe: vibe,
            },
        ]);

        if (error) {
            console.log("Error inserting walk:", error.message);
            Alert.alert("Error", error.message);
        } else {
            Alert.alert("Success", "Walk created!");

            setStart("");
            setDestination("");
            setVibe("");
            setDate(new Date());
            router.back();
        }
    };

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center px-5 mt-12 mb-8">
                <Pressable
                    onPress={() => router.back()}
                    className="h-10 w-10 rounded-full bg-background border border-black-200 items-center justify-center"
                >
                    <Text className="text-xl text-black-300">←</Text>
                </Pressable>
            </View>

            {/* Form Content */}
            <View className="px-5">
                {/* Starting Location */}
                <View className="mb-6">
                    <Text className="text-2xl font-rubik text-black-300 mb-2">
                        Starting Location
                    </Text>
                    <TextInput
                        value={start}
                        onChangeText={setStart}
                        placeholder="Enter starting location"
                        placeholderTextColor={"#666876"}
                        className="h-14 rounded-2xl bg-background border border-black-200 px-4 text-lg font-rubikMedium text-black-300"
                    />
                </View>

                {/* Destination */}
                <View className="mb-6">
                    <Text className="text-2xl font-rubik text-black-300 mb-2">
                        Final Location
                    </Text>
                    <TextInput
                        value={destination}
                        onChangeText={setDestination}
                        placeholder="Enter destination location"
                        placeholderTextColor={"#666876"}
                        className="h-14 rounded-2xl bg-background border border-black-200 px-4 text-lg font-rubikMedium text-black-300"
                    />
                </View>

                {/* Time */}
                <View className="mb-6">
                    <Text className="text-2xl font-rubik text-black-300 mb-2">
                        Leaving at
                    </Text>
                    <TextInput
                        value={timeText}
                        onChangeText={setTimeText}
                        placeholder="Enter time (e.g., 3:00 PM)"
                        placeholderTextColor="#666876"
                        keyboardType="numbers-and-punctuation"
                        className="h-14 rounded-2xl bg-background border border-black-200 px-4 text-lg font-rubikMedium text-black-300"
                    />
                </View>

                {/* Vibe Selection */}
                <View className="mb-10">
                    <Text className="text-2xl font-rubik text-black-300 mb-4">
                        Walk Vibe
                    </Text>
                    <View className="flex-row justify-between px-1">
                        <Pressable
                            onPress={() => setVibe("chill")}
                            className={`h-14 flex-1 rounded-2xl items-center justify-center mr-2 border ${vibe === "chill"
                                    ? "bg-primary-300 border-primary-300"
                                    : "bg-background border-black-200"
                                }`}
                        >
                            <Text
                                className={`text-lg font-rubikMedium ${vibe === "chill"
                                        ? "text-white"
                                        : "text-black-300"
                                    }`}
                            >
                                Chill
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={() => setVibe("energetic")}
                            className={`h-14 flex-1 rounded-2xl items-center justify-center ml-2 border ${vibe === "energetic"
                                    ? "bg-primary-300 border-primary-300"
                                    : "bg-background border-black-200"
                                }`}
                        >
                            <Text
                                className={`text-lg font-rubikMedium ${vibe === "energetic"
                                        ? "text-white"
                                        : "text-black-300"
                                    }`}
                            >
                                Energetic
                            </Text>
                        </Pressable>
                    </View>
                </View>

                {/* Create Button */}
                <View className="mt-8 mb-8">
                    <Pressable
                        disabled={!canPost}
                        onPress={handleCreateWalk}  
                        className={`h-14 items-center justify-center rounded-2xl ${canPost
                                ? "bg-primary-300"
                                : "bg-black-100"
                            }`}
                    >
                        <Text className={`text-lg font-rubikMedium ${canPost ? "text-white" : "text-black-300"
                            }`}>
                            Create Walk
                        </Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}