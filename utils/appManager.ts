import { NativeModules } from "react-native";

const { ShizukuModule, AppManager, AppManagerBinder, RootModule } = NativeModules as any;

// ─── Shizuku / AppManager (ADB-level) ────────────────────────────────────────

const DEFAULT_TIMEOUT = 10000;
const POLL_INTERVAL   = 500;

async function ensureShizukuPermission(): Promise<boolean> {
    try {
        const has = await ShizukuModule.hasPermission();
        if (has) return true;
        const granted = await ShizukuModule.requestPermission();
        return !!granted;
    } catch {
        return false;
    }
}

async function triggerBind(): Promise<void> {
    try {
        if (AppManagerBinder?.binService) {
            await AppManagerBinder.binService();
        }
    } catch (err) {
        console.warn("triggerBind failed:", err);
    }
}

function isShizukuModulePresent(): boolean {
    return !!(AppManager && typeof AppManager.disablePackage === "function");
}

export async function ensureBound(timeout = DEFAULT_TIMEOUT): Promise<boolean> {
    const start = Date.now();
    const ok = await ensureShizukuPermission();
    if (!ok) return false;

    try {
        await triggerBind();
        return true;
    } catch { /* ignore */ }

    // fallback polling (in case bind fires but promise rejects)
    return new Promise((resolve) => {
        const tick = () => {
            if (isShizukuModulePresent()) return resolve(true);
            if (Date.now() - start > timeout) return resolve(false);
            setTimeout(tick, POLL_INTERVAL);
        };
        tick();
    });
}

async function callShizuku(method: string, pkg: string) {
    if (!pkg || !pkg.trim()) throw new Error("Invalid package name");
    if (!AppManager?.[method]) throw new Error("Shizuku AppManager not available");
    return AppManager[method](pkg);
}

// ─── Root (trực tiếp từ app process, không qua Shizuku) ─────────────────────

async function callRoot(method: string, pkg?: string): Promise<any> {
    if (!RootModule) throw new Error("RootModule not available");

    if (method === "checkRootAvailable") {
        return RootModule.checkRootAvailable();
    }

    if (!pkg || !pkg.trim()) throw new Error("Invalid package name");
    if (typeof RootModule[method] !== "function") throw new Error(`RootModule.${method} not found`);
    return RootModule[method](pkg);
}

// ─── Unified wrapper ──────────────────────────────────────────────────────────

export type UninstallResult =
    | { success: true;  strategy: "full" | "user" | "keepdata" | "disabled" }
    | { success: false; error: string };

export type ForceUninstallResult =
    | { success: true;  strategy: "full" | "user" | "keepdata" }
    | { success: false; error: string };

/**
 * Parse kết quả từ RootModule.uninstallPackage:
 *   "ok:full:..."      → thành công, gỡ hoàn toàn
 *   "ok:user:..."      → thành công, gỡ cho user
 *   "ok:keepdata:..."  → thành công, giữ data
 *   "disabled:..."     → fallback disable (không xóa được APK)
 */
function parseRootUninstallResult(raw: string): UninstallResult {
    if (raw.startsWith("ok:full:"))     return { success: true,  strategy: "full" };
    if (raw.startsWith("ok:user:"))     return { success: true,  strategy: "user" };
    if (raw.startsWith("ok:keepdata:")) return { success: true,  strategy: "keepdata" };
    if (raw.startsWith("disabled:"))    return { success: true,  strategy: "disabled" };
    return { success: true, strategy: "full" };
}

export const AppManagerWrapper = {
    ensureBound,

    // ── Shizuku methods ──────────────────────────────────────────────────────
    shizuku: {
        disablePackage:   (pkg: string) => callShizuku("disablePackage",   pkg),
        enablePackage:    (pkg: string) => callShizuku("enablePackage",    pkg),
        forceStopPackage: (pkg: string) => callShizuku("forceStopPackage", pkg),
        uninstallPackage: (pkg: string) => callShizuku("uninstallPackage", pkg),
        /**
         * Force-uninstall qua ADB shell (Shizuku): revoke permissions → remove device-admin
         * → multi-strategy pm uninstall → cmd package uninstall.
         * Không fallback về disabled. Không cần root.
         */
        forceUninstallPackage: async (pkg: string): Promise<ForceUninstallResult> => {
            try {
                await callShizuku("forceUninstallPackage", pkg);
                return { success: true, strategy: "full" };
            } catch (e: any) {
                return { success: false, error: e?.message ?? String(e) };
            }
        },
    },

    // ── Root methods (không qua Shizuku) ─────────────────────────────────────
    root: {
        checkAvailable:   ():            Promise<boolean> => callRoot("checkRootAvailable").catch(() => false),
        disablePackage:   (pkg: string) => callRoot("disablePackage",   pkg),
        enablePackage:    (pkg: string) => callRoot("enablePackage",    pkg),
        forceStopPackage: (pkg: string) => callRoot("forceStopPackage", pkg),
        uninstallPackage: async (pkg: string): Promise<UninstallResult> => {
            try {
                const raw: string = await callRoot("uninstallPackage", pkg);
                return parseRootUninstallResult(raw);
            } catch (e: any) {
                return { success: false, error: e?.message ?? String(e) };
            }
        },
        /**
         * Force uninstall: thử mọi cách để xóa hoàn toàn (mount remount, delete APK trực tiếp...).
         * Không bao giờ fallback về "disabled" — nếu không xóa được thì trả về { success: false }.
         */
        forceUninstallPackage: async (pkg: string): Promise<ForceUninstallResult> => {
            try {
                const raw: string = await callRoot("forceUninstallPackage", pkg);
                if (raw.startsWith("ok:full:"))     return { success: true, strategy: "full" };
                if (raw.startsWith("ok:user:"))     return { success: true, strategy: "user" };
                if (raw.startsWith("ok:keepdata:")) return { success: true, strategy: "keepdata" };
                return { success: false, error: raw };
            } catch (e: any) {
                return { success: false, error: e?.message ?? String(e) };
            }
        },
    },

    // ── Convenience — chọn đúng backend theo rootMode ────────────────────────
    disablePackage:   (pkg: string, rootMode: boolean) =>
        rootMode ? callRoot("disablePackage", pkg) : callShizuku("disablePackage", pkg),

    enablePackage:    (pkg: string, rootMode: boolean) =>
        rootMode ? callRoot("enablePackage", pkg) : callShizuku("enablePackage", pkg),

    forceStopPackage: (pkg: string, rootMode: boolean) =>
        rootMode ? callRoot("forceStopPackage", pkg) : callShizuku("forceStopPackage", pkg),

    uninstallPackage: (pkg: string, rootMode: boolean) =>
        rootMode ? AppManagerWrapper.root.uninstallPackage(pkg) : callShizuku("uninstallPackage", pkg),

    checkRootAvailable: (): Promise<boolean> => AppManagerWrapper.root.checkAvailable(),
};

export default AppManagerWrapper;
