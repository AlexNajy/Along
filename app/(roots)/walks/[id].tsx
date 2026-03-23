import React, { useEffect, useState, useCallback } from "react";
import {View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, Image, Alert, Animated } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Mapbox from "@rnmapbox/maps";

import { supabase } from "@/libs/supabase";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Walk, WalkRequest, Profile } from "@/constants/types";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

type ParticipantRow = WalkRequest & {
    profiles: Pick<Profile, "user_name" | "avatar">;
};

function formatStartTime(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatCountdown(iso: string): string {
    const diff = new Date(iso).getTime() - Date.now();
    if (diff <= 0) return "starting now";
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (days > 0) return `in ${days}d ${hours}h`;
    if (hours > 0) return `in ${hours}h ${minutes}m`;
    if (minutes > 0) return `in ${minutes}m ${seconds}s`;
    return `in ${seconds}s`;
}

function getInitials(name?: string): string {
    if (!name) return "?";
    return name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

export default function WalkDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { colors, isDark } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const [walk, setWalk] = useState<Walk | null>(null);
    const [participants, setParticipants] = useState<ParticipantRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState<string>("");
    const [isCancelling, setIsCancelling] = useState(false);
    const buttonScale = React.useRef(new Animated.Value(1)).current;


    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
    
        const [walkResult, requestsResult] = await Promise.all([
            supabase.from("walks").select("*").eq("id", id).single(),
            supabase
                .from("walk_requests")
                .select("*")
                .eq("walk_id", id)
                .eq("status", "accepted"),
        ]);
    
        if (walkResult.error) {
            setError(walkResult.error.message);
            setLoading(false);
            return;
        }
        if (requestsResult.error) {
            setError(requestsResult.error.message);
            setLoading(false);
            return;
        }
    
        const requests = requestsResult.data ?? [];
    
        if (requests.length > 0) {
            const requesterIds = requests.map((r) => r.requester_id);
            const { data: profileData } = await supabase
                .from("profiles")
                .select("id, user_name, avatar")
                .in("id", requesterIds);
    
            setParticipants(requests.map((r) => ({
                ...r,
                profiles: profileData?.find((p) => p.id === r.requester_id),
            })) as ParticipantRow[]);
        } else {
            setParticipants([]);
        }
    
        setWalk(walkResult.data as Walk);
        setLoading(false);
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    useEffect(() => {
        if (!walk) return;
        setCountdown(formatCountdown(walk.start_time));
        const interval = setInterval(() => {
            setCountdown(formatCountdown(walk.start_time));
        }, 1000);
        return () => clearInterval(interval);
    }, [walk]);

    const doCancel = async () => {
        if (!walk) return;
        setIsCancelling(true);
        const { error: cancelError } = await supabase
            .from("walks")
            .update({ status: "past" })
            .eq("id", walk.id);

        if (cancelError) {
            setIsCancelling(false);
            Alert.alert("Error", cancelError.message);
            return;
        }
        setIsCancelling(false);
        router.back();
    };

    const handleCancelPress = () => {
        Alert.alert("Cancel Walk", "Are you sure you want to cancel this walk?", [
            { text: "No", style: "cancel" },
            { text: "Yes", style: "destructive", onPress: doCancel },
        ]);
    };

    const handleCancelPressIn = () => {
        Animated.spring(buttonScale, { toValue: 0.95, useNativeDriver: true }).start();
    };

    const handleCancelPressOut = () => {
        Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();
    };


    const startCoord: [number, number] = walk
        ? [walk.start_lng, walk.start_lat]
        : [0, 0];
    const endCoord: [number, number] = walk
        ? [walk.end_lng, walk.end_lat]
        : [0, 0];

    const boundsFromWalk = walk
        ? {
              ne: [
                  Math.max(walk.start_lng, walk.end_lng),
                  Math.max(walk.start_lat, walk.end_lat),
              ] as [number, number],
              sw: [
                  Math.min(walk.start_lng, walk.end_lng),
                  Math.min(walk.start_lat, walk.end_lat),
              ] as [number, number],
          }
        : null;

    if (loading) {
        return (
            <View style={[styles.centeredState, { backgroundColor: colors.surface.secondary }]}>
                <ActivityIndicator size="large" color={colors.primary[500]} />
            </View>
        );
    }

    if (error || !walk) {
        return (
            <View style={[styles.centeredState, { backgroundColor: colors.surface.secondary }]}>
                <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.text.secondary }]}>
                    {error ?? "Walk not found"}
                </Text>
                <Pressable
                    onPress={() => router.back()}
                    style={[styles.retryButton, { backgroundColor: colors.surface.primary }]}
                >
                    <Text style={{ color: colors.primary[500], fontWeight: "600" }}>Go back</Text>
                </Pressable>
            </View>
        );
    }

    const isOwner = user?.id === walk.user_id;
    const isPublic = walk.walk_type === "public";


    return (
        <View style={[styles.container, { backgroundColor: colors.surface.secondary }]}>
            
            <View
                style={[
                    styles.modalHandleRow,
                    { paddingTop: insets.top + 10, backgroundColor: colors.surface.secondary },
                ]}
            >
                <View style={[styles.handleBar, { backgroundColor: colors.surface.tertiary }]} />
                <Pressable
                    onPress={() => router.back()}
                    style={[,styles.closeButton, { backgroundColor: colors.surface.primary }]}
                >
                    <Ionicons name="chevron-back" size={20} color={colors.text.primary} />
                </Pressable>
            </View>

            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + 32 },
                ]}
                showsVerticalScrollIndicator={false}
            >
            
                <View style={[styles.mapCard, { backgroundColor: colors.surface.primary }]}>
                    <Mapbox.MapView
                        style={styles.mapView}
                        styleURL={Mapbox.StyleURL.Street}
                        attributionPosition={{ bottom: 6, right: 6 }}
                        logoEnabled={false}
                        scaleBarEnabled={false}
                        scrollEnabled={false}
                        zoomEnabled={false}
                        rotateEnabled={false}
                        pitchEnabled={false}
                    >
                        {boundsFromWalk && (
                            <Mapbox.Camera
                                bounds={boundsFromWalk}
                                padding={{ paddingTop: 40, paddingRight: 40, paddingBottom: 40, paddingLeft: 40 }}
                                animationDuration={0}
                            />
                        )}

                        {walk.route && (
                            <Mapbox.ShapeSource id="route" shape={walk.route}>
                                <Mapbox.LineLayer
                                    id="route-line"
                                    style={{
                                        lineColor: colors.primary[500],
                                        lineWidth: 4,
                                        lineCap: "round",
                                        lineJoin: "round",
                                    }}
                                />
                            </Mapbox.ShapeSource>
                        )}

                        <Mapbox.PointAnnotation
                            id="start"
                            coordinate={startCoord}
                            anchor={{ x: 0.5, y: 0.5 }}
                        >
                            <View style={styles.startDot} />
                        </Mapbox.PointAnnotation>

                        <Mapbox.PointAnnotation
                            id="end"
                            coordinate={endCoord}
                            anchor={{ x: 0.5, y: 0.5 }}
                        >
                            <View style={styles.endDot} />
                        </Mapbox.PointAnnotation>
                    </Mapbox.MapView>
                </View>

                
                <View style={[styles.card, { backgroundColor: colors.surface.primary }]}>

                    
                    <View style={[styles.infoRow, { borderBottomColor: colors.surface.tertiary }]}>
                        <View
                            style={[styles.infoIconCircle, { backgroundColor: `${colors.primary[500]}1A` }]}
                        >
                            <Ionicons name="navigate-outline" size={20} color={colors.primary[500]} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>Route</Text>
                            <Text
                                style={[styles.infoValue, { color: colors.text.primary }]}
                                numberOfLines={2}
                            >
                                {walk.start_location} → {walk.end_location}
                            </Text>
                        </View>
                    </View>

                   
                    <View style={[styles.infoRow, { borderBottomColor: colors.surface.tertiary }]}>
                        <View
                            style={[styles.infoIconCircle, { backgroundColor: `${colors.primary[500]}1A` }]}
                        >
                            <Ionicons name="calendar-outline" size={20} color={colors.primary[500]} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>
                                Start time
                            </Text>
                            <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                                {formatStartTime(walk.start_time)}
                            </Text>
                        </View>
                    </View>

                   
                    <View style={[styles.infoRow, { borderBottomColor: colors.surface.tertiary }]}>
                        <View
                            style={[styles.infoIconCircle, { backgroundColor: `${colors.primary[500]}1A` }]}
                        >
                            <Ionicons name="time-outline" size={20} color={colors.primary[500]} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>
                                Countdown
                            </Text>
                            <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                                {countdown}
                            </Text>
                        </View>
                    </View>

                    
                    <View style={[styles.infoRow, styles.infoRowLast]}>
                        <View
                            style={[styles.infoIconCircle, { backgroundColor: `${colors.primary[500]}1A` }]}
                        >
                            <Ionicons
                                name={isPublic ? "globe-outline" : "lock-closed-outline"}
                                size={20}
                                color={colors.primary[500]}
                            />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>
                                Walk type
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.typeBadge,
                                {
                                    backgroundColor: isPublic
                                        ? `${colors.primary[500]}1A`
                                        : colors.surface.tertiary,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.typeBadgeText,
                                    { color: isPublic ? colors.primary[500] : colors.text.secondary },
                                ]}
                            >
                                {isPublic ? "Public" : "Private"}
                            </Text>
                        </View>
                    </View>
                </View>

                
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                    Walkers ({participants.length})
                </Text>

                <View style={[styles.card, { backgroundColor: colors.surface.primary }]}>
                    {participants.length === 0 && (
                        <View style={styles.emptyParticipants}>
                            <Ionicons name="people-outline" size={28} color={colors.text.tertiary} />
                            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                                No walkers yet
                            </Text>
                        </View>
                    )}

                    {participants.map((p, index) => {
                        const isLast = index === participants.length - 1;
                        return (
                            <View
                                key={p.id}
                                style={[
                                    styles.participantRow,
                                    !isLast && {
                                        borderBottomWidth: 1,
                                        borderBottomColor: colors.surface.tertiary,
                                    },
                                ]}
                            >
                                {p.profiles?.avatar ? (
                                    <Image
                                        source={{ uri: p.profiles.avatar }}
                                        style={styles.avatar}
                                    />
                                ) : (
                                    <View
                                        style={[
                                            styles.avatarFallback,
                                            { backgroundColor: `${colors.primary[500]}1A` },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.avatarInitials,
                                                { color: colors.primary[500] },
                                            ]}
                                        >
                                            {getInitials(p.profiles?.user_name)}
                                        </Text>
                                    </View>
                                )}
                                <Text
                                    style={[styles.participantName, { color: colors.text.primary }]}
                                    numberOfLines={1}
                                >
                                    {p.profiles?.user_name ?? "Walker"}
                                </Text>
                            </View>
                        );
                    })}

                    
                    <Pressable
                        onPress={() =>
                            Alert.alert("Coming soon", "Invite functionality is coming soon.")
                        }
                        style={[styles.inviteRow, { borderColor: colors.surface.tertiary }]}
                    >
                        <View
                            style={[
                                styles.inviteIconCircle,
                                { borderColor: colors.primary[500], backgroundColor: `${colors.primary[500]}1A` },
                            ]}
                        >
                            <Ionicons name="add" size={20} color={colors.primary[500]} />
                        </View>
                        <Text style={[styles.inviteText, { color: colors.primary[500] }]}>
                            Invite someone
                        </Text>
                    </Pressable>
                </View>
                
                {isOwner && walk.status !== "past" && (
                    <Animated.View
                        style={[styles.cancelWalkWrapper, { transform: [{ scale: buttonScale }] }]}
                    >
                        <LinearGradient
                            colors={["#10b981", "#06b6d4", "#0ea5e9"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.cancelWalkGradientBorder}
                        >
                            <Pressable
                                onPress={handleCancelPress}
                                onPressIn={handleCancelPressIn}
                                onPressOut={handleCancelPressOut}
                                disabled={isCancelling}
                                style={[
                                    styles.cancelWalkButton,
                                    { backgroundColor: isDark ? "#030712" : "#ffffff" },
                                ]}
                            >
                                {isCancelling ? (
                                    <ActivityIndicator
                                        size="small"
                                        color={isDark ? "#ffffff" : "#030712"}
                                    />
                                ) : (
                                    <>
                                        <Text
                                            style={[
                                                styles.cancelWalkText,
                                                { color: isDark ? "#ffffff" : "#030712" },
                                            ]}
                                        >
                                            Cancel Walk
                                        </Text>
                                        <Ionicons
                                            name="close-circle-outline"
                                            size={18}
                                            color={isDark ? "#ffffff" : "#030712"}
                                        />
                                    </>
                                )}
                            </Pressable>
                        </LinearGradient>
                    </Animated.View>
                )}
            </ScrollView>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    centeredState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    errorText: {
        fontSize: 15,
        textAlign: "center",
        maxWidth: 260,
    },
    retryButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        marginTop: 4,
    },

    modalHandleRow: {
        alignItems: "center",
        paddingBottom: 10,
        position: "relative",
    },
    handleBar: {
        width: 36,
        height: 4,
        borderRadius: 2,
        marginBottom: 8,
    },
    closeButton: {
        position: "absolute",
        left: 18,
        bottom: 10,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },

    scrollContent: {
        paddingHorizontal: 18,
        paddingTop: 8,
        paddingBottom: 32,
    },

    
    mapCard: {
        height: 240,
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    mapView: {
        flex: 1,
    },
    startDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: "#10b981",
        borderWidth: 2,
        borderColor: "#ffffff",
    },
    endDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: "#ef4444",
        borderWidth: 2,
        borderColor: "#ffffff",
    },

    // Info card
    card: {
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    infoRowLast: {
        borderBottomWidth: 0,
    },
    infoIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.4,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: "600",
    },
    typeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
    },
    typeBadgeText: {
        fontSize: 13,
        fontWeight: "700",
    },

    // Section header
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 12,
    },

    // Participants
    emptyParticipants: {
        alignItems: "center",
        paddingVertical: 24,
        gap: 8,
    },
    emptyText: {
        fontSize: 14,
    },
    participantRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarFallback: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarInitials: {
        fontSize: 15,
        fontWeight: "700",
    },
    participantName: {
        fontSize: 15,
        fontWeight: "600",
        flex: 1,
    },

    // Invite row
    inviteRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        borderTopWidth: 1,
    },
    inviteIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1.5,
        borderStyle: "dashed",
        alignItems: "center",
        justifyContent: "center",
    },
    inviteText: {
        fontSize: 15,
        fontWeight: "600",
    },

    cancelWalkWrapper: {
        alignSelf: "center",
        marginBottom: 8,
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    cancelWalkGradientBorder: {
        borderRadius: 18,
        padding: 2,
    },
    cancelWalkButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 72,
        paddingVertical: 14,
        borderRadius: 16,
        minWidth: 200,
        justifyContent: "center",
    },
    cancelWalkText: {
        fontSize: 16,
        fontWeight: "600",
        letterSpacing: 0.3,
    },
});
