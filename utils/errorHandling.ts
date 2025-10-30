import { LogBox } from "react-native";
import Toast from "react-native-toast-message";

let initialized = false;

export function initGlobalErrorHandling() {
    if (initialized) return;
    initialized = true;

    try {
        if (!__DEV__) {
            LogBox.ignoreAllLogs(true);
        }
    } catch { }

    try {
        const originalHandler = (global as any).ErrorUtils?.getGlobalHandler?.();

        (global as any).ErrorUtils?.setGlobalHandler?.((error: any, isFatal?: boolean) => {
            try {
                console.error("GlobalError:", error);
                Toast.show({
                    type: "error",
                    text1: isFatal ? "Lỗi nghiêm trọng" : "Đã xảy ra lỗi",
                    text2: error?.message || String(error),
                });
            } catch { }

            if (originalHandler) {
                try {
                    originalHandler(error, isFatal);
                } catch { }
            }
        });
    } catch { }

    if (typeof Promise !== "undefined") {
        const anyWindow: any = global as any;
        if (!anyWindow.__unhandledRejectionHandlerSet) {
            anyWindow.__unhandledRejectionHandlerSet = true;
            const trackingHandler = (event: any) => {
                try {
                    const reason = event?.reason || event;
                    console.warn("UnhandledPromiseRejection:", reason);
                    Toast.show({ type: "error", text1: "Lỗi", text2: reason?.message || String(reason) });
                } catch { }
            };

            try {
                anyWindow.addEventListener?.("unhandledrejection", trackingHandler);
            } catch { }
            try {
                const oldRejection = (anyWindow as any).onunhandledrejection;
                (anyWindow as any).onunhandledrejection = (e: any) => {
                    trackingHandler(e);
                    if (typeof oldRejection === "function") oldRejection(e);
                };
            } catch { }
        }
    }
}


