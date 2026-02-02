import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function TabsLayout() {
    const { colors } = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary[500],
                tabBarInactiveTintColor: colors.black[200],
                tabBarStyle: {
                    backgroundColor: colors.surface.primary,
                    borderTopColor: colors.surface.tertiary,
                },
            }}
        >
            <Tabs.Screen
                name="map"
                options={{
                    title: 'Explore',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="navigate" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="walks"
                options={{
                    title: 'Activity',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="filter" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" color={color} size={size} />
                    ),
                }}
            />
        </Tabs>
    );
}

export default function Layout() {
    return (
        <ThemeProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <TabsLayout />
            </GestureHandlerRootView>
        </ThemeProvider>
    );
}