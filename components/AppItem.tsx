import { useTheme } from "@/hooks/use-theme-color";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
    item: any;
    setSelectedApps: (apps: any[]) => void;
    selectedApps: any[];
    onLongPress?: (item: any) => void;
    isPending?: boolean;
    isBloatware?: boolean;
    isProtected?: boolean;
};

function AppItemComponent({ item, setSelectedApps, selectedApps, onLongPress, isPending = false, isBloatware = false, isProtected = false }: Props) {
    const theme = useTheme();
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

    const bgColor = isSelected
        ? theme.scale[3]
        : isPressed
        ? theme.scale[2]
        : 'transparent';

    return (
        <Pressable
            style={[styles.pressable, { backgroundColor: bgColor, opacity: isPending ? 0.55 : 1 }]}
            onLongPress={isPending ? undefined : handleLongPress}
            onPressIn={() => !isPending && setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            disabled={isPending}
        >
            <View style={styles.row}>
                {/* Icon */}
                <View style={styles.iconWrapper}>
                    {item.iconBase64 ? (
                        <Image
                            source={{ uri: `data:image/png;base64,${item.iconBase64}` }}
                            style={styles.icon}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[styles.icon, { backgroundColor: theme.scale[3] }]} />
                    )}
                    {isPending && (
                        <View style={[styles.pendingOverlay, { backgroundColor: theme.scale[1] + 'cc' }]}>
                            <ActivityIndicator size="small" color={theme.scale[8]} />
                        </View>
                    )}
                </View>

                {/* Text */}
                <View style={styles.textContainer}>
                    <Text style={[styles.name, { color: theme.scale[11] }]} numberOfLines={1}>
                        {item.appName}
                    </Text>
                    <Text style={[styles.pkg, { color: theme.scale[8] }]} numberOfLines={1}>
                        {item.packageName}
                    </Text>
                    <View style={styles.tags}>
                        {!item.enabled && !isPending && (
                            <Text style={[styles.tag, { color: theme.semantic.error, backgroundColor: theme.semantic.error + "22" }]}>
                                disabled
                            </Text>
                        )}
                        {isBloatware && (
                            <Text style={[styles.tag, { color: theme.semantic.warning, backgroundColor: theme.semantic.warning + "22" }]}>
                                bloatware
                            </Text>
                        )}
                        {isProtected && (
                            <Text style={[styles.tag, { color: theme.semantic.success, backgroundColor: theme.semantic.success + "22" }]}>
                                protected
                            </Text>
                        )}
                        {isPending && (
                            <Text style={[styles.tag, { color: theme.scale[8], backgroundColor: theme.scale[4] }]}>
                                đang xử lý...
                            </Text>
                        )}
                    </View>
                </View>

                {/* Checkbox */}
                {!isPending && (
                    <TouchableOpacity onPress={handleCheckboxPress} style={styles.checkbox} hitSlop={8}>
                        <Ionicons
                            name={isSelected ? "checkbox" : "square-outline"}
                            size={24}
                            color={isSelected ? theme.accent[0] : theme.scale[6]}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </Pressable>
    );
}

export default React.memo(AppItemComponent);

const styles = StyleSheet.create({
    pressable: {
        borderRadius: 16,
        marginHorizontal: 4,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 8,
        minHeight: 44,
    },
    iconWrapper: {
        position: "relative",
        marginRight: 12,
    },
    icon: {
        width: 40,
        height: 40,
        borderRadius: 12,
    },
    pendingOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    textContainer: {
        flex: 1,
        marginRight: 8,
    },
    name: {
        fontSize: 14,
        fontWeight: "600",
    },
    pkg: {
        fontSize: 12,
        marginTop: 1,
    },
    tags: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 4,
        marginTop: 3,
    },
    tag: {
        fontSize: 10,
        fontWeight: "600",
        borderRadius: 999,
        paddingHorizontal: 5,
        paddingVertical: 1,
    },
    checkbox: {
        padding: 4,
        minWidth: 44,
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center",
    },
});
