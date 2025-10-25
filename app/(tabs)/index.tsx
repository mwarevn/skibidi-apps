import AppItem from "@/components/AppItem";
import LayoutScreen from "@/components/ui/LayoutScreen";
import AppManagerWrapper from "@/utils/appManager";
import Ionicons from "@expo/vector-icons/Ionicons";
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { Toast } from "toastify-react-native";
const { SystemModule, ShizukuModule } = NativeModules;

type RootStackParamList = {
    MyScreen: undefined;
    OtherScreen: { id: string };
};

export default function AppsScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [selectedApps, setSelectedApps] = useState<any[]>([]);
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [search, setSearch] = useState("");
    const [shizukuAvailable, setShizukuAvailable] = useState<boolean | null>(null);
    const [shizukuHasPermission, setShizukuHasPermission] = useState<boolean | null>(null);

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

            await loadApps().finally(() => setSelectedApps([]));
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

    async function loadApps() {
        try {
            setLoading(true);
            const list = await SystemModule.getAllApps();
            console.log("Total apps:", list.length);
            setApps(list);
        } catch (e) {
            console.error("Error loading apps:", e);
        } finally {
            setLoading(false);
        }
    }

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await loadApps();
        } catch (e) {
            console.warn(e);
        } finally {
            setRefreshing(false);
        }
    }, []);

    // filtered list by packageName (case-insensitive)
    const filteredApps = useMemo(() => {
        if (!search || search.trim() === "") return apps;
        const q = search.toLowerCase();
        return apps.filter((a: any) => (a.packageName || "").toLowerCase().includes(q));
    }, [apps, search]);

    // Set up header options based on selected apps (disable/trash)
    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight:
                selectedApps.length === 0
                    ? null
                    : () => (
                          <View style={{ flexDirection: "row", alignItems: "center" }}>
                              <Text style={{ fontWeight: "bold" }}>{selectedApps.length} selected</Text>

                              <TouchableOpacity
                                  onPress={() =>
                                      runBatchAction(
                                          selectedApps,
                                          AppManagerWrapper.disablePackage,
                                          "Đã vô hiệu hoá tất cả package đã chọn.",
                                          "không thể vô hiệu hoá."
                                      )
                                  }
                                  style={{
                                      marginHorizontal: 8,
                                      padding: 10,
                                      borderRadius: 1000,
                                      backgroundColor: "#dbdbdb50",
                                  }}
                              >
                                  <Ionicons name={"ban-outline"} color="grey" size={25} />
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
                                  style={{
                                      marginRight: 8,
                                      padding: 10,
                                      borderRadius: 1000,
                                      backgroundColor: "#dbdbdb50",
                                  }}
                              >
                                  <Ionicons name={"trash"} color="red" size={25} />
                              </TouchableOpacity>
                          </View>
                      ),
        } as any);
    }, [selectedApps, navigation, runBatchAction]);

    React.useEffect(() => {
        loadApps();
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

    return (
        <LayoutScreen>
            <GestureHandlerRootView style={styles.container}>
                <View style={{ backgroundColor: "#fff" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 10 }}>
                        <Text>Total: {apps.length} apps</Text>
                        <Text
                            style={{
                                marginLeft: 12,
                                color: shizukuAvailable ? (shizukuHasPermission ? "#2e7d32" : "#f9a825") : "#d32f2f",
                            }}
                        >
                            {shizukuAvailable === null
                                ? "Checking Shizuku..."
                                : shizukuAvailable
                                ? shizukuHasPermission
                                    ? "Shizuku: Authorized"
                                    : "Shizuku: Needs Permission"
                                : "Shizuku: Not Installed"}
                        </Text>
                    </View>

                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search by package name..."
                        style={styles.search}
                        autoCapitalize="none"
                        autoCorrect={false}
                        clearButtonMode="while-editing"
                    />
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
                        {/* <Text style={{ color: "#fff", fontWeight: "bold" }}>↑</Text> */}
                        <Ionicons name={"arrow-up"} color="#000" size={20} />
                    </TouchableOpacity>
                ) : null}

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
                                                await loadApps();
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
                                                await loadApps();
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
                                            await loadApps();
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
                                            await loadApps();
                                            closeSheet();
                                        }
                                    }}
                                    style={{ padding: 12, backgroundColor: "#ffd6d6", borderRadius: 8 }}
                                >
                                    <Text style={{ textAlign: "center", color: "#900" }}>Uninstall</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <Text>Không có app được chọn</Text>
                        )}
                    </BottomSheetView>
                </BottomSheet>
            </GestureHandlerRootView>
        </LayoutScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "transparent",
    },
    contentContainer: {
        flex: 1,
        paddingBottom: 64,
        alignItems: "center",
    },
    search: {
        height: 40,
        borderRadius: 8,
        borderWidth: 0.3,
        borderColor: "#ddd",
        paddingHorizontal: 10,
        marginVertical: 8,
        marginHorizontal: 8,
    },
});
