import AppItem from "@/components/AppItem";
import LayoutScreen from "@/components/ui/LayoutScreen";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import AppManagerWrapper from "@/utils/appManager";
import Ionicons from "@expo/vector-icons/Ionicons";
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    AppState,
    FlatList,
    Image,
    NativeModules,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NativeStackNavigationProp } from "react-native-screens/lib/typescript/native-stack/types";
import Toast from "react-native-toast-message";

const { SystemModule, ShizukuModule } = NativeModules;

type RootStackParamList = {
    MyScreen: undefined;
    OtherScreen: { id: string };
};

export default function AppsScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const theme = useColorScheme();

    const [selectedApps, setSelectedApps] = useState<any[]>([]);
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [search, setSearch] = useState<string>("");
    const [filters, setFilters] = useState({ disabled: false, system: false, inWidget: false });
    const [widgetAppsSet, setWidgetAppsSet] = useState<Set<string>>(new Set());
    const [shizukuAvailable, setShizukuAvailable] = useState<boolean | null>(null);
    const [shizukuHasPermission, setShizukuHasPermission] = useState<boolean>(false);

    const SHIZUKU_PKG = "moe.shizuku.privileged.api";

    const openPlayStore = useCallback((pkg = SHIZUKU_PKG) => {
        try {
            const { Linking } = require("react-native");
            const playUrl = `market://details?id=${pkg}`;
            const webUrl = `https://play.google.com/store/apps/details?id=${pkg}`;
            Linking.openURL(playUrl).catch(() => Linking.openURL(webUrl));
        } catch (err) {
            console.warn("Failed to open Play Store", err);
        }
    }, []);

    const runBatchAction = useCallback(
        async (items: any[], action: (pkg: string) => Promise<any>, successMsg: string, failMsg: string) => {
            const results = await Promise.all(
                items.map((pkg: any) =>
                    action(pkg.packageName)
                        .then((res: any) => ({ pkg: pkg.packageName, status: "fulfilled", res }))
                        .catch((err: any) => ({ pkg: pkg.packageName, status: "rejected", reason: err }))
                )
            );

            const failures = results.filter((r: any) => r.status === "rejected");

            if (failures.length > 0) {
                console.error(failures);
                Toast.show({ type: "error", text1: "Lỗi", text2: `${failures.length} package(s) ${failMsg}` });
            } else {
                Toast.show({ type: "success", text1: "Hoàn tất", text2: successMsg });
            }

            await loadApps(false).finally(() => setSelectedApps([]));
        },
        []
    );

    // ref
    const bottomSheetRef = useRef<BottomSheet>(null);
    const listRef = useRef<FlatList<any> | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);

    // callbacks
    const handleSheetChanges = useCallback(
        (index: number) => {
            // when sheet is closed (index === -1) clear selected app to release references
            if (index === -1) {
                setSelectedApp(null);
            }
        },
        [setSelectedApp]
    );

    const handleOpenSheetForApp = useCallback((app: any) => {
        setSelectedApp(app);
        // open bottom sheet
        bottomSheetRef.current?.expand();
    }, []);

    const closeSheet = useCallback(() => {
        bottomSheetRef.current?.close();
        setSelectedApp(null);
    }, []);

    const getWidgetAppsSet = useCallback(async () => {
        try {
            const currentData = await SystemModule.getListWidgetData?.();
            if (!currentData || currentData === "null" || currentData === "[]") {
                return new Set();
            }
            const currentList = JSON.parse(currentData);
            return new Set(currentList.map((app: any) => app.packageName));
        } catch (e) {
            console.warn("Failed to get widget apps:", e);
            return new Set();
        }
    }, []);

    const isAppInWidget = useCallback(
        async (packageName: string) => {
            const widgetApps = await getWidgetAppsSet();
            return widgetApps.has(packageName);
        },
        [getWidgetAppsSet]
    );

    const syncWidgetData = useCallback(async (appsList: any[]) => {
        try {
            const currentData = await SystemModule.getListWidgetData?.();
            if (!currentData || currentData === "null" || currentData === "[]") {
                return;
            }
            const currentList = JSON.parse(currentData);
            // Merge with latest app info
            const mergedList = currentList.map((widgetApp: any) => {
                const latestApp = appsList.find((app: any) => app.packageName === widgetApp.packageName);
                return latestApp || widgetApp;
            });
            await SystemModule.setListWidgetData(JSON.stringify(mergedList));
        } catch (e) {
            console.warn("Failed to sync widget data:", e);
        }
    }, []);

    async function loadApps(showLoading = false) {
        try {
            if (showLoading) setLoading(true);
            const list = await SystemModule.getAllApps();
            console.log("Total apps:", list.length);
            setApps(list);
            // Sync widget data with updated app info
            await syncWidgetData(list);
            // Update widget apps set
            const widgetSet = (await getWidgetAppsSet()) as Set<string>;
            setWidgetAppsSet(widgetSet);
        } catch (e) {
            console.error("Error loading apps:", e);
        } finally {
            if (showLoading) setLoading(false);
        }
    }

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await loadApps(true);
        } catch (e) {
            console.warn(e);
        } finally {
            setRefreshing(false);
        }
    }, []);

    // filtered list by packageName (case-insensitive) and filters
    const filteredApps = useMemo(() => {
        let filtered = apps;
        if (search && search.trim() !== "") {
            const q = search.toLowerCase();
            filtered = filtered.filter((a: any) => (a.packageName || "").toLowerCase().includes(q));
        }
        if (filters.disabled) {
            filtered = filtered.filter((a: any) => !a.enabled);
        }
        if (filters.system) {
            filtered = filtered.filter((a: any) => a.isSystemApp);
        }
        if (filters.inWidget) {
            filtered = filtered.filter((a: any) => widgetAppsSet.has(a.packageName));
        }
        return filtered;
    }, [apps, search, filters, widgetAppsSet]);

    // check if all filtered apps are selected
    const allSelected = useMemo(() => {
        return (
            filteredApps.length > 0 &&
            filteredApps.every((app) => selectedApps.some((s) => s.packageName === app.packageName))
        );
    }, [filteredApps, selectedApps]);

    const toggleSelectAll = useCallback(() => {
        if (allSelected) {
            // deselect all filtered apps
            setSelectedApps((prev) => prev.filter((s) => !filteredApps.some((f) => f.packageName === s.packageName)));
        } else {
            // select all filtered apps
            setSelectedApps((prev) => {
                const newSelected = [...prev];
                filteredApps.forEach((app) => {
                    if (!newSelected.some((s) => s.packageName === app.packageName)) {
                        newSelected.push(app);
                    }
                });
                return newSelected;
            });
        }
    }, [allSelected, filteredApps]);

    const addToWidget = async (itemData: any) => {
        try {
            // 1. Lấy danh sách hiện tại từ SharedPreferences (nếu có)
            const currentData = await SystemModule.getListWidgetData?.(); // [Tùy chọn] nếu bạn thêm method này
            let currentList066 = [];

            if (currentData && currentData !== "null" && currentData !== "[]") {
                try {
                    currentList066 = JSON.parse(currentData);
                } catch (e) {
                    currentList066 = [];
                }
            }

            // 2. Tạo map để loại trùng dựa trên packageName
            const appMap = new Map();

            // Thêm các app hiện có
            currentList066.forEach((app: any) => {
                if (app.packageName) {
                    appMap.set(app.packageName, app);
                }
            });

            // Thêm các app mới được chọn
            [itemData].forEach((app) => {
                if (app.packageName) {
                    appMap.set(app.packageName, app);
                }
            });

            // 3. Chuyển về array
            const mergedList = Array.from(appMap.values());

            // 4. Lưu lại
            const res = await SystemModule.setListWidgetData(JSON.stringify(mergedList));

            if (res) {
                Toast.show({
                    type: "success",
                    text1: "Hoàn tất",
                    text2: `Đã thêm ${[itemData].length} app vào widget (không trùng).`,
                });
            }
        } catch (err) {
            console.error("Lỗi thêm widget:", err);
            Toast.show({
                type: "error",
                text1: "Lỗi",
                text2: "Không thể thêm vào widget",
            });
        }
    };

    const removeFromWidget = async (packageName: string) => {
        try {
            const currentData = await SystemModule.getListWidgetData?.();
            if (!currentData || currentData === "null" || currentData === "[]") {
                return;
            }
            const currentList = JSON.parse(currentData);
            const filteredList = currentList.filter((app: any) => app.packageName !== packageName);
            await SystemModule.setListWidgetData(JSON.stringify(filteredList));
            Toast.show({
                type: "success",
                text1: "Hoàn tất",
                text2: "Đã xóa khỏi widget",
            });
            // Update widgetAppsSet
            setWidgetAppsSet((prev) => {
                const newSet = new Set(prev);
                newSet.delete(packageName);
                return newSet;
            });
        } catch (err) {
            console.error("Lỗi xóa widget:", err);
            Toast.show({
                type: "error",
                text1: "Lỗi",
                text2: "Không thể xóa khỏi widget",
            });
        }
    };

    React.useEffect(() => {
        loadApps(true);
    }, []);

    // consolidated Shizuku check: runs when apps load and when screen focuses
    const checkShizuku = useCallback(
        async (showPrompts = true) => {
            try {
                const available = Boolean(await ShizukuModule.isShizukuAvailable());
                setShizukuAvailable(available);

                if (!available) {
                    setShizukuHasPermission(false);
                    if (showPrompts) {
                        Alert.alert(
                            "Yêu cầu Shizuku",
                            "Ứng dụng này yêu cầu app 'Shizuku' để hoạt động. Vui lòng cài đặt Shizuku từ Play Store.",
                            [
                                { text: "Cài đặt", onPress: () => openPlayStore() },
                                { text: "Bỏ qua", style: "cancel" },
                            ]
                        );
                    }
                    return;
                }

                const has = Boolean(await ShizukuModule.hasPermission());
                setShizukuHasPermission(has);

                if (!has && showPrompts) {
                    Alert.alert("Yêu cầu ủy quyền", "Vui lòng ủy quyền Shizuku cho ứng dụng này!", [
                        {
                            text: "Ủy quyền",
                            onPress: async () => {
                                try {
                                    // requestPermission may open Shizuku UI (external). Don't assume the return value
                                    // represents the final state; re-check on app resume instead.
                                    await ShizukuModule.requestPermission();
                                } catch (err) {
                                    console.error("Request permission error:", err);
                                }
                            },
                        },
                        { text: "Bỏ qua", style: "cancel" },
                    ]);
                } else if (has) {
                    await AppManagerWrapper.ensureBound();
                }
            } catch (err) {
                console.warn("Shizuku check failed:", err);
                setShizukuAvailable(false);
                setShizukuHasPermission(false);
            }
        },
        [openPlayStore]
    );

    React.useEffect(() => {
        // show prompts once when apps are first loaded so user can install/grant Shizuku
        if (apps.length > 0) checkShizuku(true);
    }, [apps, checkShizuku]);

    // Re-check Shizuku when app returns to foreground (onResume behavior)
    useEffect(() => {
        const handler = (nextAppState: string) => {
            if (nextAppState === "active") {
                // when app becomes active again, re-check and show prompts if needed
                checkShizuku(true);
            }
        };

        // Use (AppState as any) to support different RN versions without TS errors
        const anyAppState = AppState as any;
        const sub = anyAppState.addEventListener ? anyAppState.addEventListener("change", handler) : null;

        return () => {
            try {
                if (sub && typeof sub.remove === "function") {
                    sub.remove();
                } else if (anyAppState.removeEventListener) {
                    anyAppState.removeEventListener("change", handler);
                }
            } catch (e) {
                // ignore
            }
        };
    }, [checkShizuku]);

    const [modalVisible, setModalVisible] = useState(false);

    return (
        <GestureHandlerRootView style={styles.container}>
            <LayoutScreen>
                <Text
                    style={{
                        marginTop: 20,
                        color: shizukuAvailable ? (shizukuHasPermission ? "#2e7d32" : "#f9a825") : "#d32f2f",
                        fontWeight: "bold",
                        fontSize: 18,
                        marginStart: 18,
                    }}
                >
                    {shizukuAvailable === null
                        ? "Checking Shizuku..."
                        : shizukuAvailable
                        ? shizukuHasPermission
                            ? "Shizuku Authorized"
                            : "Shizuku Needs Permission"
                        : "Shizuku Not Installed"}
                </Text>
                <Text style={{ marginStart: 20, fontWeight: "bold", fontSize: 12, opacity: 0.2 }}>mwarevn</Text>

                <View>
                    <View
                        style={{
                            width: "100%",
                            marginHorizontal: "auto",
                            marginTop: 28,
                            position: "relative",
                        }}
                    >
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Search by package name..."
                            style={[styles.search, { paddingRight: 44 }]}
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="search"
                        />
                        <TouchableOpacity
                            style={{
                                position: "absolute",
                                right: 28,
                                top: 0,
                                bottom: 0,
                                justifyContent: "center",
                                alignItems: "center",
                                padding: 8,
                            }}
                        >
                            <Ionicons name="search" size={20} color="#939393a5" />
                        </TouchableOpacity>
                    </View>

                    <Text style={{ marginTop: 8, marginStart: 18, fontSize: 11 }}>
                        * {filteredApps.length}/{apps.length}
                    </Text>
                </View>

                <View style={styles.filtersContainer}>
                    <TouchableOpacity
                        onPress={() => setFilters((prev) => ({ ...prev, disabled: !prev.disabled }))}
                        style={[styles.filterButton, filters.disabled && styles.filterButtonActive]}
                    >
                        <Ionicons name="ban" size={16} color={filters.disabled ? "#fff" : "#666"} />
                        <Text style={[styles.filterText, filters.disabled && styles.filterTextActive]}>Disabled</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setFilters((prev) => ({ ...prev, system: !prev.system }))}
                        style={[styles.filterButton, filters.system && styles.filterButtonActive]}
                    >
                        <Ionicons name="settings" size={16} color={filters.system ? "#fff" : "#666"} />
                        <Text style={[styles.filterText, filters.system && styles.filterTextActive]}>System</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setFilters((prev) => ({ ...prev, inWidget: !prev.inWidget }))}
                        style={[styles.filterButton, filters.inWidget && styles.filterButtonActive]}
                    >
                        <Ionicons name="star" size={16} color={filters.inWidget ? "#fff" : "#666"} />
                        <Text style={[styles.filterText, filters.inWidget && styles.filterTextActive]}>In Widget</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <ActivityIndicator size="large" color="#666" />
                        <Text style={{ marginTop: 8, color: "#666" }}>Loading apps...</Text>
                    </View>
                ) : apps.length === 0 ? (
                    <Text>Loading...</Text>
                ) : filteredApps.length === 0 ? (
                    <Text>No results for {`"${search}"`}</Text>
                ) : (
                    <View style={{ flex: 1, paddingBottom: selectedApps.length > 0 ? 120 : 0 }}>
                        <FlatList
                            ref={(r) => {
                                listRef.current = r;
                            }}
                            data={filteredApps}
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            onScroll={({ nativeEvent }) => {
                                const offsetY = nativeEvent.contentOffset?.y || 0;
                                setShowScrollTop(offsetY > 200);
                            }}
                            scrollEventThrottle={16}
                            renderItem={({ item }) => (
                                <AppItem
                                    item={item}
                                    setSelectedApps={setSelectedApps}
                                    selectedApps={selectedApps}
                                    onLongPress={handleOpenSheetForApp}
                                />
                            )}
                            keyExtractor={(item) => item.packageName}
                            initialNumToRender={20}
                            windowSize={11}
                            removeClippedSubviews={true}
                            maxToRenderPerBatch={20}
                        />
                    </View>
                )}

                {showScrollTop ? (
                    <TouchableOpacity
                        onPress={() => {
                            try {
                                listRef.current?.scrollToOffset({ offset: 0, animated: true });
                            } catch (e) {
                                console.warn(e);
                            }
                        }}
                        style={{
                            position: "absolute",
                            right: 16,
                            bottom: 16,
                            backgroundColor: "#ffffffbc",
                            borderRadius: 8,
                            opacity: 0.85,
                            width: 42,
                            height: 42,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",

                            shadowColor: "#ddd",
                            shadowOffset: {
                                width: 0,
                                height: 1,
                            },
                            shadowOpacity: 0.2,
                            shadowRadius: 1.41,
                            elevation: 1,
                        }}
                    >
                        <Ionicons name={"arrow-up"} color="#000" size={20} />
                    </TouchableOpacity>
                ) : null}

                {selectedApps.length > 0 && (
                    <View style={[styles.selectionActions, { backgroundColor: Colors[theme ?? "light"].background }]}>
                        <Text style={[styles.selectionText, { color: Colors[theme ?? "light"].text }]}>
                            {selectedApps.length} selected
                        </Text>
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                onPress={toggleSelectAll}
                                style={[styles.actionButton, { backgroundColor: Colors[theme ?? "light"].background }]}
                            >
                                <Ionicons
                                    name={allSelected ? "checkbox" : "square-outline"}
                                    size={20}
                                    color={allSelected ? Colors[theme ?? "light"].tint : Colors[theme ?? "light"].icon}
                                />
                                <Text style={[styles.actionButtonText, { color: Colors[theme ?? "light"].text }]}>
                                    {allSelected ? "Deselect All" : "Select All"}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={async () => {
                                    runBatchAction(
                                        selectedApps,
                                        AppManagerWrapper.disablePackage,
                                        "Đã vô hiệu hoá tất cả package đã chọn.",
                                        "không thể vô hiệu hoá."
                                    );
                                }}
                                style={[styles.actionButton, { backgroundColor: Colors[theme ?? "light"].background }]}
                            >
                                <Ionicons name="ban-outline" size={20} color="grey" />
                                <Text style={styles.actionButtonText}>Disable</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() =>
                                    runBatchAction(
                                        selectedApps,
                                        AppManagerWrapper.uninstallPackage,
                                        "Đã gỡ cài đặt tất cả package đã chọn.",
                                        "không thể gỡ cài đặt."
                                    )
                                }
                                style={[styles.actionButton, { backgroundColor: "#ffebee" }]}
                            >
                                <Ionicons name="trash" size={20} color="red" />
                                <Text style={[styles.actionButtonText, { color: "red" }]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <BottomSheet
                    index={-1}
                    detached={true}
                    enablePanDownToClose={true}
                    enableDynamicSizing={true}
                    snapPoints={[200, "50%"]}
                    ref={bottomSheetRef}
                    onChange={handleSheetChanges}
                    backdropComponent={(props) => (
                        <BottomSheetBackdrop
                            {...props}
                            disappearsOnIndex={-1}
                            appearsOnIndex={0}
                            pressBehavior="close"
                        />
                    )}
                >
                    <BottomSheetView style={styles.contentContainer}>
                        {selectedApp ? (
                            <View style={{ width: "100%", paddingHorizontal: 16 }}>
                                {selectedApp.iconBase64 ? (
                                    <View style={{ alignItems: "center", marginBottom: 8 }}>
                                        <Image
                                            source={{ uri: `data:image/png;base64,${selectedApp.iconBase64}` }}
                                            style={{ width: 64, height: 64, borderRadius: 12 }}
                                        />
                                    </View>
                                ) : null}

                                <Text style={{ fontWeight: "700", fontSize: 16, marginBottom: 8 }}>
                                    {selectedApp.appName}
                                </Text>
                                <Text style={{ color: "#666", marginBottom: 12 }}>{selectedApp.packageName}</Text>

                                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                                    <TouchableOpacity
                                        onPress={async () => {
                                            try {
                                                const pkg = selectedApp && selectedApp.packageName;
                                                if (!pkg) {
                                                    Toast.show({
                                                        type: "error",
                                                        text1: "Lỗi",
                                                        text2: "Invalid package",
                                                    });
                                                    return;
                                                }
                                                await AppManagerWrapper.disablePackage(pkg);
                                                Toast.show({
                                                    type: "success",
                                                    text1: "Hoàn tất",
                                                    text2: "Đã vô hiệu hoá",
                                                });
                                            } catch (err) {
                                                console.error(err);
                                                Toast.show({
                                                    type: "error",
                                                    text1: "Lỗi",
                                                    text2: "Không thể vô hiệu hoá",
                                                });
                                            } finally {
                                                await loadApps(false);
                                                closeSheet();
                                            }
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: 12,
                                            backgroundColor: "#f0f0f0",
                                            borderRadius: 8,
                                            marginRight: 8,
                                        }}
                                    >
                                        <Text style={{ textAlign: "center" }}>Disable</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={async () => {
                                            try {
                                                const pkg = selectedApp && selectedApp.packageName;
                                                if (!pkg) {
                                                    Toast.show({
                                                        type: "error",
                                                        text1: "Lỗi",
                                                        text2: "Invalid package",
                                                    });
                                                    return;
                                                }
                                                await AppManagerWrapper.enablePackage(pkg);
                                                Toast.show({ type: "success", text1: "Hoàn tất", text2: "Đã bật lại" });
                                            } catch (err) {
                                                console.error(err);
                                                Toast.show({ type: "error", text1: "Lỗi", text2: "Không thể bật" });
                                            } finally {
                                                await loadApps(false);
                                                closeSheet();
                                            }
                                        }}
                                        style={{ flex: 1, padding: 12, backgroundColor: "#f0f0f0", borderRadius: 8 }}
                                    >
                                        <Text style={{ textAlign: "center" }}>Enable</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={{ height: 12 }} />

                                <TouchableOpacity
                                    onPress={async () => {
                                        try {
                                            const pkg = selectedApp && selectedApp.packageName;
                                            if (!pkg) {
                                                Toast.show({ type: "error", text1: "Lỗi", text2: "Invalid package" });
                                                return;
                                            }
                                            await AppManagerWrapper.forceStopPackage(pkg);
                                            Toast.show({ type: "success", text1: "Hoàn tất", text2: "Đã dừng" });
                                        } catch (err) {
                                            console.error(err);
                                            Toast.show({ type: "error", text1: "Lỗi", text2: "Không thể dừng" });
                                        } finally {
                                            await loadApps(false);
                                            closeSheet();
                                        }
                                    }}
                                    style={{ padding: 12, backgroundColor: "#ffecb3", borderRadius: 8 }}
                                >
                                    <Text style={{ textAlign: "center" }}>Force Stop</Text>
                                </TouchableOpacity>
                                <View style={{ height: 12 }} />

                                <TouchableOpacity
                                    onPress={async () => {
                                        const pkg = selectedApp?.packageName;
                                        if (!pkg) return;
                                        const inWidget = widgetAppsSet.has(pkg);
                                        if (inWidget) {
                                            await removeFromWidget(pkg);
                                        } else {
                                            await addToWidget(selectedApp);
                                        }
                                        await loadApps(false);
                                        closeSheet();
                                    }}
                                    style={{ padding: 12, backgroundColor: "#f0f0f0", borderRadius: 8 }}
                                >
                                    <Text style={{ textAlign: "center" }}>
                                        {selectedApp && widgetAppsSet.has(selectedApp.packageName)
                                            ? "Remove from Widget"
                                            : "Add to Widget"}
                                    </Text>
                                </TouchableOpacity>

                                <View style={{ height: 12 }} />

                                <TouchableOpacity
                                    onPress={async () => {
                                        try {
                                            const pkg = selectedApp && selectedApp.packageName;
                                            if (!pkg) {
                                                Toast.show({ type: "error", text1: "Lỗi", text2: "Invalid package" });
                                                return;
                                            }
                                            await AppManagerWrapper.uninstallPackage(pkg);
                                            Toast.show({ type: "success", text1: "Hoàn tất", text2: "Đã gỡ cài đặt" });
                                        } catch (err) {
                                            console.error(err);
                                            Toast.show({ type: "error", text1: "Lỗi", text2: "Không thể gỡ cài đặt" });
                                        } finally {
                                            await loadApps(false);
                                            closeSheet();
                                        }
                                    }}
                                    style={{ padding: 12, backgroundColor: "#ffd6d6", borderRadius: 8 }}
                                >
                                    <Text style={{ textAlign: "center", color: "#900" }}>Uninstall</Text>
                                </TouchableOpacity>
                                <View style={{ height: 12 }} />
                            </View>
                        ) : (
                            <Text>Không có app được chọn</Text>
                        )}
                    </BottomSheetView>
                </BottomSheet>
            </LayoutScreen>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "transparent",
    },
    contentContainer: {
        flex: 1,
        alignItems: "center",
    },
    search: {
        height: 40,
        borderRadius: 8,
        borderWidth: 0.3,
        borderColor: "#ddd",
        paddingHorizontal: 12,
        backgroundColor: "#e9e9e9ff",
        marginHorizontal: "auto",
        width: "85%",
    },
    selectAllContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 12,
        marginStart: 18,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "#f5f5f5",
        borderRadius: 8,
        alignSelf: "flex-start",
    },
    selectAllText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
    },
    selectionActions: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#eee",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    selectionText: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 12,
        textAlign: "center",
    },
    actionButtons: {
        flexDirection: "row",
        justifyContent: "space-around",
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f0f0f0",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        minWidth: 100,
        justifyContent: "center",
    },
    actionButtonText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: "600",
    },
    filtersContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginTop: 8,
        marginHorizontal: 18,
        gap: 8,
        marginBottom: 4,
    },
    filterButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: "#f0f0f0",
        borderWidth: 1,
        borderColor: "#ddd",
    },
    filterButtonActive: {
        backgroundColor: "#007AFF",
        borderColor: "#007AFF",
    },
    filterText: {
        marginLeft: 6,
        fontSize: 12,
        color: "#666",
        fontWeight: "500",
    },
    filterTextActive: {
        color: "#fff",
    },
});
