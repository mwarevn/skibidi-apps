import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type AlertAction = {
    text: string;
    onPress?: () => void;
    style?: "default" | "cancel" | "destructive";
};

export default function AlertModal({
    visible,
    title,
    message,
    actions = [{ text: "OK" }],
    onRequestClose,
}: {
    visible: boolean;
    title?: string;
    message?: string;
    actions?: AlertAction[];
    onRequestClose?: () => void;
}) {
    const scheme = useColorScheme() ?? "light";
    const colors = Colors[scheme];

    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.96)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 1, duration: 140, useNativeDriver: true }),
                Animated.timing(scale, {
                    toValue: 1,
                    duration: 160,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 0, duration: 120, useNativeDriver: true }),
                Animated.timing(scale, { toValue: 0.96, duration: 120, useNativeDriver: true }),
            ]).start();
        }
    }, [visible, opacity, scale]);

    return (
        <Modal transparent animationType="none" visible={visible} onRequestClose={onRequestClose}>
            <Animated.View
                style={[styles.backdrop, { opacity: opacity.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] }) }]}
            />
            <View style={styles.centered}>
                <Animated.View
                    style={[
                        styles.card,
                        {
                            backgroundColor: colors.background,
                            transform: [{ scale }],
                        },
                    ]}
                >
                    {title ? <Text style={[styles.title, { color: colors.text }]}>{title}</Text> : null}
                    {message ? <Text style={[styles.message, { color: colors.icon }]}>{message}</Text> : null}
                    <View style={styles.actionsRow}>
                        {actions.map((a, idx) => {
                            const textColor =
                                a.style === "destructive" ? "#d32f2f" : a.style === "cancel" ? colors.icon : colors.text;
                            return (
                                <TouchableOpacity
                                    key={`${a.text}-${idx}`}
                                    onPress={a.onPress}
                                    style={[styles.actionBtn, { borderColor: colors.icon + "33" }]}
                                >
                                    <Text style={[styles.actionText, { color: textColor }]}>{a.text}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#000",
    },
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    card: {
        width: "100%",
        maxWidth: 420,
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 8,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "#00000010",
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 8,
        textAlign: "center",
    },
    message: {
        fontSize: 14,
        marginBottom: 16,
        textAlign: "center",
    },
    actionsRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 8,
    },
    actionBtn: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    actionText: {
        fontSize: 14,
        fontWeight: "600",
    },
});
