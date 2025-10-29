import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";

type ErrorBoundaryState = {
    hasError: boolean;
    message?: string;
};

type ErrorBoundaryProps = {
    children: React.ReactNode;
};

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
        const message = error instanceof Error ? error.message : "Unknown error";
        return { hasError: true, message };
    }

    componentDidCatch(error: unknown, errorInfo: any) {
        try {
            console.error("Unhandled error:", error, errorInfo);
            const message = error instanceof Error ? error.message : "Unknown error";
            Toast.show({ type: "error", text1: "Đã xảy ra lỗi", text2: message });
        } catch {}
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.title}>Đã xảy ra lỗi</Text>
                    <Text style={styles.subtitle}>Vui lòng thử lại thao tác hoặc khởi động lại ứng dụng.</Text>
                </View>
            );
        }
        return this.props.children as any;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
    },
});
