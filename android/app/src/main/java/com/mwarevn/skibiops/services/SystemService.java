package com.mwarevn.skibiops.services;

import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.IBinder;
import android.os.Binder;
import android.util.Log;
import java.util.ArrayList;
import java.util.List;

public class SystemService extends Binder {


    private static final String TAG = "SystemService";

    public SystemService() {
        super();
        Log.d(TAG, "SystemService ctor()");
    }

    // This method will run in the user service process under Shizuku identity.
    // Return a flattened String (one package per line) to avoid big Parcelable overhead.
    // You can change to return a ParcelFileDescriptor or AIDL-returned list if desired.
    public String listAllPackagesAsText(int flags, int userId) {
        Log.d(TAG, "listAllPackagesAsText() called");
        try {
            // NOTE: In user service context, getContext() is not available like normal App.
            // But Shizuku v13 supports constructing with a Context param for the service.
            // We attempt to access PackageManager via PackageManager.getDefault... however
            // to be safe we use PackageManager via reflection on ActivityThread if needed.
            PackageManager pm = androidx.appcompat.app.AppCompatActivity.class.getApplication().getPackageManager(); // [Chưa xác minh] - fallback hack
            // Safer approach is to use hidden APIs or rely on service's Context injected by Shizuku.
            List<PackageInfo> pkgs = pm.getInstalledPackages(flags);

            StringBuilder sb = new StringBuilder();
            for (PackageInfo p : pkgs) {
                // Format: apkPath|packageName|versionName
                String apkPath = (p.applicationInfo != null) ? p.applicationInfo.sourceDir : "";
                String pkgName = p.packageName != null ? p.packageName : "";
                String ver = p.versionName != null ? p.versionName : "";
                sb.append(apkPath).append("|").append(pkgName).append("|").append(ver).append("\n");
            }
            return sb.toString();
        } catch (Throwable t) {
            Log.e(TAG, "listAllPackagesAsText error", t);
            return "";
        }
    }

    // required destroy hook — Shizuku may call this transaction code when unbinding
    // We expose a destroy method that can be invoked remotely (transaction code 16777115)
    public void destroyAndExit() {
        Log.d(TAG, "destroyAndExit called");
        System.exit(0);
    }

    // Important: return this as the binder the Shizuku server will forward.
    public IBinder getBinder() {
        return this;
    }
}
