import AppItem from "@/components/AppItem";
import LayoutScreen from "@/components/ui/LayoutScreen";
import AppManagerWrapper from "@/utils/appManager";
import Ionicons from "@expo/vector-icons/Ionicons";
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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
const { SystemModule, ShizukuModule, AppManager } = NativeModules;

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

    // ref
    const bottomSheetRef = useRef<BottomSheet>(null);

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
                          <View style={{ flexDirection: "row", display: "flex", alignItems: "center" }}>
                              <Text style={{ fontWeight: "bold" }}>{selectedApps.length} selected</Text>

                              <TouchableOpacity
                                  onPress={async () => {
                                      const results = await Promise.all(
                                          selectedApps.map((pkg: any) =>
                                              AppManagerWrapper.uninstallPackage(pkg.packageName)
                                                  .then((res: any) => ({
                                                      pkg: pkg.packageName,
                                                      status: "fulfilled",
                                                      res,
                                                  }))
                                                  .catch((err: any) => ({
                                                      pkg: pkg.packageName,
                                                      status: "rejected",
                                                      reason: err,
                                                  }))
                                          )
                                      );

                                      const failures = results.filter((r: any) => r.status === "rejected");

                                      if (failures.length > 0) {
                                          console.error("Some packages failed to disable:", failures);
                                          Toast.show({
                                              type: "error",
                                              text1: "Lỗi",
                                              text2: `${failures.length} package(s) không thể vô hiệu hoá.`,
                                          });
                                      } else {
                                          Toast.show({
                                              type: "success",
                                              text1: "Hoàn tất",
                                              text2: "Đã vô hiệu hoá tất cả package đã chọn.",
                                          });
                                      }

                                      // Clear selection and reload apps regardless of individual failures

                                      await loadApps().finally(() => {
                                          setSelectedApps([]);
                                      });
                                  }}
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
                                  onPress={async () => {
                                      const results = await Promise.all(
                                          selectedApps.map((pkg: any) =>
                                              AppManagerWrapper.uninstallPackage(pkg.packageName)
                                                  .then((res: any) => ({
                                                      pkg: pkg.packageName,
                                                      status: "fulfilled",
                                                      res,
                                                  }))
                                                  .catch((err: any) => ({
                                                      pkg: pkg.packageName,
                                                      status: "rejected",
                                                      reason: err,
                                                  }))
                                          )
                                      );

                                      const failures = results.filter((r: any) => r.status === "rejected");

                                      if (failures.length > 0) {
                                          console.error("Some packages failed to uninstall:", failures);
                                          Toast.show({
                                              type: "error",
                                              text1: "Lỗi",
                                              text2: `${failures.length} package(s) không thể gỡ cài đặt.`,
                                          });
                                      } else {
                                          Toast.show({
                                              type: "success",
                                              text1: "Hoàn tất",
                                              text2: "Đã gỡ cài đặt tất cả package đã chọn.",
                                          });
                                      }

                                      // Clear selection and reload apps regardless of individual failures

                                      await loadApps().finally(() => {
                                          setSelectedApps([]);
                                      });
                                  }}
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
    }, [selectedApps, navigation]);

    React.useEffect(() => {
        loadApps();
    }, []);

    React.useEffect(() => {
        async function check() {
            const available = await ShizukuModule.isShizukuAvailable();

            if (!available) {
                return Alert.alert(
                    "Error",
                    "Ứng dụng này yêu cầu cần có app 'Shizuku' để hoạt động được. Vui lòng tải nó từ Play Store.",
                    [
                        {
                            text: "Tải về",
                            onPress: () => {},
                        },
                        {
                            text: "Bỏ qua",
                            onPress: () => null,
                        },
                    ]
                );
            }

            let has = await ShizukuModule.hasPermission();

            if (!has) {
                let result = null;
                Alert.alert("Error", "Vui lòng ủy quyền Shizuku cho ứng dụng này!", [
                    {
                        text: "Ủy quyền",
                        onPress: async () => {
                            result = await ShizukuModule.requestPermission();

                            console.log({ result });

                            if (!result) {
                                Toast.show({
                                    type: "error",
                                    text1: "Lỗi",
                                    text2: "Vui lòng ủy quyền Shizuku cho ứng dụng này!",
                                    onPress: async () => {
                                        const a = await ShizukuModule.requestPermission();
                                        console.log(a);
                                    },
                                });
                            }
                            // If permission granted, try to ensure AppManager binding
                            const bound = await AppManagerWrapper.ensureBound();
                            console.log("AppManager bound:", bound);
                        },
                    },
                    {
                        text: "Bỏ qua",
                        onPress: () => null,
                    },
                ]);

                has = await ShizukuModule.hasPermission();

                console.log("Has Shizuku permission:", has);
            } else {
                console.log("Has Shizuku permission:", has);
            }
        }

        apps.length > 0 && check();
    }, [apps]);

    // If apps are loaded and permission already exists, proactively ensure AppManager is bound
    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const has = await ShizukuModule.hasPermission();
                if (mounted && has) {
                    const bound = await AppManagerWrapper.ensureBound();
                    console.log("Proactive bind result:", bound);
                }
            } catch (err) {
                console.warn(err);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [apps]);

    return (
        <LayoutScreen>
            <GestureHandlerRootView style={styles.container}>
                <Text style={{ marginLeft: 10 }}>Total: {apps.length} apps</Text>

                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search by package name..."
                    style={styles.search}
                    autoCapitalize="none"
                    autoCorrect={false}
                    clearButtonMode="while-editing"
                />

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
                        data={filteredApps}
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
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#ddd",
        paddingHorizontal: 10,
        marginBottom: 8,
        marginHorizontal: 8,
    },
});
