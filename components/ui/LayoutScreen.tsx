import { useTheme } from "@/hooks/use-theme-color";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LayoutScreen({ children }: { children: React.ReactNode }) {
    const theme = useTheme();
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.scale[1] }}>
            {children}
        </SafeAreaView>
    );
}
