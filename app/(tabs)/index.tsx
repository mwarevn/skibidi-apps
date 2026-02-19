import AlertModal, { AlertAction } from "@/components/AlertModal";
import AppItem from "@/components/AppItem";
import LayoutScreen from "@/components/ui/LayoutScreen";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { usePermission } from "@/hooks/usePermission";
import AppManagerWrapper, { setPermission } from "@/utils/appManager";
import { openPlayStore } from "@/utils/common";
import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
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
import { Button, Chip, FAB, IconButton, Text as PaperText, Surface, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const { SystemModule, ShizukuModule } = NativeModules;

export default function AppsScreen() {
    const theme = useColorScheme();
    const { permission, isLoading } = usePermission();
    const router = useRouter();
    const paperTheme = useTheme();

    useEffect(() => {
        if (!isLoading) {
            if (permission) {
                setPermission(permission);
            } else {
                // No permission selected, navigate to permission select screen
                router.push("/permission-select");
            }
        }
    }, [permission, isLoading]);

    const [selectedApps, setSelectedApps] = useState<any[]>([]);
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [search, setSearch] = useState<string>("");
    const [filters, setFilters] = useState({ disabled: false, system: false, inWidget: false });
    const [widgetAppsSet, setWidgetAppsSet] = useState<Set<string>>(new Set());
    const [shizukuAvailable, setShizukuAvailable] = useState<boolean | null>(null);
    const [shizukuHasPermission, setShizukuHasPermission] = useState<boolean>(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState<string | undefined>(undefined);
    const [alertMessage, setAlertMessage] = useState<string | undefined>(undefined);
    const [alertActions, setAlertActions] = useState<AlertAction[] | undefined>(undefined);

    const runBatchAction = useCallback(
        async (items: any[], action: (pkg: string) => Promise<any>, successMsg: string, failMsg: string) => {
            const results = await Promise.all(
                items.map((pkg: any) =>
                    action(pkg.packageName)
                        .then((res: any) => ({ pkg: pkg.packageName, status: "fulfilled", res }))
                        .catch((err: any) => ({ pkg: pkg.packageName, status: "rejected", reason: err })),
                ),
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
        [],
    );

    // ref
    const bottomSheetRef = useRef<BottomSheet>(null);
    const listRef = useRef<FlatList<any> | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);

    // callbacks
    const handleSheetChanges = useCallback(
        (index: number) => {
            if (index === -1) {
                setSelectedApp(null);
            }
        },
        [setSelectedApp],
    );

    const handleOpenSheetForApp = useCallback((app: any) => {
        setSelectedApp(app);
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

    const renderItem = useCallback(
        ({ item }: { item: any }) => (
            <AppItem
                item={item}
                setSelectedApps={setSelectedApps}
                selectedApps={selectedApps}
                onLongPress={handleOpenSheetForApp}
            />
        ),
        [selectedApps, setSelectedApps, handleOpenSheetForApp],
    );

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

    // consolidated permission check: runs when apps load and when screen focuses
    const checkPermissions = useCallback(
        async (showPrompts = true) => {
            if (permission === "root") {
                // For root, no need to check Shizuku
                setShizukuAvailable(null);
                setShizukuHasPermission(false);
                return;
            }

            // Shizuku check
            try {
                const available = Boolean(await ShizukuModule.isShizukuAvailable());
                setShizukuAvailable(available);

                if (!available) {
                    setShizukuHasPermission(false);
                    if (showPrompts) {
                        setAlertTitle("Yêu cầu Shizuku");
                        setAlertMessage(
                            "Ứng dụng này yêu cầu app 'Shizuku' để hoạt động. Vui lòng cài đặt Shizuku từ Play Store. Hoặc bật dịch vụ Shizuku nếu bạn đã cài đặt.",
                        );
                        setAlertActions([
                            { text: "Bỏ qua", style: "cancel", onPress: () => setAlertVisible(false) },
                            {
                                text: "Cài đặt",
                                onPress: () => {
                                    setAlertVisible(false);
                                    openPlayStore();
                                },
                            },
                        ]);
                        setAlertVisible(true);
                    }
                    return;
                }

                const has = Boolean(await ShizukuModule.hasPermission());
                setShizukuHasPermission(has);

                if (!has && showPrompts) {
                    setAlertTitle("Yêu cầu ủy quyền");
                    setAlertMessage("Vui lòng ủy quyền Shizuku cho ứng dụng này!");
                    setAlertActions([
                        {
                            text: "Bỏ qua",
                            style: "cancel",
                            onPress: () => setAlertVisible(false),
                        },
                        {
                            text: "Ủy quyền",
                            onPress: async () => {
                                setAlertVisible(false);
                                try {
                                    await ShizukuModule.requestPermission();
                                } catch (err) {
                                    console.error("Request permission error:", err);
                                }
                            },
                        },
                    ]);
                    setAlertVisible(true);
                } else if (has) {
                    await AppManagerWrapper.ensureBound();
                }
            } catch (err) {
                console.warn("Shizuku check failed:", err);
                setShizukuAvailable(false);
                setShizukuHasPermission(false);
            }
        },
        [permission, openPlayStore],
    );

    useEffect(() => {
        // show prompts once when apps are first loaded so user can install/grant permission
        if (apps.length > 0) checkPermissions(true);
    }, [apps, checkPermissions]);

    // Re-check permission when app returns to foreground (onResume behavior)
    useEffect(() => {
        const handler = (nextAppState: string) => {
            if (nextAppState === "active") {
                // when app becomes active again, re-check and show prompts if needed
                checkPermissions(true);
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
    }, [checkPermissions]);

    return (
        <SafeAreaView style={styles.container}>
            <LayoutScreen>
                <AlertModal
                    visible={alertVisible}
                    title={alertTitle}
                    message={alertMessage}
                    actions={alertActions}
                    onRequestClose={() => setAlertVisible(false)}
                />
                {/* <Card style={{ marginTop: 8, marginHorizontal: 16, paddingVertical: 8, paddingHorizontal: 12 }}>
                    <PaperText
                        variant="bodyMedium"
                        style={{
                            color:
                                permission === "root"
                                    ? paperTheme.colors.primary
                                    : shizukuAvailable
                                      ? shizukuHasPermission
                                          ? paperTheme.colors.primary
                                          : paperTheme.colors.secondary
                                      : paperTheme.colors.error,
                            fontWeight: "500",
                            textAlign: "center",
                        }}
                    >
                        {permission === "root"
                            ? "Root mode"
                            : shizukuAvailable === null
                              ? "Checking..."
                              : shizukuAvailable
                                ? shizukuHasPermission
                                    ? "Shizuku Mode"
                                    : "Need Permission"
                                : "No Shizuku"}
                    </PaperText>
                </Card> */}

                <View
                    style={{
                        position: "absolute",
                        top: 20,
                        right: 20,
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        zIndex: 10,
                    }}
                >
                    <PaperText
                        variant="bodyMedium"
                        style={{
                            color:
                                permission === "root"
                                    ? paperTheme.colors.primary
                                    : shizukuAvailable
                                      ? shizukuHasPermission
                                          ? paperTheme.colors.primary
                                          : paperTheme.colors.secondary
                                      : paperTheme.colors.error,
                            fontWeight: "500",
                            textAlign: "center",
                        }}
                    >
                        {permission === "root"
                            ? "Root mode"
                            : shizukuAvailable === null
                              ? "Checking..."
                              : shizukuAvailable
                                ? shizukuHasPermission
                                    ? "Shizuku Mode"
                                    : "Need Permission"
                                : "No Shizuku"}
                    </PaperText>
                    <IconButton
                        icon="cog"
                        size={24}
                        onPress={() => router.push("/permission-select")}
                        style={{
                            backgroundColor: paperTheme.colors.surfaceVariant,
                        }}
                        iconColor={paperTheme.colors.onSurfaceVariant}
                    />
                </View>

                <View style={{ marginVertical: 8, marginTop: 16 }}>
                    <View
                        style={{
                            width: "93%",
                            marginHorizontal: "auto",
                            marginTop: 16,
                            position: "relative",
                        }}
                    >
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Search by package name..."
                            style={{
                                height: 48,
                                borderRadius: 24,
                                paddingHorizontal: 16,
                                paddingRight: 48,
                                backgroundColor: paperTheme.colors.surfaceVariant,
                                color: paperTheme.colors.onSurface,
                                fontSize: 16,
                            }}
                            placeholderTextColor={paperTheme.colors.onSurfaceVariant}
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="search"
                        />
                        <IconButton
                            icon="magnify"
                            size={20}
                            style={{
                                position: "absolute",
                                right: 2,
                                top: 2,
                            }}
                            iconColor={paperTheme.colors.onSurfaceVariant}
                        />
                    </View>

                    <Text
                        style={{
                            marginTop: 4,
                            marginStart: 32,
                            fontSize: 11,
                            color: paperTheme.colors.onSurfaceVariant,
                        }}
                    >
                        * {filteredApps.length}/{apps.length}
                    </Text>
                </View>

                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "center",
                        marginTop: 8,
                        marginHorizontal: 16,
                        gap: 4,
                        marginBottom: 8,
                    }}
                >
                    <Chip
                        icon="cancel"
                        selected={filters.disabled}
                        onPress={() => setFilters((prev) => ({ ...prev, disabled: !prev.disabled }))}
                        style={{
                            flex: 1,
                            height: 32,
                            backgroundColor: filters.disabled
                                ? paperTheme.colors.primaryContainer
                                : paperTheme.colors.surface,
                        }}
                        textStyle={{ fontSize: 12 }}
                        mode="flat"
                    >
                        Disabled
                    </Chip>
                    <Chip
                        icon="cog"
                        selected={filters.system}
                        onPress={() => setFilters((prev) => ({ ...prev, system: !prev.system }))}
                        style={{
                            flex: 1,
                            height: 32,
                            backgroundColor: filters.system
                                ? paperTheme.colors.primaryContainer
                                : paperTheme.colors.surface,
                        }}
                        textStyle={{ fontSize: 12 }}
                        mode="flat"
                    >
                        System
                    </Chip>
                    <Chip
                        icon="star"
                        selected={filters.inWidget}
                        onPress={() => setFilters((prev) => ({ ...prev, inWidget: !prev.inWidget }))}
                        style={{
                            flex: 1,
                            height: 32,
                            backgroundColor: filters.inWidget
                                ? paperTheme.colors.primaryContainer
                                : paperTheme.colors.surface,
                        }}
                        textStyle={{ fontSize: 12 }}
                        mode="flat"
                    >
                        In Widget
                    </Chip>
                </View>

                {loading ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
                        <ActivityIndicator size="large" animating={true} color={paperTheme.colors.primary} />
                        <PaperText
                            variant="bodyLarge"
                            style={{
                                marginTop: 16,
                                color: paperTheme.colors.onSurfaceVariant,
                                textAlign: "center",
                            }}
                        >
                            Loading apps...
                        </PaperText>
                    </View>
                ) : apps.length === 0 ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
                        <PaperText
                            variant="headlineSmall"
                            style={{
                                color: paperTheme.colors.onSurface,
                                textAlign: "center",
                                marginBottom: 8,
                            }}
                        >
                            No Apps Found
                        </PaperText>
                        <PaperText
                            variant="bodyMedium"
                            style={{
                                color: paperTheme.colors.onSurfaceVariant,
                                textAlign: "center",
                            }}
                        >
                            Pull down to refresh or check permissions
                        </PaperText>
                    </View>
                ) : filteredApps.length === 0 ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
                        <PaperText
                            variant="headlineSmall"
                            style={{
                                color: paperTheme.colors.onSurface,
                                textAlign: "center",
                                marginBottom: 8,
                            }}
                        >
                            No Results
                        </PaperText>
                        <PaperText
                            variant="bodyMedium"
                            style={{
                                color: paperTheme.colors.onSurfaceVariant,
                                textAlign: "center",
                            }}
                        >
                            No apps match "{search}"
                        </PaperText>
                    </View>
                ) : (
                    <View style={{ flex: 1, paddingBottom: selectedApps.length > 0 ? 140 : 16, paddingHorizontal: 0 }}>
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
                            renderItem={renderItem}
                            keyExtractor={(item) => item.packageName}
                            getItemLayout={(data, index) => ({
                                length: 72, // Reduced from 60 to make more compact
                                offset: 72 * index,
                                index,
                            })}
                            initialNumToRender={25}
                            windowSize={15}
                            removeClippedSubviews={true}
                            maxToRenderPerBatch={25}
                            contentContainerStyle={{ paddingBottom: 16 }}
                        />
                    </View>
                )}

                {/* Scroll to top button */}
                {showScrollTop ? (
                    <FAB
                        icon="arrow-up"
                        style={{
                            position: "absolute",
                            right: 16,
                            bottom: selectedApps.length > 0 ? 140 : 16,
                        }}
                        onPress={() => {
                            try {
                                listRef.current?.scrollToOffset({ offset: 0, animated: true });
                            } catch (e) {
                                console.warn(e);
                            }
                        }}
                        size="small"
                    />
                ) : null}

                {selectedApps.length > 0 && (
                    <Surface
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            backgroundColor: paperTheme.colors.surface,
                            padding: 16,
                            borderTopWidth: 1,
                            borderTopColor: paperTheme.colors.outline,
                            elevation: 4,
                        }}
                        elevation={4}
                    >
                        <PaperText
                            variant="titleMedium"
                            style={{
                                color: paperTheme.colors.onSurface,
                                textAlign: "center",
                                marginBottom: 12,
                            }}
                        >
                            {selectedApps.length} selected
                        </PaperText>
                        <View style={{ flexDirection: "row", justifyContent: "space-around", gap: 8 }}>
                            <Button
                                mode="outlined"
                                onPress={toggleSelectAll}
                                icon={allSelected ? "checkbox-marked" : "checkbox-blank-outline"}
                                style={{ flex: 1 }}
                            >
                                {allSelected ? "Deselect All" : "Select All"}
                            </Button>
                            <Button
                                mode="outlined"
                                onPress={async () => {
                                    runBatchAction(
                                        selectedApps,
                                        AppManagerWrapper.disablePackage,
                                        "Đã vô hiệu hoá tất cả package đã chọn.",
                                        "không thể vô hiệu hoá.",
                                    );
                                }}
                                icon="cancel"
                                style={{ flex: 1 }}
                            >
                                Disable
                            </Button>
                            <Button
                                mode="contained"
                                onPress={() =>
                                    runBatchAction(
                                        selectedApps,
                                        AppManagerWrapper.uninstallPackage,
                                        "Đã gỡ cài đặt tất cả package đã chọn.",
                                        "không thể gỡ cài đặt.",
                                    )
                                }
                                icon="delete"
                                buttonColor={paperTheme.colors.error}
                                textColor={paperTheme.colors.onError}
                                style={{ flex: 1 }}
                            >
                                Delete
                            </Button>
                        </View>
                    </Surface>
                )}

                <BottomSheet
                    index={-1}
                    detached={true}
                    enablePanDownToClose={true}
                    enableDynamicSizing={true}
                    snapPoints={[200, "50%"]}
                    ref={bottomSheetRef}
                    onChange={handleSheetChanges}
                    backgroundStyle={{ backgroundColor: theme === "dark" ? "#121212" : "#ffffff" }}
                    // handleStyle={{ backgroundColor: theme === "dark" ? "#1e1e1e" : "#f7f7f7" }}
                    handleIndicatorStyle={{ backgroundColor: theme === "dark" ? "#555" : "#cfcfcf" }}
                    animationConfigs={{
                        duration: 150,
                    }}
                    backdropComponent={useCallback(
                        (props: BottomSheetBackdropProps) => (
                            <BottomSheetBackdrop
                                {...props}
                                disappearsOnIndex={-1}
                                appearsOnIndex={0}
                                pressBehavior="close"
                            />
                        ),
                        [],
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

                                <Text
                                    style={{
                                        fontWeight: "700",
                                        fontSize: 16,
                                        marginBottom: 8,
                                        color: Colors[theme ?? "light"].text,
                                    }}
                                >
                                    {selectedApp.appName}
                                </Text>
                                <Text style={{ color: Colors[theme ?? "light"].icon, marginBottom: 12 }}>
                                    {selectedApp.packageName}
                                </Text>

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
                                            backgroundColor: theme === "dark" ? "#222" : "#f0f0f0",
                                            borderRadius: 8,
                                            marginRight: 8,
                                        }}
                                    >
                                        <Text style={{ textAlign: "center", color: Colors[theme ?? "light"].text }}>
                                            Disable
                                        </Text>
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
                                        style={{
                                            flex: 1,
                                            padding: 12,
                                            backgroundColor: theme === "dark" ? "#222" : "#f0f0f0",
                                            borderRadius: 8,
                                        }}
                                    >
                                        <Text style={{ textAlign: "center", color: Colors[theme ?? "light"].text }}>
                                            Enable
                                        </Text>
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
                                    style={{
                                        padding: 12,
                                        backgroundColor: theme === "dark" ? "#705d26" : "#ffecb3",
                                        borderRadius: 8,
                                    }}
                                >
                                    <Text style={{ textAlign: "center", color: Colors[theme ?? "light"].text }}>
                                        Force Stop
                                    </Text>
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
                                    style={{
                                        padding: 12,
                                        backgroundColor: theme === "dark" ? "#222" : "#f0f0f0",
                                        borderRadius: 8,
                                    }}
                                >
                                    <Text style={{ textAlign: "center", color: Colors[theme ?? "light"].text }}>
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
                                    style={{
                                        padding: 12,
                                        backgroundColor: theme === "dark" ? "#6b2b2b" : "#ffd6d6",
                                        borderRadius: 8,
                                    }}
                                >
                                    <Text style={{ textAlign: "center", color: "#ff5252" }}>Uninstall</Text>
                                </TouchableOpacity>
                                <View style={{ height: 12 }} />
                            </View>
                        ) : (
                            <Text style={{ color: Colors[theme ?? "light"].text }}>Không có app được chọn</Text>
                        )}
                    </BottomSheetView>
                </BottomSheet>
            </LayoutScreen>
        </SafeAreaView>
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
