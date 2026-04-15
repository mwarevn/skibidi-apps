import AppItem from "@/components/AppItem";
import LayoutScreen from "@/components/ui/LayoutScreen";
import { useTheme } from "@/hooks/use-theme-color";
import AppManagerWrapper from "@/utils/appManager";
import { openPlayStore } from "@/utils/common";
import Ionicons from "@expo/vector-icons/Ionicons";
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    AppState,
    FlatList,
    Image,
    NativeModules,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";

const { SystemModule, ShizukuModule } = NativeModules;

// ─── Widget data helpers (không liên quan state) ──────────────────────────────

async function getWidgetList(): Promise<any[]> {
    try {
        const raw = await SystemModule.getListWidgetData?.();
        if (!raw || raw === "null" || raw === "[]") return [];
        return JSON.parse(raw);
    } catch { return []; }
}

async function saveWidgetList(list: any[]): Promise<void> {
    await SystemModule.setListWidgetData(JSON.stringify(list));
}

/** Patch 1 app trong widget data theo packageName */
async function patchWidgetEntry(packageName: string, changes: Record<string, any>): Promise<void> {
    const list = await getWidgetList();
    const idx = list.findIndex((a: any) => a.packageName === packageName);
    if (idx === -1) return; // không có trong widget, bỏ qua
    list[idx] = { ...list[idx], ...changes };
    await saveWidgetList(list);
}

/** Xóa app ra khỏi widget data */
async function deleteWidgetEntry(packageName: string): Promise<void> {
    const list = await getWidgetList();
    const next = list.filter((a: any) => a.packageName !== packageName);
    if (next.length === list.length) return; // không có, bỏ qua
    await saveWidgetList(next);
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AppsScreen() {
    const theme = useTheme();

    // ─── State ────────────────────────────────────────────────────────────────
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({ disabled: false, system: false, inWidget: false });

    const [widgetAppsSet, setWidgetAppsSet] = useState<Set<string>>(new Set());

    // packages đang xử lý — hiển thị spinner trên từng item
    const [pendingPkgs, setPendingPkgs] = useState<Set<string>>(new Set());

    const [selectedApps, setSelectedApps] = useState<any[]>([]);
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);

    const [shizukuAvailable, setShizukuAvailable] = useState<boolean | null>(null);
    const [shizukuHasPermission, setShizukuHasPermission] = useState(false);

    const [rootMode, setRootMode] = useState(false);

    const bottomSheetRef = useRef<BottomSheet>(null);
    const listRef = useRef<FlatList<any> | null>(null);
    const hasCheckedShizuku = useRef(false);

    // ─── Pending helpers ──────────────────────────────────────────────────────
    const addPending = useCallback((pkgs: string[]) => {
        setPendingPkgs((prev) => { const s = new Set(prev); pkgs.forEach((p) => s.add(p)); return s; });
    }, []);

    const removePending = useCallback((pkgs: string[]) => {
        setPendingPkgs((prev) => { const s = new Set(prev); pkgs.forEach((p) => s.delete(p)); return s; });
    }, []);

    // ─── Optimistic state helpers ─────────────────────────────────────────────
    /** Cập nhật 1 app trong list ngay lập tức (không reload toàn bộ) */
    const patchApp = useCallback((packageName: string, changes: Record<string, any>) => {
        setApps((prev) =>
            prev.map((a) => (a.packageName === packageName ? { ...a, ...changes } : a))
        );
    }, []);

    /** Xóa app khỏi list ngay lập tức */
    const removeApp = useCallback((packageName: string) => {
        setApps((prev) => prev.filter((a) => a.packageName !== packageName));
        // Đồng bộ widget: xóa luôn nếu có
        deleteWidgetEntry(packageName).catch(() => {});
        setWidgetAppsSet((prev) => { const s = new Set(prev); s.delete(packageName); return s; });
    }, []);

    // ─── App list loader ──────────────────────────────────────────────────────
    const loadApps = useCallback(async (showLoading = false) => {
        try {
            if (showLoading) setLoading(true);
            const list: any[] = await SystemModule.getAllApps();
            setApps(list);

            // Sync widget data với thông tin app mới nhất
            const widgetList = await getWidgetList();
            if (widgetList.length > 0) {
                const merged = widgetList.map((wa: any) => {
                    const fresh = list.find((a) => a.packageName === wa.packageName);
                    return fresh ? { ...wa, ...fresh } : wa;
                });
                await saveWidgetList(merged);
                setWidgetAppsSet(new Set(merged.map((a: any) => a.packageName)));
            } else {
                setWidgetAppsSet(new Set());
            }
        } catch (e) {
            console.error("loadApps error:", e);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    // ─── Widget state ─────────────────────────────────────────────────────────
    const addToWidget = useCallback(async (itemData: any) => {
        if (widgetAppsSet.has(itemData.packageName)) {
            Toast.show({ type: "info", text1: "Đã có", text2: "App này đã trong widget" });
            return;
        }
        const list = await getWidgetList();
        const map = new Map(list.map((a: any) => [a.packageName, a]));
        map.set(itemData.packageName, itemData);
        await saveWidgetList(Array.from(map.values()));
        setWidgetAppsSet((prev) => { const s = new Set(prev); s.add(itemData.packageName); return s; });
        Toast.show({ type: "success", text1: "Hoàn tất", text2: "Đã thêm vào widget" });
    }, [widgetAppsSet]);

    const removeFromWidget = useCallback(async (packageName: string, silent = false) => {
        await deleteWidgetEntry(packageName);
        setWidgetAppsSet((prev) => { const s = new Set(prev); s.delete(packageName); return s; });
        if (!silent) Toast.show({ type: "success", text1: "Hoàn tất", text2: "Đã xóa khỏi widget" });
    }, []);

    // ─── Single-app actions (từ BottomSheet) ──────────────────────────────────
    const doDisable = useCallback(async (app: any) => {
        const pkg = app.packageName;
        addPending([pkg]);
        closeSheet();
        try {
            await AppManagerWrapper.disablePackage(pkg, rootMode);
            patchApp(pkg, { enabled: false });
            await patchWidgetEntry(pkg, { enabled: false });
            Toast.show({ type: "success", text1: "Hoàn tất", text2: `Đã vô hiệu hoá ${app.appName}` });
        } catch {
            Toast.show({ type: "error", text1: "Lỗi", text2: `Không thể vô hiệu hoá ${app.appName}` });
        } finally {
            removePending([pkg]);
        }
    }, [addPending, removePending, patchApp, rootMode]);

    const doEnable = useCallback(async (app: any) => {
        const pkg = app.packageName;
        addPending([pkg]);
        closeSheet();
        try {
            await AppManagerWrapper.enablePackage(pkg, rootMode);
            patchApp(pkg, { enabled: true });
            await patchWidgetEntry(pkg, { enabled: true });
            Toast.show({ type: "success", text1: "Hoàn tất", text2: `Đã bật lại ${app.appName}` });
        } catch {
            Toast.show({ type: "error", text1: "Lỗi", text2: `Không thể bật ${app.appName}` });
        } finally {
            removePending([pkg]);
        }
    }, [addPending, removePending, patchApp, rootMode]);

    const doForceStop = useCallback(async (app: any) => {
        const pkg = app.packageName;
        addPending([pkg]);
        closeSheet();
        try {
            await AppManagerWrapper.forceStopPackage(pkg, rootMode);
            Toast.show({ type: "success", text1: "Hoàn tất", text2: `Đã dừng ${app.appName}` });
        } catch {
            Toast.show({ type: "error", text1: "Lỗi", text2: `Không thể dừng ${app.appName}` });
        } finally {
            removePending([pkg]);
        }
    }, [addPending, removePending, rootMode]);

    /** Thực thi disable từ uninstall dialog */
    const doDisableFromUninstall = useCallback(async (app: any) => {
        const pkg = app.packageName;
        addPending([pkg]);
        try {
            await AppManagerWrapper.disablePackage(pkg, rootMode);
            patchApp(pkg, { enabled: false });
            await patchWidgetEntry(pkg, { enabled: false });
            Toast.show({ type: "success", text1: "Đã vô hiệu hoá", text2: app.appName });
        } catch {
            Toast.show({ type: "error", text1: "Lỗi", text2: `Không thể disable ${app.appName}` });
        } finally {
            removePending([pkg]);
        }
    }, [addPending, removePending, patchApp, rootMode]);

    /** Force uninstall: thử mọi cách để xóa hoàn toàn (root hoặc Shizuku) */
    const doForceUninstall = useCallback(async (app: any) => {
        const pkg = app.packageName;
        addPending([pkg]);
        try {
            const result = rootMode
                ? await AppManagerWrapper.root.forceUninstallPackage(pkg)
                : await AppManagerWrapper.shizuku.forceUninstallPackage(pkg);
            if (!result.success) {
                Toast.show({ type: "error", text1: "Không thể gỡ hoàn toàn", text2: result.error });
                return;
            }
            removeApp(pkg);
            Toast.show({ type: "success", text1: "Đã gỡ hoàn toàn", text2: app.appName });
        } catch {
            Toast.show({ type: "error", text1: "Lỗi", text2: `Force uninstall thất bại với ${app.appName}` });
        } finally {
            removePending([pkg]);
        }
    }, [addPending, removePending, removeApp, rootMode]);

    const doUninstall = useCallback(async (app: any) => {
        const pkg = app.packageName;

        // Root mode: hiển thị dialog lựa chọn
        if (rootMode) {
            closeSheet();
            Alert.alert(
                "Gỡ cài đặt (Root)",
                `Chọn phương thức gỡ cho "${app.appName}":`,
                [
                    { text: "Huỷ", style: "cancel" },
                    {
                        text: "Disable",
                        style: "default",
                        onPress: () => doDisableFromUninstall(app),
                    },
                    {
                        text: "Force Uninstall",
                        style: "destructive",
                        onPress: () => doForceUninstall(app),
                    },
                ]
            );
            return;
        }

        // Shizuku mode: cũng hiển thị dialog lựa chọn
        closeSheet();
        Alert.alert(
            "Gỡ cài đặt",
            `Chọn phương thức gỡ cho "${app.appName}":`,
            [
                { text: "Huỷ", style: "cancel" },
                {
                    text: "Disable",
                    style: "default",
                    onPress: () => doDisableFromUninstall(app),
                },
                {
                    text: "Force Uninstall",
                    style: "destructive",
                    onPress: () => doForceUninstall(app),
                },
            ]
        );
    }, [addPending, removePending, removeApp, patchApp, rootMode, doDisableFromUninstall, doForceUninstall]);

    // ─── Batch actions ────────────────────────────────────────────────────────
    /**
     * Chạy action đồng loạt — mỗi app độc lập nhau:
     * - Hiển thị spinner riêng trên từng item
     * - Lỗi 1 app KHÔNG dừng các app khác
     * - Cập nhật UI ngay khi từng app xong
     */
    const runBatchDisable = useCallback(async () => {
        const targets = [...selectedApps];
        setSelectedApps([]);
        addPending(targets.map((a) => a.packageName));

        const results = await Promise.allSettled(
            targets.map(async (app) => {
                try {
                    await AppManagerWrapper.disablePackage(app.packageName, rootMode);
                    patchApp(app.packageName, { enabled: false });
                    await patchWidgetEntry(app.packageName, { enabled: false });
                } finally {
                    removePending([app.packageName]);
                }
            })
        );

        const failed = results.filter((r) => r.status === "rejected").length;
        const ok = results.length - failed;
        if (failed === 0) {
            Toast.show({ type: "success", text1: `Đã disable ${ok} app` });
        } else {
            Toast.show({ type: "warn", text1: `${ok} thành công, ${failed} thất bại` });
        }
    }, [selectedApps, addPending, removePending, patchApp, rootMode]);

    const executeBatchUninstall = useCallback(async (targets: any[], strategy: "disable" | "force") => {
        addPending(targets.map((a) => a.packageName));
        let okCount = 0;
        let failedCount = 0;

        if (strategy === "disable") {
            await Promise.allSettled(
                targets.map(async (app) => {
                    try {
                        await AppManagerWrapper.disablePackage(app.packageName, rootMode);
                        patchApp(app.packageName, { enabled: false });
                        await patchWidgetEntry(app.packageName, { enabled: false });
                        okCount++;
                    } catch {
                        failedCount++;
                    } finally {
                        removePending([app.packageName]);
                    }
                })
            );
            if (failedCount === 0) {
                Toast.show({ type: "success", text1: `Đã disable ${okCount} app` });
            } else {
                Toast.show({ type: "warn", text1: `${okCount} disable được, ${failedCount} thất bại` });
            }
            return;
        }

        // Force uninstall (root hoặc Shizuku tuỳ rootMode)
        await Promise.allSettled(
            targets.map(async (app) => {
                try {
                    const result = rootMode
                        ? await AppManagerWrapper.root.forceUninstallPackage(app.packageName)
                        : await AppManagerWrapper.shizuku.forceUninstallPackage(app.packageName);
                    if (!result.success) {
                        failedCount++;
                        removePending([app.packageName]);
                        return;
                    }
                    okCount++;
                    removeApp(app.packageName);
                } catch {
                    failedCount++;
                    removePending([app.packageName]);
                }
            })
        );

        if (failedCount === 0) {
            Toast.show({ type: "success", text1: `Đã gỡ hoàn toàn ${okCount} app` });
        } else {
            const parts: string[] = [];
            if (okCount > 0)    parts.push(`${okCount} đã gỡ`);
            if (failedCount > 0) parts.push(`${failedCount} thất bại`);
            Toast.show({ type: "warn", text1: parts.join(", ") });
        }
    }, [addPending, removePending, removeApp, patchApp, rootMode]);

    const runBatchUninstall = useCallback(async () => {
        const targets = [...selectedApps];
        setSelectedApps([]);

        // Root mode: hỏi chiến lược
        if (rootMode) {
            Alert.alert(
                `Gỡ ${targets.length} app (Root)`,
                "Chọn phương thức gỡ:",
                [
                    { text: "Huỷ", style: "cancel" },
                    {
                        text: "Disable tất cả",
                        style: "default",
                        onPress: () => executeBatchUninstall(targets, "disable"),
                    },
                    {
                        text: "Force Uninstall",
                        style: "destructive",
                        onPress: () => executeBatchUninstall(targets, "force"),
                    },
                ]
            );
            return;
        }

        // Shizuku mode: cũng hiển thị dialog
        Alert.alert(
            `Gỡ ${targets.length} app`,
            "Chọn phương thức gỡ:",
            [
                { text: "Huỷ", style: "cancel" },
                {
                    text: "Disable tất cả",
                    style: "default",
                    onPress: () => executeBatchUninstall(targets, "disable"),
                },
                {
                    text: "Force Uninstall",
                    style: "destructive",
                    onPress: () => executeBatchUninstall(targets, "force"),
                },
            ]
        );
    }, [selectedApps, addPending, removePending, removeApp, rootMode, executeBatchUninstall]);

    // ─── Root mode ────────────────────────────────────────────────────────────
    const loadRootMode = useCallback(async () => {
        try { setRootMode(!!(await SystemModule.getRootMode())); } catch { /* ignore */ }
    }, []);

    const toggleRootMode = useCallback(async () => {
        if (rootMode) {
            await SystemModule.setRootMode(false);
            setRootMode(false);
            Toast.show({ type: "info", text1: "Root Mode đã tắt" });
            return;
        }
        const avail = await AppManagerWrapper.checkRootAvailable();
        if (!avail) {
            Alert.alert("Không có quyền Root", "Không tìm thấy su binary. Thiết bị chưa root hoặc Magisk chưa cấp quyền.");
            return;
        }
        Alert.alert(
            "Bật Root Mode",
            "Cho phép gỡ các app hệ thống khó gỡ. Dùng cẩn thận — gỡ sai có thể gây lỗi thiết bị.",
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Bật",
                    style: "destructive",
                    onPress: async () => {
                        await SystemModule.setRootMode(true);
                        setRootMode(true);
                        Toast.show({ type: "success", text1: "Root Mode đã bật", text2: "Uninstall dùng quyền root" });
                    },
                },
            ]
        );
    }, [rootMode]);

    // ─── Bottom sheet ─────────────────────────────────────────────────────────
    const handleSheetChanges = useCallback((index: number) => {
        if (index === -1) setSelectedApp(null);
    }, []);

    const handleOpenSheetForApp = useCallback((app: any) => {
        setSelectedApp(app);
        bottomSheetRef.current?.expand();
    }, []);

    const closeSheet = useCallback(() => {
        bottomSheetRef.current?.close();
        setSelectedApp(null);
    }, []);

    // ─── Shizuku ──────────────────────────────────────────────────────────────
    const checkShizuku = useCallback(async (showPrompts = true) => {
        try {
            const available = Boolean(await ShizukuModule.isShizukuAvailable());
            setShizukuAvailable(available);
            if (!available) {
                setShizukuHasPermission(false);
                if (showPrompts)
                    Alert.alert("Yêu cầu Shizuku", "Cài đặt Shizuku từ Play Store để sử dụng app.", [
                        { text: "Cài đặt", onPress: () => openPlayStore("moe.shizuku.privileged.api") },
                        { text: "Bỏ qua", style: "cancel" },
                    ]);
                return;
            }
            const has = Boolean(await ShizukuModule.hasPermission());
            setShizukuHasPermission(has);
            if (!has && showPrompts) {
                Alert.alert("Yêu cầu ủy quyền", "Vui lòng ủy quyền Shizuku cho ứng dụng này!", [
                    {
                        text: "Ủy quyền",
                        onPress: async () => {
                            try { await ShizukuModule.requestPermission(); } catch { /* ignore */ }
                        },
                    },
                    { text: "Bỏ qua", style: "cancel" },
                ]);
            } else if (has) {
                await AppManagerWrapper.ensureBound();
            }
        } catch {
            setShizukuAvailable(false);
            setShizukuHasPermission(false);
        }
    }, []);

    // ─── Effects ──────────────────────────────────────────────────────────────
    useEffect(() => {
        loadApps(true);
        loadRootMode();
    }, []);

    useEffect(() => {
        if (apps.length > 0 && !hasCheckedShizuku.current) {
            hasCheckedShizuku.current = true;
            checkShizuku(true);
        }
    }, [apps, checkShizuku]);

    useEffect(() => {
        const handler = (s: string) => { if (s === "active") checkShizuku(false); };
        const anyAS = AppState as any;
        const sub = anyAS.addEventListener?.("change", handler) ?? null;
        return () => { try { sub?.remove?.() ?? anyAS.removeEventListener?.("change", handler); } catch { /* ignore */ } };
    }, [checkShizuku]);

    // ─── Derived state ────────────────────────────────────────────────────────
    const filteredApps = useMemo(() => {
        let f = apps;
        if (search.trim()) {
            const q = search.toLowerCase();
            f = f.filter((a) =>
                (a.packageName || "").toLowerCase().includes(q) ||
                (a.appName || "").toLowerCase().includes(q)
            );
        }
        if (filters.disabled) f = f.filter((a) => !a.enabled);
        if (filters.system)   f = f.filter((a) => a.isSystemApp);
        if (filters.inWidget) f = f.filter((a) => widgetAppsSet.has(a.packageName));
        return f;
    }, [apps, search, filters, widgetAppsSet]);

    const allSelected = useMemo(() =>
        filteredApps.length > 0 &&
        filteredApps.every((a) => selectedApps.some((s) => s.packageName === a.packageName)),
        [filteredApps, selectedApps]
    );

    const toggleSelectAll = useCallback(() => {
        if (allSelected) {
            setSelectedApps((prev) => prev.filter((s) => !filteredApps.some((f) => f.packageName === s.packageName)));
        } else {
            setSelectedApps((prev) => {
                const next = [...prev];
                filteredApps.forEach((a) => { if (!next.some((s) => s.packageName === a.packageName)) next.push(a); });
                return next;
            });
        }
    }, [allSelected, filteredApps]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try { await loadApps(false); } finally { setRefreshing(false); }
    }, [loadApps]);

    const renderItem = useCallback(
        ({ item }: { item: any }) => (
            <AppItem
                item={item}
                setSelectedApps={setSelectedApps}
                selectedApps={selectedApps}
                onLongPress={handleOpenSheetForApp}
                isPending={pendingPkgs.has(item.packageName)}
            />
        ),
        [selectedApps, handleOpenSheetForApp, pendingPkgs]
    );

    // Status bar
    const statusColor =
        shizukuAvailable === null ? theme.scale[8]
        : shizukuAvailable ? (shizukuHasPermission ? theme.semantic.success : theme.semantic.warning)
        : theme.semantic.error;
    const statusLabel =
        shizukuAvailable === null ? "Checking Shizuku..."
        : shizukuAvailable ? (shizukuHasPermission ? "Shizuku Authorized" : "Shizuku Needs Permission")
        : "Shizuku Not Installed";

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <GestureHandlerRootView style={[styles.root, { backgroundColor: theme.scale[1] }]}>
            <LayoutScreen>

                {/* ── Header ── */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
                            <Text style={[styles.brand, { color: theme.scale[7] }]}>mwarevn</Text>
                        </View>
                        <TouchableOpacity
                            onPress={toggleRootMode}
                            style={[styles.rootToggle, {
                                backgroundColor: rootMode ? theme.semantic.error + "22" : theme.scale[3],
                            }]}
                        >
                            <Ionicons
                                name={rootMode ? "shield" : "shield-outline"}
                                size={16}
                                color={rootMode ? theme.semantic.error : theme.scale[8]}
                            />
                            <Text style={[styles.rootToggleText, { color: rootMode ? theme.semantic.error : theme.scale[8] }]}>
                                {rootMode ? "Root ON" : "Root"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Search ── */}
                <View style={styles.searchWrapper}>
                    <View style={[styles.searchBox, { backgroundColor: theme.scale[3] }]}>
                        <Ionicons name="search" size={18} color={theme.scale[7]} style={styles.searchIcon} />
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Tìm theo tên hoặc package..."
                            placeholderTextColor={theme.scale[7]}
                            style={[styles.searchInput, { color: theme.scale[10] }]}
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="search"
                        />
                        {search.length > 0 && (
                            <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
                                <Ionicons name="close-circle" size={18} color={theme.scale[7]} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={[styles.countLabel, { color: theme.scale[8] }]}>
                        {filteredApps.length} / {apps.length}
                        {pendingPkgs.size > 0 && ` · ${pendingPkgs.size} đang xử lý`}
                    </Text>
                </View>

                {/* ── Filters ── */}
                <View style={styles.filtersRow}>
                    {(["disabled", "system", "inWidget"] as const).map((key) => {
                        const labels  = { disabled: "Disabled", system: "System", inWidget: "In Widget" };
                        const icons   = { disabled: "ban", system: "settings", inWidget: "star" } as const;
                        const active  = filters[key];
                        return (
                            <TouchableOpacity
                                key={key}
                                onPress={() => setFilters((p) => ({ ...p, [key]: !p[key] }))}
                                style={[styles.filterChip, {
                                    backgroundColor: active ? theme.accent[0] : theme.scale[3],
                                }]}
                            >
                                <Ionicons name={icons[key]} size={14} color={active ? theme.accent[11] : theme.scale[8]} />
                                <Text style={[styles.filterChipText, { color: active ? theme.accent[11] : theme.scale[8] }]}>
                                    {labels[key]}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* ── List ── */}
                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={theme.scale[8]} />
                        <Text style={[styles.hint, { color: theme.scale[8] }]}>Loading apps...</Text>
                    </View>
                ) : filteredApps.length === 0 ? (
                    <View style={styles.centered}>
                        <Text style={[styles.hint, { color: theme.scale[8] }]}>
                            {apps.length === 0 ? "Không có app nào" : `Không tìm thấy "${search}"`}
                        </Text>
                    </View>
                ) : (
                    <View style={[styles.listWrapper, { paddingBottom: selectedApps.length > 0 ? 128 : 0 }]}>
                        <FlatList
                            ref={(r) => { listRef.current = r; }}
                            data={filteredApps}
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            onScroll={({ nativeEvent }) => setShowScrollTop((nativeEvent.contentOffset?.y ?? 0) > 200)}
                            scrollEventThrottle={16}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.packageName}
                            getItemLayout={(_, index) => ({ length: 62, offset: 62 * index, index })}
                            initialNumToRender={20}
                            windowSize={11}
                            removeClippedSubviews
                            maxToRenderPerBatch={20}
                        />
                    </View>
                )}

                {/* ── Scroll to top ── */}
                {showScrollTop && (
                    <TouchableOpacity
                        onPress={() => { try { listRef.current?.scrollToOffset({ offset: 0, animated: true }); } catch { /* ignore */ } }}
                        style={[styles.scrollTopBtn, { backgroundColor: theme.scale[3] }]}
                    >
                        <Ionicons name="arrow-up" color={theme.scale[10]} size={20} />
                    </TouchableOpacity>
                )}

                {/* ── Selection bar ── */}
                {selectedApps.length > 0 && (
                    <View style={[styles.selectionBar, { backgroundColor: theme.scale[2] }]}>
                        <Text style={[styles.selectionTitle, { color: theme.scale[10] }]}>
                            {selectedApps.length} đã chọn
                        </Text>
                        <View style={styles.selectionBtns}>
                            <TouchableOpacity
                                onPress={toggleSelectAll}
                                style={[styles.selBtn, { backgroundColor: theme.scale[3] }]}
                            >
                                <Ionicons name={allSelected ? "checkbox" : "square-outline"} size={18} color={theme.scale[10]} />
                                <Text style={[styles.selBtnText, { color: theme.scale[10] }]}>
                                    {allSelected ? "Bỏ chọn" : "Tất cả"}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={runBatchDisable}
                                style={[styles.selBtn, { backgroundColor: theme.scale[3] }]}
                            >
                                <Ionicons name="ban-outline" size={18} color={theme.scale[10]} />
                                <Text style={[styles.selBtnText, { color: theme.scale[10] }]}>Disable</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={runBatchUninstall}
                                style={[styles.selBtn, { backgroundColor: theme.semantic.error + "22" }]}
                            >
                                <Ionicons name="trash" size={18} color={theme.semantic.error} />
                                <Text style={[styles.selBtnText, { color: theme.semantic.error }]}>
                                    {rootMode ? "Force Xóa" : "Xóa"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* ── Bottom Sheet ── */}
                <BottomSheet
                    index={-1}
                    detached
                    enablePanDownToClose
                    enableDynamicSizing
                    snapPoints={[200, "58%"]}
                    ref={bottomSheetRef}
                    onChange={handleSheetChanges}
                    animationConfigs={{ duration: 200 }}
                    backgroundStyle={{ backgroundColor: theme.scale[2] }}
                    handleIndicatorStyle={{ backgroundColor: theme.scale[5] }}
                    backdropComponent={useCallback(
                        (props: BottomSheetBackdropProps) => (
                            <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
                        ),
                        []
                    )}
                >
                    <BottomSheetView style={styles.sheetContent}>
                        {selectedApp ? (
                            <View style={styles.sheetInner}>
                                {/* App icon + info */}
                                {selectedApp.iconBase64 && (
                                    <View style={styles.sheetIconRow}>
                                        <Image
                                            source={{ uri: `data:image/png;base64,${selectedApp.iconBase64}` }}
                                            style={styles.sheetIcon}
                                        />
                                    </View>
                                )}
                                <Text style={[styles.sheetAppName, { color: theme.scale[11] }]}>
                                    {selectedApp.appName}
                                </Text>
                                <Text style={[styles.sheetPkg, { color: theme.scale[8] }]}>
                                    {selectedApp.packageName}
                                </Text>

                                {/* Disable / Enable */}
                                <View style={styles.sheetRow}>
                                    <TouchableOpacity
                                        onPress={() => doDisable(selectedApp)}
                                        style={[styles.sheetBtn, { backgroundColor: theme.scale[3], flex: 1, marginRight: 8 }]}
                                    >
                                        <Ionicons name="ban-outline" size={18} color={theme.scale[9]} />
                                        <Text style={[styles.sheetBtnText, { color: theme.scale[10] }]}>Disable</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => doEnable(selectedApp)}
                                        style={[styles.sheetBtn, { backgroundColor: theme.scale[3], flex: 1 }]}
                                    >
                                        <Ionicons name="checkmark-circle-outline" size={18} color={theme.semantic.success} />
                                        <Text style={[styles.sheetBtnText, { color: theme.scale[10] }]}>Enable</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Force Stop */}
                                <TouchableOpacity
                                    onPress={() => doForceStop(selectedApp)}
                                    style={[styles.sheetBtn, { backgroundColor: theme.semantic.warning + "22" }]}
                                >
                                    <Ionicons name="stop-circle-outline" size={18} color={theme.semantic.warning} />
                                    <Text style={[styles.sheetBtnText, { color: theme.semantic.warning }]}>Force Stop</Text>
                                </TouchableOpacity>

                                {/* Widget toggle */}
                                <TouchableOpacity
                                    onPress={async () => {
                                        const pkg = selectedApp?.packageName;
                                        if (!pkg) return;
                                        closeSheet();
                                        if (widgetAppsSet.has(pkg)) {
                                            await removeFromWidget(pkg);
                                        } else {
                                            await addToWidget(selectedApp);
                                        }
                                    }}
                                    style={[styles.sheetBtn, { backgroundColor: theme.scale[3] }]}
                                >
                                    <Ionicons
                                        name={widgetAppsSet.has(selectedApp?.packageName) ? "star" : "star-outline"}
                                        size={18}
                                        color={theme.scale[9]}
                                    />
                                    <Text style={[styles.sheetBtnText, { color: theme.scale[10] }]}>
                                        {widgetAppsSet.has(selectedApp?.packageName) ? "Xóa khỏi Widget" : "Thêm vào Widget"}
                                    </Text>
                                </TouchableOpacity>

                                {/* Uninstall */}
                                <TouchableOpacity
                                    onPress={() => doUninstall(selectedApp)}
                                    style={[styles.sheetBtn, { backgroundColor: theme.semantic.error + "22" }]}
                                >
                                    <Ionicons name="trash-outline" size={18} color={theme.semantic.error} />
                                    <Text style={[styles.sheetBtnText, { color: theme.semantic.error }]}>
                                        {rootMode ? "Force Uninstall (Root)" : "Uninstall"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <Text style={{ color: theme.scale[8], padding: 24 }}>Không có app được chọn</Text>
                        )}
                    </BottomSheetView>
                </BottomSheet>

            </LayoutScreen>
        </GestureHandlerRootView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1 },

    // Header
    header:        { marginTop: 20, marginHorizontal: 20, marginBottom: 4 },
    headerTop:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    statusLabel:   { fontWeight: "700", fontSize: 17 },
    brand:         { fontSize: 11, fontWeight: "500", marginTop: 2 },
    rootToggle:    { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, minHeight: 36 },
    rootToggleText:{ fontSize: 13, fontWeight: "600" },

    // Search
    searchWrapper: { marginHorizontal: 20, marginTop: 20, marginBottom: 4 },
    searchBox:     { flexDirection: "row", alignItems: "center", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, minHeight: 44 },
    searchIcon:    { marginRight: 8 },
    searchInput:   { flex: 1, fontSize: 14, padding: 0, margin: 0 },
    countLabel:    { fontSize: 11, marginTop: 6, marginLeft: 4 },

    // Filters
    filtersRow:      { flexDirection: "row", marginHorizontal: 20, marginTop: 10, marginBottom: 8, gap: 8 },
    filterChip:      { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, gap: 6, minHeight: 36 },
    filterChipText:  { fontSize: 12, fontWeight: "500" },

    // States
    centered:  { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
    hint:      { fontSize: 14 },
    listWrapper: { flex: 1, paddingHorizontal: 12 },

    // Scroll to top
    scrollTopBtn: { position: "absolute", right: 16, bottom: 16, borderRadius: 999, width: 44, height: 44, alignItems: "center", justifyContent: "center" },

    // Selection bar
    selectionBar:  { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingVertical: 14, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    selectionTitle:{ fontSize: 13, fontWeight: "600", textAlign: "center", marginBottom: 10 },
    selectionBtns: { flexDirection: "row", justifyContent: "space-around", gap: 8 },
    selBtn:        { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, gap: 6, minHeight: 44 },
    selBtnText:    { fontSize: 13, fontWeight: "600" },

    // Bottom Sheet
    sheetContent:  { flex: 1, alignItems: "center", paddingBottom: 24 },
    sheetInner:    { width: "100%", paddingHorizontal: 20, gap: 10 },
    sheetIconRow:  { alignItems: "center", marginBottom: 4 },
    sheetIcon:     { width: 64, height: 64, borderRadius: 16 },
    sheetAppName:  { fontWeight: "700", fontSize: 17, textAlign: "center" },
    sheetPkg:      { fontSize: 12, textAlign: "center", marginBottom: 4 },
    sheetRow:      { flexDirection: "row" },
    sheetBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, paddingHorizontal: 20, borderRadius: 999, gap: 8, minHeight: 48 },
    sheetBtnText:  { fontWeight: "600", fontSize: 15, textAlign: "center" },
});
