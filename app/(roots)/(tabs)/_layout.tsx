import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useRouter, usePathname } from 'expo-router';
import MapScreen from './map';
import WalksScreen from './walks';
import ProfileScreen from './profile';
import { Ionicons } from '@expo/vector-icons';

const Tab = createMaterialTopTabNavigator();

function CustomBottomBar() {
    const { colors } = useTheme();
    const router = useRouter();
    const pathname = usePathname();

    const screens = [
        { name: 'map', route: '/(roots)/(tabs)/map', icon: 'navigate', label: 'Explore' },
        { name: 'walks', route: '/(roots)/(tabs)/walks', icon: 'filter', label: 'Activity' },
        { name: 'profile', route: '/(roots)/(tabs)/profile', icon: 'person', label: 'Profile' },
    ];

    const currentIndex = screens.findIndex(s => pathname.includes(s.name));

    return (
        <View
            style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                paddingVertical: 12,
                borderTopWidth: 1,
                borderTopColor: colors.surface.tertiary,
                backgroundColor: colors.surface.primary,
            }}
        >
            {screens.map((s, i) => (
                <TouchableOpacity
                    key={s.name}
                    onPress={() => router.push(s.route as any)}
                    style={{ alignItems: 'center' }}
                >
                    <Ionicons
                        name={s.icon as any}
                        size={24}
                        color={i === currentIndex ? colors.primary[500] : colors.black[200]}
                    />
                    <Text
                        style={{
                            color: i === currentIndex ? colors.primary[500] : colors.black[200],
                            fontSize: 12,
                            marginTop: 4,
                        }}
                    >
                        {s.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

function LayoutContent() {
    const screens = [
        { name: 'map', component: MapScreen },
        { name: 'walks', component: WalksScreen },
        { name: 'profile', component: ProfileScreen },
    ];

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
                <Tab.Navigator
                    screenOptions={{
                        tabBarStyle: { display: 'none' },
                        swipeEnabled: true,
                        animationEnabled: true,
                    }}
                    initialRouteName="map"
                >
                    {screens.map((s) => (
                        <Tab.Screen key={s.name} name={s.name} component={s.component} />
                    ))}
                </Tab.Navigator>

                <CustomBottomBar />
            </View>
        </GestureHandlerRootView>
    );
}

export default function Layout() {
    return ( 
        <ThemeProvider>
            <LayoutContent/>
        </ThemeProvider>
    );
}