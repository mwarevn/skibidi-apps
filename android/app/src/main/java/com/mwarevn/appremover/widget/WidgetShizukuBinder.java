package com.mwarevn.appremover.widget;

import android.content.ComponentName;
import android.content.Context;
import android.content.ServiceConnection;
import android.os.IBinder;
import android.util.Log;

import com.mwarevn.appremover.IAppManagerService;
import com.mwarevn.appremover.react.modules.ServiceHolder;
import com.mwarevn.appremover.react.services.AppManagerUserService;

import rikka.shizuku.Shizuku;

public class WidgetShizukuBinder {

    private static final String TAG = "WidgetShizukuBinder";
    private static boolean isBinding = false;
    private static ServiceConnection connection;

    public static void bindIfNeeded(Context context, Runnable onBound) {
        if (ServiceHolder.getServiceApi() != null) {
            onBound.run();
            return;
        }

        if (isBinding) {
            return;
        }

        isBinding = true;

        if (!Shizuku.pingBinder()) {
            Log.e(TAG, "Shizuku binder not available");
            isBinding = false;
            return;
        }

        if (Shizuku.checkSelfPermission() != 0) {
            Log.e(TAG, "Shizuku permission not granted");
            isBinding = false;
            return;
        }

        ComponentName cpn = new ComponentName(context, AppManagerUserService.class);

        connection = new ServiceConnection() {
            @Override
            public void onServiceConnected(ComponentName name, IBinder service) {
                IAppManagerService api = IAppManagerService.Stub.asInterface(service);
                ServiceHolder.setServiceApi(api);
                Log.d(TAG, "Shizuku service bound from widget");
                isBinding = false;
                onBound.run();
            }

            @Override
            public void onServiceDisconnected(ComponentName name) {
                ServiceHolder.setServiceApi(null);
                isBinding = false;
                Log.d(TAG, "Shizuku service disconnected");
            }
        };

        try {
            Shizuku.UserServiceArgs args = new Shizuku.UserServiceArgs(cpn)
                    .daemon(false)
                    .version(1)
                    .tag("widget_app_manager")
                    .processNameSuffix("widget");

            Shizuku.bindUserService(args, connection);
            Log.d(TAG, "Binding Shizuku service from widget...");
        } catch (Exception e) {
            Log.e(TAG, "Failed to bind Shizuku service", e);
            isBinding = false;
        }
    }

//    public static void unbind() {
//        if (connection != null && isBinding) {
//            try {
//                Shizuku.unbindUserService(connection);
//            } catch (Exception e) {
//                Log.e(TAG, "Failed to unbind", e);
//            }
//            isBinding = false;
//            connection = null;
//        }
//    }
}