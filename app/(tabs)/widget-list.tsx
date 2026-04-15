import LayoutScreen from "@/components/ui/LayoutScreen";
import { useTheme } from "@/hooks/use-theme-color";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    NativeModules,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";

const { SystemModule } = NativeModules;

interface WidgetApp {
    appName: string;
    packageName: string;
    iconBase64?: string;
}

export default function WidgetList() {
    const theme = useTheme();
    const [widgetApps, setWidgetApps] = useState<WidgetApp[]>([]);
    const [loading, setLoading] = useState(false);

    const loadWidgetData = useCallback(async () => {
        try {
            setLoading(true);
            const jsonData = await SystemModule.getListWidgetData();
            if (jsonData && jsonData !== "null" && jsonData !== "[]") {
                setWidgetApps(JSON.parse(jsonData));
            } else {
                setWidgetApps([]);
            }
        } catch {
            Toast.show({ type: "error", text1: "Lỗi", text2: "Không thể tải danh sách widget" });
        } finally {
            setLoading(false);
        }
    }, []);

    const removeFromWidget = useCallback(
        (packageName: string) => {
            const appName = widgetApps.find((a) => a.packageName === packageName)?.appName ?? packageName;
            Alert.alert("Xóa khỏi widget", `Bỏ "${appName}" khỏi widget?`, [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const newList = widgetApps.filter((app) => app.packageName !== packageName);
                            await SystemModule.setListWidgetData(JSON.stringify(newList));
                            Toast.show({ type: "success", text1: "Đã xóa", text2: "Đã xóa khỏi widget" });
                            loadWidgetData();
                        } catch {
                            Toast.show({ type: "error", text1: "Lỗi", text2: "Không thể xóa" });
                        }
                    },
                },
            ]);
        },
        [widgetApps, loadWidgetData]
    );

    useFocusEffect(useCallback(() => { loadWidgetData(); }, [loadWidgetData]));

    const renderItem = useCallback(
        ({ item }: { item: WidgetApp }) => (
            <View style={[styles.itemContainer, { backgroundColor: theme.scale[2] }]}>
                {item.iconBase64 ? (
                    <Image
                        source={{ uri: `data:image/png;base64,${item.iconBase64}` }}
                        style={styles.icon}
                    />
                ) : (
                    <View style={[styles.icon, { backgroundColor: theme.scale[3], justifyContent: "center", alignItems: "center" }]}>
                        <Ionicons name="apps" size={22} color={theme.scale[7]} />
                    </View>
                )}
                <View style={styles.info}>
                    <Text style={[styles.appName, { color: theme.scale[11] }]} numberOfLines={1}>
                        {item.appName}
                    </Text>
                    <Text style={[styles.packageName, { color: theme.scale[8] }]} numberOfLines={1}>
                        {item.packageName}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => removeFromWidget(item.packageName)}
                    style={[styles.deleteBtn, { backgroundColor: theme.semantic.error + '22' }]}
                    hitSlop={8}
                >
                    <Ionicons name="trash" size={18} color={theme.semantic.error} />
                </TouchableOpacity>
            </View>
        ),
        [theme, removeFromWidget]
    );

    return (
        <LayoutScreen>
            <View style={styles.titleRow}>
                <Text style={[styles.title, { color: theme.scale[11] }]}>Ứng dụng trong widget</Text>
                <Text style={[styles.count, { color: theme.scale[8] }]}>{widgetApps.length}</Text>
            </View>

            <View style={styles.listContainer}>
                {loading && widgetApps.length === 0 ? (
                    <View style={styles.centered}>
                        <Text style={{ color: theme.scale[8] }}>Đang tải...</Text>
                    </View>
                ) : widgetApps.length === 0 ? (
                    <View style={styles.centered}>
                        <Ionicons name="apps-outline" size={48} color={theme.scale[6]} />
                        <Text style={[styles.emptyText, { color: theme.scale[8] }]}>
                            Chưa có app nào trong widget
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={widgetApps}
                        keyExtractor={(item) => item.packageName}
                        renderItem={renderItem}
                        contentContainerStyle={{ gap: 8 }}
                        refreshControl={
                            <RefreshControl
                                refreshing={loading}
                                onRefresh={loadWidgetData}
                                tintColor={theme.scale[8]}
                            />
                        }
                    />
                )}
            </View>
        </LayoutScreen>
    );
}

const styles = StyleSheet.create({
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 16,
        gap: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
    },
    count: {
        fontSize: 13,
        fontWeight: "500",
    },
    listContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        fontStyle: "italic",
    },
    itemContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 20,
        minHeight: 64,
    },
    icon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        marginRight: 14,
    },
    info: {
        flex: 1,
        marginRight: 8,
    },
    appName: {
        fontWeight: "600",
        fontSize: 14,
    },
    packageName: {
        fontSize: 12,
        marginTop: 2,
    },
    deleteBtn: {
        width: 38,
        height: 38,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
    },
});
