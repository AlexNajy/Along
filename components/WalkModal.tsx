import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Walk } from '@/constants/types';
import { useEffect, useRef, useState } from 'react';

type Props = {
  visible: boolean;
  onClose: () => void;
  selectedWalk?: Walk | null;
  userRoute?: {
    start: string;
    end: string;
    distance?: string;
  } | null;
};

export const WalkModal: React.FC<Props> = ({ visible, onClose, selectedWalk, userRoute }) => {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setShouldRender(false);
      });
    }
  }, [visible]);

  if (!shouldRender) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.surface.primary,
          transform: [{ translateY: slideAnim }],
          shadowColor: '#000',
        }
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {selectedWalk ? 'Walk Details' : 'Your Route'}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {selectedWalk ? (
        <View style={styles.content}>
          <View style={styles.row}>
            <Ionicons name="location" size={20} color={colors.primary[500]} />
            <View style={styles.textContainer}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>From</Text>
              <Text style={[styles.value, { color: colors.text.primary }]}>
                {selectedWalk.start_location || 'Start location'}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <Ionicons name="flag" size={20} color={colors.secondary[500]} />
            <View style={styles.textContainer}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>To</Text>
              <Text style={[styles.value, { color: colors.text.primary }]}>
                {selectedWalk.end_location || 'End location'}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <Ionicons name="time" size={20} color={colors.primary[500]} />
            <View style={styles.textContainer}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>Departure</Text>
              <Text style={[styles.value, { color: colors.text.primary }]}>
                {new Date(selectedWalk.start_time).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>
          </View>
        </View>
      ) : userRoute ? (
        <View style={styles.content}>
          <View style={styles.row}>
            <Ionicons name="location" size={20} color={colors.primary[500]} />
            <View style={styles.textContainer}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>From</Text>
              <Text style={[styles.value, { color: colors.text.primary }]}>
                {userRoute.start}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <Ionicons name="flag" size={20} color={colors.secondary[500]} />
            <View style={styles.textContainer}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>To</Text>
              <Text style={[styles.value, { color: colors.text.primary }]}>
                {userRoute.end}
              </Text>
            </View>
          </View>

          {userRoute.distance && (
            <View style={styles.row}>
              <Ionicons name="walk" size={20} color={colors.primary[500]} />
              <View style={styles.textContainer}>
                <Text style={[styles.label, { color: colors.text.secondary }]}>Distance</Text>
                <Text style={[styles.value, { color: colors.text.primary }]}>
                  {userRoute.distance}
                </Text>
              </View>
            </View>
          )}
        </View>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Rubik-Regular',
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    fontFamily: 'Rubik-SemiBold',
  },
});