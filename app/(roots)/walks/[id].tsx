import React from "react";
import {Text, View} from "react-native"
import { useLocalSearchParams } from "expo-router";

const WalkPage = () => {
    const {id} = useLocalSearchParams()
    
    return (
        <View>
            <Text>Walk Page</Text>
        </View>
    )
}

export default WalkPage