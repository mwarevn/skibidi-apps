package com.mwarevn.skibiops.react.modules;

import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.util.Base64;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.io.ByteArrayOutputStream;
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

    @ReactMethod
    public void getMessage(Promise promise) {
        promise.resolve("Xin chào từ Java!");
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
