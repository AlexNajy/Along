import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/libs/supabase';
import Button from '@/components/Button';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      setUser(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      Alert.alert('Error', 'Could not load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            try {
              const { error } = await supabase.auth.signOut();
              if (error) throw error;
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Could not sign out. Please try again.');
            } finally {
              setSigningOut(false);
            }
          },
        },
      ]
    );
  }; 

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'This feature is coming soon!');
  };

  if (loading) {
    return (
      <View className="flex-1 bg-surface-secondary justify-center items-center">
        <Text className="text-text-secondary font-rubik">Loading...</Text>
      </View>
    );
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;


  return (

    <ScrollView className="flex-1 bg-surface-secondary">
       {/* Header */}
      <View className="bg-surface px-6 pt-16 pb-8 items-center border-b border-surface-tertiary">
        {/* Avatar image */}
        <View className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center mb-4 overflow-hidden">
          {avatarUrl ? (
            <Image 
                source={{ uri: avatarUrl }}
                className="w-full h-full"
                resizeMode="cover"
            />
          ) : (
            <Text className="text-3xl font-rubikBold text-primary-500">
              {displayName.charAt(0).toUpperCase()}
            </Text>
          )}

        </View>
        {/* Client name */}
        <Text className="text-2xl font-rubikBold text-text-primary mb-1">
            {displayName}
        </Text>
          {/* Client email */}
        <Text className="text-sm font-rubik text-text-secondary">
            {user?.email}
        </Text>
        </View>

    <View className="px-3 py-6">
        {/* Account info section */}
        <View className="bg-surface rounded-card p-card mb-4 shadow-card">
            <Text className="text-lg font-rubikSemiBold text-text-primary my">
                Account Info
            </Text>
        </View>

        <View className="flex-row justify-between items-center px-1 py-2">
            <Text className="font-rubik text-text-secondary">Email</Text>
            <Text className="font-rubikMedium text-text-primary">
                {user?.email}
            </Text>
        </View>

        <View className="h-px bg-surface-tertiary my-2" />

        <View className="flex-row justify-between items-center px-1 py-2">
            <Text className="font-rubik text-text-secondary">
                Account ID
            </Text>
            <Text className="font-rubik text-text-tertiary text-xs">
                {user?.id.slice(0, 8)}...
            </Text>
        </View>
    </View>


    <View className="px-3 py-4">
        {/* Action Section */}
        <View className="bg-surface rounded-card p-card mb-4 shadow-card ">
                <Text className="text-lg font-rubikSemiBold text-text-primary mb-4">
                    Actions
                </Text>

                {/* Edit profla button */}
                <View className="mb-3">
                    <Button
                        title='Edit profile'
                        onPress={handleEditProfile}
                        variant='primary'
                        size='medium'
                        fullWidth
                    />
                </View>

                {/* Sign out button */}
                <Button
                    title='Sign out'
                    onPress={handleSignOut}
                    variant='danger'
                    size='medium'
                    loading={signingOut}
                    fullWidth        
                /> 
        </View>
        {/*Fotter spacing*/}
        <View className="h-18" />
    </View>

    </ScrollView>
  );
}
