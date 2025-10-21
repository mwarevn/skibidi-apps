import React, { useCallback, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
    item: any;
    setSelectedApps: (apps: any[]) => void;
    selectedApps: any[];
    onLongPress?: (item: any) => void;
};

function AppItemComponent({ item, setSelectedApps, selectedApps, onLongPress }: Props) {
    const isSelected = selectedApps.find((i: any) => i.packageName === item.packageName);
    const [isPressed, setIsPressed] = useState(false);

    const handlePress = useCallback(() => {
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
            onPress={handlePress}
        >
            <View style={styles.row}>
                {item.iconBase64 ? (
                    <Image source={{ uri: `data:image/png;base64,${item.iconBase64}` }} style={styles.icon} />
                ) : (
                    <View style={[styles.icon, styles.placeholderIcon]} />
                )}
                <View>
                    <Text style={styles.name}>{item.appName}</Text>
                    <Text style={styles.pkg}>{item.packageName}</Text>
                    {!item.enabled && <Text style={styles.disabledTag}>disabled</Text>}
                </View>
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
        backgroundColor: "#ffefef",
    },
    pressed: {
        backgroundColor: "#eef6ff",
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
});
