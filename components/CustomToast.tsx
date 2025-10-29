import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { BlurView } from "expo-blur";
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type ToastRenderProps = {
    text1?: string;
    text2?: string;
    type?: string;
    onPress?: () => void;
    hide?: () => void;
};

export default function CustomToast({ text1, text2, hide, type, onPress }: ToastRenderProps) {
    const scheme = useColorScheme() ?? "light";
    const colors = Colors[scheme];

    const tint = useMemo(() => {
        switch (type) {
            case "success":
                return "#8BC34A";
            case "error":
                return "#EF5350";
            case "info":
                return "#42A5F5";
            case "warn":
            case "warning":
                return "#FFB300";
            default:
                return colors.tint;
        }
    }, [type, colors.tint]);

    const slide = useRef(new Animated.Value(-24)).current;
    const fade = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.parallel([
            Animated.timing(slide, {
                toValue: 0,
                duration: 280,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
        ]).start();
        // no cleanup animation; Toast library handles exit
    }, [slide, fade]);

    const glassBg = scheme === "dark" ? "rgba(18,18,18,0.78)" : "rgba(255,255,255,0.86)";
    const borderCol = scheme === "dark" ? "#00000044" : "#FFFFFF55";

    return (
        <Animated.View
            style={{
                transform: [{ translateY: slide }],
                opacity: fade,
                width: "100%",
                alignItems: "center",
            }}
        >
            <BlurView
                intensity={scheme === "dark" ? 65 : 55}
                tint={scheme === "dark" ? "dark" : "light"}
                style={[styles.card, { backgroundColor: glassBg, borderColor: borderCol }]}
            >
                <View style={[styles.indicator, { backgroundColor: tint }]} />
                <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.contentRow}>
                    <Ionicons
                        name={
                            type === "success" ? "checkmark-circle" : type === "error" ? "alert-circle" : "information-circle"
                        }
                        size={22}
                        color={tint}
                    />
                    <View style={styles.textContainer}>
                        {!!text1 && (
                            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                                {text1}
                            </Text>
                        )}
                        {!!text2 && (
                            <Text style={[styles.message, { color: colors.icon }]} numberOfLines={2}>
                                {text2}
                            </Text>
                        )}
                    </View>
                    <TouchableOpacity onPress={hide} style={styles.closeBtn}>
                        <Ionicons name="close" size={18} color={scheme === "dark" ? "#ddd" : "#555"} />
                    </TouchableOpacity>
                </TouchableOpacity>
            </BlurView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        width: "94%",
        borderRadius: 22,
        overflow: "hidden",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "#FFFFFF55",
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    contentRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    indicator: {
        position: "absolute",
        left: 8,
        top: 8,
        width: 6,
        height: 6,
        borderRadius: 6,
        opacity: 0.9,
    },
    textContainer: {
        flex: 1,
        marginLeft: 10,
        paddingRight: 8,
    },
    title: {
        fontWeight: "700",
        fontSize: 14,
        marginBottom: 2,
    },
    message: {
        fontSize: 12,
    },
    closeBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#00000012",
        marginLeft: 8,
    },
});
