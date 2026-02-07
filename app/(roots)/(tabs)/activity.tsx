import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/libs/supabase";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState, useCallback } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import Button from "@/components/Button";
import Mapbox from '@rnmapbox/maps';
import { router } from "expo-router";
import { UBC_CENTER_COORDINATE } from "@/constants/boundaries";
import { Walk } from "@/constants/types"

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

const Activity = () => {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const [walks, setWalks] = useState<Walk[]>([]);
    const [pastWalks, setPastWalks] = useState<Walk[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [walkDuration, setWalkDuration] = useState(0);

    const fetchMyWalks = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from("walks")
            .select("*")
            .eq("user_id", user.id)
            .in("status", ["active", "upcoming"])
            .order("start_time", { ascending: true });

        if (error) {
            console.error("Error fetching walks:", error.message);
        } else {
            setWalks(data ?? []);
        }
    }, []);

    const activeWalk = walks[0] ?? null;

    useEffect(() => {
        if (!activeWalk || activeWalk.status !== "active") return;

        const interval = setInterval(() => {
            const startTime = new Date(activeWalk.start_time).getTime();
            const now = Date.now();
            const diff = Math.floor((now - startTime) / 1000);
            setWalkDuration(diff);
        }, 1000);

        return () => clearInterval(interval);
    }, [activeWalk, walks]);


    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const fetchPastWalks = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from("walks")
            .select("*")
            .eq("user_id", user.id)
            .eq("status", "past")
            .order("start_time", { ascending: false })
            .limit(5);

        if (error) {
            console.error("Error fetching past walks:", error.message);
        } else {
            setPastWalks(data ?? []);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchMyWalks();
        }, [fetchMyWalks])
    );

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            await Promise.all([fetchMyWalks(), fetchPastWalks()]);
            setLoading(false);
        };

        loadInitialData();
    }, [fetchMyWalks, fetchPastWalks]);

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchMyWalks(), fetchPastWalks()]);
        setRefreshing(false);
    };

    const endWalk = async () => {
        if (!activeWalk) return;

        const { error } = await supabase
            .from("walks")
            .update({ status: "past" })
            .eq("id", activeWalk.id);

        if (error) {
            console.error("Error ending walk:", error.message);
            return;
        }

        await fetchMyWalks();
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.surface.secondary }]}>
            <ScrollView
                contentContainerStyle={{
                    paddingTop: insets.top + 18,
                    paddingHorizontal: 18,
                    paddingBottom: 24,
                    flexGrow: 1,

                }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary[500]}
                    />
                }
            >

                {!activeWalk ? (
                    <>

                        <View
                            style={[
                                styles.heroCard,
                                {
                                    backgroundColor: colors.surface.primary,
                                    borderColor: colors.surface.tertiary,
                                },
                            ]}
                        >
                            <View
                                style={[
                                    styles.iconCircle,
                                    { backgroundColor: `${colors.primary[500]}1A` },
                                ]}
                            >
                                <Ionicons name="navigate-outline" size={25} color={colors.primary[700]} />
                            </View>

                            <Text style={[styles.heroTitle, { color: colors.text.primary }]}>
                                No active walk
                            </Text>

                            <Text style={[styles.heroSubtitle, { color: colors.text.secondary }]}>
                                Start a walk from the Map to see it here
                            </Text>
                        </View>

                        {pastWalks.length > 0 && (
                            <View style={styles.historySection}>
                                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                                    Walk History
                                </Text>

                                {pastWalks.map((walk) => (
                                    <Pressable
                                        key={walk.id}
                                        style={[styles.historyCard, { backgroundColor: colors.surface.primary }]}
                                    >
                                        <View style={styles.historyCardContent}>
                                            <View style={styles.historyCardLeft}>
                                                <View style={[styles.historyIconCircle, { backgroundColor: `${colors.primary[500]}1A` }]}>
                                                    <Ionicons name="walk" size={20} color={colors.primary[500]} />
                                                </View>
                                                <View style={styles.historyCardInfo}>
                                                    <Text style={[styles.historyCardTitle, { color: colors.text.primary }]} numberOfLines={1}>
                                                        {walk.start_location} to {walk.end_location}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                                        </View>
                                    </Pressable>
                                ))}
                            </View>
                        )}
                    </>
                ) : (
                    <View>

                        <View style={styles.activeHeader}>
                            <Text style={[styles.activeHeaderTitle, { color: colors.text.primary }]}>
                                Active Walk
                            </Text>
                            <Pressable style={[styles.safetyButton, { backgroundColor: colors.primary[50] }]}>
                                <Ionicons name="shield-checkmark" size={24} color={colors.primary[500]} />
                            </Pressable>
                        </View>


                        <View style={[styles.mapCard, { backgroundColor: colors.surface.primary }]}>
                            <Mapbox.MapView
                                style={styles.mapView}
                                styleURL={isDark ? Mapbox.StyleURL.Street : Mapbox.StyleURL.Street}
                                attributionPosition={{ bottom: 8, right: 8 }}
                                logoEnabled={false}
                                scaleBarEnabled={false}
                                scrollEnabled={false}
                                zoomEnabled={false}
                                rotateEnabled={false}
                                pitchEnabled={false}
                            >
                                <Mapbox.Camera
                                    zoomLevel={14}
                                    centerCoordinate={
                                        activeWalk.start_lng && activeWalk.start_lat
                                            ? [activeWalk.start_lng, activeWalk.start_lat]
                                            : UBC_CENTER_COORDINATE
                                    }
                                    animationMode="none"
                                />


                                {activeWalk.start_lng && activeWalk.start_lat && (
                                    <Mapbox.PointAnnotation
                                        id="start-marker"
                                        coordinate={[activeWalk.start_lng, activeWalk.start_lat]}
                                        anchor={{ x: 0.5, y: 1 }}
                                    >
                                        <View style={styles.marker}>
                                            <Ionicons name="location" color={colors.secondary[500]} size={40} />
                                        </View>
                                    </Mapbox.PointAnnotation>
                                )}


                                {activeWalk.end_lng && activeWalk.end_lat && (
                                    <Mapbox.PointAnnotation
                                        id="end-marker"
                                        coordinate={[activeWalk.end_lng, activeWalk.end_lat]}
                                        anchor={{ x: 0.5, y: 1 }}
                                    >
                                        <View style={styles.marker}>
                                            <Ionicons name="location" color={colors.primary[500]} size={40} />
                                        </View>
                                    </Mapbox.PointAnnotation>
                                )}
                            </Mapbox.MapView>


                            <View style={styles.mapOverlay}>
                                <View style={[styles.meetingBadge, { backgroundColor: colors.surface.primary }]}>
                                    <Text style={[styles.meetingBadgeText, { color: colors.text.primary }]}>
                                        Meet at {activeWalk.start_location}
                                    </Text>
                                </View>
                            </View>


                            <Pressable
                                style={[styles.compassButton, { backgroundColor: colors.surface.primary }]}
                                onPress={() => router.push('../(tabs)/map')}
                            >
                                <Ionicons name="navigate" size={20} color={colors.text.primary} />
                            </Pressable>
                        </View>

                        <View style={styles.statsRow}>

                            <View style={[styles.statCard, { backgroundColor: colors.surface.primary }]}>
                                <View style={[styles.statIconCircle, { backgroundColor: colors.primary[50] }]}>
                                    <Ionicons name="time-outline" size={20} color={colors.primary[500]} />
                                </View>
                                <Text style={[styles.statValue, { color: colors.text.primary }]}>
                                    {formatDuration(walkDuration)}
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                                    Walk Duration
                                </Text>
                            </View>


                            <View style={[styles.statCard, { backgroundColor: colors.surface.primary }]}>
                                <View style={[styles.statIconCircle, { backgroundColor: colors.primary[50] }]}>
                                    <Ionicons name="location" size={20} color={colors.primary[500]} />
                                </View>
                                <Text
                                    style={[styles.statValue, { color: colors.text.primary, fontSize: 15 }]}
                                    numberOfLines={1}
                                >
                                    {activeWalk.end_location}
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                                    Destination
                                </Text>
                            </View>
                        </View>


                        <View style={[styles.infoCard, { backgroundColor: colors.surface.primary }]}>
                            <View style={[styles.infoIconCircle, { backgroundColor: colors.primary[50] }]}>
                                <Ionicons name="location-outline" size={20} color={colors.primary[500]} />
                            </View>
                            <View style={styles.infoTextContainer}>
                                <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>
                                    Meeting Point
                                </Text>
                                <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                                    {activeWalk.start_location}
                                </Text>
                            </View>
                        </View>


                        <View style={styles.buttonContainer}>
                            <Button
                                title="End Walk"
                                onPress={endWalk}
                                variant="danger"
                                size="large"
                                fullWidth
                            />
                        </View>
                    </View>

                )}
            </ScrollView>
        </View>
    );
};

export default Activity;


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    headerTitle: {
        fontSize: 34,
        fontWeight: "800",
    },
    headerSubtitle: {
        marginTop: 6,
        fontSize: 16,
        opacity: 0.9,
    },

    heroCard: {
        marginTop: 18,
        paddingVertical: 32,
        paddingHorizontal: 18,
        borderRadius: 22,
        borderWidth: 1,
        alignItems: "center",
    },

    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
    },

    heroTitle: {
        fontSize: 22,
        fontWeight: "800",
        marginBottom: 6,
    },
    heroSubtitle: {
        fontSize: 16,
        textAlign: "center",
        opacity: 0.9,
        maxWidth: 280,
    },
    activeLabel: {
        fontSize: 13,
        fontWeight: "700",
        marginBottom: 8,
    },
    activeRoute: {
        fontSize: 18,
        fontWeight: "800",
        marginBottom: 6,
    },
    activeTime: {
        fontSize: 14,
        opacity: 0.9,
    },

    expandedCard: {
        paddingBottom: 24,
    },

    activeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
        marginTop: 8,
    },
    activeHeaderTitle: {
        fontSize: 28,
        fontWeight: '800',
    },
    safetyButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    infoIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 17,
        fontWeight: '700',
    },
    buttonContainer: {
        marginTop: 8,
    },
    mapCard: {
        height: 300,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        position: 'relative',
    },
    mapView: {
        flex: 1,
    },
    mapOverlay: {
        position: 'absolute',
        top: 16,
        left: 0,
        right: 0,
        alignItems: 'center',
        pointerEvents: 'none',
    },
    meetingBadge: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    meetingBadgeText: {
        fontSize: 15,
        fontWeight: '600',
    },
    compassButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    marker: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    historySection: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 12,
    },
    historyCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    historyCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    historyCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    historyIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    historyCardInfo: {
        flex: 1,
    },
    historyCardTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    historyCardDate: {
        fontSize: 13,
    },
});
