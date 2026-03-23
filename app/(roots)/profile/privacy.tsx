import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Switch, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/libs/supabase";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Walk } from "@/constants/types";

interface PrivacySettings {
    profile_public: boolean;
    allow_walk_requests: boolean;
    share_location_during_walk: boolean;
}

const DEFAULT_SETTINGS: PrivacySettings = {
    profile_public: true,
    allow_walk_requests: true,
    share_location_during_walk: true,
};

export default function PrivacyScreen() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const [pastWalks, setPastWalks] = useState<Walk[]>([]);
    const [walksLoading, setWalksLoading] = useState(true);
    const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS);
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [showFullHistory, setShowFullHistory] = useState(false);

    const fetchSettings = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from("profiles")
            .select("profile_public, allow_walk_requests, share_location_during_walk")
            .eq("id", user.id)
            .single();

        if (error) {
            console.error("Error fetching privacy settings:", error.message);
        } else if (data) {
            setSettings({
                profile_public: data.profile_public ?? DEFAULT_SETTINGS.profile_public,
                allow_walk_requests: data.allow_walk_requests ?? DEFAULT_SETTINGS.allow_walk_requests,
                share_location_during_walk: data.share_location_during_walk ?? DEFAULT_SETTINGS.share_location_during_walk,
            });
        }
        setSettingsLoading(false);
    }, [user]);

    const fetchPastWalks = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from("walks")
            .select("*")
            .eq("user_id", user.id)
            .eq("status", "past")
            .order("start_time", { ascending: false })
            .limit(3);

        if (error) console.error("Error fetching past walks:", error.message);
        else setPastWalks(data ?? []);
        setWalksLoading(false);
    }, [user]);

    useEffect(() => {
        fetchSettings();
        fetchPastWalks();
    }, [fetchSettings, fetchPastWalks]);

    const handleToggle = async (key: keyof PrivacySettings, value: boolean) => {
        if (!user) return;
        setSettings((prev) => ({ ...prev, [key]: value }));
        const { error } = await supabase
            .from("profiles")
            .update({ [key]: value })
            .eq("id", user.id);
        if (error) {
            console.error("Error updating privacy setting:", error.message);
            setSettings((prev) => ({ ...prev, [key]: !value }));
        }
    };

    const fetchAllWalks = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from("walks")
            .select("*")
            .eq("user_id", user.id)
            .eq("status", "past")
            .order("start_time", { ascending: false });
    
        if (error) console.error("Error fetching all walks:", error.message);
        else setPastWalks(data ?? []);
    }, [user]);

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    const privacyRows: { key: keyof PrivacySettings; icon: string; label: string; description: string }[] = [
        {
            key: "profile_public",
            icon: "eye-outline",
            label: "Public Profile",
            description: "Let others find and view your profile",
        },
        {
            key: "allow_walk_requests",
            icon: "person-add-outline",
            label: "Walk Requests",
            description: "Allow others to request to join your walks",
        },
        {
            key: "share_location_during_walk",
            icon: "location-outline",
            label: "Share Location During Walks",
            description: "Show your live location to walk participants",
        },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.surface.secondary }]}>
            <ScrollView
                contentContainerStyle={{
                    paddingTop: insets.top + 18,
                    paddingHorizontal: 18,
                    paddingBottom: insets.bottom + 24,
                }}
            >
                
                <View style={styles.header}>
                    <Pressable
                        onPress={() => router.back()}
                        style={[styles.backButton, { backgroundColor: colors.surface.primary }]}
                    >
                        <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
                        Privacy & Safety
                    </Text>
                </View>

               
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                    Privacy Settings
                </Text>

                {settingsLoading ? (
                    <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                        Loading...
                    </Text>
                ) : (
                    <View style={[styles.card, { backgroundColor: colors.surface.primary }]}>
                        {privacyRows.map((row, index) => (
                            <View
                                key={row.key}
                                style={[
                                    styles.toggleRow,
                                    index < privacyRows.length - 1 && {
                                        borderBottomWidth: 1,
                                        borderBottomColor: colors.surface.tertiary,
                                    },
                                ]}
                            >
                                <View style={[styles.toggleIconCircle, { backgroundColor: colors.primary[50] }]}>
                                    <Ionicons name={row.icon as any} size={20} color={colors.primary[700]} />
                                </View>
                                <View style={styles.toggleContent}>
                                    <Text style={[styles.toggleLabel, { color: colors.text.primary }]}>
                                        {row.label}
                                    </Text>
                                    <Text style={[styles.toggleDescription, { color: colors.text.secondary }]}>
                                        {row.description}
                                    </Text>
                                </View>
                                <Switch
                                    value={settings[row.key]}
                                    onValueChange={(val) => handleToggle(row.key, val)}
                                    trackColor={{ false: colors.surface.tertiary, true: colors.primary[500] }}
                                    thumbColor="#ffffff"
                                />
                            </View>
                        ))}
                    </View>
                )}

                
                <Text style={[styles.sectionTitle, { color: colors.text.primary, marginTop: 24 }]}>
                    Walk History
                </Text>

                {walksLoading ? (
                    <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                        Loading...
                    </Text>
                ) : pastWalks.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: colors.surface.primary, borderColor: colors.surface.tertiary }]}>
                        <Ionicons name="walk-outline" size={32} color={colors.text.tertiary} />
                        <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                            No walks yet
                        </Text>
                    </View>
                ) : (
                    <>
                        {pastWalks.map((walk) => (
                            <View
                                key={walk.id}
                                style={[styles.walkCard, { backgroundColor: colors.surface.primary }]}
                            >
                                <View style={[styles.walkIconCircle, { backgroundColor: `${colors.primary[500]}1A` }]}>
                                    <Ionicons name="walk" size={20} color={colors.primary[500]} />
                                </View>
                                <View style={styles.walkInfo}>
                                    <Text style={[styles.walkRoute, { color: colors.text.primary }]} numberOfLines={1}>
                                        {walk.start_location} → {walk.end_location}
                                    </Text>
                                    <Text style={[styles.walkDate, { color: colors.text.secondary }]}>
                                        {formatTime(walk.start_time)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                        <Pressable
                            onPress={() => {
                                if (!showFullHistory) fetchAllWalks();
                                else fetchPastWalks();
                                setShowFullHistory((prev) => !prev);
                            }}
                            style={[styles.showMoreButton, { borderColor: colors.surface.tertiary }]}
                        >
                            <Text style={[styles.showMoreText, { color: colors.primary[500] }]}>
                                {showFullHistory ? "Show Less" : "Show Full History"}
                            </Text>
                            <Ionicons
                                name={showFullHistory ? "chevron-up" : "chevron-down"}
                                size={16}
                                color={colors.primary[500]}
                            />
                        </Pressable>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 12,
    },
    card: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    toggleIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    toggleContent: { flex: 1, marginRight: 12 },
    toggleLabel: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    toggleDescription: {
        fontSize: 13,
    },
    emptyCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 32,
        alignItems: 'center',
        gap: 8,
    },
    emptyText: {
        fontSize: 15,
        textAlign: 'center',
    },
    walkCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    walkIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    walkInfo: { flex: 1 },
    walkRoute: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    walkDate: { fontSize: 13 },

    showMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1,
        borderRadius: 16,
        paddingVertical: 12,
        marginTop: 4,
    },
    showMoreText: {
        fontSize: 14,
        fontWeight: '600',
    },
    
});
