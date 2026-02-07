import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { supabase } from '@/libs/supabase';
import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

interface UserStats {
    total_walks: number;
    rating: number;
    connections: number;
    verified: boolean;
}

export default function ProfileScreen() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const { user, loading: authLoading, signOut } = useAuth();
    const [loading, setLoading] = useState(true);
    const [signingOut, setSigningOut] = useState(false);
    const [stats, setStats] = useState<UserStats>({
        total_walks: 0,
        rating: 0.0,
        connections: 0,
        verified: false,
    });

    useEffect(() => {
        if (user) {
            fetchUserStats();
        }
        setLoading(false);
    }, [user]);

    const fetchUserStats = async () => {
        if (!user) return;

        try {
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
            console.error('Error fetching stats:', error);
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

    if (authLoading || loading) {
        return (
            <View 
                style={{ 
                    flex: 1, 
                    backgroundColor: colors.surface.secondary,
                    paddingTop: insets.top,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                <Text style={{ fontFamily: 'Rubik-Regular', color: colors.text.secondary }}>
                    Loading...
                </Text>
            </View>
        );
    }


    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

    return (
        <View style={{ flex: 1, backgroundColor: colors.surface.secondary }}>
            <ScrollView 
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingTop: insets.top }}
                showsVerticalScrollIndicator={false}
            >


                {/* Profile Card */}
                <View style={{ marginHorizontal: 24, marginBottom: 16 }}>
                    <View style={{ borderRadius:16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, backgroundColor: colors.surface.primary }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                            {/* Avatar */}
                            <View style={{ width: 80, height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginRight: 16, backgroundColor: colors.primary[100] }}>
                                {avatarUrl ? (
                                    <Image
                                        source={{ uri: avatarUrl }}
                                        style={{ width: '100%', height: '100%' }}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <Text style={{ fontSize: 24, fontFamily: 'Rubik-Bold', color: colors.primary[500] }}>
                                        {displayName.charAt(0).toUpperCase()}
                                    </Text>
                                )}
                            </View>

                            {/* Name and Info */}
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 20, fontFamily: 'Rubik-Bold', marginRight: 8, color: colors.text.primary }}>
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
                                <Text style={{ fontSize: 14, fontFamily: 'Rubik-Regular', marginTop: 4, color: colors.text.secondary }}>
                                    Tecnologico de Monterrey
                                </Text>
                                <Text style={{ fontSize: 14, fontFamily: 'Rubik-Regular', color: colors.text.secondary }}>
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
                <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        {/* Total Walks */}
                        <View style={{ borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, flex: 1, marginRight: 8, alignItems: 'center', backgroundColor: colors.surface.primary }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <Text style={{ fontSize: 24, fontFamily: 'Rubik-Bold', color: colors.text.primary }}>
                                    {stats.total_walks}
                                </Text>
                            </View>
                            <Text style={{ fontSize: 14, fontFamily: 'Rubik-Regular', color: colors.text.secondary }}>Total Walks</Text>
                        </View>

                        {/* Rating */}
                        <View style={{ borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, flex: 1, marginHorizontal: 4, alignItems: 'center', backgroundColor: colors.surface.primary }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <Text style={{ fontSize: 24, fontFamily: 'Rubik-Bold', color: colors.text.primary }}>
                                    {stats.rating.toFixed(1)}
                                </Text>
                            </View>
                            <Text style={{ fontSize: 14, fontFamily: 'Rubik-Regular', color: colors.text.secondary }}>Rating</Text>
                        </View>

                        {/* Connections */}
                        <View style={{ borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, flex: 1, marginLeft: 8, alignItems: 'center', backgroundColor: colors.surface.primary }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <Text style={{ fontSize: 24, fontFamily: 'Rubik-Bold', color: colors.text.primary,  }}>
                                    {stats.connections}
                                </Text>
                            </View>
                            <Text style={{ fontSize: 13, fontFamily: 'Rubik-Regular', color: colors.text.secondary,  }}>Connections</Text>
                        </View>
                    </View>
                </View>

                {/* Settings Menu */}
                <View style={{ marginHorizontal: 24, marginBottom: 16 }}>
                    <View style={{ borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, overflow: 'hidden', backgroundColor: colors.surface.primary }}>
                        
                        {/* Notifications */}
                        <TouchableOpacity
                            onPress={handleNotifications}
                            style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.surface.tertiary }}
                        >
                            <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: colors.primary[50] }}>
                                <Ionicons name="notifications" size={20} color={colors.primary[700]} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontFamily: 'Rubik-SemiBold', color: colors.text.primary }}>
                                    Notifications
                                </Text>
                                <Text style={{ fontSize: 14, fontFamily: 'Rubik-Regular', color: colors.text.secondary }}>
                                    Manage alerts and updates
                                </Text>
                            </View>
                            <Text style={{ fontSize: 20, color: colors.text.tertiary }}>›</Text>
                        </TouchableOpacity>

                        {/* Privacy & Safety */}
                        <TouchableOpacity
                            onPress={handlePrivacy}
                            style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.surface.tertiary }}
                        >
                            <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: colors.primary[50] }}>
                                <Ionicons name="shield-half" size={20} color={colors.primary[700]} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontFamily: 'Rubik-SemiBold', color: colors.text.primary }}>
                                    Privacy & Safety
                                </Text>
                                <Text style={{ fontSize: 14, fontFamily: 'Rubik-Regular', color: colors.text.secondary }}>
                                    Control your visibility
                                </Text>
                            </View>
                            <Text style={{ fontSize: 20, color: colors.text.tertiary }}>›</Text>
                        </TouchableOpacity>

                        {/* Verify Identity */}
                        <TouchableOpacity
                            onPress={handleVerifyIdentity}
                            style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.surface.tertiary }}
                        >
                            <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: colors.primary[50] }}>
                                <Ionicons name="shield-checkmark" size={20} color={colors.primary[700]} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontFamily: 'Rubik-SemiBold', color: colors.text.primary }}>
                                    Verify Identity
                                </Text>
                                <Text style={{ fontSize: 14, fontFamily: 'Rubik-Regular', color: colors.text.secondary }}>
                                    Complete your verification
                                </Text>
                            </View>
                            <Text style={{ fontSize: 20, color: colors.text.tertiary }}>›</Text>
                        </TouchableOpacity>

                        {/* Help & Support */}
                        <TouchableOpacity
                            onPress={handleHelp}
                            style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
                        >
                            <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: colors.primary[50] }}>
                                <Ionicons name="help" size={20} color={colors.primary[700]} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontFamily: 'Rubik-SemiBold', color: colors.text.primary }}>
                                    Help & Support
                                </Text>
                                <Text style={{ fontSize: 14, fontFamily: 'Rubik-Regular', color: colors.text.secondary }}>
                                    Get help or report issues
                                </Text>
                            </View>
                            <Text style={{ fontSize: 20, color: colors.text.tertiary }}>›</Text>
                        </TouchableOpacity>

                    </View>
                </View>

                {/* Sign Out Button */}
                <View style={{ marginHorizontal: 24, marginBottom: 32 }}>
                    <Button
                        title={signingOut ? "Signing Out..." : "Sign Out"}
                        onPress={signOut}
                        variant="danger"
                        size="medium"
                        fullWidth
                        disabled={signingOut}
                    />
                </View>
            </ScrollView>
        </View>
    );
}