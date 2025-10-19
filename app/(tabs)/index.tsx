import AppItem from "@/components/AppItem";
import LayoutScreen from "@/components/ui/LayoutScreen";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import React, { useLayoutEffect, useState } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";

import { NativeModules } from "react-native";
import { NativeStackNavigationProp } from "react-native-screens/lib/typescript/native-stack/types";
import { Toast } from "toastify-react-native";
const { SystemModule, ShizukuModule, AppManager } = NativeModules;

// SystemModule.getMessage().then((msg: string) => {
//     console.log(msg);
// });
type RootStackParamList = {
    MyScreen: undefined;
    OtherScreen: { id: string };
};

export default function AppsScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [selectedApps, setSelectedApps] = useState([]);

    async function loadApps() {
        try {
            const list = await SystemModule.getInstalledApps();
            console.log("Total apps:", list.length);
            setApps(list);
        } catch (e) {
            console.error("Error loading apps:", e);
        }
    }

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
                                      //   const dis = await AppManager.disablePackage(
                                      //       "com.google.android.googlequicksearchbox"
                                      //   );

                                      // Tôi muốn sau khi bấm nút này thì sẽ disable tất cả các app đã chọn trong selectedApps và load lại danh sách apps và nếu có lỗi disibale app nào thì cũng không ảnh hưởng tới việc dissable các app khác

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

    const [apps, setApps] = React.useState<any>([]);

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
            <Text>Total: {apps.length} apps</Text>
            {apps.length === 0 ? (
                <Text>Loading...</Text>
            ) : (
                <FlatList
                    data={apps}
                    renderItem={({ item }) => (
                        <AppItem item={item} setSelectedApps={setSelectedApps} selectedApps={selectedApps} />
                    )}
                    keyExtractor={(item) => item.packageName}
                />
            )}
        </LayoutScreen>
    );
}
