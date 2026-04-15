/**
 * Danh sách bloatware phổ biến theo nhà sản xuất.
 * Dùng để highlight app trong danh sách.
 */
export const BLOATWARE_PACKAGES = new Set<string>([
    // ── Samsung ──────────────────────────────────────────────────────────────
    "com.samsung.android.bixby.agent",
    "com.samsung.android.bixby.wakeup",
    "com.samsung.android.bixbyvision.framework",
    "com.samsung.android.app.tips",
    "com.samsung.android.game.gamehome",
    "com.samsung.android.game.gos",
    "com.samsung.android.game.gametools",
    "com.samsung.android.kidsinstaller",
    "com.samsung.android.scloud",
    "com.samsung.android.app.spage",  // Samsung Daily
    "com.samsung.android.livesticker",
    "com.samsung.android.app.watchmanagerstub",
    "com.samsung.android.mobileservice",
    "com.samsung.android.messaging",
    "com.samsung.android.dialer",
    "com.samsung.android.email.provider",
    "com.samsung.android.calendar",
    "com.samsung.android.app.reminder",
    "com.samsung.android.shortcutbackupservice",
    "com.samsung.android.beaconmanager",
    "com.samsung.android.smartcallprovider",
    "com.samsung.android.aremoji",
    "com.samsung.android.arzone",
    "com.samsung.android.dressroom",
    "com.samsung.android.sticker",
    "com.samsung.android.coreapps",
    "com.samsung.systemui.bixby2",

    // ── Xiaomi / MIUI ─────────────────────────────────────────────────────
    "com.miui.analytics",
    "com.miui.msa.global",
    "com.xiaomi.mipicks",
    "com.xiaomi.gamecenter.sdk.service",
    "com.miui.daemon",
    "com.miui.weather2",
    "com.miui.cleanmaster",
    "com.miui.powerkeeper",
    "com.miui.yellowpage",
    "com.miui.hybrid",
    "com.miui.hybrid.accessory",
    "com.miui.bugreport",
    "com.xiaomi.miplay_client",
    "com.miui.videoplayer",
    "com.miui.player",
    "com.miui.notes",
    "com.miui.gallery",
    "com.miui.compass",
    "com.mi.globalbrowser",
    "com.miui.calculator",
    "com.miui.scanner",
    "com.xiaomi.joyose",
    "com.miui.contentcatcher",
    "com.miui.catcherpatch",
    "cn.wps.xiaomi.abroad.lite",

    // ── OPPO / ColorOS ────────────────────────────────────────────────────
    "com.oppo.market",
    "com.coloros.ocrscanner",
    "com.coloros.note",
    "com.coloros.weather2",
    "com.coloros.calculator",
    "com.coloros.compass2",
    "com.coloros.soundrecorder",
    "com.heytap.browser",
    "com.heytap.cloud",
    "com.heytap.mcs",
    "com.nearme.gamecenter",
    "com.heytap.themestore",

    // ── Vivo / FuntouchOS ─────────────────────────────────────────────────
    "com.vivo.appstore",
    "com.vivo.game",
    "com.vivo.browser",
    "com.bbk.theme",

    // ── Huawei / EMUI ─────────────────────────────────────────────────────
    "com.huawei.appmarket",
    "com.huawei.browser",
    "com.huawei.music",
    "com.huawei.video",
    "com.huawei.hitouch",
    "com.huawei.hifolder",
    "com.huawei.android.thememanager",

    // ── Google bloatware ──────────────────────────────────────────────────
    "com.google.android.youtube",
    "com.google.android.apps.youtube.music",
    "com.google.android.apps.tachyon",   // Google Meet
    "com.google.android.apps.subscriptions.red",  // Google One
    "com.google.android.apps.photos",
    "com.google.android.googlequicksearchbox",
    "com.google.android.projection.gearhead",
    "com.google.android.as",             // Android System Intelligence
    "com.google.android.apps.googleassistant",

    // ── Meta ──────────────────────────────────────────────────────────────
    "com.facebook.katana",
    "com.facebook.system",
    "com.facebook.services",
    "com.facebook.appmanager",
    "com.instagram.android",
    "com.whatsapp",

    // ── Microsoft ─────────────────────────────────────────────────────────
    "com.microsoft.skydrive",
    "com.microsoft.office.outlook",
    "com.microsoft.teams",
    "com.linkedin.android",
]);

export function isBloatware(packageName: string): boolean {
    return BLOATWARE_PACKAGES.has(packageName);
}
