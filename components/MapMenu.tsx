import React, { useEffect, useRef, useState } from "react";
import { View, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

interface MenuAction {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    onPress: () => void;
}

interface MapMenuProps {
    open: boolean;
    onToggle: () => void;
    actions: MenuAction[];
}

export const MapMenu = ({ open, onToggle, actions }: MapMenuProps) => {
    const { colors } = useTheme();
    const anims = useRef(actions.map(() => new Animated.Value(0))).current;
    const toggleAnim = useRef(new Animated.Value(0)).current;
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        if (open) {
            anims.forEach(anim => anim.setValue(0));
            toggleAnim.setValue(0);
            setShouldRender(true);

            Animated.parallel([
                Animated.timing(toggleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.stagger(
                    40,
                    [...anims].reverse().map(anim =>
                        Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true })
                    )
                ),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(toggleAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.stagger(
                    30,
                    anims.map(anim =>
                        Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: true })
                    )
                ),
            ]).start(({ finished }) => {
                if (finished) setShouldRender(false);
            });
        }
    }, [open]);

    const rotate = toggleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '90deg'],
    });

    const isActive = open || shouldRender;

    return (
        <View style={styles.wrapper}>
            {shouldRender && (
                <View style={styles.items}>
                    {actions.map((action, i) => {
                        const opacity = anims[i];
                        const translateY = anims[i].interpolate({
                            inputRange: [0, 1],
                            outputRange: [8, 0],
                        });

                        return (
                            <Animated.View key={i} style={{ opacity, transform: [{ translateY }] }}>
                                <TouchableOpacity
                                    style={[styles.circle, { backgroundColor: colors.surface.primary }]}
                                    activeOpacity={0.8}
                                    onPress={action.onPress}
                                >
                                    <Ionicons name={action.icon} size={20} color={colors.text.primary} />
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    })}
                </View>
            )}

            <TouchableOpacity
                style={[styles.circle, { backgroundColor: isActive ? colors.primary[500] : colors.surface.primary }]}
                onPress={onToggle}
                activeOpacity={0.8}
            >
                <Animated.View style={{ transform: [{ rotate }] }}>
                    <Ionicons
                        name="ellipsis-vertical"
                        size={20}
                        color={isActive ? '#fff' : colors.text.primary}
                    />
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: 32,
        right: 16,
        alignItems: 'center',
        zIndex: 1100,
    },
    circle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    items: {
        marginBottom: 8,
        gap: 8,
    },
});
