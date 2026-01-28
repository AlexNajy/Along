import React from "react";
import {Text, View} from "react-native"
import { useLocalSearchParams } from "expo-router";

const Walk = () => {
    const {id} = useLocalSearchParams()
    
    return (
        <View>
            <Text>Walk Page</Text>
        </View>
    )
}

export default Walk