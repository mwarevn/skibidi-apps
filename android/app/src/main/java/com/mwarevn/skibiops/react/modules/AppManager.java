package com.mwarevn.skibiops.react.modules;

import android.content.ComponentName;
import android.content.ServiceConnection;
import android.content.pm.PackageManager;
import android.os.IBinder;
import android.os.RemoteException;
import android.util.Log;

import com.facebook.react.BuildConfig;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.mwarevn.skibiops.IAppManagerService;
import com.mwarevn.skibiops.react.services.AppManagerUserService;

import rikka.shizuku.Shizuku;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class AppManager extends ReactContextBaseJavaModule {

    private static final String TAG = "AppManager";
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private IAppManagerService serviceApi;
    private ReactApplicationContext reactContext;

    public AppManager(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        bindUserService();
    }

    @Override
    public String getName() {
        return "AppManager";
    }

    private ComponentName getCpn() {
        return new ComponentName(reactContext, AppManagerUserService.class);
    }

    private void bindUserService() {
        if (!Shizuku.pingBinder()) return;

        Shizuku.UserServiceArgs args = new Shizuku.UserServiceArgs(getCpn())
                .daemon(false)
                .processNameSuffix("shizuku_user_service")
                .debuggable(BuildConfig.DEBUG)
                .version(1)
                .tag("app_manager_service");

        ServiceConnection connection = new ServiceConnection() {
            @Override
            public void onServiceConnected(ComponentName name, IBinder service) {
                serviceApi = IAppManagerService.Stub.asInterface(service);
                Log.d(TAG, "UserService bound");
            }

            @Override
            public void onServiceDisconnected(ComponentName name) {
                serviceApi = null;
                Log.d(TAG, "UserService disconnected");
            }
        };

        Shizuku.bindUserService(args, connection);
    }

    private void checkService(Promise promise) {
        if (serviceApi == null || Shizuku.checkSelfPermission() != PackageManager.PERMISSION_GRANTED || !Shizuku.pingBinder()) {
            promise.reject("SERVICE_NOT_READY", "Shizuku service not bound or permission denied.");
            return;
        }
    }

    @ReactMethod
    public void uninstallPackage(String packageName, Promise promise) {
        checkService(promise);
        executor.execute(() -> {
            try {
                serviceApi.uninstallPackage(packageName);
                promise.resolve("Uninstall successful for " + packageName);
            } catch (RemoteException e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }

    @ReactMethod
    public void disablePackage(String packageName, Promise promise) {
        checkService(promise);
        executor.execute(() -> {
            try {
                serviceApi.disablePackage(packageName);
                promise.resolve("Disable successful for " + packageName);
            } catch (RemoteException e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }

    @ReactMethod
    public void enablePackage(String packageName, Promise promise) {
        checkService(promise);
        executor.execute(() -> {
            try {
                serviceApi.enablePackage(packageName);
                promise.resolve("Enable successful for " + packageName);
            } catch (RemoteException e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }

    @ReactMethod
    public void forceStopPackage(String packageName, Promise promise) {
        checkService(promise);
        executor.execute(() -> {
            try {
                serviceApi.forceStopPackage(packageName);
                promise.resolve("Force stop successful for " + packageName);
            } catch (RemoteException e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }




//    @Override
//    public void onCatalystInstanceDestroy() {
//        executor.shutdown();
//        if (serviceApi != null) {
//            try {
//                serviceApi.destroy();
//            } catch (RemoteException e) {
//                // Ignore
//            }
//            Shizuku.unbindUserService(new Shizuku.UserServiceArgs(AppManagerUserService.class.getName()).tag("app_manager_service"), null, true);
//        }
//    }
}