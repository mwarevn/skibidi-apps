import LayoutScreen from "@/components/ui/LayoutScreen";
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
import { Toast } from "toastify-react-native";

const { SystemModule } = NativeModules;

interface WidgetApp {
    appName: string;
    packageName: string;
    iconBase64?: string;
}

export default function PermissionManager() {
    const [widgetApps, setWidgetApps] = useState<WidgetApp[]>([]);
    const [loading, setLoading] = useState(false);

    // Tải danh sách từ SharedPreferences
    const loadWidgetData = useCallback(async () => {
        try {
            setLoading(true);
            const jsonData = await SystemModule.getListWidgetData();
            if (jsonData && jsonData !== "null" && jsonData !== "[]") {
                const parsed = JSON.parse(jsonData);
                setWidgetApps(parsed);
            } else {
                setWidgetApps([]);
            }
        } catch (err) {
            console.error("Lỗi load widget data:", err);
            Toast.show({ type: "error", text1: "Lỗi", text2: "Không thể tải danh sách widget" });
        } finally {
            setLoading(false);
        }
    }, []);

    // Xóa 1 app khỏi widget
    const removeFromWidget = async (packageName: string) => {
        Alert.alert(
            "Xóa khỏi widget",
            `Bạn có chắc muốn xóa "${widgetApps.find((a) => a.packageName === packageName)?.appName}"?`,
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const newList = widgetApps.filter((app) => app.packageName !== packageName);
                            const res = await SystemModule.setListWidgetData(JSON.stringify(newList));
                            if (res) {
                                Toast.show({ type: "success", text1: "Đã xóa", text2: "Đã xóa khỏi widget" });
                                loadWidgetData(); // Refresh
                            }
                        } catch (err) {
                            Toast.show({ type: "error", text1: "Lỗi", text2: "Không thể xóa" });
                        }
                    },
                },
            ]
        );
    };

    useFocusEffect(
        useCallback(() => {
            loadWidgetData();
        }, [loadWidgetData])
    );
    // useEffect(() => {
    //     loadWidgetData();
    // }, [loadWidgetData]);

    const renderItem = ({ item }: { item: WidgetApp }) => (
        <View style={styles.itemContainer}>
            {item.iconBase64 ? (
                <Image source={{ uri: `data:image/png;base64,${item.iconBase64}` }} style={styles.icon} />
            ) : (
                <View style={[styles.icon, styles.placeholderIcon]}>
                    <Ionicons name="apps" size={24} color="#999" />
                </View>
            )}
            <View style={styles.info}>
                <Text style={styles.appName}>{item.appName}</Text>
                <Text style={styles.packageName}>{item.packageName}</Text>
            </View>
            <TouchableOpacity onPress={() => removeFromWidget(item.packageName)} style={styles.deleteButton}>
                <Ionicons name="trash" size={20} color="#ff4444" />
            </TouchableOpacity>
        </View>
    );

    return (
        <LayoutScreen>
            <View style={styles.container}>
                {loading ? (
                    <Text>Đang tải...</Text>
                ) : widgetApps.length === 0 ? (
                    <Text style={styles.emptyText}>Chưa có app nào trong widget</Text>
                ) : (
                    <FlatList
                        data={widgetApps}
                        keyExtractor={(item) => item.packageName}
                        renderItem={renderItem}
                        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadWidgetData} />}
                    />
                )}
            </View>
        </LayoutScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 12,
    },
    itemContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        backgroundColor: "#f9f9f9",
        borderRadius: 8,
        marginBottom: 8,
    },
    icon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        marginRight: 12,
    },
    placeholderIcon: {
        backgroundColor: "#eee",
        justifyContent: "center",
        alignItems: "center",
    },
    info: {
        flex: 1,
    },
    appName: {
        fontWeight: "600",
        fontSize: 15,
    },
    packageName: {
        fontSize: 12,
        color: "#666",
    },
    deleteButton: {
        padding: 8,
    },
    emptyText: {
        textAlign: "center",
        color: "#888",
        marginTop: 32,
        fontStyle: "italic",
    },
});
