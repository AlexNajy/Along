import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/libs/supabase";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Walk } from "@/constants/types";

export default function PrivacyScreen() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const [pastWalks, setPastWalks] = useState<Walk[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPastWalks = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from("walks")
            .select("*")
            .eq("user_id", user.id)
            .eq("status", "past")
            .order("start_time", { ascending: false });

        if (error) console.error("Error fetching past walks:", error.message);
        else setPastWalks(data ?? []);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchPastWalks();
    }, [fetchPastWalks]);

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    return (
        <View style={[styles.container, { backgroundColor: colors.surface.secondary }]}>
            <ScrollView
                contentContainerStyle={{
                    paddingTop: insets.top + 18,
                    paddingHorizontal: 18,
                    paddingBottom: insets.bottom + 24,
                }}
            >
                {/* Header */}
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

                {/* Walk History */}
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                    Walk History
                </Text>

                {loading ? (
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
                    pastWalks.map((walk) => (
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
                    ))
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
});