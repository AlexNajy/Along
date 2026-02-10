import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Image } from "react-native";
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
        .map((walk) => {
            const isSelected = walk.id === selectedWalkId;
          
          return (
            <Mapbox.MarkerView
              key={walk.id}
              id={walk.id}
              coordinate={[walk.start_lng!, walk.start_lat!]}
            >
              <TouchableOpacity onPress={() => onWalkPress?.(walk.id)}>
                <Image
                  source={{
                    uri: avatars[walk.user_id],
                  }}
                  style={{
                    width: isSelected ? 50 : 40,
                    height: isSelected ? 50 : 40,
                    borderRadius: 25,
                    borderWidth: 2,
                    borderColor: 'white',
                    backgroundColor: colors.blank
                  }}
                />
              </TouchableOpacity>
            </Mapbox.MarkerView>
          );
        })}
    </>
  );
};

export default WalkPins;