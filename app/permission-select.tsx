import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { NativeModules } from "react-native";
import { Button, Card, Text as PaperText, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const { ShizukuModule, SystemModule } = NativeModules;

const PERMISSION_KEY = "selected_permission";

type PermissionType = "shizuku" | "root" | null;

export default function PermissionSelectScreen() {
    const [availablePermissions, setAvailablePermissions] = useState<{ shizuku: boolean; root: boolean }>({
        shizuku: false,
        root: false,
    });
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { setPermission } = usePermission();
    const paperTheme = useTheme();

    useEffect(() => {
        checkPermissions();
    }, []);

    const checkPermissions = async () => {
        try {
            // Check Shizuku
            const shizukuAvailable = (await ShizukuModule.isShizukuAvailable?.()) || false;
            setAvailablePermissions({
                shizuku: shizukuAvailable,
                root: await checkRootAccess(),
            });
        } catch (e) {
            console.warn("Error checking permissions:", e);
        } finally {
            setLoading(false);
        }
    };

    const checkRootAccess = async (): Promise<boolean> => {
        try {
            return await SystemModule.isRootAvailable();
        } catch (e) {
            return false;
        }
    };

    const selectPermission = async (type: PermissionType) => {
        if (!type) return;
        await setPermission(type);
        router.back();
    };

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
                <PaperText variant="bodyLarge" style={{ color: paperTheme.colors.onSurfaceVariant }}>
                    Checking permissions...
                </PaperText>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, padding: 20, backgroundColor: paperTheme.colors.background }}>
            <PaperText
                variant="headlineMedium"
                style={{
                    textAlign: "center",
                    marginBottom: 12,
                    color: paperTheme.colors.onSurface,
                    fontWeight: "600",
                }}
            >
                Chọn phương thức truy cập
            </PaperText>
            <PaperText
                variant="bodyLarge"
                style={{
                    textAlign: "center",
                    marginBottom: 32,
                    color: paperTheme.colors.onSurfaceVariant,
                }}
            >
                Chọn cách app truy cập hệ thống để quản lý ứng dụng
            </PaperText>

            {availablePermissions.shizuku && (
                <Card style={{ marginBottom: 20, borderRadius: 16 }} mode="elevated" elevation={2}>
                    <Card.Content style={{ padding: 20 }}>
                        <PaperText
                            variant="titleLarge"
                            style={{ color: paperTheme.colors.onSurface, fontWeight: "600", marginBottom: 8 }}
                        >
                            Shizuku
                        </PaperText>
                        <PaperText
                            variant="bodyMedium"
                            style={{ color: paperTheme.colors.onSurfaceVariant, marginBottom: 16 }}
                        >
                            Sử dụng Shizuku để truy cập hệ thống một cách an toàn
                        </PaperText>
                        <PaperText
                            variant="bodySmall"
                            style={{ color: paperTheme.colors.onSurfaceVariant, marginBottom: 16 }}
                        >
                            • Không yêu cầu root • Bảo mật cao • Tương thích với Android 8+
                        </PaperText>
                    </Card.Content>
                    <Card.Actions style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                        <Button
                            mode="contained"
                            onPress={() => selectPermission("shizuku")}
                            style={{ flex: 1, borderRadius: 12 }}
                            contentStyle={{ paddingVertical: 6 }}
                        >
                            Chọn Shizuku
                        </Button>
                    </Card.Actions>
                </Card>
            )}

            {availablePermissions.root && (
                <Card style={{ marginBottom: 20, borderRadius: 16 }} mode="elevated" elevation={2}>
                    <Card.Content style={{ padding: 20 }}>
                        <PaperText
                            variant="titleLarge"
                            style={{ color: paperTheme.colors.onSurface, fontWeight: "600", marginBottom: 8 }}
                        >
                            Root
                        </PaperText>
                        <PaperText
                            variant="bodyMedium"
                            style={{ color: paperTheme.colors.onSurfaceVariant, marginBottom: 16 }}
                        >
                            Sử dụng quyền root để truy cập đầy đủ hệ thống
                        </PaperText>
                        <PaperText
                            variant="bodySmall"
                            style={{ color: paperTheme.colors.onSurfaceVariant, marginBottom: 16 }}
                        >
                            • Quyền truy cập tối đa • Tất cả tính năng • Yêu cầu thiết bị đã root
                        </PaperText>
                    </Card.Content>
                    <Card.Actions style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                        <Button
                            mode="contained"
                            onPress={() => selectPermission("root")}
                            style={{ flex: 1, borderRadius: 12 }}
                            contentStyle={{ paddingVertical: 6 }}
                            buttonColor={paperTheme.colors.secondary}
                            textColor={paperTheme.colors.onSecondary}
                        >
                            Chọn Root
                        </Button>
                    </Card.Actions>
                </Card>
            )}

            {!availablePermissions.shizuku && !availablePermissions.root && (
                <Card style={{ marginTop: 40, borderRadius: 16 }} mode="elevated" elevation={1}>
                    <Card.Content style={{ padding: 32, alignItems: "center" }}>
                        <PaperText
                            variant="headlineSmall"
                            style={{
                                textAlign: "center",
                                color: paperTheme.colors.onSurface,
                                marginBottom: 12,
                                fontWeight: "500",
                            }}
                        >
                            Không có phương thức truy cập
                        </PaperText>
                        <PaperText
                            variant="bodyLarge"
                            style={{
                                textAlign: "center",
                                color: paperTheme.colors.onSurfaceVariant,
                                marginBottom: 20,
                            }}
                        >
                            Thiết bị của bạn không hỗ trợ các phương thức truy cập hệ thống cần thiết.
                        </PaperText>
                        <PaperText
                            variant="bodyMedium"
                            style={{
                                textAlign: "center",
                                color: paperTheme.colors.onSurfaceVariant,
                            }}
                        >
                            Vui lòng cài đặt Shizuku hoặc root thiết bị để sử dụng ứng dụng.
                        </PaperText>
                    </Card.Content>
                </Card>
            )}
        </SafeAreaView>
    );
}
