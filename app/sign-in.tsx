import React, {useEffect, useState} from "react";
import { ScrollView, Text, View, Image, TouchableOpacity, Alert} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context";
import images from "@/constants/images";
import icons from "@/constants/icons";
import { GoogleSignin, statusCodes, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { router } from "expo-router";
import { supabase } from "@/libs/supabase";

const SignIn = () => {
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        GoogleSignin.configure({
            iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        });
    }, []);

    const handleLogin = async () => {
        if (isLoading) return;

        try {
            setIsLoading(true);
            await GoogleSignin.hasPlayServices();
            
            const response = await GoogleSignin.signIn();
            
            if (isSuccessResponse(response)) {
                const idToken = response.data.idToken;
                setIsLoading(false);
                
                if (!idToken) {
                    Alert.alert('Error', 'Failed to get ID token from Google');
                    return;
                }
                
                const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: idToken,
                    nonce: undefined, 
                });

                if (error) {
                    Alert.alert('Sign In Error', error.message);
                    console.error('Supabase auth error:', error);
                    return;
                }

                console.log('Signed in successfully:', data.user?.email);
                router.replace("/(roots)/(tabs)/map");
            }
        } catch (error: any) {
            console.error('Google Sign In error:', error);
            
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                console.log('User cancelled sign in');
            } else if (error.code === statusCodes.IN_PROGRESS) {
                Alert.alert('Error', 'Sign in is already in progress');
            } else {
                Alert.alert('Error', error.message || 'Something went wrong during sign in');
            }
        } finally {
            setIsLoading(false);
        }
    };

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