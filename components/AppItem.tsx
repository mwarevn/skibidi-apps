import React, { useEffect } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export default function AppItem({ item, setSelectedApps, selectedApps }: any) {
    // const [isSelected, setIsSelected] = useState(false);

    // useEffect(() => {
    //     isSelected && setSelectedApps([...selectedApps, item]);
    //     !isSelected && setSelectedApps([...selectedApps.filter((i: any) => i.packageName !== item.packageName)]);
    // }, [isSelected]);

    const isSelected = selectedApps.find((i: any) => i.packageName === item.packageName);

    useEffect(() => {}, [selectedApps]);

    return (
        <Pressable
            style={{ backgroundColor: isSelected ? "red" : "transparent" }}
            onLongPress={() => {}}
            onPress={() => {
                if (isSelected) {
                    setSelectedApps(selectedApps.filter((i: any) => i.packageName !== item.packageName));
                } else {
                    setSelectedApps([...selectedApps, item]);
                }
            }}
        >
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 10,
                }}
            >
                {item.iconBase64 ? (
                    <Image source={{ uri: `data:image/png;base64,${item.iconBase64}` }} style={styles.icon} />
                ) : (
                    <View style={[styles.icon, { backgroundColor: "#ccc" }]} />
                )}
                <View>
                    <Text style={styles.name}>{item.appName}</Text>
                    <Text style={styles.pkg}>{item.packageName}</Text>
                    {!item.enabled && <Text style={{ color: "orangered" }}>disabled</Text>}
                </View>
            </View>
        </Pressable>
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
