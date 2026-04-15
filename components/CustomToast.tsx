import { useTheme } from "@/hooks/use-theme-color";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type ToastType = "success" | "error" | "info" | "warn";

export default function CustomToast({
    text1,
    text2,
    hide,
    type,
    onPress,
}: {
    text1: string;
    text2?: string;
    hide: () => void;
    type: ToastType;
    onPress?: () => void;
}) {
    const theme = useTheme();

    const iconColor = (() => {
        switch (type) {
            case "success": return theme.semantic.success;
            case "error":   return theme.semantic.error;
            case "warn":    return theme.semantic.warning;
            default:        return theme.scale[9];
        }
    })();

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.toast, { backgroundColor: theme.scale[2] }]}
            activeOpacity={0.85}
        >
            <Ionicons name="planet" size={22} color={iconColor} />
            <View style={styles.textContainer}>
                <Text style={[styles.title, { color: theme.scale[11] }]} numberOfLines={1}>
                    {text1}
                </Text>
                {!!text2 && (
                    <Text style={[styles.message, { color: theme.scale[9] }]} numberOfLines={2}>
                        {text2}
                    </Text>
                )}
            </View>
            <TouchableOpacity
                onPress={hide}
                style={[styles.closeBtn, { backgroundColor: theme.scale[4] }]}
                hitSlop={8}
            >
                <Ionicons name="close" size={16} color={theme.scale[8]} />
            </TouchableOpacity>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    toast: {
        width: "92%",
        borderRadius: 999,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
    },
    textContainer: {
        flex: 1,
        marginLeft: 12,
    },
    title: {
        fontWeight: "700",
        fontSize: 15,
    },
    message: {
        fontSize: 13,
        marginTop: 2,
    },
    closeBtn: {
        borderRadius: 999,
        width: 28,
        height: 28,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 12,
    },
});
