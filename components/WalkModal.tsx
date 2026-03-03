import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Walk } from '@/constants/types';
import { useEffect, useRef, useState } from 'react';
import { calculateDistance, calculateEstimatedTime } from '@/libs/geometry';

const roundDistance = (distance: string): string => {
    const num = parseFloat(distance);

    if (distance.includes('km')) {
        return `${Math.round(num * 10) / 10}km`;
    } else if (distance.includes('m')) {
        const rounded = Math.round(num / 10) * 10;
        return `${rounded}m`;
    }

    return distance;
};

type Props = {
    visible: boolean;
    onClose: () => void;
    selectedWalk?: Walk | null;
    userRoute?: {
        start: string;
        end: string;
        distance?: string;
        estimatedTime?: string;
    } | null;
    onCreateWalk?: () => void;
    onJoinWalk?: () => void;
};

export const WalkModal: React.FC<Props> = ({
    visible,
    onClose,
    selectedWalk,
    userRoute,
    onCreateWalk,
    onJoinWalk
}) => {
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
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>

            {selectedWalk ? (
                <>
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
                    </View>

                    <View style={styles.bottomRow}>
                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <Ionicons name="time" size={18} color={colors.primary[500]} />
                                <Text style={[styles.statText, { color: colors.text.primary }]}>
                                    {new Date(selectedWalk.start_time).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </Text>
                            </View>
                            {selectedWalk.route && (
                                <View style={styles.statItem}>
                                    <Ionicons name="walk" size={18} color={colors.primary[500]} />
                                    <Text style={[styles.statText, { color: colors.text.primary }]}>
                                        {calculateEstimatedTime(calculateDistance(selectedWalk.route))}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {onJoinWalk && (
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: colors.primary[500] }]}
                                onPress={onJoinWalk}
                            >
                                <Text style={styles.buttonText}>Join Walk</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </>
            ) : userRoute ? (
                <>
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
                    </View>

                    <View style={styles.bottomRow}>
                        <View style={styles.statsContainer}>
                            {userRoute.distance && (
                                <View style={styles.statItem}>
                                    <Ionicons name="walk" size={18} color={colors.primary[500]} />
                                    <Text style={[styles.statText, { color: colors.text.primary }]}>
                                        {roundDistance(userRoute.distance)}
                                    </Text>
                                </View>
                            )}
                            {userRoute.estimatedTime && (
                                <View style={styles.statItem}>
                                    <Ionicons name="time" size={18} color={colors.primary[500]} />
                                    <Text style={[styles.statText, { color: colors.text.primary }]}>
                                        {userRoute.estimatedTime}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {onCreateWalk && (
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: colors.primary[500] }]}
                                onPress={onCreateWalk}
                            >
                                <Text style={styles.buttonText}>Create Walk</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </>
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
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
        zIndex: 10,
    },
    content: {
        gap: 12,
        marginTop: 8,
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
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
        gap: 12,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 16,
        flex: 1,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statText: {
        fontSize: 14,
        fontFamily: 'Rubik-SemiBold',
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'Rubik-SemiBold',
    },
});