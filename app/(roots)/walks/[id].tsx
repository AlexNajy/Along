import React from "react";
import {Text, View} from "react-native"
import { useLocalSearchParams } from "expo-router";

const Walks = () => {
    const {id} = useLocalSearchParams()
    
    return (
        <View>
            <Text>Walks Page</Text>
        </View>
    )
}

export default Walks