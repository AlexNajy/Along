import React, { useEffect, useState } from "react";
import { View, Text, FlatList, RefreshControl, StyleSheet } from "react-native";
import { supabase } from "@/libs/supabase";
import { useTheme } from "@/context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Walk = {
    id: string;
    start_location: string;
    end_location: string;
    start_time: string;
};

const Walks = () => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [walks, setWalks] = useState<Walk[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchUpcomingWalks = async () => {
        const { data, error } = await supabase
            .from("walks")
            .select("id, start_location, end_location, start_time")
            .eq("status", "upcoming")
            .order("start_time", { ascending: true });

        if (error) {
            console.error("Error fetching walks:", error.message);
        } else {
            setWalks(data ?? []);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            await fetchUpcomingWalks();
            setLoading(false);
        };

        loadInitialData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUpcomingWalks();
        setRefreshing(false);
    };

    if (loading) {
        return (
            <View 
                style={[
                    styles.container, 
                    { 
                        backgroundColor: colors.surface.secondary,
                        paddingTop: insets.top,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }
                ]}
            >
                <Text style={{ color: colors.text.secondary }}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.surface.secondary }]}>
            <FlatList
                data={walks}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingTop: insets.top, paddingHorizontal: 16 }}
                ListHeaderComponent={
                    <Text style={[styles.title, { color: colors.text.primary }]}>
                        Upcoming Walks
                    </Text>
                }
                renderItem={({ item }) => (
                    <View style={[styles.walkCard, { backgroundColor: colors.surface.primary }]}>
                        <Text style={{ color: colors.text.primary }}>
                            {item.start_location} → {item.end_location}
                        </Text>
                        <Text style={{ color: colors.text.secondary }}>
                            {new Date(item.start_time).toLocaleString()}
                        </Text>
                    </View>
                )}
                ListEmptyComponent={
                    <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
                        No upcoming walks
                    </Text>
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary[500]}
                    />
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        marginTop: 16,
    },
    walkCard: {
        padding: 12,
        marginBottom: 20,
        borderRadius: 16,
    },
    emptyText: {
        textAlign: 'center',
        opacity: 0.6,
        marginTop: 16,
    },
});

export default Walks;