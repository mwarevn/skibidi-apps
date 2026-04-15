package com.mwarevn.skibiops.react.modules;

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
import com.mwarevn.skibiops.IAppManagerService;
import com.mwarevn.skibiops.R;
import com.mwarevn.skibiops.widget.Widget;

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
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    public AppManager(ReactApplicationContext reactContext) {
        super(reactContext);

        widgetActionReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();
                String pkg = intent.getStringExtra(Widget.EXTRA_PACKAGE_NAME);

                if (pkg == null) return;

                if (Widget.ACTION_FORCE_STOP.equals(action)) {
                    forceStopPackage(pkg, new Promise() {
                        @Override
                        public void resolve(@Nullable Object o) {

                        }

                        @Override
                        public void reject(@NonNull String s, @Nullable String s1) {

                        }

                        @Override
                        public void reject(@NonNull String s, @Nullable Throwable throwable) {

                        }

                        @Override
                        public void reject(@NonNull String s, @Nullable String s1, @Nullable Throwable throwable) {

                        }

                        @Override
                        public void reject(@NonNull Throwable throwable) {

                        }

                        @Override
                        public void reject(@NonNull Throwable throwable, @NonNull WritableMap writableMap) {

                        }

                        @Override
                        public void reject(@NonNull String s, @NonNull WritableMap writableMap) {

                        }

                        @Override
                        public void reject(@NonNull String s, @Nullable Throwable throwable, @NonNull WritableMap writableMap) {

                        }

                        @Override
                        public void reject(@NonNull String s, @Nullable String s1, @NonNull WritableMap writableMap) {

                        }

                        @Override
                        public void reject(@Nullable String s, @Nullable String s1, @Nullable Throwable throwable, @Nullable WritableMap writableMap) {

                        }

                        @Override
                        public void reject(@NonNull String s) {

                        }
                    });
                } else if (Widget.ACTION_TOGGLE_ENABLE.equals(action)) {
//                    togglePackageEnabled(pkg);
                }

                AppWidgetManager mgr = AppWidgetManager.getInstance(context);
                int[] ids = mgr.getAppWidgetIds(new ComponentName(context, Widget.class));
                mgr.notifyAppWidgetViewDataChanged(ids, R.id.list_view);
            }
        };

        // Đăng ký receiver
        IntentFilter filter = new IntentFilter();
        filter.addAction(Widget.ACTION_FORCE_STOP);
        filter.addAction(Widget.ACTION_TOGGLE_ENABLE);
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

    @ReactMethod
    public void checkRootAvailable(Promise promise) {
        if (!checkService(promise)) return;
        executor.execute(() -> {
            try {
                boolean available = getService().checkRootAvailable();
                promise.resolve(available);
            } catch (RemoteException e) {
                Log.e(TAG, "checkRootAvailable failed", e);
                promise.resolve(false);
            }
        });
    }

    @ReactMethod
    public void forceUninstallAsRoot(String packageName, Promise promise) {
        if (!checkService(promise)) return;
        executor.execute(() -> {
            try {
                getService().forceUninstallAsRoot(packageName);
                promise.resolve("Root uninstall successful for " + packageName);
            } catch (RemoteException e) {
                String msg = Log.getStackTraceString(e);
                Log.e(TAG, "forceUninstallAsRoot failed", e);
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