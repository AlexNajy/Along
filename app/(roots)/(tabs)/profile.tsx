import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/libs/supabase';
import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

interface UserStats {
  total_walks: number;
  rating: number;
  connections: number;
  verified: boolean;
}

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    total_walks: 0,
    rating: 0.0,
    connections: 0,
    verified: false,
  });

  useEffect(() => {
    fetchUser();
    fetchUserStats();
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

  const fetchUserStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
  
      const { data, error } = await supabase
        .from('profiles')
        .select('total_walks, ratings, connections, verified')
        .eq('id', user.id)
        .single();
  
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
  
      if (data) {
        setStats({
          total_walks: data.total_walks || 0,      
          rating: data.ratings || 0.0,             
          connections: data.connections || 0,
          verified: data.verified || false,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
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

  const handleNotifications = () => {
    Alert.alert('Notifications', 'This feature is coming soon!');
  };

  const handlePrivacy = () => {
    Alert.alert('Privacy & Safety', 'This feature is coming soon!');
  };

  const handleVerifyIdentity = () => {
    Alert.alert('Verify Identity', 'This feature is coming soon!');
  };

  const handleHelp = () => {
    Alert.alert('Help & Support', 'This feature is coming soon!');
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
      {/* Page Header */}
      <View className="px-6 pt-13 pb-4">
        <Text className="text-3xl font-rubikBold text-text-primary">Account</Text>
        <Text className="text-base font-rubik text-text-secondary mt-1">
          Manage your profile and settings
        </Text>
      </View>

    <View>
      {/* Profile Card */}
      <View className="mx-6 mb-4">
        <View className="bg-surface rounded-card p-6 shadow-card">
          <View className="flex-row items-center mb-4">
            {/* Avatar */}
            <View className="w-20 h-20 rounded-2xl bg-primary-100 items-center justify-center overflow-hidden mr-4">
              {avatarUrl ? (
                <Image 
                  source={{ uri: avatarUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-2xl font-rubikBold text-primary-500">
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>

            {/* Name and Info */}
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-xl font-rubikBold text-text-primary mr-2">
                  {displayName}
                </Text>
                {stats.verified && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.primary[700]}
                  />
                )}
              </View>
              <Text className="text-sm font-rubik text-text-secondary mt-1">
                Tecnologico de Monterrey
              </Text>
              <Text className="text-sm font-rubik text-text-secondary">
                {user?.email}
              </Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          <Button
            title="Edit Profile"
            onPress={handleEditProfile}
            variant="outline"
            size="medium"
            fullWidth
          />
        </View>
      </View>

    {/* Stats Cards */}
    <View className="px-6 mb-4">
        <View className="flex-row justify-between">
          {/* Total Walks */}
          <View className="bg-surface rounded-card p-4 shadow-card flex-1 mr-2 items-center">
            <View className="flex-row items-center mb-2">
              <Text className="text-2xl font-rubikBold text-text-primary">
              {stats.total_walks}
              </Text>
            </View>
            <Text className="text-sm font-rubik text-text-secondary">Total Walks</Text>
          </View>

          {/* Rating */}
          <View className="bg-surface rounded-card p-4 shadow-card flex-1 mx-1 items-center">
            <View className="flex-row items-center mb-2">
              <Text className="text-2xl font-rubikBold text-text-primary">
                {stats.rating.toFixed(1)}
              </Text>
            </View>
            <Text className="text-sm font-rubik text-text-secondary">Rating</Text>
          </View>

          {/* Connections */}
          <View className="bg-surface rounded-card p-4 shadow-card flex-1 ml-2 items-center">
            <View className="flex-row items-center mb-2">
              <Text className="text-2xl font-rubikBold text-text-primary">
              {stats.connections}
              </Text>
            </View>
            <Text className="text-sm font-rubik text-text-secondary">Connections </Text>
          </View>
        </View>
      </View>



    {/* Settings Menu */}
    <View className="mx-6 mb-4">
            <View className="bg-surface rounded-card shadow-card overflow-hidden">
              
              {/* Notifications */}
              <TouchableOpacity 
                onPress={handleNotifications}
                className="flex-row items-center p-4 border-b border-surface-tertiary active:bg-surface-secondary"
              >
                <View className="w-10 h-10 rounded-full bg-primary-50 items-center justify-center mr-3">
                  <Ionicons name="notifications" size={20} color={colors.primary[700]} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-rubikSemiBold text-text-primary">
                    Notifications
                  </Text>
                  <Text className="text-sm font-rubik text-text-secondary">
                    Manage alerts and updates
                  </Text>
                </View>
                <Text className="text-text-tertiary text-xl">›</Text>
              </TouchableOpacity>

              {/* Privacy & Safety */}
              <TouchableOpacity 
                onPress={handlePrivacy}
                className="flex-row items-center p-4 border-b border-surface-tertiary active:bg-surface-secondary"
              >
                <View className="w-10 h-10 rounded-full bg-primary-50 items-center justify-center mr-3">
                  <Ionicons name="shield-half" size={20} color={colors.primary[700]} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-rubikSemiBold text-text-primary">
                    Privacy & Safety
                  </Text>
                  <Text className="text-sm font-rubik text-text-secondary">
                    Control your visibility
                  </Text>
                </View>
                <Text className="text-text-tertiary text-xl">›</Text>
              </TouchableOpacity>

              {/* Verify Identity */}
              <TouchableOpacity 
                onPress={handleVerifyIdentity}
                className="flex-row items-center p-4 border-b border-surface-tertiary active:bg-surface-secondary"
              >
                <View className="w-10 h-10 rounded-full bg-primary-50 items-center justify-center mr-3">
                  <Ionicons name="shield-checkmark" size={20} color={colors.primary[700]} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-rubikSemiBold text-text-primary">
                    Verify Identity
                  </Text>
                  <Text className="text-sm font-rubik text-text-secondary">
                    Complete your verification
                  </Text>
                </View>
                <Text className="text-text-tertiary text-xl">›</Text>
              </TouchableOpacity>

              {/* Help & Support */}
              <TouchableOpacity 
                onPress={handleHelp}
                className="flex-row items-center p-4 active:bg-surface-secondary"
              >
                <View className="w-10 h-10 rounded-full bg-primary-50 items-center justify-center mr-3">
                  <Ionicons name="help" size={20} color={colors.primary[700]} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-rubikSemiBold text-text-primary">
                    Help & Support
                  </Text>
                  <Text className="text-sm font-rubik text-text-secondary">
                    Get help or report issues
                  </Text>
                </View>
                <Text className="text-text-tertiary text-xl">›</Text>
              </TouchableOpacity>

            </View>
          </View>

          <View className="h-px bg-surface-tertiary my-2" />

          {/* Sign Out Button */}
          <View className="mx-6 mb-8">
            <Button
              title={signingOut ? "Signing Out..." : "Sign Out"}
              onPress={handleSignOut}
              variant="danger"
              size="medium"
              fullWidth
              disabled={signingOut}
            />
          </View>
        </View>

    </ScrollView>
  );
}
