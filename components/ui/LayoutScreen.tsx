import React from "react";
import { View } from "react-native";

export default function LayoutScreen({ children }: any) {
    return (
        <View style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>{children}</View>

            <View style={{ height: 64 }}>{/* Phần trên cố định 120px */}</View>
        </View>
    );
}
