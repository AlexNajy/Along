import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

interface MapMenuProps {
    open: boolean;
    onToggle: () => void;
}

export const MapMenu = ({ open, onToggle }: MapMenuProps) => {
    const { colors } = useTheme();

    return (
        <View style={styles.wrapper}>
            {open && (
                <View style={styles.items}>
                    {['1', '2', '3'].map((label) => (
                        <TouchableOpacity
                            key={label}
                            style={[styles.circle, { backgroundColor: colors.surface.primary }]}
                            activeOpacity={0.8}
                            onPress={() => {}}
                        >
                            <Text style={[styles.label, { color: colors.text.primary }]}>{label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <TouchableOpacity
                style={[styles.circle, { backgroundColor: colors.surface.primary }]}
                onPress={onToggle}
                activeOpacity={0.8}
            >
                <Ionicons name="ellipsis-vertical" size={20} color={colors.text.primary} />
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
    label: {
        fontSize: 16,
        fontWeight: '600',
    },
});
