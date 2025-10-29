import CustomToast from "@/components/CustomToast";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { initGlobalErrorHandling } from "@/utils/errorHandling";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import Toast from "react-native-toast-message";

export const unstable_settings = {
    anchor: "(tabs)",
};

export default function RootLayout() {
    const colorScheme = useColorScheme();
    useEffect(() => {
        initGlobalErrorHandling();
    }, []);

    return (
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            <ErrorBoundary>
                <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
                </Stack>
                <Toast
                    position="top"
                    topOffset={32}
                    config={{
                        success: (props) => <CustomToast {...props} type="success" />,
                        error: (props) => <CustomToast {...props} type="error" />,
                        info: (props) => <CustomToast {...props} type="info" />,
                    }}
                />
                <StatusBar style="auto" />
            </ErrorBoundary>
        </ThemeProvider>
    );
}
