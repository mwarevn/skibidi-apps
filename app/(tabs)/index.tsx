import LayoutScreen from "@/components/ui/LayoutScreen";
import React from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";

import { NativeModules } from "react-native";
const { SystemModule, ShizukuModule } = NativeModules;

SystemModule.getMessage().then((msg: string) => {
  console.log(msg);
});

export default function AppsScreen() {
  const [apps, setApps] = React.useState<any>([]);

  React.useEffect(() => {
    async function loadApps() {
      try {
        const list = await SystemModule.getInstalledApps();
        console.log("Total apps:", list.length);
        setApps(list);
      } catch (e) {
        console.error("Error loading apps:", e);
      }
    }

    loadApps();
  }, []);

  React.useEffect(() => {
    async function check() {
      const available = await ShizukuModule.isShizukuAvailable();
      console.log("Shizuku available:", available);

      const has = await ShizukuModule.hasPermission();
      console.log("Has Shizuku permission:", has);

      if (!has) {
        console.log("Requesting permission...");
        ShizukuModule.requestPermission();
      }
    }

    check();
  }, []);

  return (
    <LayoutScreen>
      <FlatList
        data={apps}
        renderItem={({ item }) => {
          return (
            <View style={styles.item}>
              {item.iconBase64 ? (
                <Image
                  source={{ uri: `data:image/png;base64,${item.iconBase64}` }}
                  style={styles.icon}
                />
              ) : (
                <View style={[styles.icon, { backgroundColor: "#ccc" }]} />
              )}
              <View>
                <Text style={styles.name}>{item.appName}</Text>
                <Text style={styles.pkg}>{item.packageName}</Text>
              </View>
            </View>
          );
        }}
        keyExtractor={(item) => item.packageName}
      />
    </LayoutScreen>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  icon: {
    width: 40,
    height: 40,
    marginRight: 10,
    borderRadius: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
  },
  pkg: {
    fontSize: 12,
    color: "#666",
  },
});
