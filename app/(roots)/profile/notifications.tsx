import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Switch, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/libs/supabase";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

interface NotificationPrefs {
    notif_walk_requests: boolean;
    notif_walk_starting_soon: boolean;
    notif_walk_accepted: boolean;
    notif_walk_declined: boolean;
}

export default function NotificationsScreen() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [prefs, setPrefs] = useState<NotificationPrefs>({
        notif_walk_requests: true,
        notif_walk_starting_soon: true,
        notif_walk_accepted: true,
        notif_walk_declined: true,
    });

    const fetchPrefs = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from("profiles")
            .select(
                "notif_walk_requests, notif_walk_starting_soon, notif_walk_accepted, notif_walk_declined"
            )
            .eq("id", user.id)
            .single();

        if (error) {
            console.error("Error fetching notification prefs:", error.message);
        } else if (data) {
            setPrefs({
                notif_walk_requests: data.notif_walk_requests ?? true,
                notif_walk_starting_soon: data.notif_walk_starting_soon ?? true,
                notif_walk_accepted: data.notif_walk_accepted ?? true,
                notif_walk_declined: data.notif_walk_declined ?? true,
            });
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchPrefs();
    }, [fetchPrefs]);

    const handleToggle = async (key: keyof NotificationPrefs, value: boolean) => {
        if (!user) return;
        setPrefs((prev) => ({ ...prev, [key]: value }));
        const { error } = await supabase
            .from("profiles")
            .update({ [key]: value })
            .eq("id", user.id);

        if (error) {
            console.error("Error saving notification pref:", error.message);
            // Revert on failure
            setPrefs((prev) => ({ ...prev, [key]: !value }));
        }
    };

    const rows: { key: keyof NotificationPrefs; label: string; description: string; icon: string }[] = [
        {
            key: "notif_walk_requests",
            label: "Walk Requests",
            description: "When someone requests to join your walk",
            icon: "person-add-outline",
        },
        {
            key: "notif_walk_starting_soon",
            label: "Walk Starting Soon",
            description: "Reminder before your scheduled walk begins",
            icon: "time-outline",
        },
        {
            key: "notif_walk_accepted",
            label: "Walk Accepted",
            description: "When your walk request is approved",
            icon: "checkmark-circle-outline",
        },
        {
            key: "notif_walk_declined",
            label: "Walk Declined",
            description: "When your walk request is not approved",
            icon: "close-circle-outline",
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
                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        onPress={() => router.back()}
                        style={[styles.backButton, { backgroundColor: colors.surface.primary }]}
                    >
                        <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
                        Notifications
                    </Text>
                </View>

                {/* Section title */}
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                    Push Notifications
                </Text>

                {loading ? (
                    <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
                        Loading...
                    </Text>
                ) : (
                    <View
                        style={[
                            styles.card,
                            {
                                backgroundColor: colors.surface.primary,
                                shadowColor: "#000",
                            },
                        ]}
                    >
                        {rows.map((row, index) => (
                            <View
                                key={row.key}
                                style={[
                                    styles.row,
                                    index < rows.length - 1 && {
                                        borderBottomWidth: 1,
                                        borderBottomColor: colors.surface.tertiary,
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.iconCircle,
                                        { backgroundColor: colors.primary[50] },
                                    ]}
                                >
                                    <Ionicons
                                        name={row.icon as any}
                                        size={20}
                                        color={colors.primary[700]}
                                    />
                                </View>
                                <View style={styles.rowText}>
                                    <Text style={[styles.rowLabel, { color: colors.text.primary }]}>
                                        {row.label}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.rowDescription,
                                            { color: colors.text.secondary },
                                        ]}
                                    >
                                        {row.description}
                                    </Text>
                                </View>
                                <Switch
                                    value={prefs[row.key]}
                                    onValueChange={(value) => handleToggle(row.key, value)}
                                    trackColor={{
                                        false: colors.surface.tertiary,
                                        true: colors.primary[500],
                                    }}
                                    thumbColor={colors.surface.primary}
                                />
                            </View>
                        ))}
                    </View>
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
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 12,
    },
    loadingText: {
        fontSize: 15,
        textAlign: "center",
        marginTop: 32,
    },
    card: {
        borderRadius: 16,
        overflow: "hidden",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    rowText: { flex: 1 },
    rowLabel: {
        fontSize: 15,
        fontWeight: "600",
        marginBottom: 2,
    },
    rowDescription: {
        fontSize: 13,
    },
});
