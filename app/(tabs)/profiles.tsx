import LayoutScreen from "@/components/ui/LayoutScreen";
import { useTheme } from "@/hooks/use-theme-color";
import AppManagerWrapper from "@/utils/appManager";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    NativeModules,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";

const { SystemModule } = NativeModules;

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProfileAction = "disable" | "enable" | "force_stop" | "clear_data";

export interface AppProfile {
    id: string;
    name: string;
    icon: string;
    packages: string[];        // package names
    appNames: Record<string, string>; // packageName → appName (để hiển thị)
    action: ProfileAction;
    description?: string;
}

interface InstalledApp {
    appName: string;
    packageName: string;
    iconBase64?: string;
    isSystemApp: boolean;
    enabled: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROFILE_ICONS = [
    "game-controller", "briefcase", "bed", "fitness", "school",
    "car", "home", "heart", "star", "musical-notes",
    "camera", "book", "cafe", "airplane", "moon", "glasses",
];

const ACTIONS: { key: ProfileAction; label: string; icon: string; color: "error" | "success" | "warning" }[] = [
    { key: "disable",     label: "Disable",      icon: "ban-outline",          color: "error"   },
    { key: "enable",      label: "Enable",        icon: "checkmark-circle-outline", color: "success" },
    { key: "force_stop",  label: "Force Stop",    icon: "stop-circle-outline",  color: "warning" },
    { key: "clear_data",  label: "Clear Data",    icon: "trash-outline",        color: "warning" },
];

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ─── App Picker Modal ─────────────────────────────────────────────────────────

interface AppPickerProps {
    visible: boolean;
    selectedPkgs: Set<string>;
    onConfirm: (selected: InstalledApp[]) => void;
    onClose: () => void;
}

function AppPickerModal({ visible, selectedPkgs, onConfirm, onClose }: AppPickerProps) {
    const theme = useTheme();
    const [apps, setApps] = useState<InstalledApp[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [picked, setPicked] = useState<Set<string>>(new Set(selectedPkgs));
    const [filterSystem, setFilterSystem] = useState(false);

    // Load khi mở
    const load = useCallback(async () => {
        if (apps.length > 0) return;
        setLoading(true);
        try {
            const list: InstalledApp[] = await SystemModule.getAllApps();
            setApps(list.sort((a: InstalledApp, b: InstalledApp) => a.appName.localeCompare(b.appName)));
        } catch {
            Toast.show({ type: "error", text1: "Không thể tải danh sách app" });
        } finally {
            setLoading(false);
        }
    }, [apps.length]);

    useFocusEffect(useCallback(() => {
        if (visible) { setPicked(new Set(selectedPkgs)); load(); }
    }, [visible, selectedPkgs, load]));

    // Reset picked khi mở lại
    React.useEffect(() => {
        if (visible) setPicked(new Set(selectedPkgs));
    }, [visible]);

    const filtered = useMemo(() => {
        let f = apps;
        if (filterSystem) f = f.filter((a) => a.isSystemApp);
        if (search.trim()) {
            const q = search.toLowerCase();
            f = f.filter((a) =>
                a.appName.toLowerCase().includes(q) ||
                a.packageName.toLowerCase().includes(q)
            );
        }
        return f;
    }, [apps, search, filterSystem]);

    const toggle = useCallback((pkg: string) => {
        setPicked((prev) => {
            const next = new Set(prev);
            if (next.has(pkg)) next.delete(pkg); else next.add(pkg);
            return next;
        });
    }, []);

    const handleConfirm = useCallback(() => {
        const selected = apps.filter((a) => picked.has(a.packageName));
        onConfirm(selected);
    }, [apps, picked, onConfirm]);

    const renderApp = useCallback(({ item }: { item: InstalledApp }) => {
        const sel = picked.has(item.packageName);
        return (
            <TouchableOpacity
                onPress={() => toggle(item.packageName)}
                style={[styles.pickerItem, { backgroundColor: sel ? theme.scale[3] : "transparent" }]}
                activeOpacity={0.7}
            >
                {item.iconBase64 ? (
                    <Image source={{ uri: `data:image/png;base64,${item.iconBase64}` }} style={styles.pickerIcon} />
                ) : (
                    <View style={[styles.pickerIcon, { backgroundColor: theme.scale[3] }]} />
                )}
                <View style={styles.pickerText}>
                    <Text style={[styles.pickerName, { color: theme.scale[11] }]} numberOfLines={1}>
                        {item.appName}
                    </Text>
                    <Text style={[styles.pickerPkg, { color: theme.scale[7] }]} numberOfLines={1}>
                        {item.packageName}
                    </Text>
                </View>
                <Ionicons
                    name={sel ? "checkbox" : "square-outline"}
                    size={22}
                    color={sel ? theme.scale[11] : theme.scale[5]}
                />
            </TouchableOpacity>
        );
    }, [picked, toggle, theme]);

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={[styles.pickerRoot, { backgroundColor: theme.scale[1] }]}>
                {/* Header */}
                <View style={[styles.pickerHeader, { borderBottomColor: theme.scale[3] }]}>
                    <TouchableOpacity onPress={onClose} hitSlop={8}>
                        <Ionicons name="close" size={24} color={theme.scale[9]} />
                    </TouchableOpacity>
                    <Text style={[styles.pickerTitle, { color: theme.scale[11] }]}>
                        Chọn app
                    </Text>
                    <TouchableOpacity onPress={handleConfirm}>
                        <Text style={[styles.pickerDone, { color: theme.scale[11] }]}>
                            Xong ({picked.size})
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Search + filter */}
                <View style={styles.pickerSearchRow}>
                    <View style={[styles.pickerSearchBox, { backgroundColor: theme.scale[3], flex: 1 }]}>
                        <Ionicons name="search" size={16} color={theme.scale[7]} style={{ marginRight: 6 }} />
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Tìm app..."
                            placeholderTextColor={theme.scale[6]}
                            style={[styles.pickerSearchInput, { color: theme.scale[11] }]}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {search.length > 0 && (
                            <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
                                <Ionicons name="close-circle" size={16} color={theme.scale[6]} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity
                        onPress={() => setFilterSystem((v) => !v)}
                        style={[styles.pickerFilterBtn, {
                            backgroundColor: filterSystem ? theme.semantic.warning + "33" : theme.scale[3],
                        }]}
                    >
                        <Text style={[styles.pickerFilterText, {
                            color: filterSystem ? theme.semantic.warning : theme.scale[8],
                        }]}>System</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.pickerCount, { color: theme.scale[7] }]}>
                    {filtered.length} app · {picked.size} đã chọn
                </Text>

                {loading ? (
                    <View style={styles.pickerLoading}>
                        <ActivityIndicator color={theme.scale[8]} />
                    </View>
                ) : (
                    <FlatList
                        data={filtered}
                        keyExtractor={(item) => item.packageName}
                        renderItem={renderApp}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
                        getItemLayout={(_, index) => ({ length: 64, offset: 64 * index, index })}
                        initialNumToRender={20}
                        windowSize={7}
                        removeClippedSubviews
                    />
                )}
            </SafeAreaView>
        </Modal>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfilesScreen() {
    const theme = useTheme();
    const [profiles, setProfiles] = useState<AppProfile[]>([]);
    const [running, setRunning] = useState<string | null>(null);

    // Form
    const [showForm, setShowForm] = useState(false);
    const [formName, setFormName] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formAction, setFormAction] = useState<ProfileAction>("disable");
    const [formIcon, setFormIcon] = useState("briefcase");
    const [formApps, setFormApps] = useState<InstalledApp[]>([]);

    // App picker
    const [pickerVisible, setPickerVisible] = useState(false);

    // ── Data ──────────────────────────────────────────────────────────────────

    const loadProfiles = useCallback(async () => {
        try {
            const raw = await SystemModule.getProfiles();
            setProfiles(raw && raw !== "[]" ? JSON.parse(raw) : []);
        } catch { setProfiles([]); }
    }, []);

    const saveProfiles = useCallback(async (list: AppProfile[]) => {
        await SystemModule.saveProfiles(JSON.stringify(list));
        setProfiles(list);
    }, []);

    useFocusEffect(useCallback(() => { loadProfiles(); }, [loadProfiles]));

    // ── Form helpers ──────────────────────────────────────────────────────────

    const resetForm = useCallback(() => {
        setFormName(""); setFormDesc(""); setFormAction("disable");
        setFormIcon("briefcase"); setFormApps([]);
    }, []);

    const openForm = useCallback(() => { resetForm(); setShowForm(true); }, [resetForm]);
    const closeForm = useCallback(() => { setShowForm(false); resetForm(); }, [resetForm]);

    const handlePickerConfirm = useCallback((selected: InstalledApp[]) => {
        setFormApps(selected);
        setPickerVisible(false);
    }, []);

    const removeFormApp = useCallback((pkg: string) => {
        setFormApps((prev) => prev.filter((a) => a.packageName !== pkg));
    }, []);

    const handleCreate = useCallback(async () => {
        if (!formName.trim()) {
            Toast.show({ type: "error", text1: "Tên profile không được trống" });
            return;
        }
        if (formApps.length === 0) {
            Toast.show({ type: "error", text1: "Chọn ít nhất 1 app" });
            return;
        }
        const appNames: Record<string, string> = {};
        formApps.forEach((a) => { appNames[a.packageName] = a.appName; });

        const profile: AppProfile = {
            id: generateId(),
            name: formName.trim(),
            icon: formIcon,
            packages: formApps.map((a) => a.packageName),
            appNames,
            action: formAction,
            description: formDesc.trim() || undefined,
        };
        await saveProfiles([...profiles, profile]);
        closeForm();
        Toast.show({ type: "success", text1: "Đã tạo profile", text2: formName.trim() });
    }, [formName, formDesc, formAction, formIcon, formApps, profiles, saveProfiles, closeForm]);

    // ── Run profile ───────────────────────────────────────────────────────────

    const handleRun = useCallback(async (profile: AppProfile) => {
        if (running) return;
        const actionCfg = ACTIONS.find((a) => a.key === profile.action)!;
        Alert.alert(
            `Chạy "${profile.name}"`,
            `${actionCfg.label} ${profile.packages.length} app?`,
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Chạy",
                    style: profile.action === "disable" || profile.action === "clear_data" ? "destructive" : "default",
                    onPress: async () => {
                        setRunning(profile.id);
                        let ok = 0, fail = 0;
                        let rootMode = false;
                        try { rootMode = !!(await SystemModule.getRootMode()); } catch {}

                        await Promise.allSettled(
                            profile.packages.map(async (pkg) => {
                                try {
                                    switch (profile.action) {
                                        case "disable":    await AppManagerWrapper.disablePackage(pkg, rootMode);    break;
                                        case "enable":     await AppManagerWrapper.enablePackage(pkg, rootMode);     break;
                                        case "force_stop": await AppManagerWrapper.forceStopPackage(pkg, rootMode);  break;
                                        case "clear_data": await AppManagerWrapper.clearData(pkg, rootMode);         break;
                                    }
                                    ok++;
                                } catch { fail++; }
                            })
                        );
                        setRunning(null);
                        if (fail === 0) {
                            Toast.show({ type: "success", text1: `"${profile.name}" hoàn tất`, text2: `${ok} app` });
                        } else {
                            Toast.show({ type: "warn", text1: `${ok} thành công, ${fail} thất bại` });
                        }
                    },
                },
            ]
        );
    }, [running]);

    // ── Delete ────────────────────────────────────────────────────────────────

    const handleDelete = useCallback((id: string) => {
        const p = profiles.find((x) => x.id === id);
        Alert.alert("Xóa profile", `Xóa "${p?.name}"?`, [
            { text: "Hủy", style: "cancel" },
            {
                text: "Xóa", style: "destructive",
                onPress: async () => {
                    await saveProfiles(profiles.filter((x) => x.id !== id));
                    Toast.show({ type: "success", text1: "Đã xóa profile" });
                },
            },
        ]);
    }, [profiles, saveProfiles]);

    // ── Render profile card ───────────────────────────────────────────────────

    const renderProfile = useCallback(({ item }: { item: AppProfile }) => {
        const isRunning = running === item.id;
        const actionCfg = ACTIONS.find((a) => a.key === item.action)!;
        const actionColor = theme.semantic[actionCfg.color];
        const appList = item.packages
            .slice(0, 3)
            .map((pkg) => item.appNames?.[pkg] || pkg)
            .join(", ");
        const extra = item.packages.length > 3 ? ` +${item.packages.length - 3}` : "";

        return (
            <View style={[styles.card, { backgroundColor: theme.scale[2] }]}>
                <View style={[styles.cardIconBox, { backgroundColor: actionColor + "22" }]}>
                    <Ionicons name={item.icon as any} size={24} color={actionColor} />
                </View>

                <View style={styles.cardBody}>
                    <Text style={[styles.cardName, { color: theme.scale[11] }]}>{item.name}</Text>
                    {item.description ? (
                        <Text style={[styles.cardDesc, { color: theme.scale[8] }]} numberOfLines={1}>
                            {item.description}
                        </Text>
                    ) : null}
                    <Text style={[styles.cardApps, { color: theme.scale[7] }]} numberOfLines={1}>
                        {appList}{extra}
                    </Text>
                    <View style={styles.cardMeta}>
                        <View style={[styles.actionBadge, { backgroundColor: actionColor + "22" }]}>
                            <Ionicons name={actionCfg.icon as any} size={11} color={actionColor} />
                            <Text style={[styles.actionBadgeText, { color: actionColor }]}>
                                {actionCfg.label}
                            </Text>
                        </View>
                        <Text style={[styles.countText, { color: theme.scale[7] }]}>
                            {item.packages.length} app
                        </Text>
                    </View>
                </View>

                <View style={styles.cardActions}>
                    <TouchableOpacity
                        onPress={() => handleRun(item)}
                        disabled={isRunning || !!running}
                        style={[styles.iconBtn, {
                            backgroundColor: actionColor + (isRunning ? "44" : "22"),
                            opacity: running && !isRunning ? 0.4 : 1,
                        }]}
                    >
                        <Ionicons
                            name={isRunning ? "hourglass-outline" : "play"}
                            size={17}
                            color={actionColor}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleDelete(item.id)}
                        style={[styles.iconBtn, { backgroundColor: theme.scale[3] }]}
                    >
                        <Ionicons name="trash-outline" size={15} color={theme.scale[7]} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }, [theme, running, handleRun, handleDelete]);

    // ── Form picker selected apps chips ───────────────────────────────────────

    const selectedPkgSet = useMemo(() => new Set(formApps.map((a) => a.packageName)), [formApps]);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <LayoutScreen>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.title, { color: theme.scale[11] }]}>Profiles</Text>
                    <Text style={[styles.subtitle, { color: theme.scale[8] }]}>
                        Nhóm app — thực thi 1 chạm
                    </Text>
                </View>
                {!showForm ? (
                    <TouchableOpacity
                        onPress={openForm}
                        style={[styles.addBtn, { backgroundColor: theme.scale[3] }]}
                    >
                        <Ionicons name="add" size={22} color={theme.scale[10]} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPress={closeForm}
                        style={[styles.addBtn, { backgroundColor: theme.scale[3] }]}
                    >
                        <Ionicons name="close" size={22} color={theme.scale[10]} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Create Form */}
            {showForm && (
                <ScrollView
                    style={[styles.form, { backgroundColor: theme.scale[2] }]}
                    contentContainerStyle={styles.formContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Tên */}
                    <Text style={[styles.label, { color: theme.scale[9] }]}>Tên profile</Text>
                    <TextInput
                        value={formName}
                        onChangeText={setFormName}
                        placeholder="Ví dụ: Gaming Mode"
                        placeholderTextColor={theme.scale[6]}
                        style={[styles.input, { backgroundColor: theme.scale[3], color: theme.scale[11] }]}
                    />

                    {/* Mô tả */}
                    <Text style={[styles.label, { color: theme.scale[9] }]}>Mô tả (tuỳ chọn)</Text>
                    <TextInput
                        value={formDesc}
                        onChangeText={setFormDesc}
                        placeholder="Mô tả ngắn..."
                        placeholderTextColor={theme.scale[6]}
                        style={[styles.input, { backgroundColor: theme.scale[3], color: theme.scale[11] }]}
                    />

                    {/* Action */}
                    <Text style={[styles.label, { color: theme.scale[9] }]}>Hành động</Text>
                    <View style={styles.actionGrid}>
                        {ACTIONS.map((a) => {
                            const active = formAction === a.key;
                            const color = theme.semantic[a.color];
                            return (
                                <TouchableOpacity
                                    key={a.key}
                                    onPress={() => setFormAction(a.key)}
                                    style={[
                                        styles.actionOption,
                                        { backgroundColor: active ? color + "33" : theme.scale[3] },
                                    ]}
                                >
                                    <Ionicons name={a.icon as any} size={18} color={active ? color : theme.scale[7]} />
                                    <Text style={[styles.actionOptionText, { color: active ? color : theme.scale[8] }]}>
                                        {a.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Icon */}
                    <Text style={[styles.label, { color: theme.scale[9] }]}>Icon</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.iconRow}>
                            {PROFILE_ICONS.map((ic) => (
                                <TouchableOpacity
                                    key={ic}
                                    onPress={() => setFormIcon(ic)}
                                    style={[
                                        styles.iconChip,
                                        { backgroundColor: formIcon === ic ? theme.scale[5] : theme.scale[3] },
                                    ]}
                                >
                                    <Ionicons
                                        name={ic as any}
                                        size={20}
                                        color={formIcon === ic ? theme.scale[11] : theme.scale[7]}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    {/* App picker */}
                    <View style={styles.labelRow}>
                        <Text style={[styles.label, { color: theme.scale[9] }]}>
                            App ({formApps.length} đã chọn)
                        </Text>
                        <TouchableOpacity
                            onPress={() => setPickerVisible(true)}
                            style={[styles.pickBtn, { backgroundColor: theme.scale[3] }]}
                        >
                            <Ionicons name="apps-outline" size={14} color={theme.scale[8]} />
                            <Text style={[styles.pickBtnText, { color: theme.scale[8] }]}>Chọn app</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Selected chips */}
                    {formApps.length > 0 && (
                        <View style={styles.chipWrap}>
                            {formApps.map((a) => (
                                <View key={a.packageName} style={[styles.chip, { backgroundColor: theme.scale[3] }]}>
                                    {a.iconBase64 ? (
                                        <Image
                                            source={{ uri: `data:image/png;base64,${a.iconBase64}` }}
                                            style={styles.chipIcon}
                                        />
                                    ) : null}
                                    <Text style={[styles.chipText, { color: theme.scale[10] }]} numberOfLines={1}>
                                        {a.appName}
                                    </Text>
                                    <TouchableOpacity onPress={() => removeFormApp(a.packageName)} hitSlop={6}>
                                        <Ionicons name="close-circle" size={15} color={theme.scale[6]} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}

                    {formApps.length === 0 && (
                        <TouchableOpacity
                            onPress={() => setPickerVisible(true)}
                            style={[styles.emptyPickerBtn, { backgroundColor: theme.scale[3] }]}
                        >
                            <Ionicons name="add-circle-outline" size={20} color={theme.scale[7]} />
                            <Text style={[styles.emptyPickerText, { color: theme.scale[7] }]}>
                                Nhấn để chọn app từ danh sách
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Submit */}
                    <TouchableOpacity
                        onPress={handleCreate}
                        style={[styles.createBtn, { backgroundColor: theme.scale[10] }]}
                    >
                        <Text style={[styles.createBtnText, { color: theme.scale[1] }]}>Tạo Profile</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}

            {/* Profile list */}
            {!showForm && (
                profiles.length === 0 ? (
                    <View style={styles.empty}>
                        <Ionicons name="layers-outline" size={56} color={theme.scale[4]} />
                        <Text style={[styles.emptyTitle, { color: theme.scale[7] }]}>Chưa có profile nào</Text>
                        <TouchableOpacity
                            onPress={openForm}
                            style={[styles.emptyCreate, { backgroundColor: theme.scale[3] }]}
                        >
                            <Ionicons name="add" size={16} color={theme.scale[9]} />
                            <Text style={[styles.emptyCreateText, { color: theme.scale[9] }]}>Tạo profile đầu tiên</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={profiles}
                        keyExtractor={(item) => item.id}
                        renderItem={renderProfile}
                        contentContainerStyle={styles.list}
                    />
                )
            )}

            {/* App picker modal */}
            <AppPickerModal
                visible={pickerVisible}
                selectedPkgs={selectedPkgSet}
                onConfirm={handlePickerConfirm}
                onClose={() => setPickerVisible(false)}
            />
        </LayoutScreen>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    // Header
    header:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 20, marginTop: 20, marginBottom: 14 },
    title:    { fontSize: 22, fontWeight: "700" },
    subtitle: { fontSize: 12, marginTop: 2 },
    addBtn:   { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },

    // Form
    form:        { marginHorizontal: 16, borderRadius: 20, marginBottom: 8, maxHeight: "75%" },
    formContent: { padding: 16, paddingBottom: 24 },
    label:       { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginTop: 14 },
    labelRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14, marginBottom: 8 },
    input:       { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14 },

    // Action grid
    actionGrid:       { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    actionOption:     { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, minWidth: "45%", flex: 1 },
    actionOptionText: { fontSize: 13, fontWeight: "600" },

    // Icon picker
    iconRow:  { flexDirection: "row", gap: 8, paddingVertical: 4 },
    iconChip: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },

    // App picker button
    pickBtn:     { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
    pickBtnText: { fontSize: 12, fontWeight: "600" },

    // Selected app chips
    chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
    chip:     { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, maxWidth: 160 },
    chipIcon: { width: 18, height: 18, borderRadius: 4 },
    chipText: { fontSize: 12, fontWeight: "500", flex: 1 },

    // Empty picker placeholder
    emptyPickerBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 18 },
    emptyPickerText: { fontSize: 13 },

    // Submit
    createBtn:     { borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 20 },
    createBtnText: { fontWeight: "700", fontSize: 15 },

    // Profile card
    list:         { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
    card:         { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 18, gap: 12 },
    cardIconBox:  { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
    cardBody:     { flex: 1 },
    cardName:     { fontSize: 15, fontWeight: "600" },
    cardDesc:     { fontSize: 12, marginTop: 1 },
    cardApps:     { fontSize: 11, marginTop: 3 },
    cardMeta:     { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
    actionBadge:  { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
    actionBadgeText: { fontSize: 11, fontWeight: "600" },
    countText:    { fontSize: 11 },
    cardActions:  { gap: 8 },
    iconBtn:      { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },

    // Empty state
    empty:           { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    emptyTitle:      { fontSize: 15, fontWeight: "500" },
    emptyCreate:     { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, marginTop: 4 },
    emptyCreateText: { fontSize: 14, fontWeight: "500" },

    // App picker modal
    pickerRoot:      { flex: 1 },
    pickerHeader:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 },
    pickerTitle:     { fontSize: 17, fontWeight: "700" },
    pickerDone:      { fontSize: 15, fontWeight: "700" },
    pickerSearchRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, marginTop: 12, marginBottom: 6 },
    pickerSearchBox: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
    pickerSearchInput:{ flex: 1, fontSize: 14, padding: 0 },
    pickerFilterBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
    pickerFilterText:{ fontSize: 12, fontWeight: "600" },
    pickerCount:     { fontSize: 11, marginHorizontal: 20, marginBottom: 6 },
    pickerLoading:   { flex: 1, alignItems: "center", justifyContent: "center" },
    pickerItem:      { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 8, borderRadius: 12, height: 64 },
    pickerIcon:      { width: 40, height: 40, borderRadius: 10, marginRight: 12 },
    pickerText:      { flex: 1, marginRight: 8 },
    pickerName:      { fontSize: 14, fontWeight: "500" },
    pickerPkg:       { fontSize: 11, marginTop: 2 },
});
