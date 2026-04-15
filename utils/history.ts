import { NativeModules } from "react-native";

const { SystemModule } = NativeModules;

export type HistoryAction =
    | "disable"
    | "enable"
    | "force_stop"
    | "uninstall"
    | "force_uninstall"
    | "extract_apk"
    | "protect"
    | "unprotect";

export interface HistoryEntry {
    id: string;
    timestamp: number;
    action: HistoryAction;
    packageName: string;
    appName: string;
    success: boolean;
    detail?: string;
}

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export async function logHistory(
    action: HistoryAction,
    packageName: string,
    appName: string,
    success: boolean,
    detail?: string
): Promise<void> {
    try {
        const entry: HistoryEntry = {
            id: generateId(),
            timestamp: Date.now(),
            action,
            packageName,
            appName,
            success,
            detail,
        };
        await SystemModule.addHistoryEntry(JSON.stringify(entry));
    } catch {
        // không block action chính nếu log lỗi
    }
}

export async function getHistory(): Promise<HistoryEntry[]> {
    try {
        const raw = await SystemModule.getHistory();
        if (!raw || raw === "[]") return [];
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

export async function clearHistory(): Promise<void> {
    await SystemModule.clearHistory();
}

export const ACTION_LABEL: Record<HistoryAction, string> = {
    disable:       "Vô hiệu hoá",
    enable:        "Bật lại",
    force_stop:    "Force Stop",
    uninstall:     "Gỡ cài đặt",
    force_uninstall: "Force Uninstall",
    extract_apk:   "Trích xuất APK",
    protect:       "Bảo vệ",
    unprotect:     "Bỏ bảo vệ",
};

export const ACTION_ICON: Record<HistoryAction, string> = {
    disable:       "ban",
    enable:        "checkmark-circle",
    force_stop:    "stop-circle",
    uninstall:     "trash",
    force_uninstall: "nuclear",
    extract_apk:   "download",
    protect:       "shield-checkmark",
    unprotect:     "shield-outline",
};
