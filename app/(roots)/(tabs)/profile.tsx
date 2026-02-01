import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/libs/supabase';
import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface UserStats {
    total_walks: number;
    rating: number;
    connections: number;
    verified: boolean;
}

export default function ProfileScreen() {
    const { colors } = useTheme();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [signingOut, setSigningOut] = useState(false);
    const [stats, setStats] = useState<UserStats>({
        total_walks: 0,
        rating: 0.0,
        connections: 0,
        verified: false,
    });

    useEffect(() => {
        fetchUser();
        fetchUserStats();
    }, []);

    const fetchUser = async () => {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            setUser(user);
        } catch (error) {
            console.error('Error fetching user:', error);
            Alert.alert('Error', 'Could not load profile');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserStats = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('total_walks, ratings, connections, verified')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                return;
            }

            if (data) {
                setStats({
                    total_walks: data.total_walks || 0,
                    rating: data.ratings || 0.0,
                    connections: data.connections || 0,
                    verified: data.verified || false,
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handleSignOut = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        setSigningOut(true);
                        try {
                            const { error } = await supabase.auth.signOut();
                            if (error) throw error;
                        } catch (error) {
                            console.error('Error signing out:', error);
                            Alert.alert('Error', 'Could not sign out. Please try again.');
                        } finally {
                            setSigningOut(false);
                        }
                    },
                },
            ]
        );
    };

    const handleEditProfile = () => {
        Alert.alert('Edit Profile', 'This feature is coming soon!');
    };

    const handleNotifications = () => {
        Alert.alert('Notifications', 'This feature is coming soon!');
    };

    const handlePrivacy = () => {
        Alert.alert('Privacy & Safety', 'This feature is coming soon!');
    };

    const handleVerifyIdentity = () => {
        Alert.alert('Verify Identity', 'This feature is coming soon!');
    };

    const handleHelp = () => {
        Alert.alert('Help & Support', 'This feature is coming soon!');
    };

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface.secondary }} edges={['top']}>
                <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.surface.secondary }}>
                    <Text className="font-rubik" style={{ color: colors.text.secondary }}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;


    return (

        <ScrollView className="flex-1" style={{ backgroundColor: colors.surface.secondary }}>
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface.secondary }} edges={['top']}>
                {/* Page Header */}
                <View className="px-6 pb-4">
                    <Text className="text-3xl font-rubikBold" style={{ color: colors.text.primary }}>Account</Text>
                    <Text className="text-base font-rubik mt-1" style={{ color: colors.text.secondary }}>
                        Manage your profile and settings
                    </Text>
                </View>

                <View>
                    {/* Profile Card */}
                    <View className="mx-6 mb-4">
                        <View className="rounded-card p-6 shadow-card" style={{ backgroundColor: colors.surface.primary }}>
                            <View className="flex-row items-center mb-4">
                                {/* Avatar */}
                                <View className="w-20 h-20 rounded-2xl items-center justify-center overflow-hidden mr-4" style={{ backgroundColor: colors.primary[100] }}>
                                    {avatarUrl ? (
                                        <Image
                                            source={{ uri: avatarUrl }}
                                            className="w-full h-full"
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <Text className="text-2xl font-rubikBold" style={{ color: colors.primary[500] }}>
                                            {displayName.charAt(0).toUpperCase()}
                                        </Text>
                                    )}
                                </View>

                                {/* Name and Info */}
                                <View className="flex-1">
                                    <View className="flex-row items-center">
                                        <Text className="text-xl font-rubikBold mr-2" style={{ color: colors.text.primary }}>
                                            {displayName}
                                        </Text>
                                        {stats.verified && (
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={18}
                                                color={colors.primary[700]}
                                            />
                                        )}
                                    </View>
                                    <Text className="text-sm font-rubik mt-1" style={{ color: colors.text.secondary }}>
                                        Tecnologico de Monterrey
                                    </Text>
                                    <Text className="text-sm font-rubik" style={{ color: colors.text.secondary }}>
                                        {user?.email}
                                    </Text>
                                </View>
                            </View>

                            {/* Edit Profile Button */}
                            <Button
                                title="Edit Profile"
                                onPress={handleEditProfile}
                                variant="outline"
                                size="medium"
                                fullWidth
                            />
                        </View>
                    </View>

                    {/* Stats Cards */}
                    <View className="px-6 mb-4">
                        <View className="flex-row justify-between">
                            {/* Total Walks */}
                            <View className="rounded-card p-4 shadow-card flex-1 mr-2 items-center" style={{ backgroundColor: colors.surface.primary }}>
                                <View className="flex-row items-center mb-2">
                                    <Text className="text-2xl font-rubikBold" style={{ color: colors.text.primary }}>
                                        {stats.total_walks}
                                    </Text>
                                </View>
                                <Text className="text-sm font-rubik" style={{ color: colors.text.secondary }}>Total Walks</Text>
                            </View>

                            {/* Rating */}
                            <View className="rounded-card p-4 shadow-card flex-1 mx-1 items-center" style={{ backgroundColor: colors.surface.primary }}>
                                <View className="flex-row items-center mb-2">
                                    <Text className="text-2xl font-rubikBold" style={{ color: colors.text.primary }}>
                                        {stats.rating.toFixed(1)}
                                    </Text>
                                </View>
                                <Text className="text-sm font-rubik" style={{ color: colors.text.secondary }}>Rating</Text>
                            </View>

                            {/* Connections */}
                            <View className="rounded-card p-4 shadow-card flex-1 ml-2 items-center" style={{ backgroundColor: colors.surface.primary }}>
                                <View className="flex-row items-center mb-2">
                                    <Text className="text-2xl font-rubikBold" style={{ color: colors.text.primary }}>
                                        {stats.connections}
                                    </Text>
                                </View>
                                <Text className="text-sm font-rubik" style={{ color: colors.text.secondary }}>Connections </Text>
                            </View>
                        </View>
                    </View>



                    {/* Settings Menu */}
                    <View className="mx-6 mb-4">
                        <View className="rounded-card shadow-card overflow-hidden" style={{ backgroundColor: colors.surface.primary }}>

                            {/* Notifications */}
                            <TouchableOpacity
                                onPress={handleNotifications}
                                className="flex-row items-center p-4 border-b"
                                style={{ borderBottomColor: colors.surface.tertiary }}
                            >
                                <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.primary[50] }}>
                                    <Ionicons name="notifications" size={20} color={colors.primary[700]} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-base font-rubikSemiBold" style={{ color: colors.text.primary }}>
                                        Notifications
                                    </Text>
                                    <Text className="text-sm font-rubik" style={{ color: colors.text.secondary }}>
                                        Manage alerts and updates
                                    </Text>
                                </View>
                                <Text className="text-xl" style={{ color: colors.text.tertiary }}>›</Text>
                            </TouchableOpacity>

                            {/* Privacy & Safety */}
                            <TouchableOpacity
                                onPress={handlePrivacy}
                                className="flex-row items-center p-4 border-b"
                                style={{ borderBottomColor: colors.surface.tertiary }}
                            >
                                <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.primary[50] }}>
                                    <Ionicons name="shield-half" size={20} color={colors.primary[700]} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-base font-rubikSemiBold" style={{ color: colors.text.primary }}>
                                        Privacy & Safety
                                    </Text>
                                    <Text className="text-sm font-rubik" style={{ color: colors.text.secondary }}>
                                        Control your visibility
                                    </Text>
                                </View>
                                <Text className="text-xl" style={{ color: colors.text.tertiary }}>›</Text>
                            </TouchableOpacity>

                            {/* Verify Identity */}
                            <TouchableOpacity
                                onPress={handleVerifyIdentity}
                                className="flex-row items-center p-4 border-b"
                                style={{ borderBottomColor: colors.surface.tertiary }}
                            >
                                <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.primary[50] }}>
                                    <Ionicons name="shield-checkmark" size={20} color={colors.primary[700]} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-base font-rubikSemiBold" style={{ color: colors.text.primary }}>
                                        Verify Identity
                                    </Text>
                                    <Text className="text-sm font-rubik" style={{ color: colors.text.secondary }}>
                                        Complete your verification
                                    </Text>
                                </View>
                                <Text className="text-xl" style={{ color: colors.text.tertiary }}>›</Text>
                            </TouchableOpacity>

                            {/* Help & Support */}
                            <TouchableOpacity
                                onPress={handleHelp}
                                className="flex-row items-center p-4"
                            >
                                <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.primary[50] }}>
                                    <Ionicons name="help" size={20} color={colors.primary[700]} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-base font-rubikSemiBold" style={{ color: colors.text.primary }}>
                                        Help & Support
                                    </Text>
                                    <Text className="text-sm font-rubik" style={{ color: colors.text.secondary }}>
                                        Get help or report issues
                                    </Text>
                                </View>
                                <Text className="text-xl" style={{ color: colors.text.tertiary }}>›</Text>
                            </TouchableOpacity>

                        </View>
                    </View>

                    {/* Sign Out Button */}
                    <View className="mx-6 mb-8">
                        <Button
                            title={signingOut ? "Signing Out..." : "Sign Out"}
                            onPress={handleSignOut}
                            variant="danger"
                            size="medium"
                            fullWidth
                            disabled={signingOut}
                        />
                    </View>
                </View>
            </SafeAreaView>
        </ScrollView >

    );
}