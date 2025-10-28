import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LayoutScreen({ children }: any) {
    return (
        <SafeAreaView style={{ flex: 1 }}>
            {/* <View style={{ height: 64 }}>Phần trên cố định 120px</View> */}

            {/* <View style={{ flex: 1 }}>{children}</View> */}
            {children}

            {/* <View style={{ height: 64 }}>Phần trên cố định 120px</View> */}
        </SafeAreaView>
    );
}
