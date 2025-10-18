import CustomToast from "@/components/CustomToast";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import ToastManager from "toastify-react-native";

export const unstable_settings = {
    anchor: "(tabs)",
};

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const toastConfig = {
        custom: (props: any) => <CustomToast {...props} />,
        success: (props: any) => <CustomToast {...props} />,
        error: (props: any) => <CustomToast {...props} />,
        info: (props: any) => <CustomToast {...props} />,
        warning: (props: any) => <CustomToast {...props} />,
    };

    return (
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
            </Stack>
            <ToastManager config={toastConfig} />
            <StatusBar style="auto" />
        </ThemeProvider>
    );
}
