import React, { useEffect, useState, useCallback, useRef } from "react";
import {View, Text, ScrollView, Pressable, TextInput, Alert, ActivityIndicator, StyleSheet, Image, Animated} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/libs/supabase";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Profile } from "@/constants/types";
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

export default function EditProfileScreen() {
    const { colors, isDark } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userName, setUserName] = useState("");
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const buttonScale = useRef(new Animated.Value(1)).current;
    const handleSavePressIn = () => {
        Animated.spring(buttonScale, { toValue: 0.95, useNativeDriver: true }).start();
    };
    const handleSavePressOut = () => {
        Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();
    };

    const fetchProfile = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from("profiles")
            .select("user_name, avatar")
            .eq("id", user.id)
            .single();

        if (error) {
            console.error("Error fetching profile:", error.message);
        } else if (data) {
            setUserName((data as Pick<Profile, "user_name" | "avatar">).user_name ?? "");
            setAvatarUri((data as Pick<Profile, "user_name" | "avatar">).avatar ?? null);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleSave = async () => {
        if (!user) return;

        if (userName.trim().length === 0) {
            Alert.alert("Validation Error", "Username cannot be empty.");
            return;
        }

        setSaving(true);
        const { error } = await supabase
            .from("profiles")
            .update({ user_name: userName.trim(), avatar: avatarUri ?? "" })
            .eq("id", user.id);

        setSaving(false);

        if (error) {
            console.error("Error saving profile:", error.message);
            Alert.alert("Error", "Failed to save your profile. Please try again.");
        } else {
            Alert.alert("Saved", "Your profile has been updated.", [
                { text: "OK", onPress: () => router.back() },
            ]);
        }
    };

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to your photo library.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setAvatarUri(result.assets[0].uri);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.surface.secondary }]}>
            <ScrollView
                contentContainerStyle={{
                    paddingTop: insets.top + 18,
                    paddingHorizontal: 18,
                    paddingBottom: insets.bottom + 24,
                }}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Pressable
                        onPress={() => router.back()}
                        style={[styles.backButton, { backgroundColor: colors.surface.primary }]}
                    >
                        <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
                        Edit Profile
                    </Text>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color={colors.primary[500]} />
                        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
                            Loading...
                        </Text>
                    </View>
                ) : (
                    <>
                        <View
                            style={[
                                styles.card,
                                {
                                    backgroundColor: colors.surface.primary,
                                    shadowColor: "#000",
                                },
                            ]}
                        >
                            <View
                                style={[
                                    styles.fieldRow,
                                    {
                                        borderBottomWidth: 1,
                                        borderBottomColor: colors.surface.tertiary,
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.fieldIconCircle,
                                        { backgroundColor: colors.primary[50] },
                                    ]}
                                >
                                    <Ionicons
                                        name="person-outline"
                                        size={20}
                                        color={colors.primary[700]}
                                    />
                                </View>
                                <View style={styles.fieldContent}>
                                    <Text
                                        style={[
                                            styles.fieldLabel,
                                            { color: colors.text.secondary },
                                        ]}
                                    >
                                        Username
                                    </Text>
                                    <TextInput
                                        value={userName}
                                        onChangeText={setUserName}
                                        placeholder="Enter your username"
                                        placeholderTextColor={colors.text.tertiary}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        style={[
                                            styles.input,
                                            { color: colors.text.primary },
                                        ]}
                                    />
                                </View>
                            </View>

                            <View style={styles.fieldRow}>
                                <View style={styles.fieldContent}>
                                    <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>
                                        Profile Picture
                                    </Text>
                                    <Pressable onPress={handlePickImage} style={styles.avatarPickerRow}>
                                        {avatarUri ? (
                                            <Image
                                                source={{ uri: avatarUri }}
                                                style={styles.avatarPreview}
                                            />
                                        ) : (
                                            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface.tertiary }]}>
                                                <Ionicons name="person" size={24} color={colors.text.tertiary} />
                                            </View>
                                        )}
                                        <Text style={[styles.avatarPickerText, { color: colors.primary[500] }]}>
                                            Profile Picture
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>

                        <Animated.View style={[styles.saveWrapper, { transform: [{ scale: buttonScale }] }]}>
                            <LinearGradient
                                colors={['#10b981', '#06b6d4', '#0ea5e9']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.saveGradientBorder}
                            >
                                <Pressable
                                    onPress={handleSave}
                                    onPressIn={handleSavePressIn}
                                    onPressOut={handleSavePressOut}
                                    disabled={saving}
                                    style={[styles.saveButton, { backgroundColor: isDark ? '#030712' : '#ffffff', opacity: saving ? 0.75 : 1 }]}
                                >
                                    {saving ? (
                                        <ActivityIndicator color={isDark ? '#ffffff' : '#030712'} size="small" />
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark" size={20} color={isDark ? '#ffffff' : '#030712'} />
                                            <Text style={[styles.saveButtonText, { color: isDark ? '#ffffff' : '#030712' }]}>
                                                Save Changes
                                            </Text>
                                        </>
                                    )}
                                </Pressable>
                            </LinearGradient>
                        </Animated.View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
        gap: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "800",
    },
    loadingContainer: {
        alignItems: "center",
        marginTop: 48,
        gap: 12,
    },
    loadingText: {
        fontSize: 15,
    },
    card: {
        borderRadius: 16,
        overflow: "hidden",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: 24,
    },
    fieldRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    fieldIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    fieldContent: { flex: 1 },
    fieldLabel: {
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 4,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    input: {
        fontSize: 15,
        fontWeight: "500",
        paddingVertical: 0,
    },
    avatarPickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 4,
    },
    avatarPreview: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarPickerText: {
        fontSize: 15,
        fontWeight: '600',
    },
    saveWrapper: {
        alignSelf: 'center',
        marginTop: 8,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    saveGradientBorder: {
        borderRadius: 18,
        padding: 2,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingHorizontal: 48,
        paddingVertical: 14,
        borderRadius: 16,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
});
