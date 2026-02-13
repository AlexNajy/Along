import { useState, useEffect } from 'react';
import { supabase } from '@/libs/supabase';
import { Walk } from '@/constants/types';

export const useWalks = () => {
    const [walks, setWalks] = useState<Walk[]>([]);
    const [selectedWalkId, setSelectedWalkId] = useState<string | null>(null);

    const selectedWalk = selectedWalkId 
        ? walks.find(w => w.id === selectedWalkId) 
        : null;

    const fetchWalks = async () => {
        try {
            const { data, error } = await supabase
                .from("walks")
                .select("*")
                .eq("status", "upcoming")
                .order("start_time", { ascending: true });

            if (error) throw error;
            if (data) setWalks(data as Walk[]);
        } catch (err: any) {
            console.error("Failed to fetch walks:", err);
        }
    };

    useEffect(() => {
        fetchWalks();
        const channel = supabase.channel('walks-updates').on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'walks' },
            () => fetchWalks()
        ).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    return { walks, selectedWalkId, setSelectedWalkId, selectedWalk };
};