import { useRef } from 'react';
import { Animated } from 'react-native';

export const useJiggleAnimation = () => {
  const jiggleAnim = useRef(new Animated.Value(0)).current;

  const jiggle = () => {
    Animated.sequence([
      Animated.timing(jiggleAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(jiggleAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(jiggleAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(jiggleAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return { 
    jiggleAnim, 
    jiggle,
    animatedStyle: { transform: [{ translateX: jiggleAnim }] }
  };
};