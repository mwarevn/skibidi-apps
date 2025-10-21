package com.mwarevn.skibiops.react.modules;

import android.os.RemoteException;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.mwarevn.skibiops.IAppManagerService;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import android.util.Log;

/**
 * Lightweight AppManager module. Binding to Shizuku user service is done by AppManagerBinder
 * which stores the AIDL interface into ServiceHolder. This module only forwards calls to the
 * service held in ServiceHolder and returns SERVICE_NOT_READY if not bound.
 */
public class AppManager extends ReactContextBaseJavaModule {

    private static final String TAG = "AppManager";
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    public AppManager(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "AppManager";
    }

    private IAppManagerService getService() {
        return ServiceHolder.getServiceApi();
    }

    private boolean checkService(Promise promise) {
        IAppManagerService svc = getService();
        if (svc == null) {
            promise.reject("SERVICE_NOT_READY", "Shizuku service not bound or permission denied.");
            return false;
        }
        return true;
    }

    @ReactMethod
    public void uninstallPackage(String packageName, Promise promise) {
        if (!checkService(promise)) return;
        executor.execute(() -> {
            try {
                getService().uninstallPackage(packageName);
                promise.resolve("Uninstall successful for " + packageName);
            } catch (RemoteException e) {
                String msg = Log.getStackTraceString(e);
                Log.e(TAG, "uninstallPackage failed", e);
                promise.reject("ERROR", msg);
            }
        });
    }

    @ReactMethod
    public void disablePackage(String packageName, Promise promise) {
        if (!checkService(promise)) return;
        executor.execute(() -> {
            try {
                getService().disablePackage(packageName);
                promise.resolve("Disable successful for " + packageName);
            } catch (RemoteException e) {
                String msg = Log.getStackTraceString(e);
                Log.e(TAG, "disablePackage failed", e);
                promise.reject("ERROR", msg);
            }
        });
    }

    @ReactMethod
    public void enablePackage(String packageName, Promise promise) {
        if (!checkService(promise)) return;
        executor.execute(() -> {
            try {
                getService().enablePackage(packageName);
                promise.resolve("Enable successful for " + packageName);
            } catch (RemoteException e) {
                String msg = Log.getStackTraceString(e);
                Log.e(TAG, "enablePackage failed", e);
                promise.reject("ERROR", msg);
            }
        });
    }

    @ReactMethod
    public void forceStopPackage(String packageName, Promise promise) {
        if (!checkService(promise)) return;
        executor.execute(() -> {
            try {
                getService().forceStopPackage(packageName);
                promise.resolve("Force stop successful for " + packageName);
            } catch (RemoteException e) {
                String msg = Log.getStackTraceString(e);
                Log.e(TAG, "forceStopPackage failed", e);
                promise.reject("ERROR", msg);
            }
        });
    }

    @Override
    public void onCatalystInstanceDestroy() {
        executor.shutdown();
    }
}