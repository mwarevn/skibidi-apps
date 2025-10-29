import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useCallback, useState } from "react";
import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
    item: any;
    setSelectedApps: (apps: any[]) => void;
    selectedApps: any[];
    onLongPress?: (item: any) => void;
};

function AppItemComponent({ item, setSelectedApps, selectedApps, onLongPress }: Props) {
    const isSelected = selectedApps.some((i: any) => i.packageName === item.packageName);
    const [isPressed, setIsPressed] = useState(false);

    const handleCheckboxPress = useCallback(() => {
        if (isSelected) {
            setSelectedApps(selectedApps.filter((i: any) => i.packageName !== item.packageName));
        } else {
            setSelectedApps([...selectedApps, item]);
        }
    }, [isSelected, selectedApps, item, setSelectedApps]);

    const handleLongPress = useCallback(() => {
        onLongPress && onLongPress(item);
    }, [onLongPress, item]);

    return (
        <Pressable
            style={[styles.pressable, isSelected ? styles.selected : undefined, isPressed ? styles.pressed : undefined]}
            onLongPress={handleLongPress}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
        >
            <View style={styles.row}>
                {item.iconBase64 ? (
                    <Image
                        source={{ uri: `data:image/png;base64,${item.iconBase64}` }}
                        style={styles.icon}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.icon, styles.placeholderIcon]} />
                )}
                <View style={styles.textContainer}>
                    <Text style={styles.name}>{item.appName}</Text>
                    <Text style={styles.pkg}>{item.packageName}</Text>
                    {!item.enabled && <Text style={styles.disabledTag}>disabled</Text>}
                </View>
                <TouchableOpacity onPress={handleCheckboxPress} style={styles.checkbox}>
                    <Ionicons
                        name={isSelected ? "checkbox" : "square-outline"}
                        size={24}
                        color={isSelected ? "#007AFF" : "#ccc"}
                    />
                </TouchableOpacity>
            </View>
        </Pressable>
    );
}

export default React.memo(AppItemComponent);

const styles = StyleSheet.create({
    item: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
    },
    pressable: {
        backgroundColor: "transparent",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
    },
    icon: {
        width: 40,
        height: 40,
        marginRight: 10,
        borderRadius: 8,
    },
    placeholderIcon: {
        backgroundColor: "#ccc",
    },
    selected: {
        backgroundColor: "#e3f2fd",
    },
    pressed: {
        backgroundColor: "#f5f5f5",
    },
    name: {
        fontSize: 14,
        fontWeight: "600",
    },
    pkg: {
        fontSize: 12,
        color: "#666",
    },
    disabledTag: {
        color: "orangered",
    },
    textContainer: {
        flex: 1,
    },
    checkbox: {
        padding: 5,
    },
});
