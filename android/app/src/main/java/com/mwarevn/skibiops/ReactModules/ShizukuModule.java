package com.mwarevn.skibiops.ReactModules;

import static rikka.shizuku.SystemServiceHelper.getTransactionCode;

import android.app.Activity;
import android.content.pm.ApplicationInfo;
import android.os.IBinder;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import rikka.shizuku.Shizuku;
import rikka.shizuku.ShizukuBinderWrapper;
import rikka.shizuku.SystemServiceHelper;

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
        if (allowSystemApps) {
            // [Suy luận] Giả định rằng nếu Shizuku có UID 0, nó đang chạy ở chế độ root
            // Lưu ý: Shizuku 13.1.5 không cung cấp API isRoot() trực tiếp, nên chỉ kiểm tra quyền
            if (!Shizuku.pingBinder() || Shizuku.checkSelfPermission() != 0) {
                throw new Exception("Root access required for system app operations");
            }
        }
    }

    private boolean isSystemApp(String packageName) {
        try {
            IBinder binder = SystemServiceHelper.getSystemService("package");
            if (binder == null) {
                return false;
            }
            ShizukuBinderWrapper wrapper = new ShizukuBinderWrapper(binder);
            android.os.Parcel data = android.os.Parcel.obtain();
            android.os.Parcel reply = android.os.Parcel.obtain();

            try {
                data.writeInterfaceToken("android.content.pm.IPackageManager");
                data.writeString(packageName);
                data.writeInt(0); // userId

                int GET_APPLICATION_INFO_TRANSACTION = 51; // Compatible with Android 9+
                wrapper.transact(GET_APPLICATION_INFO_TRANSACTION, data, reply, 0);
                reply.readException();
                ApplicationInfo appInfo = ApplicationInfo.CREATOR.createFromParcel(reply);
                return (appInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0;
            } finally {
                data.recycle();
                reply.recycle();
            }
        } catch (Exception e) {
            return false; // Assume non-system app if check fails
        }
    }

    private boolean isPackageEnabled(String packageName) {
        try {
            IBinder binder = SystemServiceHelper.getSystemService("package");
            if (binder == null) {
                return false;
            }
            ShizukuBinderWrapper wrapper = new ShizukuBinderWrapper(binder);
            android.os.Parcel data = android.os.Parcel.obtain();
            android.os.Parcel reply = android.os.Parcel.obtain();

            try {
                data.writeInterfaceToken("android.content.pm.IPackageManager");
                data.writeString(packageName);
                data.writeInt(0); // userId

                int GET_APPLICATION_ENABLED_SETTING_TRANSACTION = 92; // Compatible with Android 9+
                wrapper.transact(GET_APPLICATION_ENABLED_SETTING_TRANSACTION, data, reply, 0);
                reply.readException();
                int state = reply.readInt();
                return state == 1; // COMPONENT_ENABLED_STATE_ENABLED
            } finally {
                data.recycle();
                reply.recycle();
            }
        } catch (Exception e) {
            return false; // Assume disabled if check fails
        }
    }

    @ReactMethod
    public void disablePackage(String packageName, Promise promise) {
        try {
            boolean isSystemApp = isSystemApp(packageName);
            checkShizukuAccess(isSystemApp); // Require root for system apps
            if (isSystemApp(packageName) && Shizuku.checkSelfPermission() != 0) {
                throw new Exception("Disabling system apps requires root access");
            }
            if (!isPackageEnabled(packageName)) {
                throw new Exception("Package is already disabled: " + packageName);
            }

            IBinder binder = SystemServiceHelper.getSystemService("package");
            if (binder == null) {
                throw new Exception("Cannot get package service");
            }

            ShizukuBinderWrapper wrapper = new ShizukuBinderWrapper(binder);
            android.os.Parcel data = android.os.Parcel.obtain();
            android.os.Parcel reply = android.os.Parcel.obtain();

            try {
                data.writeInterfaceToken("android.content.pm.IPackageManager");
                data.writeString(packageName);
                data.writeInt(isSystemApp ? 2 : 3); // Use DISABLED for system apps, DISABLED_USER for non-system
                data.writeInt(0); // flags (DONT_KILL_APP)
                data.writeInt(0); // userId

                int SET_APPLICATION_ENABLED_SETTING_TRANSACTION = 90; // Compatible with Android 9+
                wrapper.transact(SET_APPLICATION_ENABLED_SETTING_TRANSACTION, data, reply, 0);
                reply.readException();

                promise.resolve("Package disabled: " + packageName);
            } finally {
                data.recycle();
                reply.recycle();
            }
        } catch (Exception e) {
            promise.reject("DISABLE_PACKAGE_ERROR", "Failed to disable package: " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void enablePackage(String packageName, Promise promise) {
        try {
            boolean isSystemApp = isSystemApp(packageName);
            checkShizukuAccess(isSystemApp); // Require root for system apps
            if (isSystemApp(packageName) && Shizuku.checkSelfPermission() != 0) {
                throw new Exception("Enabling system apps requires root access");
            }
            if (isPackageEnabled(packageName)) {
                throw new Exception("Package is already enabled: " + packageName);
            }

            IBinder binder = SystemServiceHelper.getSystemService("package");
            if (binder == null) {
                throw new Exception("Cannot get package service");
            }

            ShizukuBinderWrapper wrapper = new ShizukuBinderWrapper(binder);
            android.os.Parcel data = android.os.Parcel.obtain();
            android.os.Parcel reply = android.os.Parcel.obtain();

            try {
                data.writeInterfaceToken("android.content.pm.IPackageManager");
                data.writeString(packageName);
                data.writeInt(1); // COMPONENT_ENABLED_STATE_ENABLED
                data.writeInt(0); // flags (DONT_KILL_APP)
                data.writeInt(0); // userId

                int SET_APPLICATION_ENABLED_SETTING_TRANSACTION = 90; // Compatible with Android 9+
                wrapper.transact(SET_APPLICATION_ENABLED_SETTING_TRANSACTION, data, reply, 0);
                reply.readException();

                promise.resolve("Package enabled: " + packageName);
            } finally {
                data.recycle();
                reply.recycle();
            }
        } catch (Exception e) {
            promise.reject("ENABLE_PACKAGE_ERROR", "Failed to enable package: " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void uninstallPackage(String packageName, Promise promise) {
        try {
            boolean isSystemApp = isSystemApp(packageName);
            checkShizukuAccess(isSystemApp); // Require root for system apps
            if (isSystemApp(packageName) && Shizuku.checkSelfPermission() != 0) {
                throw new Exception("Uninstalling system apps requires root access");
            }

            IBinder binder = SystemServiceHelper.getSystemService("package");
            if (binder == null) {
                throw new Exception("Cannot get package service");
            }

            ShizukuBinderWrapper wrapper = new ShizukuBinderWrapper(binder);
            android.os.Parcel data = android.os.Parcel.obtain();
            android.os.Parcel reply = android.os.Parcel.obtain();

            try {
                data.writeInterfaceToken("android.content.pm.IPackageManager");
                data.writeString(packageName);
                data.writeInt(0); // userId
                data.writeString(null); // observer
                data.writeInt(isSystemApp ? 1 : 0); // flags (DELETE_SYSTEM_APP for system apps)

                int DELETE_PACKAGE_TRANSACTION = 68; // Compatible with Android 9+
                wrapper.transact(DELETE_PACKAGE_TRANSACTION, data, reply, 0);
                reply.readException();

                promise.resolve("Package uninstalled: " + packageName);
            } finally {
                data.recycle();
                reply.recycle();
            }
        } catch (Exception e) {
            promise.reject("UNINSTALL_ERROR", "Failed to uninstall package: " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void forceStopPackage(String packageName, Promise promise) {
        try {
            boolean isSystemApp = isSystemApp(packageName);
            checkShizukuAccess(isSystemApp); // Require root for system apps
            if (isSystemApp(packageName) && Shizuku.checkSelfPermission() != 0) {
                throw new Exception("Force stopping system apps requires root access");
            }

            IBinder binder = SystemServiceHelper.getSystemService("activity");
            if (binder == null) {
                throw new Exception("Cannot get activity service");
            }

            ShizukuBinderWrapper wrapper = new ShizukuBinderWrapper(binder);
            android.os.Parcel data = android.os.Parcel.obtain();
            android.os.Parcel reply = android.os.Parcel.obtain();

            try {
                data.writeInterfaceToken("android.app.IActivityManager");
                data.writeString(packageName);
                data.writeInt(0); // userId

                int FORCE_STOP_PACKAGE_TRANSACTION = 80; // Compatible with Android 9+
                wrapper.transact(FORCE_STOP_PACKAGE_TRANSACTION, data, reply, 0);
                reply.readException();

                promise.resolve("Package force stopped: " + packageName);
            } finally {
                data.recycle();
                reply.recycle();
            }
        } catch (Exception e) {
            promise.reject("FORCE_STOP_ERROR", "Failed to force stop package: " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void killBackgroundProcesses(String packageName, Promise promise) {
        try {
            boolean isSystemApp = isSystemApp(packageName);
            checkShizukuAccess(isSystemApp); // Require root for system apps
            if (isSystemApp(packageName) && Shizuku.checkSelfPermission() != 0) {
                throw new Exception("Killing background processes of system apps requires root access");
            }

            IBinder binder = SystemServiceHelper.getSystemService("activity");
            if (binder == null) {
                throw new Exception("Cannot get activity service");
            }

            ShizukuBinderWrapper wrapper = new ShizukuBinderWrapper(binder);
            android.os.Parcel data = android.os.Parcel.obtain();
            android.os.Parcel reply = android.os.Parcel.obtain();

            try {
                data.writeInterfaceToken("android.app.IActivityManager");
                data.writeString(packageName);
                data.writeInt(0); // userId

                int FORCE_STOP_PACKAGE_TRANSACTION = 80; // Prefer forceStop over killBackgroundProcesses
                wrapper.transact(FORCE_STOP_PACKAGE_TRANSACTION, data, reply, 0);
                reply.readException();

                promise.resolve("Package force stopped: " + packageName);
            } catch (Exception e) {
                // Fallback to killBackgroundProcesses only for non-system apps or rooted devices
                try {
                    data = android.os.Parcel.obtain();
                    reply = android.os.Parcel.obtain();
                    data.writeInterfaceToken("android.app.IActivityManager");
                    data.writeString(packageName);
                    data.writeInt(0); // userId

                    int KILL_BACKGROUND_PROCESSES_TRANSACTION = 104; // Compatible with Android 9+
                    wrapper.transact(KILL_BACKGROUND_PROCESSES_TRANSACTION, data, reply, 0);
                    reply.readException();

                    promise.resolve("Background processes killed: " + packageName);
                } catch (Exception e2) {
                    promise.reject("KILL_BACKGROUND_ERROR",
                            "Failed to kill package " + packageName + ": forceStopPackage failed: " + e.getMessage() +
                                    "; killBackgroundProcesses failed: " + e2.getMessage() +
                                    ". System apps or protected apps may require root access.", e2);
                }
            } finally {
                data.recycle();
                reply.recycle();
            }
        } catch (Exception e) {
            promise.reject("KILL_BACKGROUND_ERROR", "Failed to kill background processes: " + e.getMessage(), e);
        }
    }

    @ReactMethod
    public void isPackageEnabled(String packageName, Promise promise) {
        try {
            checkShizukuAccess(false); // No need for root to check status
            boolean enabled = isPackageEnabled(packageName);
            promise.resolve(enabled);
        } catch (Exception e) {
            promise.reject("CHECK_ENABLED_ERROR", "Failed to check package enabled state: " + e.getMessage(), e);
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
                    promise.resolve(Shizuku.checkSelfPermission() == 0);
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