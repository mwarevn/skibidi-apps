package com.mwarevn.skibiops.ReactModules;

import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.util.Base64;

import com.facebook.react.bridge.*;
import com.facebook.react.module.annotations.ReactModule;

import java.util.List;

import rikka.shizuku.Shizuku;

@ReactModule(name = "AppInspectorModule")
public class AppInspectorModule extends ReactContextBaseJavaModule {
    private static final String TAG = "AppInspectorModule";
    private final ReactApplicationContext ctx;

    public AppInspectorModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.ctx = reactContext;
    }

    @Override
    public String getName() {
        return "AppInspectorModule";
    }

    @ReactMethod
    public void getAllApps(Promise promise) {
        try {
            if (!Shizuku.pingBinder()) {
                promise.reject("ERR_NO_SHIZUKU", "Shizuku is not available");
                return;
            }

            ReactApplicationContext ctx = getReactApplicationContext();
            PackageManager pm = ctx.getPackageManager();
            List<PackageInfo> packages = pm.getInstalledPackages(
                    PackageManager.GET_PERMISSIONS | PackageManager.MATCH_UNINSTALLED_PACKAGES
            );

            WritableArray apps = Arguments.createArray();

            for (PackageInfo pkg : packages) {
                ApplicationInfo info = pkg.applicationInfo;
                WritableMap item = Arguments.createMap();

                item.putString("packageName", pkg.packageName);
                item.putString("label", info.loadLabel(pm).toString());
                item.putString("versionName", pkg.versionName);
                item.putInt("versionCode", pkg.versionCode);
                item.putInt("targetSdk", info.targetSdkVersion);
                item.putBoolean("isSystemApp", (info.flags & ApplicationInfo.FLAG_SYSTEM) != 0);
                item.putBoolean("isDisabled", !info.enabled);

                // Icon
                Drawable icon = info.loadIcon(pm);
                if (icon instanceof BitmapDrawable) {
                    Bitmap bmp = ((BitmapDrawable) icon).getBitmap();
                    item.putString("iconBase64", bitmapToBase64(bmp));
                }

                // Permissions
                WritableArray perms = Arguments.createArray();
                if (pkg.requestedPermissions != null) {
                    for (int i = 0; i < pkg.requestedPermissions.length; i++) {
                        WritableMap p = Arguments.createMap();
                        p.putString("name", pkg.requestedPermissions[i]);
                        p.putBoolean("granted",
                                (pkg.requestedPermissionsFlags[i] &
                                        PackageInfo.REQUESTED_PERMISSION_GRANTED) != 0);
                        perms.pushMap(p);
                    }
                }
                item.putArray("permissions", perms);

                apps.pushMap(item);
            }

            promise.resolve(apps);
        } catch (Exception e) {
            promise.reject("ERR_GET_APPS", e);
        }
    }

    private String bitmapToBase64(Bitmap bmp) {
        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        bmp.compress(Bitmap.CompressFormat.PNG, 100, baos);
        return Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP);
    }
}
