import { Stack } from "expo-router";
import "./globals.css";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider } from "@/context/AuthContext";
import { AuthGuard } from "@/components/AuthGaurd";
import { View, Text, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useJiggleAnimation } from "@/hooks/useJiggleAnimation";

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        "Rubik-Bold": require("../assets/fonts/Rubik-Bold.ttf"),
        "Rubik-ExtraBold": require("../assets/fonts/Rubik-ExtraBold.ttf"),
        "Rubik-Light": require("../assets/fonts/Rubik-Light.ttf"),
        "Rubrik-Medium": require("../assets/fonts/Rubik-Medium.ttf"),
        "Rubik-Regular": require("../assets/fonts/Rubik-Regular.ttf"),
        "Rubik-SemiBold": require("../assets/fonts/Rubik-SemiBold.ttf"),
    });

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <AuthProvider>
            <OfflineBanner />
            <AuthGuard>
                <Stack screenOptions={{ headerShown: false }} />
            </AuthGuard>
        </AuthProvider>
    );
}

export let triggerOfflineJiggle: (() => void) | null = null;

function OfflineBanner() {
    const { isConnected } = useNetworkStatus();
    const { animatedStyle, jiggle } = useJiggleAnimation();

    useEffect(() => {
        triggerOfflineJiggle = jiggle;
    }, [jiggle]);

    if (isConnected) return null;

    return (
        <Animated.View 
            style={[
                {
                    position: 'absolute',
                    top: 50,
                    alignSelf: 'center',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: '#ef4444',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 12,
                    zIndex: 9999,
                },
                animatedStyle  
            ]}
        >
            <Ionicons name="cloud-offline" size={18} color="white" />
            <Text style={{ color: 'white', fontSize: 13, fontFamily: 'Rubik-SemiBold' }}>
                No Connection
            </Text>
        </Animated.View>
    );
}