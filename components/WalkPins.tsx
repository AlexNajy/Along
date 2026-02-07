import React from "react";
import { View } from "react-native";
import Mapbox from "@rnmapbox/maps";
import { Ionicons } from "@expo/vector-icons";
import { Walk } from "@/constants/walk";

type Props = {
  walks: Walk[];
  onSelectWalk?: (walkId: string) => void;
};

const WalkPins: React.FC<Props> = ({ walks, onSelectWalk }) => {
  return (
    <>
      {walks.map((walk) => {
        if (
          walk.start_lng === undefined ||
          walk.start_lat === undefined
        )
          return null;

        return (
          <Mapbox.PointAnnotation
            key={`walk-${walk.id}`}
            id={`walk-${walk.id}`}
            coordinate={[walk.start_lng, walk.start_lat]} 
            onSelected={() => onSelectWalk?.(walk.id)}
          >
            <View
              style={{
                backgroundColor: "#1E90FF", 
                borderRadius: 16,
                padding: 4,
              }}
            >
              <Ionicons name="walk" size={24} color="white" />
            </View>
          </Mapbox.PointAnnotation>
        );
      })}
    </>
  );
};

export default WalkPins;
