import LayoutScreen from "@/components/ui/LayoutScreen";
import { useTheme } from "@/hooks/use-theme-color";
import { ACTION_ICON, ACTION_LABEL, clearHistory, getHistory, HistoryEntry } from "@/utils/history";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";

function formatTime(ts: number): string {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Vừa xong";
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} giờ trước`;
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function HistoryScreen() {
    const theme = useTheme();
    const [entries, setEntries] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getHistory();
            // Mới nhất lên trên
            setEntries([...data].reverse());
        } catch {
            Toast.show({ type: "error", text1: "Lỗi", text2: "Không thể tải lịch sử" });
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const handleClear = useCallback(() => {
        Alert.alert("Xóa lịch sử", "Xóa toàn bộ lịch sử thao tác?", [
            { text: "Hủy", style: "cancel" },
            {
                text: "Xóa",
                style: "destructive",
                onPress: async () => {
                    await clearHistory();
                    setEntries([]);
                    Toast.show({ type: "success", text1: "Đã xóa lịch sử" });
                },
            },
        ]);
    }, []);

    const renderItem = useCallback(({ item }: { item: HistoryEntry }) => {
        const iconColor = item.success ? theme.semantic.success : theme.semantic.error;
        const iconName = item.success
            ? (ACTION_ICON[item.action] as any) ?? "checkmark-circle"
            : "close-circle";

        return (
            <View style={[styles.item, { backgroundColor: theme.scale[2] }]}>
                <View style={[styles.iconBox, { backgroundColor: iconColor + "22" }]}>
                    <Ionicons name={iconName} size={18} color={iconColor} />
                </View>
                <View style={styles.content}>
                    <View style={styles.row}>
                        <Text style={[styles.action, { color: theme.scale[11] }]}>
                            {ACTION_LABEL[item.action]}
                        </Text>
                        <Text style={[styles.time, { color: theme.scale[8] }]}>
                            {formatTime(item.timestamp)}
                        </Text>
                    </View>
                    <Text style={[styles.appName, { color: theme.scale[10] }]} numberOfLines={1}>
                        {item.appName}
                    </Text>
                    <Text style={[styles.pkg, { color: theme.scale[7] }]} numberOfLines={1}>
                        {item.packageName}
                    </Text>
                    {item.detail ? (
                        <Text style={[styles.detail, { color: theme.scale[8] }]} numberOfLines={2}>
                            {item.detail}
                        </Text>
                    ) : null}
                </View>
            </View>
        );
    }, [theme]);

    return (
        <LayoutScreen>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.title, { color: theme.scale[11] }]}>Lịch sử</Text>
                    <Text style={[styles.subtitle, { color: theme.scale[8] }]}>
                        {entries.length} thao tác
                    </Text>
                </View>
                {entries.length > 0 && (
                    <TouchableOpacity
                        onPress={handleClear}
                        style={[styles.clearBtn, { backgroundColor: theme.semantic.error + "22" }]}
                    >
                        <Ionicons name="trash-outline" size={16} color={theme.semantic.error} />
                        <Text style={[styles.clearBtnText, { color: theme.semantic.error }]}>Xóa</Text>
                    </TouchableOpacity>
                )}
            </View>

            {entries.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="time-outline" size={52} color={theme.scale[5]} />
                    <Text style={[styles.emptyText, { color: theme.scale[7] }]}>Chưa có thao tác nào</Text>
                </View>
            ) : (
                <FlatList
                    data={entries}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshing={loading}
                    onRefresh={load}
                />
            )}
        </LayoutScreen>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 16,
    },
    title: { fontSize: 22, fontWeight: "700" },
    subtitle: { fontSize: 12, marginTop: 2 },
    clearBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
    },
    clearBtnText: { fontSize: 13, fontWeight: "600" },
    list: { paddingHorizontal: 16, gap: 8, paddingBottom: 24 },
    item: {
        flexDirection: "row",
        alignItems: "flex-start",
        padding: 14,
        borderRadius: 16,
        gap: 12,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    content: { flex: 1 },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    action: { fontSize: 13, fontWeight: "600" },
    time: { fontSize: 11 },
    appName: { fontSize: 14, fontWeight: "500", marginTop: 2 },
    pkg: { fontSize: 11, marginTop: 1 },
    detail: { fontSize: 11, marginTop: 4, fontStyle: "italic" },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    emptyText: { fontSize: 14, fontStyle: "italic" },
});
