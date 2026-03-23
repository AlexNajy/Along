import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, Image, ScrollView, Alert, TouchableOpacity, Pressable, Animated, StyleSheet } from 'react-native';
import { supabase } from '@/libs/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';

interface UserStats {
    total_walks: number;
    rating: number;
    connections: number;
    verified: boolean;
    avatar: string | null;
}

export default function ProfileScreen() {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const { user, loading: authLoading, signOut } = useAuth();
    const [loading, setLoading] = useState(true);
    const [signingOut, setSigningOut] = useState(false);
    const [stats, setStats] = useState<UserStats>({
        total_walks: 0,
        rating: 0.0,
        connections: 0,
        verified: false,
        avatar: null,
    });

    const editScale = useRef(new Animated.Value(1)).current;
    const signOutScale = useRef(new Animated.Value(1)).current;

    const makeSpring = (ref: Animated.Value, toValue: number) =>
        Animated.spring(ref, { toValue, useNativeDriver: true }).start();

    const fetchUserStats = useCallback(async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('total_walks, ratings, connections, verified, avatar')
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
                    avatar: data.avatar || null,
                });
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchUserStats();
        } else {
            setLoading(false);
        }
    }, [user, fetchUserStats]);

    const handleSignOut = () => {
        Alert.alert(
          'Sign Out',
          'Are you sure you want to sign out?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sign Out',
              style: 'destructive',
              onPress: async () => {
                try {
                  setSigningOut(true);
                  await signOut();
                } catch (error) {
                  console.error('Sign out error:', error);
                  Alert.alert('Error', 'Failed to sign out. Please try again.');
                } finally {
                  setSigningOut(false);
                }
              },
            },
          ]
        );
    };

    const handleEditProfile = () => {
        router.push('../profile/edit-profile');
    };

    const handleNotifications = () => {
        router.push('../profile/notifications');
    };

    const handlePrivacy = () => {
        router.push('../profile/privacy');
    };

    const handleVerifyIdentity = () => {
        router.push('../profile/verify-identity');
    };

    const handleHelp = () => {
        router.push('../profile/help');
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
    const avatarUrl = stats.avatar || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

    return (
        <View style={{ flex: 1, backgroundColor: colors.surface.secondary }}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingTop: insets.top }}
                showsVerticalScrollIndicator={false}
            >
                
                <View style={{ marginHorizontal: 24, marginBottom: 16 }}>
                    <View style={{ borderRadius:16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, backgroundColor: colors.surface.primary }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                            
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

                       
                        <Animated.View style={[styles.btnWrapper, { transform: [{ scale: editScale }] }]}>
                            <LinearGradient
                                colors={['#10b981', '#06b6d4', '#0ea5e9']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradientBorder}
                            >
                                <Pressable
                                    onPress={handleEditProfile}
                                    onPressIn={() => makeSpring(editScale, 0.95)}
                                    onPressOut={() => makeSpring(editScale, 1)}
                                    style={[styles.innerButton, { backgroundColor: isDark ? '#030712' : '#ffffff' }]}
                                >
                                    <Ionicons name="pencil-outline" size={16} color={isDark ? '#ffffff' : '#030712'} />
                                    <Text style={[styles.btnText, { color: isDark ? '#ffffff' : '#030712' }]}>
                                        Edit Profile
                                    </Text>
                                </Pressable>
                            </LinearGradient>
                        </Animated.View>
                    </View>
                </View>

               
                <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        
                        <View style={{ borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, flex: 1, marginRight: 8, alignItems: 'center', backgroundColor: colors.surface.primary }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <Text style={{ fontSize: 24, fontFamily: 'Rubik-Bold', color: colors.text.primary }}>
                                    {stats.total_walks}
                                </Text>
                            </View>
                            <Text style={{ fontSize: 14, fontFamily: 'Rubik-Regular', color: colors.text.secondary }}>Total Walks</Text>
                        </View>

                       
                        <View style={{ borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, flex: 1, marginHorizontal: 4, alignItems: 'center', backgroundColor: colors.surface.primary }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <Text style={{ fontSize: 24, fontFamily: 'Rubik-Bold', color: colors.text.primary }}>
                                    {stats.rating.toFixed(1)}
                                </Text>
                            </View>
                            <Text style={{ fontSize: 14, fontFamily: 'Rubik-Regular', color: colors.text.secondary }}>Rating</Text>
                        </View>

                       
                        <View style={{ borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, flex: 1, marginLeft: 8, alignItems: 'center', backgroundColor: colors.surface.primary }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <Text style={{ fontSize: 24, fontFamily: 'Rubik-Bold', color: colors.text.primary }}>
                                    {stats.connections}
                                </Text>
                            </View>
                            <Text style={{ fontSize: 13, fontFamily: 'Rubik-Regular', color: colors.text.secondary }}>Connections</Text>
                        </View>
                    </View>
                </View>

                
                <View style={{ marginHorizontal: 24, marginBottom: 16 }}>
                    <View style={{ borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, overflow: 'hidden', backgroundColor: colors.surface.primary }}>

                        
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

                
                <View style={{ marginHorizontal: 24, marginBottom: 32 }}>
                    <Animated.View style={[styles.btnWrapper, { transform: [{ scale: signOutScale }] }]}>
                        <LinearGradient
                            colors={['#ef4444', '#f97316']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientBorder}
                        >
                            <Pressable
                                onPress={handleSignOut}
                                onPressIn={() => makeSpring(signOutScale, 0.95)}
                                onPressOut={() => makeSpring(signOutScale, 1)}
                                disabled={signingOut}
                                style={[styles.innerButton, { backgroundColor: isDark ? '#030712' : '#ffffff', opacity: signingOut ? 0.6 : 1 }]}
                            >
                                <Ionicons name="log-out-outline" size={16} color={isDark ? '#ffffff' : '#030712'} />
                                <Text style={[styles.btnText, { color: isDark ? '#ffffff' : '#030712' }]}>
                                    {signingOut ? 'Signing Out...' : 'Sign Out'}
                                </Text>
                            </Pressable>
                        </LinearGradient>
                    </Animated.View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    btnWrapper: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    gradientBorder: {
        borderRadius: 14,
        padding: 2,
    },
    innerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    btnText: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
});
