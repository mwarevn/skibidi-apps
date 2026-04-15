package com.mwarevn.skibidiapps.react.modules;

import android.content.ComponentName;
import android.content.ServiceConnection;
import android.os.IBinder;
import android.content.pm.PackageManager;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.mwarevn.skibidiapps.IAppManagerService;
import com.mwarevn.skibidiapps.react.services.AppManagerUserService;

import rikka.shizuku.Shizuku;

public class AppManagerBinder extends ReactContextBaseJavaModule {

    private static final String TAG = "AppManagerBinder";
    private ReactApplicationContext reactContext;

    public AppManagerBinder(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "AppManagerBinder";
    }

    @ReactMethod
    public void binService(Promise promise) {
        try {
            if (!Shizuku.pingBinder()) {
                Log.d(TAG, "Shizuku binder not available");
                promise.reject("NO_BINDER", "Shizuku binder not available");
                return;
            }

            if (Shizuku.checkSelfPermission() != PackageManager.PERMISSION_GRANTED) {
                Log.d(TAG, "Shizuku permission not granted");
                promise.reject("NO_PERMISSION", "Shizuku permission not granted");
                return;
            }

            ComponentName cpn = new ComponentName(reactContext, AppManagerUserService.class);

            ServiceConnection connection = new ServiceConnection() {
                @Override
                public void onServiceConnected(ComponentName name, IBinder service) {
                    IAppManagerService api = IAppManagerService.Stub.asInterface(service);
                    ServiceHolder.setServiceApi(api);
                    Log.d(TAG, "UserService bound and stored in holder");
                    promise.resolve(true);
                }

                @Override
                public void onServiceDisconnected(ComponentName name) {
                    ServiceHolder.setServiceApi(null);
                    Log.d(TAG, "UserService disconnected");
                }
            };

            // Ensure we provide a non-null process name suffix (Shizuku requires it)
            String suffix = "skibidiapps";
            try {
                Shizuku.UserServiceArgs args = new Shizuku.UserServiceArgs(cpn)
                        .daemon(false)
                        .version(1)
                        .tag("app_manager_service")
                        .processNameSuffix(suffix);

                Log.d(TAG, "Attempting to bind user service with suffix=" + suffix);
                Shizuku.bindUserService(args, connection);
            } catch (NoSuchMethodError e) {
                // Older Shizuku versions may not have processNameSuffix, fallback without it
                Log.w(TAG, "Shizuku.UserServiceArgs.processNameSuffix() not available, falling back", e);
                Shizuku.UserServiceArgs args = new Shizuku.UserServiceArgs(cpn)
                        .daemon(false)
                        .version(1)
                        .tag("app_manager_service");
                Shizuku.bindUserService(args, connection);
            }
        } catch (Throwable t) {
            Log.e(TAG, "Error binding service", t);
            promise.reject("ERROR", t.getMessage());
        }
    }
}
