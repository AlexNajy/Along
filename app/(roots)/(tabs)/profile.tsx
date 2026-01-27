import { supabase } from "@/libs/supabase";
import { router } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native"

const Profile = () => {
    return (
        <View>
            <Text>Profile Page</Text>
            <TouchableOpacity onPress={async () => {
                await supabase.auth.signOut();
                router.replace('/sign-in'); // Navigate back to sign-in
            }}>
                <Text>Sign Out</Text>
            </TouchableOpacity>
        </View>
    )
}

export default Profile