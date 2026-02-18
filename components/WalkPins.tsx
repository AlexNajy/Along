import React, { useEffect, useState, useRef } from "react";
import { View, TouchableOpacity, Image, Animated } from "react-native";
import Mapbox from "@rnmapbox/maps";
import { Walk } from "@/constants/types";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/libs/supabase";

type Props = {
  walks: Walk[];
  onWalkPress?: (walkId: string) => void;
  selectedWalkId?: string | null;
};

const WalkPins: React.FC<Props> = ({ walks, onWalkPress, selectedWalkId }) => {
  const { colors } = useTheme();
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAvatars = async () => {
      if (!walks.length) {
        setIsLoading(false);
        return;
      }

      const userIds = walks.map((w) => w.user_id);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, avatar")
        .in("id", userIds);

      if (error) {
        console.error("Failed to fetch avatars:", error);
        setIsLoading(false);
        return;
      }

      if (data) {
        const avatarMap: Record<string, string> = {};
        data.forEach((p) => {
          if (p.avatar) avatarMap[p.id] = p.avatar;
        });
        setAvatars(avatarMap);
      }
      
      setIsLoading(false);
    };

    fetchAvatars();
  }, [walks]);

  if (isLoading) return null;

  return (
    <>
      {walks
        .filter((w) => w.start_lng !== undefined && w.start_lat !== undefined)
        .map((walk) => (
          <AnimatedPin
            key={walk.id}
            walk={walk}
            avatarUrl={avatars[walk.user_id]}
            isSelected={walk.id === selectedWalkId}
            onPress={() => onWalkPress?.(walk.id)}
            colors={colors}
          />
        ))}
    </>
  );
};

const AnimatedPin: React.FC<{
  walk: Walk;
  avatarUrl?: string;
  isSelected: boolean;
  onPress: () => void;
  colors: any;
}> = ({ walk, avatarUrl, isSelected, onPress, colors }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (isSelected) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSelected]);

  return (
    <Mapbox.MarkerView
      id={walk.id}
      coordinate={[walk.start_lng!, walk.start_lat!]}
    >
      <TouchableOpacity onPress={onPress}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Image
            source={{
              uri: avatarUrl || 'https://ui-avatars.com/api/?name=User&background=random',
            }}
            style={{
              width: isSelected ? 50 : 40,
              height: isSelected ? 50 : 40,
              borderRadius: isSelected ? 25 : 20,
              borderWidth: isSelected ? 3 : 2,
              borderColor: isSelected ? colors.primary[500] : 'white',
              backgroundColor: '#E5E7EB',
              ...(isSelected && {
                shadowColor: colors.primary[500],
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 8,
                elevation: 8,
              })
            }}
          />
        </Animated.View>
      </TouchableOpacity>
    </Mapbox.MarkerView>
  );
};

export default WalkPins;