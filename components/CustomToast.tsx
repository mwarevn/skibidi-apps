import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ToastType } from "toastify-react-native/utils/interfaces";

export default function CustomToast({
    text1,
    text2,
    hide,
    type,
    onPress,
}: {
    text1: string;
    text2: string;
    hide: () => {};
    type: ToastType;
    onPress: () => {};
}) {
    let corlorStatus = "gray";
    switch (type) {
        case "success":
            corlorStatus = "#95e008ff";
            break;

        case "error":
            corlorStatus = "#ff3c00ff";
            break;

        case "info":
            corlorStatus = "#592cffff";
            break;

        case "warn":
            corlorStatus = "#ffc400ff";
            break;
    }

    return (
        <TouchableOpacity onPress={onPress} style={styles.customToast}>
            <Ionicons name="planet" size={25} color={corlorStatus} />
            <View style={styles.textContainer}>
                <Text style={styles.title}>{text1}</Text>
                {text2 && <Text style={styles.message}>{text2}</Text>}
            </View>
            <TouchableOpacity onPress={hide} style={{ backgroundColor: "#ddd", borderRadius: 100, marginLeft: 12 }}>
                <Ionicons name="close" size={20} color="#a1a1a1ff" />
            </TouchableOpacity>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    customToast: {
        width: "95%",

        backgroundColor: "#ffffffff",
        borderRadius: 50,
        paddingHorizontal: 16,
        paddingVertical: 8,
        flexDirection: "row",
        alignItems: "center",
        // shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 2,
        borderWidth: 0,
        borderColor: "#ddd",
    },
    textContainer: {
        flex: 1,
        marginLeft: 12,
    },
    title: {
        color: "#000000ff",
        fontWeight: "bold",
        fontSize: 16,
    },
    message: {
        color: "#000000ff",
        fontSize: 14,
        marginTop: 4,
    },
});
