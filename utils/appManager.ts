import { NativeModules } from "react-native";

const { ShizukuModule, AppManager, AppManagerBinder } = NativeModules as any;

const DEFAULT_TIMEOUT = 10000;
const POLL_INTERVAL = 500;

async function ensureShizukuPermission(): Promise<boolean> {
    try {
        const has = await ShizukuModule.hasPermission();
        if (has) return true;
        const granted = await ShizukuModule.requestPermission();
        return !!granted;
    } catch (err) {
        console.warn("Shizuku permission check failed", err);
        return false;
    }
}

async function triggerBind(): Promise<void> {
    try {
        // prefer calling the lightweight binder if present
        if (AppManagerBinder && typeof AppManagerBinder.binService === "function") {
            AppManagerBinder.binService();
            return;
        }

        if (!AppManager) return;
        // fallback: call binService on AppManager (legacy)
        AppManager.binService && AppManager.binService();
    } catch (err) {
        console.warn("Error triggering AppManager.bindService", err);
    }
}

function isAppManagerReady(): boolean {
    // Heuristic: AppManager exists and has the methods we expect
    return !!(AppManager && typeof AppManager.disablePackage === "function");
}

export async function ensureBound(timeout = DEFAULT_TIMEOUT): Promise<boolean> {
    const start = Date.now();

    const ok = await ensureShizukuPermission();
    if (!ok) return false;

    // trigger a bind attempt
    await triggerBind();

    // poll until AppManager methods are available or timeout
    return new Promise((resolve) => {
        const tick = async () => {
            if (isAppManagerReady()) return resolve(true);
            if (Date.now() - start > timeout) return resolve(false);
            // try triggering again occasionally
            await triggerBind();
            setTimeout(tick, POLL_INTERVAL);
        };
        tick();
    });
}

async function callSafe(method: string, ...args: any[]) {
    // basic validation: most methods expect a non-empty package name as first arg
    const pkg = args && args.length > 0 ? args[0] : null;
    if (typeof pkg !== "string" || pkg.trim() === "") {
        throw new Error("Invalid package name");
    }

    if (!isAppManagerReady()) {
        const bound = await ensureBound();
        if (!bound) throw new Error("AppManager not ready");
    }

    if (!AppManager || typeof AppManager[method] !== "function") throw new Error("Method not available");

    return AppManager[method](...args);
}

export const AppManagerWrapper = {
    ensureBound,
    disablePackage: (pkg: string) => callSafe("disablePackage", pkg),
    enablePackage: (pkg: string) => callSafe("enablePackage", pkg),
    forceStopPackage: (pkg: string) => callSafe("forceStopPackage", pkg),
    uninstallPackage: (pkg: string) => callSafe("uninstallPackage", pkg),
};

export default AppManagerWrapper;
