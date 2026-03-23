import React, { useEffect, useState, useCallback } from "react";
import {View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator,} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/libs/supabase";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import * as ImagePicker from 'expo-image-picker';

type VerificationStatus = "unverified" | "pending" | "verified";

export default function VerifyIdentityScreen() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const [status, setStatus] = useState<VerificationStatus>("unverified");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Step state: 0 = upload gov ID, 1 = upload selfie, 2 = ready to submit
    const [step, setStep] = useState<0 | 1 | 2>(0);
    const [govIdUploaded, setGovIdUploaded] = useState(false);
    const [selfieUploaded, setSelfieUploaded] = useState(false);

    const fetchVerificationStatus = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from("profiles")
            .select("verified, verification_pending")
            .eq("id", user.id)
            .single();

        if (error) {
            console.error("Error fetching verification status:", error.message);
        } else if (data) {
            if (data.verified) {
                setStatus("verified");
            } else if (data.verification_pending) {
                setStatus("pending");
            } else {
                setStatus("unverified");
            }
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchVerificationStatus();
    }, [fetchVerificationStatus]);

    const handleGovIdPress = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to your photo library.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });
        if (!result.canceled) {
            setGovIdUploaded(true);
            if (selfieUploaded) setStep(2);
            else setStep(1);
        }
    };

    const handleSelfiePress = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to your camera.');
            return;
        }
        
        try {
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                quality: 0.8,
            });
            if (!result.canceled) {
                setSelfieUploaded(true);
                if (govIdUploaded) setStep(2);
            }
        } catch {
            Alert.alert('Camera not available', 'Please test this on a real device.');
        }
    };

    const handleSubmit = async () => {
        if (!user) return;
        setSubmitting(true);
        const { error } = await supabase
            .from("profiles")
            .update({ verification_pending: true })
            .eq("id", user.id);

        setSubmitting(false);

        if (error) {
            console.error("Error submitting verification:", error.message);
            Alert.alert("Error", "Failed to submit for review. Please try again.");
        } else {
            setStatus("pending");
        }
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
                        Verify Identity
                    </Text>
                </View>

                {loading ? (
                    <View style={styles.centeredBlock}>
                        <ActivityIndicator color={colors.primary[500]} />
                    </View>
                ) : status === "verified" ? (
                    <VerifiedState colors={colors} />
                ) : status === "pending" ? (
                    <PendingState colors={colors} />
                ) : (
                    <UnverifiedFlow
                        colors={colors}
                        step={step}
                        govIdUploaded={govIdUploaded}
                        selfieUploaded={selfieUploaded}
                        submitting={submitting}
                        onGovIdPress={handleGovIdPress}
                        onSelfiePress={handleSelfiePress}
                        onSubmit={handleSubmit}
                    />
                )}
            </ScrollView>
        </View>
    );
}



type Colors = ReturnType<typeof import("@/context/ThemeContext").useTheme>["colors"];

function VerifiedState({ colors }: { colors: Colors }) {
    return (
        <View style={[styles.statusCard, { backgroundColor: colors.surface.primary }]}>
            <View style={[styles.statusIconCircle, { backgroundColor: `${colors.accent.green}1A` }]}>
                <Ionicons name="checkmark-circle" size={48} color={colors.accent.green} />
            </View>
            <Text style={[styles.statusTitle, { color: colors.text.primary }]}>
                Your identity is verified
            </Text>
            <Text style={[styles.statusBody, { color: colors.text.secondary }]}>
                You have the verified badge on your profile. Other walkers can trust that you are who you say you are.
            </Text>
        </View>
    );
}

function PendingState({ colors }: { colors: Colors }) {
    return (
        <View style={[styles.statusCard, { backgroundColor: colors.surface.primary }]}>
            <View style={[styles.statusIconCircle, { backgroundColor: `${colors.accent.yellow}1A` }]}>
                <Ionicons name="time" size={48} color={colors.accent.yellow} />
            </View>
            <Text style={[styles.statusTitle, { color: colors.text.primary }]}>
                Your verification is under review
            </Text>
            <Text style={[styles.statusBody, { color: colors.text.secondary }]}>
                We typically complete reviews within 1–2 business days. You will receive a notification once your identity has been confirmed.
            </Text>
        </View>
    );
}

interface UnverifiedFlowProps {
    colors: Colors;
    step: 0 | 1 | 2;
    govIdUploaded: boolean;
    selfieUploaded: boolean;
    submitting: boolean;
    onGovIdPress: () => void;
    onSelfiePress: () => void;
    onSubmit: () => void;
}

function UnverifiedFlow({
    colors,
    step,
    govIdUploaded,
    selfieUploaded,
    submitting,
    onGovIdPress,
    onSelfiePress,
    onSubmit,
}: UnverifiedFlowProps) {
    return (
        <>
            {/* Intro */}
            <View style={[styles.infoCard, { backgroundColor: colors.surface.primary }]}>
                <View style={[styles.infoIconCircle, { backgroundColor: colors.primary[50] }]}>
                    <Ionicons name="shield-checkmark" size={24} color={colors.primary[700]} />
                </View>
                <View style={styles.infoTextBlock}>
                    <Text style={[styles.infoTitle, { color: colors.text.primary }]}>
                        Why verify?
                    </Text>
                    <Text style={[styles.infoBody, { color: colors.text.secondary }]}>
                        A verified badge builds trust with other walkers and unlocks all Along features.
                    </Text>
                </View>
            </View>

            
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Steps to verify
            </Text>

            
            <UploadStep
                colors={colors}
                stepNumber={1}
                label="Government-issued photo ID"
                description="Passport, driver's license, or national ID card"
                uploaded={govIdUploaded}
                active={!govIdUploaded}
                onPress={onGovIdPress}
            />

            
            <UploadStep
                colors={colors}
                stepNumber={2}
                label="A selfie holding your ID"
                description="Make sure your face and the ID are clearly visible"
                uploaded={selfieUploaded}
                active={govIdUploaded && !selfieUploaded}
                onPress={onSelfiePress}
            />

            
            {step === 2 && (
                <Pressable
                    onPress={onSubmit}
                    disabled={submitting}
                    style={[
                        styles.submitButton,
                        {
                            backgroundColor: submitting
                                ? colors.primary[300]
                                : colors.primary[500],
                        },
                    ]}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit for Review</Text>
                    )}
                </Pressable>
            )}

            
            <Text style={[styles.privacyNote, { color: colors.text.tertiary }]}>
                Your documents are encrypted and used only for identity verification. They are never shared with other users.
            </Text>
        </>
    );
}

interface UploadStepProps {
    colors: Colors;
    stepNumber: number;
    label: string;
    description: string;
    uploaded: boolean;
    active: boolean;
    onPress: () => void;
}

function UploadStep({
    colors,
    stepNumber,
    label,
    description,
    uploaded,
    active,
    onPress,
}: UploadStepProps) {
    const borderColor = uploaded
        ? colors.accent.green
        : active
        ? colors.primary[500]
        : colors.surface.tertiary;

    return (
        <Pressable
            onPress={active || !uploaded ? onPress : undefined}
            style={[
                styles.uploadStep,
                {
                    backgroundColor: colors.surface.primary,
                    borderColor,
                    borderWidth: 1.5,
                    opacity: !active && !uploaded ? 0.5 : 1,
                },
            ]}
        >
            
            <View
                style={[
                    styles.stepBubble,
                    {
                        backgroundColor: uploaded
                            ? `${colors.accent.green}1A`
                            : active
                            ? colors.primary[50]
                            : colors.surface.tertiary,
                    },
                ]}
            >
                {uploaded ? (
                    <Ionicons name="checkmark" size={18} color={colors.accent.green} />
                ) : (
                    <Text
                        style={[
                            styles.stepBubbleText,
                            {
                                color: active
                                    ? colors.primary[700]
                                    : colors.text.tertiary,
                            },
                        ]}
                    >
                        {stepNumber}
                    </Text>
                )}
            </View>

            
            <View style={styles.stepTextBlock}>
                <Text style={[styles.stepLabel, { color: colors.text.primary }]}>
                    {label}
                </Text>
                <Text style={[styles.stepDescription, { color: colors.text.secondary }]}>
                    {description}
                </Text>
            </View>

            {/* Right icon */}
            {!uploaded && (
                <View
                    style={[
                        styles.uploadIconCircle,
                        { backgroundColor: active ? colors.primary[50] : colors.surface.tertiary },
                    ]}
                >
                    <Ionicons
                        name="camera"
                        size={18}
                        color={active ? colors.primary[700] : colors.text.tertiary}
                    />
                </View>
            )}
        </Pressable>
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
    centeredBlock: {
        paddingTop: 60,
        alignItems: "center",
    },
    // Verified / Pending status cards
    statusCard: {
        borderRadius: 20,
        padding: 32,
        alignItems: "center",
        gap: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    statusIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    statusTitle: {
        fontSize: 20,
        fontWeight: "700",
        textAlign: "center",
    },
    statusBody: {
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20,
    },
    // Intro info card
    infoCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    infoIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
    },
    infoTextBlock: { flex: 1 },
    infoTitle: {
        fontSize: 15,
        fontWeight: "700",
        marginBottom: 4,
    },
    infoBody: {
        fontSize: 13,
        lineHeight: 18,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 12,
    },
    // Upload step rows
    uploadStep: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    stepBubble: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    stepBubbleText: {
        fontSize: 15,
        fontWeight: "700",
    },
    stepTextBlock: { flex: 1 },
    stepLabel: {
        fontSize: 15,
        fontWeight: "600",
        marginBottom: 2,
    },
    stepDescription: {
        fontSize: 13,
        lineHeight: 17,
    },
    uploadIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    // Submit button
    submitButton: {
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 8,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 3,
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
    privacyNote: {
        fontSize: 12,
        textAlign: "center",
        lineHeight: 17,
        paddingHorizontal: 8,
    },
});
