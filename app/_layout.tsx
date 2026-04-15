import { useColorScheme } from "@/hooks/use-color-scheme";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import CustomToast from "@/components/CustomToast";

export const unstable_settings = {
    anchor: "(tabs)",
};

const toastConfig = {
    success: ({ text1, text2, hide, onPress }: any) => (
        <CustomToast text1={text1} text2={text2} hide={hide} type="success" onPress={onPress} />
    ),
    error: ({ text1, text2, hide, onPress }: any) => (
        <CustomToast text1={text1} text2={text2} hide={hide} type="error" onPress={onPress} />
    ),
    info: ({ text1, text2, hide, onPress }: any) => (
        <CustomToast text1={text1} text2={text2} hide={hide} type="info" onPress={onPress} />
    ),
    warn: ({ text1, text2, hide, onPress }: any) => (
        <CustomToast text1={text1} text2={text2} hide={hide} type="warn" onPress={onPress} />
    ),
};

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
            </Stack>
            <Toast config={toastConfig} />
            <StatusBar style="auto" />
        </ThemeProvider>
    );
}
