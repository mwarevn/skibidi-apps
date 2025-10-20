import AppItem from "@/components/AppItem";
import LayoutScreen from "@/components/ui/LayoutScreen";
import Ionicons from "@expo/vector-icons/Ionicons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Alert, FlatList, NativeModules, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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
    const [apps, setApps] = useState<any[]>([]);
    const [search, setSearch] = useState("");

    // ref
    const bottomSheetRef = useRef<BottomSheet>(null);

    // callbacks
    const handleSheetChanges = useCallback((index: number) => {
        console.log("handleSheetChanges", index);
    }, []);

    async function loadApps() {
        try {
            const list = await SystemModule.getInstalledApps();
            console.log("Total apps:", list.length);
            setApps(list);
        } catch (e) {
            console.error("Error loading apps:", e);
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
                                              AppManager.disablePackage(pkg.packageName)
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
                                  onPress={() => console.log("Pressed")}
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
    }, [selectedApps]);

    React.useEffect(() => {
        loadApps();
    }, []);

    React.useEffect(() => {
        async function check() {
            const available = await ShizukuModule.isShizukuAvailable();

            if (!available) {
                Alert.alert(
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

                            if (!result) {
                                Toast.show({
                                    type: "error",
                                    text1: "Lỗi",
                                    text2: "Vui lòng ủy quyền Shizuku cho ứng dụng này!",
                                    onPress: async () => {
                                        await ShizukuModule.requestPermission();
                                    },
                                });
                            }
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

                {apps.length === 0 ? (
                    <Text>Loading...</Text>
                ) : filteredApps.length === 0 ? (
                    <Text>No results for "{search}"</Text>
                ) : (
                    <FlatList
                        data={filteredApps}
                        renderItem={({ item }) => (
                            <AppItem item={item} setSelectedApps={setSelectedApps} selectedApps={selectedApps} />
                        )}
                        keyExtractor={(item) => item.packageName}
                    />
                )}

                <BottomSheet
                    detached={true}
                    enablePanDownToClose={true}
                    enableDynamicSizing={true}
                    snapPoints={[200, "80%"]}
                    ref={bottomSheetRef}
                    onChange={handleSheetChanges}
                >
                    <BottomSheetView style={styles.contentContainer}>
                        <Text>Awesome</Text>
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
