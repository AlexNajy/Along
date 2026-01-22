import React from "react";
import { ScrollView, Text, View, Image, TouchableOpacity, } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context";
import images from "@/constants/images";
import icons from "@/constants/icons";
import { router } from "expo-router";

const SignIn = () => {
    const handleLogin = () => {router.push("/(roots)/(tabs)/map")};

    return (
        <SafeAreaView className="bg-white h-full">
            <ScrollView contentContainerClassName="h-full">
                <Image source={images.onboarding} className="w-full h-4/6" resizeMode="contain" />

                <View className="px-10">
                    <Text className="text-base text-center uppercase font-rubik text-black-200">Welcome to Along</Text>

                    <Text className="text-3xl text-center mt-2 font-rubikBold text-black-300">
                        Let's Get You Closer To {"\n"}
                        <Text className="text-primary-300">Your Destination</Text>
                    </Text>

                    <Text className="text-lg font-rubik text-black-200 text-center mt-12">
                        Login to Along with Google
                    </Text>

                    <TouchableOpacity onPress={handleLogin} className="bg-white shadow-md shadow-zinc-300 rounded-full w-full py-4 mt-5">
                        <View className="flex flex-row items-center justify-center">
                            <Image
                                source={icons.google}
                                className="w-5 h-5"
                                resizeMode="contain"
                            />
                            <Text className="text-lg font-rubikMedium text-black-300 ml-2">
                                Subscribe with Google
                            </Text>
                        </View>
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default SignIn