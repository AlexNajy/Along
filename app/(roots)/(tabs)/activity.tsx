import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/libs/supabase";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState, useCallback, useRef} from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View, Pressable, Animated} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, router } from "expo-router";
import Mapbox from '@rnmapbox/maps';
import { Walk, WalkRequest } from "@/constants/types"
import { useAuth } from "@/context/AuthContext";
import { LinearGradient } from 'expo-linear-gradient';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

const STATUS_COLORS: Record<string, string> = {
    pending: "#F59E0B",
    accepted: "#10B981",
    declined: "#EF4444",
    cancelled: "#9CA3AF",
};

const Activity = () => {
    const { colors, isDark } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const [walks, setWalks] = useState<Walk[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [walkDuration, setWalkDuration] = useState(0);
    const [incomingRequests, setIncomingRequests] = useState<WalkRequest[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<WalkRequest[]>([]);
    const buttonScale = useRef(new Animated.Value(1)).current;


    const fetchMyWalks = useCallback(async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from("walks")
            .select("*")
            .eq("user_id", user.id)
            .in("status", ["active", "upcoming"])
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching walks:", error.message);
        } else {
            setWalks(data ?? []);
        }
    }, [user]);

    const activeWalk = walks.find(w => w.status === "active") ?? null;
    const upcomingWalk = walks.find(w => w.status === "upcoming") ?? null;

    useEffect(() => {
        if (!upcomingWalk) return;

        const checkAndActivate = async () => {
            const startTime = new Date(upcomingWalk.start_time).getTime();
            const now = Date.now();

            if (now >= startTime) {
                const { error } = await supabase
                    .from("walks")
                    .update({ status: "active" })
                    .eq("id", upcomingWalk.id);

                if (error) {
                    console.error("Error activating walk:", error.message);
                } else {
                    await fetchMyWalks();
                }
            }
        };
        
        checkAndActivate();
        
        const interval = setInterval(checkAndActivate, 10000);

        return () => clearInterval(interval);
    }, [upcomingWalk, fetchMyWalks]);

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


    const fetchRequests = useCallback(async () => {
        if (!user) return;
    
        const { data: incoming, error: inErr } = await supabase
        .from("walk_requests")
        .select(`*, walk:walks(start_location, end_location, start_time, walk_type)`)
        .eq("owner_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
    
        if (inErr) {
            console.error("Error fetching incoming requests:", inErr.message);
        } else if (incoming && incoming.length > 0) {
            const requesterIds = incoming.map((r) => r.requester_id);
            const { data: profileData } = await supabase
                .from("profiles")
                .select("id, user_name, avatar")
                .in("id", requesterIds);
        
            setIncomingRequests(incoming.map((r) => ({
                ...r,
                requester: profileData?.find((p) => p.id === r.requester_id),
            })));
        } else {
            setIncomingRequests([]);
        }


    const { data: outgoing, error: outErr } = await supabase
        .from("walk_requests")
        .select(`*, walk:walks(start_location, end_location, start_time, walk_type)`)
        .eq("requester_id", user.id)
        .in("status", ["pending", "accepted", "declined"])
        .order("created_at", { ascending: false });

        if (outErr) console.error("Error fetching outgoing requests:", outErr.message);
        else setOutgoingRequests(outgoing ?? []);

        }, [user]);

    const respondToRequest = async (requestId: string, status: "accepted" | "declined") => {
        const { error } = await supabase
            .from("walk_requests")
            .update({ status })
            .eq("id", requestId);
        if (error) console.error("Error responding to request:", error.message);
        else await fetchRequests();
    };

    const cancelRequest = async (requestId: string) => {
        const { error } = await supabase
            .from("walk_requests")
            .update({ status: "cancelled" })
            .eq("id", requestId);
        if (error) console.error("Error cancelling request:", error.message);
        else await fetchRequests();
    };



    useEffect(() => {
        const loadInitialData = async () => {
            await Promise.all([fetchMyWalks(), fetchRequests()]);
        };

        loadInitialData();
    }, [fetchMyWalks, fetchRequests]);

    useFocusEffect(
        useCallback(() => {
            if (!user) return;
            fetchMyWalks();
            fetchRequests();
        }, [user,fetchMyWalks, fetchRequests])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchMyWalks(), fetchRequests()]);
        setRefreshing(false);
    };

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

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

    const handleEndWalkPressIn = () => {
        Animated.spring(buttonScale, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };
    
    const handleEndWalkPressOut = () => {
        Animated.spring(buttonScale, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.surface.secondary }]}>
            <ScrollView
                contentContainerStyle={{
                    paddingTop: insets.top + 18,
                    paddingHorizontal: 18,
                    paddingBottom: insets.bottom + 48,
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
                                <Ionicons name={upcomingWalk ? "time-outline" : "navigate-outline"} size={25} color={colors.primary[700]} />
                            </View>

                            <Text style={[styles.heroTitle, { color: colors.text.primary }]}>
                                {upcomingWalk ? "Upcoming walk" : "No active walk"}
                            </Text>

                            <Text style={[styles.heroSubtitle, { color: colors.text.secondary }]}>
                                {upcomingWalk
                                    ? `${upcomingWalk.start_location} → ${upcomingWalk.end_location}`
                                    : "Start a walk from the Map to see it here"}
                            </Text>

                            {upcomingWalk && (
                            <Text style={[styles.heroSubtitle, { color: colors.text.secondary, marginTop: 6 }]}>
                                Starts {formatTime(upcomingWalk.start_time)}
                            </Text>
                        )}

                        </View>
                        {(incomingRequests.length > 0 || outgoingRequests.length > 0) && (
                            <View style={styles.requestsSection}>
                                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                                    Walk Requests
                                </Text>

                                {incomingRequests.length > 0 && (
                                    <>
                                        <Text style={[styles.subSectionLabel, { color: colors.text.secondary }]}>
                                            Incoming
                                        </Text>
                                        {incomingRequests.map((req) => (
                                            <View key={req.id} style={[styles.requestCard, { backgroundColor: colors.surface.primary }]}>
                                                <View style={styles.requestCardLeft}>
                                                    <View style={[styles.requestIconCircle, { backgroundColor: `${colors.primary[500]}1A` }]}>
                                                        <Ionicons name="person" size={18} color={colors.primary[500]} />
                                                    </View>
                                                    <View style={styles.requestInfo}>
                                                        <Text style={[styles.requestName, { color: colors.text.primary }]} numberOfLines={1}>
                                                        {req.requester?.user_name ?? "Someone"}
                                                        </Text>
                                                        <Text style={[styles.requestRoute, { color: colors.text.secondary }]} numberOfLines={1}>
                                                            {req.walk?.start_location} → {req.walk?.end_location}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={styles.requestActions}>
                                                    <Pressable
                                                        style={[styles.actionBtn, styles.declineBtn, { borderColor: colors.surface.tertiary }]}
                                                        onPress={() => respondToRequest(req.id, "declined")}
                                                    >
                                                        <Ionicons name="close" size={16} color={colors.text.secondary} />
                                                    </Pressable>
                                                    <Pressable
                                                        style={[styles.actionBtn, { backgroundColor: colors.primary[500] }]}
                                                        onPress={() => respondToRequest(req.id, "accepted")}
                                                    >
                                                        <Ionicons name="checkmark" size={16} color="#fff" />
                                                    </Pressable>
                                                </View>
                                            </View>
                                        ))}
                                    </>
                                )}

                                {outgoingRequests.length > 0 && (
                                    <>
                                        <Text style={[styles.subSectionLabel, { color: colors.text.secondary }]}>
                                            Outgoing
                                        </Text>
                                        {outgoingRequests.map((req) => (
                                            <View key={req.id} style={[styles.requestCard, { backgroundColor: colors.surface.primary }]}>
                                                <View style={styles.requestCardLeft}>
                                                    <View style={[styles.requestIconCircle, { backgroundColor: `${colors.primary[500]}1A` }]}>
                                                        <Ionicons name="walk" size={18} color={colors.primary[500]} />
                                                    </View>
                                                    <View style={styles.requestInfo}>
                                                        <Text style={[styles.requestRoute, { color: colors.text.primary }]} numberOfLines={1}>
                                                            {req.walk?.start_location} → {req.walk?.end_location}
                                                        </Text>
                                                        <Text style={[styles.requestDate, { color: colors.text.secondary }]}>
                                                            {req.walk?.start_time ? formatTime(req.walk.start_time) : ""}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={styles.requestStatusContainer}>
                                                    <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[req.status]}1A` }]}>
                                                        <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[req.status] }]}>
                                                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                                        </Text>
                                                    </View>
                                                    {req.status === "pending" && (
                                                        <Pressable
                                                            style={[styles.cancelBtn, { borderColor: colors.surface.tertiary }]}
                                                            onPress={() => cancelRequest(req.id)}
                                                        >
                                                            <Text style={[styles.cancelBtnText, { color: colors.text.secondary }]}>
                                                                Cancel
                                                            </Text>
                                                        </Pressable>
                                                    )}
                                                </View>
                                            </View>
                                        ))}
                                    </>
                                )}
                            </View>
                        )}
                        
                        
                    </>
                ) : (
                    <View style={styles.activeContainer}>

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
                                styleURL={Mapbox.StyleURL.Street}
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
                                             [activeWalk.start_lng, activeWalk.start_lat]   
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
                    </View>

                )}
            </ScrollView>
            {activeWalk && (
                <Animated.View style={[
                    styles.endWalkWrapper,
                    { 
                        transform: [{ scale: buttonScale }],
                    }
                ]}>
                    <LinearGradient
                        colors={['#10b981', '#06b6d4', '#0ea5e9']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.endWalkGradientBorder}
                    >
                        <Pressable
                            onPress={endWalk}
                            onPressIn={handleEndWalkPressIn}
                            onPressOut={handleEndWalkPressOut}
                            style={[styles.endWalkButton, { backgroundColor: isDark ? '#030712': '#ffffff'  }]}
                        >
                            <Text style={[styles.endWalkText, { color: isDark ?  '#ffffff':'#030712'  }]}>End Walk</Text>
                            <Ionicons name="walk-outline" size={18} color={isDark ? '#ffffff':'#030712'} />

                        </Pressable>
                    </LinearGradient>
                </Animated.View>
            )}
        </View>
    );
};

export default Activity;


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    endWalkWrapper: {
        alignSelf: 'center',
        position: 'absolute',
        bottom: 28,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    endWalkGradientBorder: {
        borderRadius: 18,
        padding: 2,
    },
    endWalkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 87,
        paddingVertical: 14,
        borderRadius: 16,
    },
    endWalkText: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.3,
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

    activeContainer: {
        flex: 1,
    },
    
    
    mapCard: {
        height: 380,
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
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 12,
    },

    requestsSection: {
        marginTop: 24,
    },
    subSectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginTop: 4,
    },
    requestCard: {
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    requestCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    requestIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    requestInfo: {
        flex: 1,
    },
    requestName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    requestRoute: {
        fontSize: 14,
        fontWeight: '500',
    },
    requestDate: {
        fontSize: 13,
        marginTop: 2,
    },
    requestActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    declineBtn: {
        borderWidth: 1,
    },
    requestStatusContainer: {
        alignItems: 'flex-end',
        gap: 6,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    cancelBtn: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    cancelBtnText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
