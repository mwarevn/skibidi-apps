package com.mwarevn.appremover.react.modules;

import android.appwidget.AppWidgetManager;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.RemoteException;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.mwarevn.appremover.IAppManagerService;
import com.mwarevn.appremover.R;
import com.mwarevn.appremover.widget.WidgetProvider;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;

/**
 * Lightweight AppManager module. Binding to Shizuku user service is done by AppManagerBinder
 * which stores the AIDL interface into ServiceHolder. This module only forwards calls to the
 * service held in ServiceHolder and returns SERVICE_NOT_READY if not bound.
 */
public class AppManager extends ReactContextBaseJavaModule {

    private BroadcastReceiver widgetActionReceiver;
    private static final String TAG = "AppManager";
    private final ExecutorService executor = Executors.newCachedThreadPool();

    private Promise pms = new Promise() {
        @Override
        public void reject(@NonNull String s) {

        }

        @Override
        public void reject(@Nullable String s, @Nullable String s1, @Nullable Throwable throwable, @Nullable WritableMap writableMap) {

        }

        @Override
        public void reject(@NonNull String s, @Nullable String s1, @NonNull WritableMap writableMap) {

        }

        @Override
        public void reject(@NonNull String s, @Nullable Throwable throwable, @NonNull WritableMap writableMap) {

        }

        @Override
        public void reject(@NonNull String s, @NonNull WritableMap writableMap) {

        }

        @Override
        public void reject(@NonNull Throwable throwable, @NonNull WritableMap writableMap) {

        }

        @Override
        public void reject(@NonNull Throwable throwable) {

        }

        @Override
        public void reject(@NonNull String s, @Nullable String s1, @Nullable Throwable throwable) {

        }

        @Override
        public void reject(@NonNull String s, @Nullable Throwable throwable) {

        }

        @Override
        public void reject(@NonNull String s, @Nullable String s1) {

        }

        @Override
        public void resolve(@Nullable Object o) {

        }
    };

    public AppManager(ReactApplicationContext reactContext) {
        super(reactContext);

        widgetActionReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();
                String pkg = intent.getStringExtra(WidgetProvider.EXTRA_PACKAGE_NAME);
                boolean enabled = intent.getBooleanExtra("enabled", true);

                if (pkg == null) return;

                if (WidgetProvider.ACTION_FORCE_STOP.equals(action)) {
                    forceStopPackage(pkg, pms);
                } else if (WidgetProvider.ACTION_TOGGLE_ENABLE.equals(action)) {
                    if (enabled) {
                        enablePackage(pkg, pms);
                    } else {
                        disablePackage(pkg, pms);
                    }
                }

                AppWidgetManager mgr = AppWidgetManager.getInstance(context);
                int[] ids = mgr.getAppWidgetIds(new ComponentName(context, WidgetProvider.class));
                mgr.notifyAppWidgetViewDataChanged(ids, R.id.list_view);
            }
        };

        // Đăng ký receiver
        IntentFilter filter = new IntentFilter();
        filter.addAction(WidgetProvider.ACTION_FORCE_STOP);
        filter.addAction(WidgetProvider.ACTION_TOGGLE_ENABLE);
        ContextCompat.registerReceiver(reactContext, widgetActionReceiver, filter, ContextCompat.RECEIVER_NOT_EXPORTED);
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
    public void forceStopPackage(String packageName,Promise promise) {
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

//    @Override
//    public void onCatalystInstanceDestroy() {
//        executor.shutdown();
//        if (widgetActionReceiver != null) {
//            getReactApplicationContext().unregisterReceiver(widgetActionReceiver);
//        }
//    }
}