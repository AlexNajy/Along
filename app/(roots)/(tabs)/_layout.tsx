import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true, 
        tabBarActiveTintColor: colors.primary[500], 
        tabBarInactiveTintColor: colors.black[200],
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
