import React, { useEffect, useState } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { supabase } from "@/libs/supabase";

type Walk = {
    id: string;
    start_location: string;
    end_location: string;
    start_time: string;
};

const Walks = () => {
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
            console.log("Fetched walks data:", data);
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

    if (loading) return <Text> Loading... </Text>;

    return (
        <View className="px-4">
            <Text className="font-rubikBold text-lg mb-4">Upcoming Walks</Text>

            <FlatList
                data={walks}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View className="p-3 mb-5 bg-surface rounded-2xl">
                        <Text>
                            {item.start_location} → {item.end_location}
                        </Text>
                        <Text>
                            {new Date(item.start_time).toLocaleString()}
                        </Text>
                    </View>
                )}
                ListEmptyComponent={
                    <Text className="text-center opacity-60 mt-4">No upcoming walks</Text>
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />
        </View>
    );
};

export default Walks;