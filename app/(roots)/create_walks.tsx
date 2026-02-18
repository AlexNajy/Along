import React, { useState } from "react";
import { Text, View, Pressable, TextInput, Alert } from "react-native";
import { supabase } from "@/libs/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { useReverseGeocode } from "@/hooks/useReverseGeocode";
import { KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from "react-native";
import { calculateDistance } from "@/libs/geometry";

export default function CreateWalks() {
    const [minutesInput, setMinutesInput] = useState("");
    const [vibe, setVibe] = useState("chill");
    const maxTime = 1440;

    const params = useLocalSearchParams();

    const startMarker = params.start ? JSON.parse(Array.isArray(params.start) ? params.start[0] : params.start) : null;
    const endMarker = params.end ? JSON.parse(Array.isArray(params.end) ? params.end[0] : params.end) : null;
    const userLocation = params.user ? JSON.parse(Array.isArray(params.user) ? params.user[0] : params.user) : null;
    const route = params.route ? JSON.parse(Array.isArray(params.route) ? params.route[0] : params.route) : null;
    const distance = params.distance || (route ? calculateDistance(route) : null);

    const startCoords = startMarker ?? userLocation ?? null;
    const endCoords = endMarker ?? null;
    const { startLocation, endLocation, isLoading } = useReverseGeocode(startCoords, endCoords);

    const canPost =
        startLocation.trim() !== "" &&
        endLocation.trim() !== ""

    const calculateDepartureTime = () => {
        if (!minutesInput.trim() || minutesInput.trim() === "0") return new Date();

        const minutes = parseInt(minutesInput, 10);
        if (isNaN(minutes) || minutes < 0) return null;

        const departureTime = new Date();
        departureTime.setMinutes(departureTime.getMinutes() + minutes);
        return departureTime;
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getDisplayTime = () => {
        const departureTime = calculateDepartureTime();
        if (!departureTime) return "Enter minutes from now";

        const now = new Date();
        const diffMinutes = Math.floor((departureTime.getTime() - now.getTime()) / (1000 * 60));

        if (diffMinutes < 60) {
            return `Leaving in ${diffMinutes} min (${formatTime(departureTime)})`;
        } else {
            const hours = Math.floor(diffMinutes / 60);
            const remainingMinutes = diffMinutes % 60;
            return `Leaving in ${hours}h ${remainingMinutes}m (${formatTime(departureTime)})`;
        }
    };

    const reverseGeocode = async (lat: number, lng: number) => {
        const { data, error } = await supabase.functions.invoke("reverse_geocode", {
            body: { lng, lat },
        });


        console.log("reverse data:", data);
        console.log("reverse error:", error);

        if (error) throw error;
        return (data?.place_name as string | null) ?? null;
    };

    const handleCreateWalk = async () => {
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            Alert.alert("Error", "Please sign in");
            return;
        }

        const departureTime = calculateDepartureTime();
        if (!departureTime) {
            Alert.alert("Error", "Not an acceptable departure time");
            return;
        }

        const createStatus = () => {
            return minutesInput.trim() ? "upcoming" : "active";
        };

        const startCoords = startMarker ?? userLocation ?? null;
        const endCoords = endMarker ?? null;

        if (!startCoords?.lat || !startCoords?.lng) {
            Alert.alert("Error", "Missing start coordinates");
            return;
        }

        if (!endCoords?.lat || !endCoords?.lng) {
            Alert.alert("Error", "Missing destination coordinates");
            return;
        }



        const walk = {
            user_id: user.id,
            created_at: new Date(),
            start_location: startLocation,
            end_location: endLocation,
            start_time: departureTime.toISOString(),
            status: createStatus(),
            start_lng: Number(startCoords.lng),
            start_lat: Number(startCoords.lat),
            end_lng: Number(endCoords.lng),
            end_lat: Number(endCoords.lat),
            route: route,
        }

        const { data, error } = await supabase.from("walks").insert([walk])

        if (error) {
            console.log("Error inserting walk:", error.message);
            Alert.alert("Error", error.message);
        } else {
            Alert.alert("Success", "Walk created!");
            router.replace("../(tabs)/activity");
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
                            <Text className="text-2xl font-rubikMedium text-black-300 mb-2">
                                Starting Location
                            </Text>
                            <TextInput
                                value={isLoading ? "Loading..." : startLocation}
                                editable={false}
                                placeholder="Enter starting location"
                                placeholderTextColor={"#666876"}
                                className="h-14 rounded-2xl bg-background border border-black-200 px-4 text-lg font-rubik text-black-300"
                            />
                        </View>

                        {/* Destination */}
                        <View className="mb-6">
                            <Text className="text-2xl font-rubikMedium text-black-300 mb-2">
                                Final Location
                            </Text>
                            <TextInput
                                value={isLoading ? "Loading..." : endLocation}
                                editable={false}
                                placeholder="Enter destination location"
                                placeholderTextColor={"#666876"}
                                className="h-14 rounded-2xl bg-background border border-black-200 px-4 text-lg font-rubik text-black-300"
                            />
                        </View>

                        {/* Departure Time */}
                        <View className="mb-6">
                            <Text className="text-2xl font-rubikMedium text-black-300 mb-2">
                                Leaving in
                            </Text>

                            {/* Time Preview */}
                            <View className="mb-3">
                                <Text className="text-base font-rubik text-primary-300">
                                    <Text className="text-base font-rubikMedium text-primary-300">
                                        {minutesInput.trim() ? getDisplayTime() : `Current time: ${formatTime(new Date())}`}
                                    </Text>
                                </Text>
                            </View>

                            <View className="flex-row items-center">
                                <TextInput
                                    value={minutesInput}
                                    onChangeText={(text) => {
                                        const numericText = text.replace(/[^0-9]/g, '');
                                        const numericValue = parseInt(numericText);

                                        if (numericText === '') {
                                            setMinutesInput('');
                                        } else if (numericValue > maxTime) {
                                            setMinutesInput(maxTime.toString());
                                        } else {
                                            setMinutesInput(numericText);
                                        }
                                    }}
                                    placeholder="Enter minutes from now"
                                    placeholderTextColor="#666876"
                                    keyboardType="number-pad"
                                    className="h-14 rounded-2xl bg-background border border-black-200 px-4 text-lg font-rubik text-black-300 flex-1 mr-3"
                                />
                            </View>

                            <View className="mt-3 flex-row space-x-2">
                                <Pressable
                                    onPress={() => setMinutesInput("0")}
                                    className="mr-1 px-4 py-2 rounded-full bg-background border border-black-200"
                                >
                                    <Text className="text-sm font-rubik text-black-300">Now</Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => setMinutesInput("5")}
                                    className="mr-1 px-4 py-2 rounded-full bg-background border border-black-200"
                                >
                                    <Text className="text-sm font-rubik text-black-300">5 min</Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => setMinutesInput("15")}
                                    className="mr-1 px-4 py-2 rounded-full bg-background border border-black-200"
                                >
                                    <Text className="text-sm font-rubik text-black-300">15 min</Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => setMinutesInput("30")}
                                    className="mr-1 px-4 py-2 rounded-full bg-background border border-black-200"
                                >
                                    <Text className="text-sm font-rubik text-black-300">30 min</Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => setMinutesInput("60")}
                                    className="mr-1 px-4 py-2 rounded-full bg-background border border-black-200"
                                >
                                    <Text className="text-sm font-rubik text-black-300">1 hour</Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Vibe Selection */}
                        <View className="mb-10">
                            <Text className="text-2xl font-rubikMedium text-black-300 mb-4">
                                Walk settings
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
                                        Private
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
                                        Public
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
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}