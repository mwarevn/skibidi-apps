package com.mwarevn.skibidiapps.react.modules;

import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * RootModule — thực thi lệnh root TRỰC TIẾP từ process của app (không qua Shizuku).
 *
 * Magisk/SuperSU cấp quyền cho process này, không bị giới hạn như ADB shell.
 * Dùng khi Shizuku không đủ quyền để gỡ app cứng đầu.
 */
public class RootModule extends ReactContextBaseJavaModule {

    private static final String TAG = "RootModule";
    private static final long TIMEOUT_SEC = 30;

    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    public RootModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "RootModule";
    }

    // ─── Internal helpers ──────────────────────────────────────────────────────

    /** Tìm đường dẫn su khả dụng */
    private String findSu() {
        String[] candidates = { "su", "/system/bin/su", "/system/xbin/su", "/sbin/su", "/magisk/.core/bin/su" };
        for (String s : candidates) {
            try {
                Process p = Runtime.getRuntime().exec(new String[]{s, "-c", "id"});
                boolean done = p.waitFor(3, TimeUnit.SECONDS);
                int exit = done ? p.exitValue() : -1;
                p.destroy();
                if (exit == 0) return s;
            } catch (Exception ignored) {}
        }
        return null;
    }

    /**
     * Chạy lệnh shell qua su.
     *
     * @param suBin đường dẫn su binary
     * @param cmd   lệnh shell đầy đủ (ví dụ: "pm uninstall com.example.app")
     * @return stdout + stderr của lệnh
     * @throws Exception nếu timeout hoặc exit code != 0
     */
    private String runAsRoot(String suBin, String cmd) throws Exception {
        Log.i(TAG, "runAsRoot: " + cmd);
        Process process = Runtime.getRuntime().exec(new String[]{suBin, "-c", cmd});

        StringBuilder out = new StringBuilder();
        // Đọc stdout và stderr song song để tránh deadlock khi buffer đầy
        Thread stderrReader = new Thread(() -> {
            try (BufferedReader err = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
                String line;
                while ((line = err.readLine()) != null) {
                    synchronized (out) { out.append(line).append('\n'); }
                }
            } catch (Exception ignored) {}
        });
        stderrReader.start();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = br.readLine()) != null) {
                synchronized (out) { out.append(line).append('\n'); }
            }
        }
        stderrReader.join(5000);

        boolean finished = process.waitFor(TIMEOUT_SEC, TimeUnit.SECONDS);
        if (!finished) {
            process.destroy();
            throw new Exception("Command timed out (" + TIMEOUT_SEC + "s): " + cmd);
        }

        int exit = process.exitValue();
        process.destroy();

        String output = out.toString().trim();
        Log.i(TAG, "exit=" + exit + " output=" + output);

        if (exit != 0) {
            throw new Exception("Command failed (exit " + exit + "): " + output);
        }
        // Một số Android version exit 0 nhưng output chứa "Failure [..."
        if (output.startsWith("Failure [") || output.startsWith("Failure\n")) {
            throw new Exception("Command reported failure: " + output);
        }
        return output;
    }

    /** Lấy đường dẫn APK của package để xóa thủ công */
    private String getApkPath(String suBin, String packageName) {
        try {
            String out = runAsRoot(suBin, "pm path " + packageName);
            // output: "package:/system/priv-app/Foo/Foo.apk"
            if (out.startsWith("package:")) {
                return out.substring("package:".length()).trim();
            }
        } catch (Exception ignored) {}
        return null;
    }

    // ─── Public API ────────────────────────────────────────────────────────────

    @ReactMethod
    public void checkRootAvailable(Promise promise) {
        // Chạy trên main-ish thread vì chỉ check nhanh
        executor.execute(() -> {
            try {
                String su = findSu();
                promise.resolve(su != null);
            } catch (Exception e) {
                promise.resolve(false);
            }
        });
    }

    /**
     * Gỡ app với nhiều chiến lược leo thang:
     *  1. pm uninstall <pkg>               — gỡ hoàn toàn (nếu được)
     *  2. pm uninstall --user 0 <pkg>      — gỡ cho user hiện tại
     *  3. pm uninstall -k --user 0 <pkg>   — giữ data, gỡ APK binding
     *  4. pm disable-user --user 0 <pkg>   — vô hiệu hoá hoàn toàn (fallback)
     *
     * Giữa các bước: thử revoke device admin nếu app là device owner.
     */
    @ReactMethod
    public void uninstallPackage(String packageName, Promise promise) {
        if (packageName == null || packageName.trim().isEmpty()) {
            promise.reject("INVALID_PKG", "Package name is required");
            return;
        }

        executor.execute(() -> {
            String su = findSu();
            if (su == null) {
                promise.reject("NO_ROOT", "Root not available (su not found)");
                return;
            }

            // Thử revoke device admin trước với nhiều receiver name phổ biến
            String[] adminReceivers = {
                ".DeviceAdminReceiver", ".receiver.DeviceAdminReceiver",
                ".admin.DeviceAdminReceiver", ".DeviceAdmin"
            };
            for (String receiver : adminReceivers) {
                try { runAsRoot(su, "dpm remove-active-admin --user 0 " + packageName + receiver); } catch (Exception ignored) {}
            }
            // force-stop trước để release lock
            try { runAsRoot(su, "am force-stop " + packageName); } catch (Exception ignored) {}

            // Strategy 1 — full uninstall
            try {
                String r = runAsRoot(su, "pm uninstall " + packageName);
                promise.resolve("ok:full:" + r);
                return;
            } catch (Exception e) {
                Log.w(TAG, "Strategy 1 failed: " + e.getMessage());
            }

            // Strategy 2 — user uninstall (ẩn app với user 0, APK còn trong /system)
            try {
                String r = runAsRoot(su, "pm uninstall --user 0 " + packageName);
                promise.resolve("ok:user:" + r);
                return;
            } catch (Exception e) {
                Log.w(TAG, "Strategy 2 failed: " + e.getMessage());
            }

            // Strategy 3 — keep-data uninstall
            try {
                String r = runAsRoot(su, "pm uninstall -k --user 0 " + packageName);
                promise.resolve("ok:keepdata:" + r);
                return;
            } catch (Exception e) {
                Log.w(TAG, "Strategy 3 failed: " + e.getMessage());
            }

            // Strategy 4 — xóa APK trực tiếp (mount remount /system)
            try {
                String apkPath = getApkPath(su, packageName);
                if (apkPath != null) {
                    // Lấy thư mục chứa APK (xóa cả folder)
                    String apkDir = apkPath.contains("/") ? apkPath.substring(0, apkPath.lastIndexOf('/')) : apkPath;
                    // Xác định partition cần remount
                    String partition = apkPath.startsWith("/system") ? "/system"
                                     : apkPath.startsWith("/vendor") ? "/vendor"
                                     : apkPath.startsWith("/product") ? "/product"
                                     : null;
                    if (partition != null) {
                        try { runAsRoot(su, "mount -o remount,rw " + partition); } catch (Exception ignored) {}
                    }
                    runAsRoot(su, "rm -rf \"" + apkDir + "\"");
                    if (partition != null) {
                        try { runAsRoot(su, "mount -o remount,ro " + partition); } catch (Exception ignored) {}
                    }
                    // Thông báo package manager cập nhật
                    try { runAsRoot(su, "pm clear " + packageName); } catch (Exception ignored) {}
                    promise.resolve("ok:full:deleted_apk");
                    return;
                }
            } catch (Exception e) {
                Log.w(TAG, "Strategy 4 (delete APK) failed: " + e.getMessage());
            }

            // Strategy 5 — disable-user (last resort, không xóa APK)
            try {
                String r = runAsRoot(su, "pm disable-user --user 0 " + packageName);
                // Resolve với prefix "disabled:" để JS biết đây là fallback
                promise.resolve("disabled:" + r);
            } catch (Exception e) {
                Log.e(TAG, "All strategies failed for " + packageName);
                promise.reject("UNINSTALL_FAILED", "Không thể gỡ " + packageName + ": " + e.getMessage());
            }
        });
    }

    /**
     * Force-uninstall mạnh nhất có thể — KHÔNG bao giờ fallback về disabled.
     *
     * Chiến lược leo thang:
     *  1. Revoke device admin triệt để (mọi user, mọi receiver phổ biến)
     *  2. pm uninstall                      — full uninstall
     *  3. pm uninstall --user 0             — user-space uninstall
     *  4. pm uninstall -k --user 0          — keep-data uninstall
     *  5. cmd package uninstall             — dùng cmd thay pm (Android 10+)
     *  6. Xóa APK/OAT/ODEX trực tiếp       — remount partition rw → rm -rf
     *  7. Nếu tất cả thất bại → reject (không disable)
     */
    @ReactMethod
    public void forceUninstallPackage(String packageName, Promise promise) {
        if (packageName == null || packageName.trim().isEmpty()) {
            promise.reject("INVALID_PKG", "Package name is required");
            return;
        }

        executor.execute(() -> {
            String su = findSu();
            if (su == null) {
                promise.reject("NO_ROOT", "Root not available (su not found)");
                return;
            }

            // ── Step 0: revoke device-admin từ mọi user + mọi receiver phổ biến ──
            String[] adminReceivers = {
                ".DeviceAdminReceiver", ".receiver.DeviceAdminReceiver",
                ".admin.DeviceAdminReceiver", ".DeviceAdmin",
                ".MDMDeviceAdminReceiver", ".policy.DeviceAdminReceiver"
            };
            // Lấy danh sách user trên thiết bị
            String[] users = {"0", "10", "11", "12", "999"};
            for (String user : users) {
                for (String receiver : adminReceivers) {
                    try { runAsRoot(su, "dpm remove-active-admin --user " + user + " " + packageName + receiver); } catch (Exception ignored) {}
                }
            }
            // Revoke mọi quyền nguy hiểm để app không kháng cự
            try { runAsRoot(su, "pm revoke " + packageName + " android.permission.BIND_DEVICE_ADMIN"); } catch (Exception ignored) {}
            try { runAsRoot(su, "appops set " + packageName + " RUN_IN_BACKGROUND ignore"); } catch (Exception ignored) {}

            // ── Step 1: force-stop + kill ──
            try { runAsRoot(su, "am force-stop " + packageName); } catch (Exception ignored) {}
            try { runAsRoot(su, "am kill " + packageName); } catch (Exception ignored) {}
            // Thêm 300ms cho process kịp die
            try { Thread.sleep(300); } catch (InterruptedException ignored) {}

            // ── Strategy 1 — full uninstall ──
            try {
                String r = runAsRoot(su, "pm uninstall " + packageName);
                promise.resolve("ok:full:" + r);
                return;
            } catch (Exception e) { Log.w(TAG, "force S1 failed: " + e.getMessage()); }

            // ── Strategy 2 — user uninstall ──
            try {
                String r = runAsRoot(su, "pm uninstall --user 0 " + packageName);
                promise.resolve("ok:user:" + r);
                return;
            } catch (Exception e) { Log.w(TAG, "force S2 failed: " + e.getMessage()); }

            // ── Strategy 3 — keep-data ──
            try {
                String r = runAsRoot(su, "pm uninstall -k --user 0 " + packageName);
                promise.resolve("ok:keepdata:" + r);
                return;
            } catch (Exception e) { Log.w(TAG, "force S3 failed: " + e.getMessage()); }

            // ── Strategy 4 — cmd package (Android 10+) ──
            try {
                String r = runAsRoot(su, "cmd package uninstall " + packageName);
                promise.resolve("ok:full:" + r);
                return;
            } catch (Exception e) { Log.w(TAG, "force S4 (cmd) failed: " + e.getMessage()); }

            // ── Strategy 5 — xóa APK + OAT/ODEX trực tiếp ──
            try {
                String apkPath = getApkPath(su, packageName);
                if (apkPath == null) {
                    // Thử tìm qua dumpsys
                    try {
                        String dump = runAsRoot(su, "dumpsys package " + packageName + " | grep codePath");
                        if (dump.contains("codePath=")) {
                            apkPath = dump.split("codePath=")[1].split("\n")[0].trim() + "/base.apk";
                        }
                    } catch (Exception ignored) {}
                }

                if (apkPath != null) {
                    String apkDir = apkPath.contains("/")
                        ? apkPath.substring(0, apkPath.lastIndexOf('/'))
                        : apkPath;

                    // Xác định partition để remount
                    String[] partitions = {"/system", "/vendor", "/product", "/system_ext", "/apex", "/data"};
                    String matchedPartition = null;
                    for (String p : partitions) {
                        if (apkPath.startsWith(p)) { matchedPartition = p; break; }
                    }

                    if (matchedPartition != null) {
                        try { runAsRoot(su, "mount -o remount,rw " + matchedPartition); } catch (Exception ignored) {}
                    }

                    // Xóa APK dir
                    runAsRoot(su, "rm -rf \"" + apkDir + "\"");

                    // Xóa OAT/ODEX tương ứng (nếu có)
                    String pkgSimple = packageName.replace(".", "_");
                    String[] oatPaths = {
                        "/data/dalvik-cache/arm64/" + pkgSimple,
                        "/data/dalvik-cache/arm/" + pkgSimple,
                        "/system/app/" + pkgSimple,
                        "/system/priv-app/" + pkgSimple,
                        apkDir.replace("/app/", "/app/oat/") ,
                        apkDir + "/oat"
                    };
                    for (String oat : oatPaths) {
                        try { runAsRoot(su, "rm -rf \"" + oat + "\""); } catch (Exception ignored) {}
                    }

                    // Remount lại readonly
                    if (matchedPartition != null) {
                        try { runAsRoot(su, "mount -o remount,ro " + matchedPartition); } catch (Exception ignored) {}
                    }

                    // Thông báo PM cập nhật + clear data thừa
                    try { runAsRoot(su, "pm clear " + packageName); } catch (Exception ignored) {}
                    try { runAsRoot(su, "pm trim-caches 9999999999"); } catch (Exception ignored) {}
                    try { runAsRoot(su, "cmd package reconcileSecondaryDexFiles " + packageName); } catch (Exception ignored) {}

                    promise.resolve("ok:full:deleted_apk");
                    return;
                }
            } catch (Exception e) {
                Log.w(TAG, "force S5 (delete APK) failed: " + e.getMessage());
            }

            // ── Tất cả thất bại — không disable, báo lỗi ──
            Log.e(TAG, "forceUninstall: all strategies failed for " + packageName);
            promise.reject("FORCE_UNINSTALL_FAILED",
                "Không thể gỡ hoàn toàn " + packageName + ". APK có thể được bảo vệ bởi system hoặc DM-verity.");
        });
    }

    @ReactMethod
    public void disablePackage(String packageName, Promise promise) {
        executor.execute(() -> {
            String su = findSu();
            if (su == null) { promise.reject("NO_ROOT", "Root not available"); return; }
            try {
                String r = runAsRoot(su, "pm disable-user --user 0 " + packageName);
                promise.resolve(r);
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }

    @ReactMethod
    public void enablePackage(String packageName, Promise promise) {
        executor.execute(() -> {
            String su = findSu();
            if (su == null) { promise.reject("NO_ROOT", "Root not available"); return; }
            try {
                String r = runAsRoot(su, "pm enable --user 0 " + packageName);
                promise.resolve(r);
            } catch (Exception e) {
                // Thử không có --user
                try {
                    String r = runAsRoot(su, "pm enable " + packageName);
                    promise.resolve(r);
                } catch (Exception e2) {
                    promise.reject("ERROR", e2.getMessage());
                }
            }
        });
    }

    @ReactMethod
    public void clearData(String packageName, Promise promise) {
        executor.execute(() -> {
            String su = findSu();
            if (su == null) { promise.reject("NO_ROOT", "Root not available"); return; }
            try {
                String r = runAsRoot(su, "pm clear " + packageName);
                promise.resolve(r);
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }

    @ReactMethod
    public void forceStopPackage(String packageName, Promise promise) {
        executor.execute(() -> {
            String su = findSu();
            if (su == null) { promise.reject("NO_ROOT", "Root not available"); return; }
            try {
                // force-stop + revoke permissions để triệt để hơn
                runAsRoot(su, "am force-stop " + packageName);
                try { runAsRoot(su, "appops reset " + packageName); } catch (Exception ignored) {}
                promise.resolve("ok");
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }
}
