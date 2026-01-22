import React, { useState, useEffect } from "react";
import { Text, View, FlatList } from "react-native"
import { supabase } from "@/libs/supabase";

const Walks = () => {
    const [names, setNames] = useState([]);

    useEffect(() => {
        const getNames = async () => {
            try {
                const { data: names, error } = await supabase.from('demo').select('*');

                if (error) {
                    console.error('Error fetching names:', error.message);
                    return;
                }

                if (names && names.length > 0) {
                    setNames(names);
                }
            } catch (error) {
                console.error('Error fetching names:', error.message);
            }
        };

        getNames();

    }, []);
    return (
        <View className="flex-1 justify-center items-center">
          <Text className="font-rubikBold">Names</Text>
          <FlatList
            data={names}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <Text key={item.id}>{item.name}</Text>}
          />
        </View>
      );
}

export default Walks