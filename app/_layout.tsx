import { Stack, router } from "expo-router";
import "./globals.css";
import { useFonts } from "expo-font";
import { Suspense, use, useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { supabase } from "@/libs/supabase";


export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Rubik-Bold": require("../assets/fonts/Rubik-Bold.ttf"),
    "Rubik-ExtraBold": require("../assets/fonts/Rubik-ExtraBold.ttf"),
    "Rubik-Light": require("../assets/fonts/Rubik-Light.ttf"),
    "Rubrik-Medium": require("../assets/fonts/Rubik-Medium.ttf"),
    "Rubik-Regular": require("../assets/fonts/Rubik-Regular.ttf"),
    "Rubik-SemiBold": require("../assets/fonts/Rubik-SemiBold.ttf"),
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
  
      if (!session) {
        router.replace("/sign-in");
      }
    });
  
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthenticated(!!session);
  
        if (!session) {
          router.replace("/sign-in");
        } else {
          router.replace("/(roots)/(tabs)/map");
        }
      }
    );
  
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  if (!fontsLoaded||!isAuthenticated === null) {
    return null; 
  }
  
  return <Stack screenOptions ={{headerShown: false}}/>;
}




