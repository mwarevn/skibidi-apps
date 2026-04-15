package com.mwarevn.skibidiapps.react.modules;

import android.annotation.SuppressLint;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.PermissionInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;
import android.util.Base64;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.mwarevn.skibidiapps.R;
import com.mwarevn.skibidiapps.widget.Widget;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.List;

public class SystemModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public SystemModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @Override
    public String getName() {
        return "SystemModule";
    }

    private static final String PREFS_SETTINGS  = "APP_SETTINGS";
    private static final String KEY_ROOT_MODE   = "root_mode";

    @ReactMethod
    public void getMessage(Promise promise) {
        promise.resolve("Xin chào từ Java!");
    }

    @ReactMethod
    public void getRootMode(Promise promise) {
        boolean enabled = reactContext
                .getSharedPreferences(PREFS_SETTINGS, Context.MODE_PRIVATE)
                .getBoolean(KEY_ROOT_MODE, false);
        promise.resolve(enabled);
    }

    @ReactMethod
    public void setRootMode(boolean enabled, Promise promise) {
        reactContext
                .getSharedPreferences(PREFS_SETTINGS, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(KEY_ROOT_MODE, enabled)
                .apply();
        promise.resolve(true);
    }

    private void updateWidgetAfterDataChange() {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(reactContext);
        int[] ids = appWidgetManager.getAppWidgetIds(new ComponentName(reactContext, Widget.class));
        if (ids.length > 0) {
            appWidgetManager.notifyAppWidgetViewDataChanged(ids, R.id.list_view);
        }
    }

    @ReactMethod
    public void getListWidgetData(Promise promise) {
        SharedPreferences sharedPref = reactContext.getSharedPreferences("WIDGET_DATA", Context.MODE_PRIVATE);
        String jsonData = sharedPref.getString("list_items", "[]");
        promise.resolve(jsonData);
    }

    @ReactMethod
    public void setListWidgetData(String jsonData, Promise promise) {
        SharedPreferences.Editor editor = reactContext.getSharedPreferences("WIDGET_DATA", Context.MODE_PRIVATE).edit();
        editor.putString("list_items", jsonData); // jsonData là JSONArray string, ví dụ: [{"title":"Item1"}]
        editor.apply();

        promise.resolve(true);
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(
                this::updateWidgetAfterDataChange, 100);
    }

    @ReactMethod
    public void getInstalledApps(Promise promise) {
        try {
            PackageManager pm = reactContext.getPackageManager();
            List<PackageInfo> packages;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                packages = pm.getInstalledPackages(PackageManager.PackageInfoFlags.of(PackageManager.GET_META_DATA));
            } else {
                packages = pm.getInstalledPackages(PackageManager.GET_META_DATA);
            }

            WritableArray appList = Arguments.createArray();

            for (PackageInfo pkg : packages) {
                ApplicationInfo appInfo = pkg.applicationInfo;

                WritableMap appMap = Arguments.createMap();
                appMap.putString("appName", pm.getApplicationLabel(appInfo).toString());
                appMap.putString("packageName", pkg.packageName);
                appMap.putString("versionName", pkg.versionName);
                appMap.putInt("versionCode", pkg.versionCode);
                appMap.putBoolean("isSystemApp", (appInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0);
                appMap.putBoolean("isUpdatedSystemApp", (appInfo.flags & ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) != 0);
                appMap.putBoolean("enabled", appInfo.enabled);

                // ✅ Lấy icon app -> Base64
                try {
                    Drawable icon = pm.getApplicationIcon(appInfo);
                    String base64Icon = drawableToBase64(icon);
                    appMap.putString("iconBase64", base64Icon);
                } catch (Exception e) {
                    appMap.putString("iconBase64", null);
                }

                appList.pushMap(appMap);
            }

            promise.resolve(appList);

        } catch (Exception e) {
            promise.reject("ERR_GET_APPS", e);
        }
    }

    @SuppressLint("WrongConstant")
    @ReactMethod
    public void getAllApps(Promise promise) {
        try {
            PackageManager pm = reactContext.getPackageManager();
            List<PackageInfo> packages;
            @SuppressWarnings("deprecation")
            int flags = PackageManager.GET_META_DATA |
                    PackageManager.GET_DISABLED_COMPONENTS |
                    PackageManager.MATCH_ALL |
                    PackageManager.MATCH_UNINSTALLED_PACKAGES |
                    PackageManager.GET_SIGNING_CERTIFICATES;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                packages = pm.getInstalledPackages(PackageManager.PackageInfoFlags.of(flags));
            } else {
                packages = pm.getInstalledPackages(flags);
            }

            WritableArray appList = Arguments.createArray();

            for (PackageInfo pkg : packages) {
                if (pkg.applicationInfo == null) continue;

                ApplicationInfo appInfo = pkg.applicationInfo;

                WritableMap appMap = Arguments.createMap();
                String appName;
                try {
                    appName = pm.getApplicationLabel(appInfo).toString();
                } catch (Exception e) {
                    appName = pkg.packageName;
                }
                appMap.putString("appName", appName);
                appMap.putString("packageName", pkg.packageName);
                appMap.putString("versionName", pkg.versionName != null ? pkg.versionName : "N/A");
                appMap.putInt("versionCode", pkg.versionCode);
                appMap.putBoolean("isSystemApp", (appInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0);
                appMap.putBoolean("isUpdatedSystemApp", (appInfo.flags & ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) != 0);
                appMap.putBoolean("enabled", appInfo.enabled);  // Sẽ true/false cho Android Auto
                appMap.putDouble("firstInstallTime", pkg.firstInstallTime);
                appMap.putDouble("lastUpdateTime", pkg.lastUpdateTime);

                // Icon Base64
                try {
                    Drawable icon = pm.getApplicationIcon(appInfo);
                    String base64Icon = drawableToBase64(icon);
                    appMap.putString("iconBase64", base64Icon);
                } catch (Exception e) {
                    appMap.putString("iconBase64", null);
                }

                appList.pushMap(appMap);
            }

            promise.resolve(appList);

        } catch (Exception e) {
            promise.reject("ERR_GET_ALL_APPS", e.getMessage());
        }
    }

    // ─── App actions ──────────────────────────────────────────────────────────

    @ReactMethod
    public void openAppInfo(String packageName, Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.fromParts("package", packageName, null));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void launchApp(String packageName, Promise promise) {
        try {
            PackageManager pm = reactContext.getPackageManager();
            Intent intent = pm.getLaunchIntentForPackage(packageName);
            if (intent == null) {
                promise.reject("NO_LAUNCH", "App không có màn hình khởi động");
                return;
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    // ─── Permissions ──────────────────────────────────────────────────────────

    @ReactMethod
    @SuppressLint("WrongConstant")
    public void getAppPermissions(String packageName, Promise promise) {
        try {
            PackageManager pm = reactContext.getPackageManager();
            PackageInfo info;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                info = pm.getPackageInfo(packageName, PackageManager.PackageInfoFlags.of(PackageManager.GET_PERMISSIONS));
            } else {
                info = pm.getPackageInfo(packageName, PackageManager.GET_PERMISSIONS);
            }
            WritableArray result = Arguments.createArray();
            if (info.requestedPermissions != null) {
                for (int i = 0; i < info.requestedPermissions.length; i++) {
                    String perm = info.requestedPermissions[i];
                    boolean granted = (info.requestedPermissionsFlags[i]
                            & PackageInfo.REQUESTED_PERMISSION_GRANTED) != 0;
                    WritableMap map = Arguments.createMap();
                    map.putString("name", perm);
                    map.putBoolean("granted", granted);
                    // Xác định permission group (dangerous/normal)
                    try {
                        PermissionInfo pInfo = pm.getPermissionInfo(perm, 0);
                        map.putBoolean("dangerous", pInfo.protectionLevel == PermissionInfo.PROTECTION_DANGEROUS);
                    } catch (Exception ignored) {
                        map.putBoolean("dangerous", false);
                    }
                    result.pushMap(map);
                }
            }
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    // ─── Extract APK ─────────────────────────────────────────────────────────

    @ReactMethod
    public void extractApk(String packageName, Promise promise) {
        new Thread(() -> {
            try {
                PackageManager pm = reactContext.getPackageManager();
                ApplicationInfo appInfo;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    appInfo = pm.getApplicationInfo(packageName, PackageManager.ApplicationInfoFlags.of(0));
                } else {
                    appInfo = pm.getApplicationInfo(packageName, 0);
                }
                String apkSrc = appInfo.sourceDir;
                String appName = pm.getApplicationLabel(appInfo).toString()
                        .replaceAll("[^a-zA-Z0-9._\\- ]", "_").trim();
                String version = "unknown";
                try {
                    PackageInfo pi;
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        pi = pm.getPackageInfo(packageName, PackageManager.PackageInfoFlags.of(0));
                    } else {
                        pi = pm.getPackageInfo(packageName, 0);
                    }
                    version = pi.versionName != null ? pi.versionName : String.valueOf(pi.versionCode);
                } catch (Exception ignored) {}

                File destDir = new File(reactContext.getExternalFilesDir(null), "apks");
                if (!destDir.exists()) destDir.mkdirs();
                File destFile = new File(destDir, appName + "_" + version + ".apk");

                copyFile(new File(apkSrc), destFile);
                promise.resolve(destFile.getAbsolutePath());
            } catch (Exception e) {
                Log.e("SystemModule", "extractApk failed", e);
                promise.reject("ERROR", e.getMessage());
            }
        }).start();
    }

    private void copyFile(File src, File dst) throws IOException {
        try (InputStream in = new FileInputStream(src);
             OutputStream out = new FileOutputStream(dst)) {
            byte[] buf = new byte[65536];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
        }
    }

    // ─── History ─────────────────────────────────────────────────────────────

    private static final String PREFS_HISTORY    = "APP_HISTORY";
    private static final String KEY_HISTORY      = "entries";
    private static final int    MAX_HISTORY      = 300;

    @ReactMethod
    public void addHistoryEntry(String entryJson, Promise promise) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences(PREFS_HISTORY, Context.MODE_PRIVATE);
            String raw = prefs.getString(KEY_HISTORY, "[]");
            JSONArray arr = new JSONArray(raw);
            arr.put(new JSONObject(entryJson));
            // Giữ tối đa MAX_HISTORY entries (xóa entry cũ nhất)
            while (arr.length() > MAX_HISTORY) arr.remove(0);
            prefs.edit().putString(KEY_HISTORY, arr.toString()).apply();
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getHistory(Promise promise) {
        try {
            String raw = reactContext
                    .getSharedPreferences(PREFS_HISTORY, Context.MODE_PRIVATE)
                    .getString(KEY_HISTORY, "[]");
            promise.resolve(raw);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void clearHistory(Promise promise) {
        reactContext.getSharedPreferences(PREFS_HISTORY, Context.MODE_PRIVATE)
                .edit().remove(KEY_HISTORY).apply();
        promise.resolve(true);
    }

    // ─── Protected list ───────────────────────────────────────────────────────

    private static final String PREFS_PROTECTED  = "APP_PROTECTED";
    private static final String KEY_PROTECTED    = "packages";

    @ReactMethod
    public void getProtectedList(Promise promise) {
        String raw = reactContext
                .getSharedPreferences(PREFS_PROTECTED, Context.MODE_PRIVATE)
                .getString(KEY_PROTECTED, "[]");
        promise.resolve(raw);
    }

    @ReactMethod
    public void setProtectedList(String json, Promise promise) {
        reactContext.getSharedPreferences(PREFS_PROTECTED, Context.MODE_PRIVATE)
                .edit().putString(KEY_PROTECTED, json).apply();
        promise.resolve(true);
    }

    // ─── Profiles ─────────────────────────────────────────────────────────────

    private static final String PREFS_PROFILES   = "APP_PROFILES";
    private static final String KEY_PROFILES     = "profiles";

    @ReactMethod
    public void getProfiles(Promise promise) {
        String raw = reactContext
                .getSharedPreferences(PREFS_PROFILES, Context.MODE_PRIVATE)
                .getString(KEY_PROFILES, "[]");
        promise.resolve(raw);
    }

    @ReactMethod
    public void saveProfiles(String json, Promise promise) {
        reactContext.getSharedPreferences(PREFS_PROFILES, Context.MODE_PRIVATE)
                .edit().putString(KEY_PROFILES, json).apply();
        promise.resolve(true);
    }

    private String drawableToBase64(Drawable drawable) {
        if (drawable == null) return null;

        Bitmap bitmap;
        if (drawable instanceof BitmapDrawable) {
            bitmap = ((BitmapDrawable) drawable).getBitmap();
        } else {
            int width = drawable.getIntrinsicWidth() > 0 ? drawable.getIntrinsicWidth() : 64;
            int height = drawable.getIntrinsicHeight() > 0 ? drawable.getIntrinsicHeight() : 64;
            bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bitmap);
            drawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
            drawable.draw(canvas);
        }

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.PNG, 90, outputStream);
        byte[] byteArray = outputStream.toByteArray();

        return Base64.encodeToString(byteArray, Base64.NO_WRAP);
    }
}
