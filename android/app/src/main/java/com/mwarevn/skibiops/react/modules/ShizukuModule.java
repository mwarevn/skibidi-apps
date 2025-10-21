package com.mwarevn.skibiops.react.modules;

import android.app.Activity;
import android.content.pm.PackageManager;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import rikka.shizuku.Shizuku;

public class ShizukuModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public ShizukuModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "ShizukuModule";
    }

    private void checkShizukuAccess(boolean allowSystemApps) throws Exception {
        if (!Shizuku.pingBinder()) {
            throw new Exception("Shizuku service is not available");
        }
        if (Shizuku.checkSelfPermission() != 0) {
            throw new Exception("Shizuku permission not granted");
        }


    }

    @ReactMethod
    public void isShizukuAvailable(Promise promise) {
        try {
            boolean available = Shizuku.pingBinder();
            promise.resolve(available);
        } catch (Exception e) {
            promise.reject("ERR_SHIZUKU_CHECK", "Failed to check Shizuku availability: " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void hasPermission(Promise promise) {
        try {
            int result = Shizuku.checkSelfPermission();
            promise.resolve(result == 0);
        } catch (Exception e) {
            promise.reject("ERR_SHIZUKU_PERMISSION", "Failed to check Shizuku permission: " + e.getMessage(), e);
        }
    }
    @ReactMethod
    public void requestPermission(Promise promise) {
        Activity current = reactContext.getCurrentActivity();
        if (current == null) {
            promise.reject("ERR_NO_ACTIVITY", "No current activity available");
            return;
        }
        int REQUEST_CODE = 100;

        try {
            Shizuku.requestPermission(REQUEST_CODE);
            Shizuku.addRequestPermissionResultListener((requestCode, result) -> {
                if (requestCode == REQUEST_CODE) {
                    promise.resolve(Shizuku.checkSelfPermission() == REQUEST_CODE);
                } else {
                    promise.reject("ERR_SHIZUKU_PERMISSION", "Unexpected request code: " + requestCode);
                }
            });


        } catch (Exception e) {
            promise.reject("ERR_SHIZUKU_PERMISSION", "Failed to request Shizuku permission: " + e.getMessage(), e);
        }
    }
    @ReactMethod
    public void addListener(String eventName) {}
    @ReactMethod
    public void removeListeners(Integer count) {}
}