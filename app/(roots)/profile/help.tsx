import React, { useState, useRef } from "react";
import {View, Text, ScrollView, Pressable, Linking, LayoutAnimation, Platform, UIManager, StyleSheet} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { LinearGradient } from 'expo-linear-gradient';
import { Animated } from 'react-native';


interface FaqItem {
    question: string;
    answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
    {
        question: "How do I join someone's walk?",
        answer:
            "Browse available walks on the home screen, tap one that interests you, and press \"Request to Join\". The walk owner will receive a notification and can accept or decline your request.",
    },
    {
        question: "Can I create a private walk?",
        answer:
            "Yes. When creating a walk, set the walk type to \"Private\". Private walks are only visible to users you share a link with and won't appear in the public feed.",
    },
    {
        question: "What happens if my walk request is declined?",
        answer:
            "You'll receive a notification letting you know. You're free to request other available walks. Declined requests don't affect your profile rating.",
    },
    {
        question: "How is my rating calculated?",
        answer:
            "Your rating is based on feedback left by other walkers after shared walks complete. It reflects punctuality, friendliness, and overall experience. Ratings update after each completed walk.",
    },
    {
        question: "How do I cancel a walk I've joined?",
        answer:
            "Go to your upcoming walks, tap the walk you want to leave, and select \"Cancel\". Please cancel at least 30 minutes before the start time so the walk owner can plan accordingly.",
    },
];

export default function HelpScreen() {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const buttonScale = useRef(new Animated.Value(1)).current;

    const handleToggle = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedIndex((prev) => (prev === index ? null : index));
    };

    const handleContactSupport = () => {
        Linking.openURL("mailto:support@along.app");
    };

    const handlePressIn = () => {
        Animated.spring(buttonScale, { toValue: 0.95, useNativeDriver: true }).start();
    };
    
    const handlePressOut = () => {
        Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.surface.secondary }]}>
            <ScrollView
                contentContainerStyle={{
                    paddingTop: insets.top + 18,
                    paddingHorizontal: 18,
                    paddingBottom: insets.bottom + 24,
                }}
            >
                
                <View style={styles.header}>
                    <Pressable
                        onPress={() => router.back()}
                        style={[styles.backButton, { backgroundColor: colors.surface.primary }]}
                    >
                        <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
                        Help & Support
                    </Text>
                </View>

                
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                    Frequently Asked Questions
                </Text>

                <View
                    style={[
                        styles.faqCard,
                        {
                            backgroundColor: colors.surface.primary,
                            shadowColor: "#000",
                        },
                    ]}
                >
                    {FAQ_ITEMS.map((item, index) => (
                        <View
                            key={index}
                            style={[
                                styles.faqItem,
                                index < FAQ_ITEMS.length - 1 && {
                                    borderBottomWidth: 1,
                                    borderBottomColor: colors.surface.tertiary,
                                },
                            ]}
                        >
                            <Pressable
                                onPress={() => handleToggle(index)}
                                style={styles.faqQuestion}
                            >
                                <Text
                                    style={[styles.faqQuestionText, { color: colors.text.primary }]}
                                >
                                    {item.question}
                                </Text>
                                <Ionicons
                                    name={expandedIndex === index ? "chevron-up" : "chevron-down"}
                                    size={18}
                                    color={colors.text.tertiary}
                                />
                            </Pressable>

                            {expandedIndex === index && (
                                <Text
                                    style={[styles.faqAnswer, { color: colors.text.secondary }]}
                                >
                                    {item.answer}
                                </Text>
                            )}
                        </View>
                    ))}
                </View>

                
                <Text style={[styles.sectionTitle, { color: colors.text.primary, marginTop: 37 }]}>
                    Still need help?
                </Text>

                <Animated.View style={[styles.contactWrapper, { transform: [{ scale: buttonScale }] }]}>
                    <LinearGradient
                        colors={['#10b981', '#06b6d4', '#0ea5e9']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.contactGradientBorder}
                    >
                        <Pressable
                            onPress={handleContactSupport}
                            onPressIn={handlePressIn}
                            onPressOut={handlePressOut}
                            style={[styles.contactButton, { backgroundColor: isDark ? '#030712' : '#ffffff' }]}
                        >
                            <Ionicons name="mail-outline" size={20} color={isDark ? '#ffffff' : '#030712'} />
                            <Text style={[styles.contactButtonText, { color: isDark ? '#ffffff' : '#030712' }]}>
                                Contact Support
                            </Text>
                        </Pressable>
                    </LinearGradient>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
        gap: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "800",
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 12,
    },
    faqCard: {
        borderRadius: 16,
        overflow: "hidden",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    faqItem: {
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    faqQuestion: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    faqQuestionText: {
        fontSize: 15,
        fontWeight: "600",
        flex: 1,
    },
    faqAnswer: {
        fontSize: 14,
        lineHeight: 21,
        marginTop: 10,
    },
    contactWrapper: {
        alignSelf: 'center',
        marginTop: 18,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    contactGradientBorder: {
        borderRadius: 18,
        padding: 2,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingHorizontal: 48,
        paddingVertical: 14,
        borderRadius: 16,
    },
    contactButtonText: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
});
