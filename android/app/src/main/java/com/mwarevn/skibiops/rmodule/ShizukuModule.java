package com.mwarevn.skibiops.rmodule;

import android.app.Activity;
import androidx.annotation.Nullable;
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

    @ReactMethod
    public void isShizukuAvailable(Promise promise) {
        try {
            boolean available = Shizuku.pingBinder();
            promise.resolve(available);
        } catch (Exception e) {
            promise.reject("ERR_SHIZUKU_CHECK", e);
        }
    }

    @ReactMethod
    public void hasPermission(Promise promise) {
        try {
            int result = Shizuku.checkSelfPermission();
            promise.resolve(result == 0); // PERMISSION_GRANTED = 0
        } catch (Exception e) {
            promise.reject("ERR_SHIZUKU_PERMISSION", e);
        }
    }

    @ReactMethod
    public void requestPermission() {
        Activity current = getCurrentActivity();
        if (current == null) return; // cần Activity để hiển thị request
        int REQUEST_CODE = 100;
        Shizuku.requestPermission(REQUEST_CODE);
    }

    @ReactMethod
    public void addListener(String eventName) {} // để RN không crash
    @ReactMethod
    public void removeListeners(Integer count) {}
}
