import CustomToast from "@/components/CustomToast";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { PermissionProvider } from "@/hooks/usePermission";
import { initGlobalErrorHandling } from "@/utils/errorHandling";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MD3DarkTheme, MD3LightTheme, PaperProvider, configureFonts } from "react-native-paper";
import "react-native-reanimated";
import Toast from "react-native-toast-message";

export const unstable_settings = {
    anchor: "(tabs)",
};

// Material Design 3 Expressive Theme Configuration
const createExpressiveTheme = (isDark: boolean) => {
    const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;

    // Expressive Typography Scale
    const fontConfig = {
        fontFamily: "System",
        fontWeight: {
            thin: "100",
            light: "300",
            regular: "400",
            medium: "500",
            semibold: "600",
            bold: "700",
            heavy: "900",
        },
    };

    const fonts = configureFonts({
        config: {
            ...fontConfig,
            displayLarge: {
                ...fontConfig,
                fontSize: 57,
                lineHeight: 64,
                fontWeight: "400",
            },
            displayMedium: {
                ...fontConfig,
                fontSize: 45,
                lineHeight: 52,
                fontWeight: "400",
            },
            displaySmall: {
                ...fontConfig,
                fontSize: 36,
                lineHeight: 44,
                fontWeight: "400",
            },
            headlineLarge: {
                ...fontConfig,
                fontSize: 32,
                lineHeight: 40,
                fontWeight: "400",
            },
            headlineMedium: {
                ...fontConfig,
                fontSize: 28,
                lineHeight: 36,
                fontWeight: "400",
            },
            headlineSmall: {
                ...fontConfig,
                fontSize: 24,
                lineHeight: 32,
                fontWeight: "400",
            },
            titleLarge: {
                ...fontConfig,
                fontSize: 22,
                lineHeight: 28,
                fontWeight: "500",
            },
            titleMedium: {
                ...fontConfig,
                fontSize: 16,
                lineHeight: 24,
                fontWeight: "500",
            },
            titleSmall: {
                ...fontConfig,
                fontSize: 14,
                lineHeight: 20,
                fontWeight: "500",
            },
            labelLarge: {
                ...fontConfig,
                fontSize: 14,
                lineHeight: 20,
                fontWeight: "500",
            },
            labelMedium: {
                ...fontConfig,
                fontSize: 12,
                lineHeight: 16,
                fontWeight: "500",
            },
            labelSmall: {
                ...fontConfig,
                fontSize: 11,
                lineHeight: 16,
                fontWeight: "500",
            },
            bodyLarge: {
                ...fontConfig,
                fontSize: 16,
                lineHeight: 24,
                fontWeight: "400",
            },
            bodyMedium: {
                ...fontConfig,
                fontSize: 14,
                lineHeight: 20,
                fontWeight: "400",
            },
            bodySmall: {
                ...fontConfig,
                fontSize: 12,
                lineHeight: 16,
                fontWeight: "400",
            },
        },
    });

    return {
        ...baseTheme,
        fonts,
        // Expressive Roundness
        roundness: 16,
        // Enhanced Spacing (custom property, not part of MD3Theme)
        spacing: {
            xs: 4,
            sm: 8,
            md: 16,
            lg: 24,
            xl: 32,
            xxl: 48,
        },
    };
};

export default function RootLayout() {
    const colorScheme = useColorScheme();
    useEffect(() => {
        initGlobalErrorHandling();
    }, []);

    const paperTheme = createExpressiveTheme(colorScheme === "dark");

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <PaperProvider theme={paperTheme}>
                <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
                    <PermissionProvider>
                        <ErrorBoundary>
                            <Stack>
                                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                                <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
                                <Stack.Screen name="permission-select" options={{ headerShown: false }} />
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
                    </PermissionProvider>
                </ThemeProvider>
            </PaperProvider>
        </GestureHandlerRootView>
    );
}
