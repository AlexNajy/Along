import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, Image, TouchableOpacity, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context";
import images from "@/constants/images";
import icons from "@/constants/icons";
import { GoogleSignin, statusCodes, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { router } from "expo-router";
import { supabase } from "@/libs/supabase";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";

function SignInContent() {
    const { colors } = useTheme();
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
        <SafeAreaView className="h-full" style={{ backgroundColor: colors.surface.primary }}>
            <ScrollView contentContainerClassName="h-full">
                <Image source={images.onboarding} className="w-full h-4/6" resizeMode="contain" />

                <View className="px-10">
                    <Text className="text-base text-center uppercase font-rubik" style={{ color: colors.black[200] }}>Welcome to Along</Text>

                    <Text className="text-3xl text-center mt-2 font-rubikBold" style={{ color: colors.black[300] }}>
                        Let's Get You Closer To {"\n"}
                        <Text style={{ color: colors.primary[500] }}>Your Destination</Text>
                    </Text>

                    <Text className="text-lg font-rubik text-center mt-12" style={{ color: colors.black[200] }}>
                        Login to Along with Google
                    </Text>

                    <TouchableOpacity
                        onPress={handleLogin}
                        className="rounded-full w-full py-4 mt-5"
                        style={{
                            backgroundColor: colors.surface.primary,
                            shadowColor: colors.black[100],      
                            shadowOffset: { width: 0, height: 2 }, 
                            shadowOpacity: 0.4,                  
                            shadowRadius: 8,                     
                            elevation: 3,                          
                        }}
                    >

                        <View className="flex flex-row items-center justify-center">
                            <Image
                                source={icons.google}
                                className="w-5 h-5"
                                resizeMode="contain"
                            />
                            <Text className="text-lg font-rubikMedium ml-2" style={{ color: colors.black[300] }}>
                                Subscribe with Google
                            </Text>
                        </View>
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default function SignIn() {
    return (
        <ThemeProvider>
            <SignInContent />
        </ThemeProvider>
    );
}